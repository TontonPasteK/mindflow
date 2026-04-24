/**
 * Vercel Serverless Function — /api/chat
 * Routes all requests to Claude Sonnet (Anthropic API).
 *
 * POST body: { systemPrompt, messages, stream? }
 *   - messages: [{role, content}]  (content can be a string or vision array)
 */

// ─── Rate limiting (in-memory, per Vercel instance) ──────────────────────────
const RATE_LIMIT_MAX    = 200
const RATE_LIMIT_WINDOW = 60 * 60 * 1000
const rateLimitStore    = new Map()

function getIdentifier(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers['x-real-ip'] || 'unknown'
}

function checkRateLimit(identifier) {
  const now   = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((entry.resetAt - now) / 60000)
    return { allowed: false, remaining: 0, waitMinutes }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

function evictExpired() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  evictExpired()
  const identifier = getIdentifier(req)
  const { allowed, remaining, waitMinutes } = checkRateLimit(identifier)

  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT_MAX)
  res.setHeader('X-RateLimit-Remaining', remaining ?? 0)

  if (!allowed) {
    return res.status(429).json({
      error: `Limite atteinte (${RATE_LIMIT_MAX} messages/heure). Réessaie dans ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`,
    })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { systemPrompt, messages, stream: wantStream } = body

  if (!systemPrompt || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing systemPrompt or messages' })
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  try {
    if (wantStream) return await callClaudeStream(systemPrompt, messages, apiKey, res)
    const content = await callClaude(systemPrompt, messages, apiKey)
    return res.status(200).json({ content })
  } catch (err) {
    console.error('[chat API] error:', err.message)
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'AI service error' })
  }
}

// ─── Claude (non-streaming) ───────────────────────────────────────────────────

async function callClaude(systemPrompt, messages, apiKey) {
  // Convertir les content arrays vision pour Claude
  const claudeMessages = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content) ? m.content : m.content,
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   claudeMessages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude error ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ─── Claude (streaming) ───────────────────────────────────────────────────────

async function callClaudeStream(systemPrompt, messages, apiKey, res) {
  const claudeMessages = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content) ? m.content : m.content,
  }))

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-api-key':               apiKey,
      'anthropic-version':       '2023-06-01',
      'anthropic-beta':          'messages-2023-12-15',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      stream:     true,
      system:     systemPrompt,
      messages:   claudeMessages,
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}))
    res.setHeader('Content-Type', 'application/json')
    return res.status(claudeRes.status).json({
      error: err.error?.message || `Claude error ${claudeRes.status}`,
    })
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')

  const reader = claudeRes.body.getReader()
  const dec    = new TextDecoder()
  let   buf    = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6)
        if (raw === '[DONE]') { res.write('data: [DONE]\n\n'); continue }
        let ev
        try { ev = JSON.parse(raw) } catch { continue }

        // Claude streaming events
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          const text = ev.delta.text
          if (text) res.write(`data: ${JSON.stringify({ t: text })}\n\n`)
        }
        if (ev.type === 'message_stop') {
          res.write('data: [DONE]\n\n')
        }
      }
    }
  } catch (e) {
    console.error('[claude stream]', e.message)
  }
  res.end()
}