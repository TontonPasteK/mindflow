/**
 * Vercel Serverless Function — /api/tts
 * Streams TTS audio from OpenAI directly to the client (no full-buffer wait).
 *
 * POST body: { text }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { text } = body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' })
  }

  const cleanText = text.trim().substring(0, 800)

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: cleanText,
        voice: 'nova',
        response_format: 'mp3',
        speed: 1.15,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI TTS error ${openaiRes.status}`)
    }

    // Stream directly — client can start playing before full download
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Transfer-Encoding', 'chunked')

    const { Readable } = await import('stream')
    Readable.fromWeb(openaiRes.body).pipe(res)

  } catch (err) {
    console.error('[tts API]', err.message)
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message })
    }
  }
}
