import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { useChat } from '../hooks/useChat'
import { useVoice } from '../hooks/useVoice'
import { useTTS } from '../hooks/useTTS'
import { useAvatarTransition } from '../hooks/useAvatarTransition'
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
  // Transition Dr Mind → avatar
  const [transitioning, setTransitioning] = useState(false)
  const { getAvatarColor } = useAvatarTransition(avatarName, transitioning)

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
      setTransitioning(true)
      await refreshProfile()
      setTimeout(() => setTransitioning(false), 2000)
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
      }
      // BLOC 6 — streak update au démarrage
      if (isSessionPremium) {
        updateStreak(user.id).then(s => setStreak(s)).catch(() => {})
      }
      // BLOC 5 — charger victoires récentes
      if (isSessionPremium) {
        getUserVictories(user.id, 5).then(vs => setRecentVictories(vs || [])).catch(() => {})
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
      background: isSessionPremium ? getAvatarColor() : 'var(--bg)',
      maxWidth: '680px',
      margin: '0 auto',
      position: 'relative',
      transition: 'background 1s ease-in-out',
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

      {/* ── Avatar + Pomodoro ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: '12px',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 1s ease-in-out',
      }}>
        <div style={{
          transform: transitioning ? 'scale(0.8)' : 'scale(1)',
          transition: 'transform 0.5s ease-in-out',
        }}>
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

      {/* ── Victory modal ── */}
      <VictoryModal
        victory={newVictory}
        onClose={() => setNewVictory(null)}
      />
    </div>
  )
}
