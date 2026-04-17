import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { buildPremiumPrompt, buildFreePrompt, buildDrMindPrompt } from '../services/prompts'
import { upsertProfile, addVictory, getLastSession } from '../services/supabase'

const MAX_HISTORY = 20

function parseTags(content) {
  let text = content
  let profileData = null
  let strategies = null
  let victory = null
  let notifyParents = null

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

  // [[NOTIFY_PARENTS:{...}]]
  const notifyMatch = text.match(/\[\[NOTIFY_PARENTS:(\{.*?\})\]\]/s)
  if (notifyMatch) {
    try { notifyParents = JSON.parse(notifyMatch[1]) } catch {}
    text = text.replace(notifyMatch[0], '').trim()
  }

  return { text, profileData, strategies, victory, notifyParents }
}

export function useChat({ onProfile, onVictory, onTTS, mode = 'session', seance = 1 }) {
  const { user, profile, isPremium, refreshProfile } = useAuth()
  const { sessionId, addExchange, addMatiere, persistMessage } = useSession()

  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [retryStatus, setRetryStatus] = useState(null)
  const historyRef                = useRef([])
  const initRef                   = useRef(false)
  const onTTSRef                  = useRef(onTTS)
  onTTSRef.current                = onTTS

  const buildSystemPrompt = useCallback(async () => {
    if (mode === 'drMind') {
      return buildDrMindPrompt(user, seance)
    }
    if (isPremium) {
      const lastSession = await getLastSession(user.id).catch(() => null)
      return buildPremiumPrompt(user, profile, lastSession)
    }
    return buildFreePrompt(user)
  }, [mode, seance, isPremium, user, profile])

  const addMessage = useCallback((role, content, extras = {}) => {
    const { id: preId, ...rest } = extras
    const msg = { id: preId ?? (Date.now() + Math.random()), role, content, ...rest }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const initChat = useCallback(async () => {
    if (initRef.current) return
    initRef.current = true
    setLoading(true)

    try {
      const systemPrompt = await buildSystemPrompt()

      // Greeting selon le mode
      let greeting
      if (mode === 'drMind') {
        greeting = seance === 1
          ? `Bonjour ${user?.prenom || ''} ! Moi c'est Dr Mind. Avant que tu rencontres ton assistant personnel, j'ai besoin de comprendre comment TOI tu fonctionnes — parce que tout le monde pense différemment. On va passer environ 20 minutes ensemble aujourd'hui. Pas de bonnes ou mauvaises réponses — juste ce qui se passe vraiment dans ta tête. On commence ?`
          : `Bon retour ${user?.prenom || ''} ! La dernière fois on a bien avancé. Avant de continuer — qu'est-ce qui te revient de ce qu'on a fait ensemble ?`
      } else if (isPremium) {
        greeting = `Hey ${user?.prenom || ''} ! Content de te voir. C'est quoi au programme ce soir ?`
      } else {
        greeting = `Salut ${user?.prenom || ''} ! Je suis Maya. T'as quoi comme devoirs ce soir ?`
      }

      if (isPremium || mode === 'drMind') {
        const initMsg = { role: 'user', content: mode === 'drMind' ? 'Bonjour Dr Mind !' : 'Bonjour Maya !' }
        historyRef.current = [initMsg]

        const msgId = Date.now() + Math.random()
        let earlyTtsSentence = null

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
              setRetryStatus('Dr Mind réfléchit...')
              await new Promise(r => setTimeout(r, 3000))
            } else {
              throw err
            }
          }
        }

        const { text, strategies } = parseTags(rawText)
        const greetMsg = addMessage('assistant', text, { strategies, id: msgId })
        historyRef.current = [...historyRef.current, { role: 'assistant', content: text }]

        if (earlyTtsSentence !== null) {
          const firstMatch = text.match(/^(.{15,}?[.!?])\s/)
          const remainder = firstMatch ? text.slice(firstMatch[0].length).trim() : ''
          if (remainder && onTTSRef.current) onTTSRef.current(remainder, greetMsg.id)
        } else {
          if (onTTSRef.current) onTTSRef.current(text, greetMsg.id)
        }
      } else {
        addMessage('assistant', greeting)
        if (onTTSRef.current) onTTSRef.current(greeting)
      }
    } catch (err) {
      console.error('initChat error:', err)
      const fallback = mode === 'drMind'
        ? `Bonjour ! Je suis Dr Mind. On va découvrir ensemble comment tu apprends le mieux. On commence ?`
        : `Salut ! Je suis Maya. C'est quoi au programme ce soir ?`
      addMessage('assistant', fallback)
    } finally {
      setRetryStatus(null)
      setLoading(false)
    }
  }, [isPremium, mode, seance, user, profile, buildSystemPrompt, addMessage])

  const sendMessage = useCallback(async (content, fileData = null) => {
    const hasText = content && content.trim()
    if (!hasText && !fileData) return
    if (loading) return
    setError(null)

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

      historyRef.current = [...historyRef.current, { role: 'user', content: apiContent }].slice(-MAX_HISTORY)

      const msgId = Date.now() + Math.random()
      let earlyTtsSentence = null

      const rawResponse = await callAIStream(systemPrompt, historyRef.current, (sentence) => {
        earlyTtsSentence = sentence
        if (onTTSRef.current) onTTSRef.current(sentence, msgId)
      })

      if (fileData) {
        const ref = (fileData.mimeType === 'application/pdf' ? '[PDF envoyé]' : '[Image envoyée]') +
          (hasText ? ` — "${content.trim()}"` : '')
        historyRef.current[historyRef.current.length - 1] = { role: 'user', content: ref }
      }

      const { text, profileData, strategies, victory, notifyParents } = parseTags(rawResponse)

      const assistantMsg = addMessage('assistant', text, { strategies, id: msgId })
      historyRef.current = [...historyRef.current, { role: 'assistant', content: text }].slice(-MAX_HISTORY)
      await persistMessage('assistant', text)

      // Profil détecté — enregistrement
      if (profileData && onProfile) {
        await upsertProfile(user.id, {
          visuel: profileData.visuel,
          auditif: profileData.auditif,
          kinesthesique: profileData.kinesthesique,
          projet_de_sens: profileData.projet_de_sens,
          intelligence_dominante: profileData.intelligence,
          passions: profileData.passions,
          onboarding_complete: profileData.onboarding_complete ?? false,
          avatar: assignAvatar(profileData),
        })
        await refreshProfile()
        onProfile(profileData)
      }

      // Notification parents
      if (notifyParents) {
        console.log('[DrMind] Notify parents:', notifyParents)
        // TODO Phase 2 : déclencher email via Supabase Edge Function
      }

      // Victoire
      if (victory && onVictory && sessionId) {
        const v = await addVictory(user.id, sessionId, victory)
        onVictory(v)
      }

      // Détection matière (sessions normales uniquement)
      if (mode !== 'drMind') {
        detectMatiere(content + ' ' + text, addMatiere)
      }

      // TTS
      if (earlyTtsSentence !== null) {
        const firstMatch = text.match(/^(.{15,}?[.!?])\s/)
        const remainder = firstMatch ? text.slice(firstMatch[0].length).trim() : ''
        if (remainder && onTTSRef.current) onTTSRef.current(remainder, assistantMsg.id)
      } else {
        if (onTTSRef.current) onTTSRef.current(text, assistantMsg.id)
      }

    } catch (err) {
      console.error('sendMessage error:', err)
      setError(err.message?.startsWith('Limite') ? err.message : 'Oups, j\'ai eu un problème. Réessaie !')
    } finally {
      setLoading(false)
    }
  }, [loading, addMessage, addExchange, persistMessage, buildSystemPrompt, user, sessionId, onProfile, onVictory, refreshProfile, addMatiere, mode])

  return { messages, loading, error, retryStatus, sendMessage, initChat }
}

// ─── Attribution automatique de l'avatar selon le profil ─────────────────────
function assignAvatar(profileData) {
  const v = profileData.visuel ?? 0
  const a = profileData.auditif ?? 0
  const k = profileData.kinesthesique ?? 0
  const total = v + a + k
  if (total === 0) return 'Maya'

  const vp = v / total
  const ap = a / total
  const kp = k / total
  const threshold = 0.5

  if (vp >= threshold) return 'Max'
  if (ap >= threshold) return 'Victor'
  if (kp >= threshold) return 'Léo'
  if (vp >= 0.35 && ap >= 0.35) return 'Maya'
  if (vp >= 0.35 && kp >= 0.35) return 'Noa'
  if (ap >= 0.35 && kp >= 0.35) return 'Sam'
  return 'Alex'
}

// ─── Streaming API ────────────────────────────────────────────────────────────
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

// ─── Détection matière ────────────────────────────────────────────────────────
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
