/**
 * Vercel Serverless Function — /api/chat
 * Routes requests to Anthropic Claude with basic rate limiting.
 *
 * POST body: { systemPrompt, messages, model? }
 *   - messages: [{role, content}]  (content can be a string or vision array)
 */

// ─── Rate limiting (in-memory, per Vercel instance) ──────────────────────────
// Resets on cold starts — sufficient as basic abuse protection.
// For cross-instance persistence, swap for Upstash Redis / Vercel KV.

const RATE_LIMIT_MAX    = 20           // max requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000  // 1 hour in ms
const rateLimitStore    = new Map()    // identifier → { count, resetAt }

function getIdentifier(req) {
  // Prefer real IP forwarded by Vercel's edge
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

// Evict expired entries periodically to avoid unbounded memory growth
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

  // ── Rate limit check ────────────────────────────────────────────────────────
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

  // ── Parse body ──────────────────────────────────────────────────────────────
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

  // Pass content as-is — can be a string or a vision content array
  const cleanMessages = messages.map(m => ({
    role:    m.role,
    content: m.content,
  }))

  // Detect PDF to add the required Anthropic beta header
  const hasPDF = cleanMessages.some(m =>
    Array.isArray(m.content) &&
    m.content.some(b => b.type === 'document' && b.source?.media_type === 'application/pdf')
  )

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()

  try {
    if (wantStream) return await callClaudeStream(systemPrompt, cleanMessages, apiKey, hasPDF, res)
    const content = await callClaude(systemPrompt, cleanMessages, apiKey, hasPDF)
    return res.status(200).json({ content })
  } catch (err) {
    console.error('[chat API] error:', err.message)
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'AI service error' })
  }
}

// ─── Anthropic Claude ─────────────────────────────────────────────────────────

async function callClaude(systemPrompt, messages, apiKey, hasPDF = false) {
  const headers = {
    'Content-Type':    'application/json',
    'x-api-key':       apiKey,
    'anthropic-version': '2023-06-01',
  }
  if (hasPDF) headers['anthropic-beta'] = 'pdfs-2024-09-25'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic error ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ─── Streaming: SSE proxy from Anthropic to client ───────────────────────────

async function callClaudeStream(systemPrompt, messages, apiKey, hasPDF, res) {
  const headers = {
    'Content-Type':      'application/json',
    'x-api-key':         apiKey,
    'anthropic-version': '2023-06-01',
  }
  if (hasPDF) headers['anthropic-beta'] = 'pdfs-2024-09-25'

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      stream:     true,
      system:     systemPrompt,
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}))
    res.setHeader('Content-Type', 'application/json')
    return res.status(anthropicRes.status).json({
      error: err.error?.message || `Anthropic error ${anthropicRes.status}`,
    })
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')

  const reader = anthropicRes.body.getReader()
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
        let ev
        try { ev = JSON.parse(line.slice(6)) } catch { continue }
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ t: ev.delta.text })}\n\n`)
        } else if (ev.type === 'message_stop') {
          res.write('data: [DONE]\n\n')
        } else if (ev.type === 'error') {
          res.write(`data: ${JSON.stringify({ error: ev.error?.message || 'Stream error' })}\n\n`)
          res.end(); return
        }
      }
    }
  } catch (e) {
    console.error('[chat stream]', e.message)
  }
  res.end()
}
