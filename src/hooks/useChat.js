import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { buildPremiumPrompt, buildFreePrompt } from '../services/prompts'
import { upsertProfile, addVictory, getLastSession } from '../services/supabase'

const MAX_HISTORY = 20  // keep last N messages for context

// Parse special tags from AI response
function parseTags(content) {
  let text = content
  let profileData = null
  let strategies = null
  let victory = null

  // [[PROFILE:{...}]]
  const profileMatch = text.match(/\[\[PROFILE:(\{.*?\})\]\]/s)
  if (profileMatch) {
    try { profileData = JSON.parse(profileMatch[1]) } catch {}
    text = text.replace(profileMatch[0], '').trim()
  }

  // [[STRATEGIES:[...]]]
  const stratMatch = text.match(/\[\[STRATEGIES:(\[.*?\])\]\]/s)
  if (stratMatch) {
    try { strategies = JSON.parse(stratMatch[1]) } catch {}
    text = text.replace(stratMatch[0], '').trim()
  }

  // [[VICTORY:text]]
  const victoryMatch = text.match(/\[\[VICTORY:(.*?)\]\]/)
  if (victoryMatch) {
    victory = victoryMatch[1].trim()
    text = text.replace(victoryMatch[0], '').trim()
  }

  return { text, profileData, strategies, victory }
}

export function useChat({ onProfile, onVictory, onTTS }) {
  const { user, profile, isPremium, refreshProfile } = useAuth()
  const { sessionId, addExchange, addMatiere, persistMessage } = useSession()

  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [retryStatus, setRetryStatus] = useState(null)
  const historyRef                = useRef([])  // raw {role, content} for API
  const initRef                   = useRef(false)
  const onTTSRef                  = useRef(onTTS)
  onTTSRef.current                = onTTS  // always points to latest callback

  // Build system prompt
  const buildSystemPrompt = useCallback(async () => {
    if (isPremium) {
      const lastSession = await getLastSession(user.id).catch(() => null)
      return buildPremiumPrompt(user, profile, lastSession)
    }
    return buildFreePrompt(user)
  }, [isPremium, user, profile])

  // Add a message to UI state only (history managed explicitly)
  // Accepts an optional pre-generated id in extras (used when TTS is fired before addMessage)
  const addMessage = useCallback((role, content, extras = {}) => {
    const { id: preId, ...rest } = extras
    const msg = { id: preId ?? (Date.now() + Math.random()), role, content, ...rest }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  // Initialise the session with Maya's greeting
  const initChat = useCallback(async () => {
    if (initRef.current) return
    initRef.current = true
    setLoading(true)

    try {
      const systemPrompt = await buildSystemPrompt()
      const greeting = isPremium
        ? `Hey ${user?.prenom || ''} ! Content de te voir. C'est quoi au programme ce soir ?`
        : `Salut ${user?.prenom || ''} ! Je suis Maya. T'as quoi comme devoirs ce soir ?`

      if (isPremium) {
        // Seed history with the init exchange
        const initMsg = { role: 'user', content: 'Bonjour Maya !' }
        historyRef.current = [initMsg]

        // Pre-generate msgId so TTS can reference it before addMessage
        const msgId = Date.now() + Math.random()
        let earlyTtsSentence = null

        // Retry automatique si l'API est surchargée (jusqu'à 3 fois, 3s d'attente)
        let rawText
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            earlyTtsSentence = null
            rawText = await callAIStream(systemPrompt, historyRef.current, (sentence) => {
              earlyTtsSentence = sentence
              if (onTTSRef.current) onTTSRef.current(sentence, msgId)
            })
            break
          } catch (err) {
            if (attempt <= 3 && err.message?.includes('Overloaded')) {
              setRetryStatus('Maya réfléchit...')
              await new Promise(r => setTimeout(r, 3000))
            } else {
              throw err
            }
          }
        }

        const { text, strategies } = parseTags(rawText)
        const greetMsg = addMessage('assistant', text, { strategies, id: msgId })
        historyRef.current = [...historyRef.current, { role: 'assistant', content: text }]

        // Queue remaining sentences for TTS (after the first sentence already fired)
        if (earlyTtsSentence !== null) {
          const firstMatch = text.match(/^(.{15,}?[.!?])\s/)
          const remainder = firstMatch ? text.slice(firstMatch[0].length).trim() : ''
          if (remainder && onTTSRef.current) onTTSRef.current(remainder, greetMsg.id)
        } else {
          if (onTTSRef.current) onTTSRef.current(text, greetMsg.id)
        }
      } else {
        // Free: greet locally, history starts empty (first user msg will be first)
        addMessage('assistant', greeting)
        if (onTTSRef.current) onTTSRef.current(greeting)
      }
    } catch (err) {
      console.error('initChat error:', err)
      addMessage('assistant', `Salut ! Je suis Maya, ta compagne de devoirs. C'est quoi au programme ce soir ?`)
    } finally {
      setRetryStatus(null)
      setLoading(false)
    }
  }, [isPremium, user, profile, buildSystemPrompt, addMessage])

  // Send a user message and get AI response
  // fileData = { base64: string, mimeType: string } for vision/document attachments
  const sendMessage = useCallback(async (content, fileData = null) => {
    const hasText = content && content.trim()
    if (!hasText && !fileData) return
    if (loading) return
    setError(null)

    // Label shown in the chat bubble
    const displayText = hasText
      ? content.trim()
      : fileData?.mimeType === 'application/pdf' ? 'PDF joint' : 'Image jointe'

    addMessage('user', displayText, {
      fileAttachment: fileData ? { mimeType: fileData.mimeType } : null,
    })
    addExchange()
    await persistMessage('user', displayText)

    setLoading(true)

    try {
      const systemPrompt = await buildSystemPrompt()

      // Build the API-facing content (string or vision content array)
      let apiContent
      if (fileData) {
        const blocks = []
        if (fileData.mimeType === 'application/pdf') {
          blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData.base64 } })
        } else {
          blocks.push({ type: 'image', source: { type: 'base64', media_type: fileData.mimeType, data: fileData.base64 } })
        }
        blocks.push({ type: 'text', text: hasText ? content.trim() : 'Voilà mon document. Tu peux le lire et m\'aider dessus ?' })
        apiContent = blocks
      } else {
        apiContent = content.trim()
      }

      // Add to history with full vision content for this request
      historyRef.current = [...historyRef.current, { role: 'user', content: apiContent }].slice(-MAX_HISTORY)

      // Pre-generate msgId so TTS can reference it before addMessage
      const msgId = Date.now() + Math.random()
      let earlyTtsSentence = null

      const rawResponse = await callAIStream(systemPrompt, historyRef.current, (sentence) => {
        earlyTtsSentence = sentence
        if (onTTSRef.current) onTTSRef.current(sentence, msgId)
      })

      // Replace the base64 blob in history with a compact text ref (avoid bloating future calls)
      if (fileData) {
        const ref = (fileData.mimeType === 'application/pdf' ? '[PDF envoyé]' : '[Image envoyée]') +
          (hasText ? ` — "${content.trim()}"` : '')
        historyRef.current[historyRef.current.length - 1] = { role: 'user', content: ref }
      }
      const { text, profileData, strategies, victory } = parseTags(rawResponse)

      // Add AI message to UI + history
      const assistantMsg = addMessage('assistant', text, { strategies, id: msgId })
      historyRef.current = [...historyRef.current, { role: 'assistant', content: text }].slice(-MAX_HISTORY)
      await persistMessage('assistant', text)

      // Handle profile detection
      if (profileData && onProfile) {
        await upsertProfile(user.id, {
          visuel: profileData.visuel,
          auditif: profileData.auditif,
          kinesthesique: profileData.kinesthesique,
          projet_de_sens: profileData.projet_de_sens,
          intelligence_dominante: profileData.intelligence,
          passions: profileData.passions,
          onboarding_complete: true,
        })
        await refreshProfile()
        onProfile(profileData)
      }

      // Handle victory
      if (victory && onVictory && sessionId) {
        const v = await addVictory(user.id, sessionId, victory)
        onVictory(v)
      }

      // Detect matiere from conversation (simple heuristic)
      detectMatiere(content + ' ' + text, addMatiere)

      // TTS — queue remaining sentences after the first (already fired during stream)
      if (earlyTtsSentence !== null) {
        const firstMatch = text.match(/^(.{15,}?[.!?])\s/)
        const remainder = firstMatch ? text.slice(firstMatch[0].length).trim() : ''
        if (remainder && onTTSRef.current) onTTSRef.current(remainder, assistantMsg.id)
      } else {
        if (onTTSRef.current) onTTSRef.current(text, assistantMsg.id)
      }

    } catch (err) {
      console.error('sendMessage error:', err)
      // Show the API error message directly (e.g. rate limit message), fallback to generic
      setError(err.message?.startsWith('Limite') ? err.message : 'Oups, j\'ai eu un problème. Réessaie !')
    } finally {
      setLoading(false)
    }
  }, [loading, addMessage, addExchange, persistMessage, buildSystemPrompt, user, sessionId, onProfile, onVictory, refreshProfile, addMatiere])

  return { messages, loading, error, retryStatus, sendMessage, initChat }
}

// ─── Streaming API call — fires onFirstSentence as soon as a sentence is ready ─

async function callAIStream(systemPrompt, messages, onFirstSentence) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, stream: true }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API error ${response.status}`)
  }

  const reader = response.body.getReader()
  const dec    = new TextDecoder()
  let   buf = '', text = '', fired = false

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') continue
      let ev
      try { ev = JSON.parse(raw) } catch { continue }
      if (ev.error) throw new Error(ev.error)
      if (ev.t) {
        text += ev.t
        // Fire TTS on first complete sentence (≥15 chars, ends .!?, followed by space)
        // Skip if a [[TAG]] is open — tags are stripped by TTS.speak() but we avoid partial ones
        if (!fired) {
          const m = text.match(/^(.{15,}?[.!?])\s/)
          if (m && !m[1].includes('[[')) {
            fired = true
            onFirstSentence?.(m[1])
          }
        }
      }
    }
  }

  return text
}

// ─── Simple matière detection ─────────────────────────────────────────────────

const MATIERES = {
  'maths': ['maths', 'math', 'équation', 'calcul', 'géométrie', 'algèbre', 'fraction'],
  'français': ['français', 'rédaction', 'grammaire', 'conjugaison', 'orthographe', 'lecture', 'poème', 'texte'],
  'anglais': ['anglais', 'english', 'grammaire anglaise', 'vocabulaire anglais'],
  'histoire': ['histoire', 'géo', 'géographie', 'guerre', 'révolution', 'siècle'],
  'sciences': ['sciences', 'physique', 'chimie', 'biologie', 'svt', 'expérience'],
  'philo': ['philo', 'philosophie', 'dissertation'],
}

function detectMatiere(text, addMatiere) {
  const lower = text.toLowerCase()
  for (const [matiere, keywords] of Object.entries(MATIERES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      addMatiere(matiere.charAt(0).toUpperCase() + matiere.slice(1))
    }
  }
}
