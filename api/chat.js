/**
 * Vercel Serverless Function — /api/chat
 * POST body: { systemPrompt, messages, stream?, userId? }
 */

// ─── Mem0 (BLOC 4) ────────────────────────────────────────────────────────────
async function mem0Search(userId, query) {
  const key = process.env.MEM0_API_KEY
  if (!key || !userId) return null
  try {
    const res = await fetch('https://api.mem0.ai/v1/memories/search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${key}` },
      body: JSON.stringify({ query, user_id: userId, limit: 5 }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.results || null
  } catch { return null }
}

async function mem0Add(userId, messages) {
  const key = process.env.MEM0_API_KEY
  if (!key || !userId) return
  try {
    await fetch('https://api.mem0.ai/v1/memories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${key}` },
      body: JSON.stringify({ messages, user_id: userId }),
    })
  } catch {}
}

function buildMem0Injection(memories) {
  if (!memories || memories.length === 0) return ''
  const lines = memories.map(m => `- ${m.memory}`).join('\n')
  return `\nMÉMOIRE INTER-SESSIONS (Mem0) :\n${lines}`
}

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

  const { systemPrompt, messages, stream: wantStream, userId, userName, subject } = body

  if (!systemPrompt || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing systemPrompt or messages' })
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  // BLOC 4 — Mem0 : injecter mémoires inter-sessions
  let enrichedSystemPrompt = systemPrompt

  if (userId) {
    const query = [userName, subject].filter(Boolean).join(' ') || 'session'
    const memories = await mem0Search(userId, query)
    if (memories && memories.length > 0) {
      enrichedSystemPrompt = systemPrompt + buildMem0Injection(memories)
    }
  }

  try {
    let result
    if (wantStream) {
      result = await callClaudeStream(enrichedSystemPrompt, messages, apiKey, res)
    } else {
      const content = await callClaude(enrichedSystemPrompt, messages, apiKey)
      result = content
      res.status(200).json({ content })
    }

    // BLOC 4 — Mem0 : sauvegarder uniquement en fin de séance
    if (userId) {
      const assistantReply = typeof result === 'string' ? result : ''
      if (assistantReply.includes('[[SEANCE_COMPLETE]]')) {
        const cleanMessages = messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '[vision]',
        }))
        const summaryMessages = [
          {
            role: 'user',
            content: 'Résume cette séance en 4 points : 1) Notion travaillée (matière + concept exact) 2) Victoires : moments où l\'élève a compris par lui-même 3) Blocages : ce qui a résisté 4) Passions mentionnées par l\'élève. Format court, factuel, réutilisable à la prochaine session.',
          },
          ...cleanMessages,
          { role: 'assistant', content: assistantReply },
        ]
        mem0Add(userId, summaryMessages).catch(() => {})
      }
    }

    return
  } catch (err) {
    console.error('[chat API] error:', err.message)
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'AI service error' })
  }
}

// ─── Mistral OCR fallback (BLOC 11) ──────────────────────────────────────────

async function scanWithMistral(imageBase64, mimeType) {
  const mistralKey = process.env.MISTRAL_API_KEY
  if (!mistralKey) return null
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mistralKey}` },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: 'text', text: 'Transcris exactement le texte visible sur cette image.' },
          ],
        }],
        max_tokens: 2048,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

function hasImageContent(messages) {
  return messages.some(m => Array.isArray(m.content) && m.content.some(b => b.type === 'image'))
}

function extractImageFromMessages(messages) {
  for (const m of [...messages].reverse()) {
    if (Array.isArray(m.content)) {
      const img = m.content.find(b => b.type === 'image')
      if (img?.source?.data) return { base64: img.source.data, mimeType: img.source.media_type }
    }
  }
  return null
}

function replaceImageWithText(messages, extractedText) {
  return messages.map(m => {
    if (!Array.isArray(m.content)) return m
    const hasImg = m.content.some(b => b.type === 'image')
    if (!hasImg) return m
    const textBlocks = m.content.filter(b => b.type === 'text')
    return {
      ...m,
      content: [...textBlocks, { type: 'text', text: `[Document OCR]\n${extractedText}` }],
    }
  })
}

// ─── Claude (non-streaming) ───────────────────────────────────────────────────

async function callClaude(systemPrompt, messages, apiKey) {
  let claudeMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
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

  // BLOC 11 — Mistral fallback si 429 sur une requête avec image
  if (response.status === 429 && hasImageContent(messages)) {
    const imgData = extractImageFromMessages(messages)
    if (imgData) {
      const ocrText = await scanWithMistral(imgData.base64, imgData.mimeType)
      if (ocrText) {
        const textMessages = replaceImageWithText(messages, ocrText)
        return callClaude(systemPrompt, textMessages, apiKey)
      }
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude error ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ─── Claude (streaming) ───────────────────────────────────────────────────────

async function callClaudeStream(systemPrompt, messages, apiKey, res) {
  // BLOC 11 — Mistral fallback si image présente et 429 possible
  let processedMessages = messages

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
      messages:   processedMessages,
    }),
  })

  // BLOC 11 — Mistral fallback sur 429 avec image
  if (claudeRes.status === 429 && hasImageContent(processedMessages)) {
    const imgData = extractImageFromMessages(processedMessages)
    if (imgData) {
      const ocrText = await scanWithMistral(imgData.base64, imgData.mimeType)
      if (ocrText) {
        return callClaudeStream(systemPrompt, replaceImageWithText(processedMessages, ocrText), apiKey, res)
      }
    }
  }

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