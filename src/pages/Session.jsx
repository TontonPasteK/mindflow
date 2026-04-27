import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { useChat } from '../hooks/useChat'
import { useVoice } from '../hooks/useVoice'
import { useTTS } from '../hooks/useTTS'
import { getUserVictories, updateStreak } from '../services/supabase'

import MaxAvatar      from '../components/avatar/MaxAvatar'
import ChatInterface  from '../components/chat/ChatInterface'
import InputArea      from '../components/chat/InputArea'
import VoiceButton    from '../components/voice/VoiceButton'
import VoiceToggle    from '../components/voice/VoiceToggle'
import PomodoroTimer  from '../components/session/PomodoroTimer'
import DocumentScanner from '../components/session/DocumentScanner'
import UpgradeBanner  from '../components/session/UpgradeBanner'
import VictoryModal   from '../components/session/VictoryModal'

const MATIERES_OPTIONS = ['Général', 'Maths', 'Français', 'Histoire', 'Physique', 'SVT', 'Anglais', 'Autre']

export default function Session() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, isPremium, refreshProfile } = useAuth()
  const { startSession, closeSession, showUpgradeBanner, sessionId } = useSession()

  const mode = params.get('mode') || (isPremium ? 'premium' : 'free')
  const isSessionPremium = mode === 'premium' && isPremium

  // Nom du personnage selon le mode
  const avatarName = isSessionPremium ? (profile?.avatar || 'Maya') : 'Dr Mind'

  // Modal choix parler/taper
  const [inputMode, setInputMode] = useState(null) // null = pas encore choisi
  const [voiceMode, setVoiceMode]     = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [newVictory, setNewVictory]   = useState(null)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const [userPaused, setUserPaused]   = useState(false)
  const [ttsEnabled, setTtsEnabled]   = useState(false)
  const initRanRef                    = useRef(false)

  // BLOC 2 — matière sélectionnée
  const [matiere, setMatiere]         = useState('general')
  // BLOC 5 — victoires récentes
  const [recentVictories, setRecentVictories] = useState([])
  const [showVictories, setShowVictories] = useState(false)
  // BLOC 6 — streak + points
  const [streak, setStreak]           = useState(profile?.streak ?? 0)
  const [points, setPoints]           = useState(profile?.points ?? 0)

  // BLOC 1 — Timer de session 1h
  const [sessionStartTime] = useState(Date.now())
  const [sessionWarningShown, setSessionWarningShown] = useState(false)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)

  // BLOC 4 — Reprise de session
  const [showResumeSession, setShowResumeSession] = useState(false)
  const [lastSessionResume, setLastSessionResume] = useState(null)

  // BLOC 5 — Mode session courte 15min
  const [shortSessionMode, setShortSessionMode] = useState(false)
  const [shortSessionWarningShown, setShortSessionWarningShown] = useState(false)

  const { isSpeaking, speak, stop: stopTTS } = useTTS({
    enabled: ttsEnabled,
    onPlayStart: (msgId) => setSpeakingMessageId(msgId),
  })

  // Chat hook — passe matière pour BLOC 2+3
  const { messages, loading, error, retryStatus, sendMessage, initChat } = useChat({
    mode: 'session',
    onVictory: (v) => {
      setNewVictory(v)
      setRecentVictories(prev => [v, ...prev].slice(0, 5))
    },
    onTTS: null,
    onProfile: null,
    matiere,
    onSeanceComplete: async () => {
      await refreshProfile()
      navigate('/avatar-transition')
    },
  })

  // Voice (Web Speech API)
  const { isListening, isSupported, permissionGranted, interimText, requestPermission, startListening, stopListening } =
    useVoice({
      onTranscript: (text) => {
        stopListening()
        setUserPaused(false)
        sendMessage(text)
      },
    })

  // ── Init session ────────────────────────────────────────
  useEffect(() => {
    if (!user || initRanRef.current) return
    initRanRef.current = true

    const init = async () => {
      try {
        await startSession(user.id, mode)
      } catch (err) {
        console.warn('[Session] startSession failed (non-blocking):', err.message)
        // L'erreur est déjà gérée dans useChat, pas besoin de la cacher
      }
      // BLOC 6 — streak update au démarrage
      if (isSessionPremium) {
        updateStreak(user.id).then(s => setStreak(s)).catch(() => {})
      }
      // BLOC 5 — charger victoires récentes
      if (isSessionPremium) {
        getUserVictories(user.id, 5).then(vs => setRecentVictories(vs || [])).catch(() => {})
      }
      // BLOC 4 — Charger dernière session pour reprise
      try {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)

        if (sessions && sessions.length > 0) {
          const lastSession = sessions[0]
          if (lastSession.resume) {
            setLastSessionResume(lastSession.resume)
            setShowResumeSession(true)
          }
        }
      } catch (err) {
        console.warn('[Session] Failed to load last session:', err)
      }
      setSessionReady(true)
    }
    init()

    return () => { stopTTS() }
  }, [user])

  // ── Démarrage chat une fois le mode choisi et session prête ─
  useEffect(() => {
    if (sessionReady && inputMode !== null) initChat()
  }, [sessionReady, inputMode, initChat])

  // ── Micro en mode parler ─────────────────────────────────
  useEffect(() => {
    if (inputMode === 'voice' && !permissionRequested) {
      setPermissionRequested(true)
      requestPermission().then(granted => {
        if (granted) setVoiceMode(true)
      })
    }
  }, [inputMode, permissionRequested, requestPermission])

  // Auto-listen en mode parler
  const startListeningRef = useRef(startListening)
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  useEffect(() => {
    if (voiceMode && !isListening && !isSpeaking && !loading && permissionGranted && sessionReady && !userPaused) {
      const timer = setTimeout(() => startListeningRef.current(), 400)
      return () => clearTimeout(timer)
    }
  }, [isListening, isSpeaking, voiceMode, loading, permissionGranted, sessionReady, userPaused])

  // BLOC 1 — Timer de session 1h
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime
      const elapsedMinutes = elapsed / (1000 * 60)

      // Mode session courte 15min
      if (shortSessionMode) {
        // Avertissement à 10 minutes
        if (elapsedMinutes >= 10 && !shortSessionWarningShown && !sessionEnded) {
          setShortSessionWarningShown(true)
          setSessionTimeLeft(5) // 5 minutes restantes
        }

        // Mise à jour du temps restant après l'avertissement
        if (shortSessionWarningShown && !sessionEnded && elapsedMinutes >= 10) {
          const remaining = Math.max(0, Math.ceil(15 - elapsedMinutes))
          setSessionTimeLeft(remaining)
        }

        // Clôture forcée à 15 minutes
        if (elapsedMinutes >= 15 && !sessionEnded) {
          setSessionEnded(true)
          clearInterval(interval)
          handleForceSessionEnd()
        }
      } else {
        // Mode normal 1h
        // Avertissement à 45 minutes
        if (elapsedMinutes >= 45 && !sessionWarningShown && !sessionEnded) {
          setSessionWarningShown(true)
          setSessionTimeLeft(15) // 15 minutes restantes
        }

        // Mise à jour du temps restant chaque minute après l'avertissement
        if (sessionWarningShown && !sessionEnded && elapsedMinutes >= 45) {
          const remaining = Math.max(0, Math.ceil(60 - elapsedMinutes))
          setSessionTimeLeft(remaining)
        }

        // Clôture forcée à 60 minutes
        if (elapsedMinutes >= 60 && !sessionEnded) {
          setSessionEnded(true)
          clearInterval(interval)
          handleForceSessionEnd()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime, sessionWarningShown, sessionEnded, shortSessionMode, shortSessionWarningShown])

  const handleForceSessionEnd = async () => {
    try {
      // Envoyer message de fin avec [[SEANCE_COMPLETE]]
      const finalMessage = {
        role: 'assistant',
        content: shortSessionMode
          ? `⏰ **Session courte terminée**\n\nTu as atteint la limite de 15 minutes. C'est parfait pour une session de fatigue !\n\n[[SEANCE_COMPLETE]]`
          : `⏰ **Session terminée**\n\nTu as atteint la limite de 1 heure pour ce soir. C'est important pour ne pas te fatiguer et garder ton cerveau frais pour demain !\n\n[[SEANCE_COMPLETE]]`,
        timestamp: new Date().toISOString()
      }

      // Mettre à jour les messages localement
      // Note: on ne peut pas modifier messages directement car c'est géré par useChat
      // On va plutôt afficher un message spécial

      // Redirection après 3 secondes
      setTimeout(() => {
        navigate('/choice')
      }, 3000)

    } catch (err) {
      console.error('Erreur fin session forcée:', err)
    }
  }

  // ── Document scan ────────────────────────────────────────
  const handleScan = useCallback((base64, mimeType) => {
    sendMessage('', { base64, mimeType })
  }, [sendMessage])

  // ── Fin de session ───────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    const lastMessage = messages.findLast(m => m.role === 'assistant')
    await closeSession({ resume: lastMessage?.content?.substring(0, 200) })
    navigate('/choice')
  }, [closeSession, navigate, messages])

  const handleVoiceButton = () => {
    if (isSpeaking) {
      stopTTS()
      setUserPaused(true)
    } else if (isListening) {
      stopListening()
      setUserPaused(true)
    } else {
      setUserPaused(false)
      startListening()
    }
  }

  // ── Modal choix parler/taper ─────────────────────────────
  if (inputMode === null) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '32px 24px',
        gap: '24px',
      }}>
        <MaxAvatar isSpeaking={false} size={88} profile={profile?.intelligence_dominante ?? null} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
            Comment tu veux travailler ?
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            Tu pourras changer à tout moment pendant la session.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '360px' }}>
          {/* Bouton Écrire */}
          <button
            onClick={() => setInputMode('text')}
            style={{
              flex: 1,
              padding: '20px 16px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Écrire</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Clavier actif</div>
            </div>
          </button>

          {/* Bouton Parler */}
          <button
            onClick={() => isSupported ? setInputMode('voice') : null}
            style={{
              flex: 1,
              padding: '20px 16px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              color: isSupported ? 'var(--text)' : 'var(--text-3)',
              cursor: isSupported ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              opacity: isSupported ? 1 : 0.5,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (isSupported) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Parler</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                {isSupported ? 'Micro actif' : 'Non disponible'}
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Interface principale ─────────────────────────────────
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: isSessionPremium ? 'var(--bg)' : 'var(--bg)',
      maxWidth: '680px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleEndSession}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-3)', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '18px',
            }}
            title="Terminer la session"
          >←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
                animation: 'glow-pulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                {avatarName}
              </span>
            </div>
            {/* BLOC 6 — streak + points */}
            {isSessionPremium && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                {streak > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--accent)' }}>
                    🔥 {streak} jour{streak > 1 ? 's' : ''}
                  </span>
                )}
                {points > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {points} pts
                  </span>
                )}
              </div>
            )}
            {/* BLOC 1 — Timer de session */}
            {sessionTimeLeft !== null && !sessionEnded && (
              <div style={{
                fontSize: '11px',
                color: sessionTimeLeft <= 5 ? 'var(--error)' : 'var(--text-3)',
                marginTop: '2px',
                fontWeight: '500'
              }}>
                ⏱️ {sessionTimeLeft} min restantes
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* BLOC 9 — Mode vocal complet (premium) */}
          {isSessionPremium && isSupported && (
            <button
              onClick={() => {
                const fullVoice = ttsEnabled && inputMode === 'voice'
                if (fullVoice) {
                  stopTTS()
                  stopListening()
                  setTtsEnabled(false)
                  setVoiceMode(false)
                  setInputMode('text')
                } else {
                  setTtsEnabled(true)
                  setInputMode('voice')
                }
              }}
              title="Mode vocal complet : TTS + micro automatique"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: (ttsEnabled && inputMode === 'voice') ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${ttsEnabled && inputMode === 'voice' ? 'var(--accent)' : 'var(--border)'}`,
                color: (ttsEnabled && inputMode === 'voice') ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              }}
            >
              {(ttsEnabled && inputMode === 'voice') ? '🎙️ Vocal ON' : '🎙️ Vocal'}
            </button>
          )}

          {/* BLOC 2 — Sélecteur matière (premium) */}
          {isSessionPremium && (
            <select
              value={matiere}
              onChange={e => setMatiere(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-2)',
                padding: '5px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Matière de la session"
            >
              {MATIERES_OPTIONS.map(m => (
                <option key={m} value={m.toLowerCase() === 'général' ? 'general' : m.toLowerCase()}>{m}</option>
              ))}
            </select>
          )}

          {/* BLOC 5 — Mode session courte 15min */}
          <button
            onClick={() => setShortSessionMode(!shortSessionMode)}
            title={shortSessionMode ? "Désactiver le mode session courte" : "Activer le mode session courte (15min)"}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: shortSessionMode ? 'rgba(245,158,11,0.1)' : 'var(--bg-card)',
              border: `1px solid ${shortSessionMode ? '#F59E0B' : 'var(--border)'}`,
              color: shortSessionMode ? '#F59E0B' : 'var(--text-3)',
              cursor: 'pointer', fontSize: '12px', fontWeight: '500',
            }}
          >
            {shortSessionMode ? '⚡ 15min ON' : '⚡ 15min'}
          </button>

          {/* BLOC 5 — Victoires récentes */}
          {isSessionPremium && recentVictories.length > 0 && (
            <button
              onClick={() => setShowVictories(v => !v)}
              title="Victoires récentes"
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                background: showVictories ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${showVictories ? 'var(--accent)' : 'var(--border)'}`,
                color: showVictories ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer', fontSize: '12px',
              }}
            >
              ★ {recentVictories.length}
            </button>
          )}

          {/* Toggle TTS seul (si pas mode vocal complet) */}
          {isSessionPremium && !isSupported && (
            <button
              onClick={() => { if (ttsEnabled) stopTTS(); setTtsEnabled(v => !v) }}
              title={ttsEnabled ? 'Désactiver la voix' : 'Activer la voix'}
              style={{
                padding: '6px 10px', borderRadius: '8px',
                background: ttsEnabled ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: ttsEnabled ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              }}
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </button>
          )}

          <button
            onClick={() => navigate('/settings')}
            title="Paramètres"
            style={{
              width: '32px', height: '32px',
              borderRadius: '9px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* BLOC 5 — Panel victoires récentes */}
      {showVictories && recentVictories.length > 0 && (
        <div style={{
          margin: '0 16px 4px',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: '12px',
          color: 'var(--text-2)',
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--accent)' }}>★ Victoires récentes</div>
          {recentVictories.map((v, i) => (
            <div key={i} style={{ paddingBottom: '3px', borderBottom: i < recentVictories.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: '3px' }}>
              {(v?.texte || v?.description || String(v)).slice(0, 80)}
            </div>
          ))}
        </div>
      )}

      {/* BLOC 1 — Banner avertissement session */}
      {sessionTimeLeft !== null && !sessionEnded && (
        <div style={{
          margin: '0 16px 8px',
          padding: '12px 16px',
          background: sessionTimeLeft <= 5 ? 'rgba(224,82,82,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${sessionTimeLeft <= 5 ? 'rgba(224,82,82,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: 'var(--r-md)',
          fontSize: '13px',
          color: sessionTimeLeft <= 5 ? 'var(--error)' : '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>⏰</span>
          <span>
            {sessionTimeLeft <= 5
              ? `Attention ! Il te reste ${sessionTimeLeft} minute${sessionTimeLeft > 1 ? 's' : ''} pour ce${shortSessionMode ? 'tte session courte' : ' soir'}.`
              : `Il te reste ${sessionTimeLeft} minutes pour ce${shortSessionMode ? 'tte session courte' : ' soir'}.`
            }
          </span>
        </div>
      )}

      {/* BLOC 1 — Banner session terminée */}
      {sessionEnded && (
        <div style={{
          margin: '0 16px 8px',
          padding: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: '14px',
          color: 'var(--text)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>
            {shortSessionMode ? 'Session courte terminée' : 'Session terminée'}
          </div>
          <div style={{ color: 'var(--text-2)' }}>
            {shortSessionMode
              ? 'Tu as atteint la limite de 15 minutes. C\'est parfait pour une session de fatigue !'
              : 'Tu as atteint la limite de 1 heure pour ce soir. C\'est important pour ne pas te fatiguer !'
            }
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '12px' }}>
            Redirection automatique...
          </div>
        </div>
      )}

      {/* BLOC 4 — Banner reprise de session */}
      {showResumeSession && lastSessionResume && (
        <div style={{
          margin: '0 16px 8px',
          padding: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--r-md)',
          fontSize: '14px',
          color: 'var(--text)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🔄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--accent)' }}>
                Reprendre la session précédente ?
              </div>
              <div style={{ color: 'var(--text-2)', marginBottom: '12px', lineHeight: '1.5' }}>
                Tu avais commencé à travailler sur :<br/>
                <em>"{lastSessionResume.substring(0, 150)}{lastSessionResume.length > 150 ? '...' : ''}"</em>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowResumeSession(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Nouvelle session
                </button>
                <button
                  onClick={() => {
                    setShowResumeSession(false)
                    sendMessage(lastSessionResume)
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#080D0A',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Reprendre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Avatar + Pomodoro ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: '12px',
      }}>
        <div>
          <MaxAvatar isSpeaking={false} size={88} profile={profile?.intelligence_dominante ?? null} />
        </div>
        <div style={{ flex: 1 }}>
          <PomodoroTimer />
        </div>
      </div>

      {/* ── Upgrade banner ── */}
      {!isSessionPremium && <UpgradeBanner visible={showUpgradeBanner} />}

      {/* ── Chat ── */}
      <ChatInterface messages={messages} loading={loading} speakingMessageId={ttsEnabled ? speakingMessageId : null} ttsEnabled={ttsEnabled} />

      {/* ── Retry status ── */}
      {retryStatus && (
        <div style={{
          margin: '0 16px 8px',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          fontSize: '13px',
          color: 'var(--text-2)',
        }}>{retryStatus}</div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          margin: '0 16px 8px',
          padding: '10px 14px',
          background: 'var(--error-dim)',
          border: '1px solid rgba(224,82,82,0.25)',
          borderRadius: 'var(--r-sm)',
          fontSize: '13px', color: 'var(--error)',
        }}>{error}</div>
      )}

      {/* ── Zone de saisie ── */}
      {!sessionEnded && (
        <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {inputMode === 'voice' ? (
            <div style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              background: 'var(--bg-card)',
            }}>
              <DocumentScanner onScan={handleScan} isPremium={isSessionPremium} />
              <VoiceButton
                isListening={isListening}
                isSpeaking={isSpeaking}
                onClick={handleVoiceButton}
                disabled={loading}
              />
              {/* Texte interim visible */}
              {interimText && (
                <div style={{
                  position: 'absolute',
                  bottom: '90px',
                  left: '16px', right: '16px',
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--text-3)',
                  fontStyle: 'italic',
                }}>
                  {interimText}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
              <div style={{ padding: '12px 0 12px 16px', flexShrink: 0 }}>
                <DocumentScanner onScan={handleScan} isPremium={isSessionPremium} />
              </div>
              <div style={{ flex: 1 }}>
                <InputArea
                  onSend={sendMessage}
                  disabled={loading}
                  placeholder={`Réponds à ${avatarName}...`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Victory modal ── */}
      <VictoryModal
        victory={newVictory}
        onClose={() => setNewVictory(null)}
      />
    </div>
  )
}
