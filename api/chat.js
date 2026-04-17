/**
 * Vercel Serverless Function — /api/chat
 * Routes requests to Groq (temporaire) avec basic rate limiting.
 *
 * POST body: { systemPrompt, messages, model? }
 *   - messages: [{role, content}]  (content can be a string or vision array)
 */

// ─── Rate limiting (in-memory, per Vercel instance) ──────────────────────────
const RATE_LIMIT_MAX    = 20
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

  // Groq n'accepte pas les content arrays (vision) — on convertit en string
  const cleanMessages = messages.map(m => ({
    role:    m.role,
    content: Array.isArray(m.content)
      ? m.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
      : m.content,
  }))

  const apiKey = (process.env.GROQ_API_KEY || '').trim()

  try {
    if (wantStream) return await callGroqStream(systemPrompt, cleanMessages, apiKey, res)
    const content = await callGroq(systemPrompt, cleanMessages, apiKey)
    return res.status(200).json({ content })
  } catch (err) {
    console.error('[chat API] error:', err.message)
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'AI service error' })
  }
}

// ─── Groq (non-streaming) ─────────────────────────────────────────────────────

async function callGroq(systemPrompt, messages, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq error ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Groq (streaming) ────────────────────────────────────────────────────────

async function callGroqStream(systemPrompt, messages, apiKey, res) {
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream:     true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    res.setHeader('Content-Type', 'application/json')
    return res.status(groqRes.status).json({
      error: err.error?.message || `Groq error ${groqRes.status}`,
    })
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')

  const reader = groqRes.body.getReader()
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
        const text = ev.choices?.[0]?.delta?.content
        if (text) res.write(`data: ${JSON.stringify({ t: text })}\n\n`)
        if (ev.choices?.[0]?.finish_reason === 'stop') res.write('data: [DONE]\n\n')
      }
    }
  } catch (e) {
    console.error('[groq stream]', e.message)
  }
  res.end()
}
