import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { buildPremiumPrompt, buildFreePrompt, buildDrMindPrompt } from '../services/prompts'
import {
  upsertProfile, addVictory, getLastSession,
  getNotionsTravaillees, upsertNotionTravaillee,
  getKnowledgeGraph, upsertKnowledgeGraph,
  addPoints,
} from '../services/supabase'

const MAX_HISTORY_SESSION = 20
const MAX_HISTORY_DRMIND  = 60

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

  // [[SEANCE_COMPLETE]]
  let seanceComplete = false
  if (text.includes('[[SEANCE_COMPLETE]]')) {
    seanceComplete = true
    text = text.replace('[[SEANCE_COMPLETE]]', '').trim()
  }

  return { text, profileData, strategies, victory, notifyParents, seanceComplete }
}

const BLOCAGE_KEYWORDS = ['je sais pas', 'j\'sais pas', 'aucune idée', 'je comprends pas', 'je comprends rien']

export function useChat({ onProfile, onVictory, onTTS, onSeanceComplete, mode = 'session', seance = 1, matiere = 'general' }) {
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
  const matiereRef                = useRef(matiere)
  const blocageCountRef           = useRef(0)
  useEffect(() => { matiereRef.current = matiere }, [matiere])

  const buildSystemPrompt = useCallback(async () => {
    if (mode === 'drMind') {
      return buildDrMindPrompt(user, seance)
    }
    if (isPremium) {
      const [lastSession, notionsPrecedentes, knowledgeGraph] = await Promise.all([
        getLastSession(user.id).catch(() => null),
        getNotionsTravaillees(user.id, matiereRef.current).catch(() => []),
        getKnowledgeGraph(user.id).catch(() => null),
      ])
      return buildPremiumPrompt(user, profile, lastSession, matiereRef.current, notionsPrecedentes, knowledgeGraph)
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

      if (isPremium || mode === 'drMind') {
        // Mode premium ou Dr Mind : appel API pour le greeting
        const initMsg = {
          role: 'user',
          content: mode === 'drMind' ? 'Bonjour Dr Mind !' : `Bonjour !`
        }
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
            }, user?.id, user?.prenom, matiereRef.current)
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
        // Mode free (Dr Mind Light) : appel API pour un vrai greeting dynamique
        const prenom = user?.prenom || ''
        const initMsg = { role: 'user', content: 'Bonjour !' }
        historyRef.current = [initMsg]

        const msgId = Date.now() + Math.random()

        let rawText
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            rawText = await callAIStream(systemPrompt, historyRef.current, () => {}, user?.id, user?.prenom, matiereRef.current)
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

        const { text } = parseTags(rawText)
        addMessage('assistant', text, { id: msgId })
        historyRef.current = [...historyRef.current, { role: 'assistant', content: text }]
      }

    } catch (err) {
      console.error('initChat error:', err)

      // Message d'erreur plus rassurant
      const fallback = mode === 'drMind'
        ? `Bonjour ! Je suis Dr Mind. On va découvrir ensemble comment tu apprends le mieux. On commence ?`
        : `Salut ! Je suis Dr Mind. Comment tu vas ? C'est quoi au programme ce soir ?`

      addMessage('assistant', fallback)

      // Message d'erreur discret pour l'utilisateur
      if (!err.message?.includes('Overloaded')) {
        setError('Dr Mind a eu un petit souci de connexion, mais il est là maintenant !')
      }
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
      const maxHistory = mode === 'drMind' ? MAX_HISTORY_DRMIND : MAX_HISTORY_SESSION

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

      historyRef.current = [...historyRef.current, { role: 'user', content: apiContent }].slice(-maxHistory)

      const msgId = Date.now() + Math.random()
      let earlyTtsSentence = null

      const rawResponse = await callAIStream(systemPrompt, historyRef.current, (sentence) => {
        earlyTtsSentence = sentence
        if (onTTSRef.current) onTTSRef.current(sentence, msgId)
      }, user?.id, user?.prenom, matiereRef.current)

      if (fileData) {
        const ref = (fileData.mimeType === 'application/pdf' ? '[PDF envoyé]' : '[Image envoyée]') +
          (hasText ? ` — "${content.trim()}"` : '')
        historyRef.current[historyRef.current.length - 1] = { role: 'user', content: ref }
      }

      const { text, profileData, strategies, victory, notifyParents, seanceComplete } = parseTags(rawResponse)

      const assistantMsg = addMessage('assistant', text, { strategies, id: msgId })
      historyRef.current = [...historyRef.current, { role: 'assistant', content: text }].slice(-maxHistory)
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

      // Séance Dr Mind complète
      if (seanceComplete && onSeanceComplete) {
        onSeanceComplete()
      }

      // Notification parents
      if (notifyParents) {
        console.log('[DrMind] Notify parents:', notifyParents)
        // TODO Phase 2 : déclencher email via Supabase Edge Function
      }

      // Détection blocage
      const isBlockage = BLOCAGE_KEYWORDS.some(kw => content.toLowerCase().includes(kw))
      if (isBlockage) {
        blocageCountRef.current += 1
      } else {
        blocageCountRef.current = 0
      }
      if (blocageCountRef.current >= 3 && user?.id) {
        const sujet = matiereRef.current !== 'general' ? matiereRef.current : 'sujet inconnu'
        getKnowledgeGraph(user.id).then(kg => {
          const current = kg?.blocages_recurrents || []
          const entry = `Blocage ${sujet} (détecté x3)`
          if (!current.includes(entry)) {
            upsertKnowledgeGraph(user.id, {
              blocages_recurrents: [...current, entry].slice(-20),
            }).catch(() => {})
          }
        }).catch(() => {})
        blocageCountRef.current = 0
      }

      // Victoire
      if (victory && onVictory && sessionId) {
        const v = await addVictory(user.id, sessionId, victory)
        onVictory(v)

        // Mise à jour knowledge graph + points
        if (user?.id) {
          const lower = victory.toLowerCase()
          const bloomLevel = lower.includes('niveau 3') || lower.includes('transf') ? 3
            : lower.includes('niveau 2') || lower.includes('appliqu') ? 2 : 1
          const pts = bloomLevel === 3 ? 30 : bloomLevel === 2 ? 20 : 10
          addPoints(user.id, pts).catch(() => {})

          getKnowledgeGraph(user.id).then(kg => {
            const maitrisees = kg?.notions_maitrisees || []
            const enCours = kg?.notions_en_cours || []
            const shortV = victory.slice(0, 60)
            if (bloomLevel >= 2 && !maitrisees.includes(shortV)) {
              upsertKnowledgeGraph(user.id, {
                notions_maitrisees: [...maitrisees, shortV].slice(-50),
                notions_en_cours: enCours.filter(n => n !== shortV),
              }).catch(() => {})
              if (matiereRef.current !== 'general') {
                upsertNotionTravaillee(user.id, matiereRef.current, shortV, true).catch(() => {})
              }
            } else if (bloomLevel === 1) {
              if (!enCours.includes(shortV)) {
                upsertKnowledgeGraph(user.id, {
                  notions_en_cours: [...enCours, shortV].slice(-20),
                }).catch(() => {})
              }
            }
          }).catch(() => {})
        }
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

      // Messages d'erreur humains et rassurants
      let errorMessage = 'Oups, j\'ai eu un petit problème. Réessaie !'

      if (err.message?.includes('Overloaded') || err.message?.includes('timeout')) {
        errorMessage = 'Dr Mind réfléchit encore un peu... Attends 2 secondes et réessaie !'
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Hmm, la connexion semble instable. Vérifie ton internet et réessaie.'
      } else if (err.message?.includes('Limite')) {
        errorMessage = err.message
      } else if (err.message?.includes('API') || err.message?.includes('rate')) {
        errorMessage = 'Dr Mind est très demandé ! Attends quelques secondes et réessaie.'
      }

      setError(errorMessage)
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
async function callAIStream(systemPrompt, messages, onFirstSentence, userId, userName, subject) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, stream: true, userId, userName, subject }),
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
