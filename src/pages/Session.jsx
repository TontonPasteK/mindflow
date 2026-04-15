import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { useChat } from '../hooks/useChat'
import { useVoice } from '../hooks/useVoice'
import { useTTS } from '../hooks/useTTS'

import MaxAvatar      from '../components/avatar/MaxAvatar'
import ChatInterface  from '../components/chat/ChatInterface'
import InputArea      from '../components/chat/InputArea'
import VoiceButton    from '../components/voice/VoiceButton'
import VoiceToggle    from '../components/voice/VoiceToggle'
import PomodoroTimer  from '../components/session/PomodoroTimer'
import DocumentScanner from '../components/session/DocumentScanner'
import UpgradeBanner  from '../components/session/UpgradeBanner'
import VictoryModal   from '../components/session/VictoryModal'
import Button         from '../components/ui/Button'

export default function Session() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, isPremium } = useAuth()
  const { startSession, closeSession, showUpgradeBanner, sessionId } = useSession()

  const mode = params.get('mode') || (isPremium ? 'premium' : 'free')
  const isSessionPremium = mode === 'premium' && isPremium

  const [voiceMode, setVoiceMode]     = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [newVictory, setNewVictory]   = useState(null)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const [userPaused, setUserPaused]   = useState(false)  // ← CORRECTION : pause volontaire
  const initRanRef                    = useRef(false)

  // TTS — only for premium
  const { isSpeaking, speak, stop: stopTTS } = useTTS({
    enabled: isSessionPremium,
    onPlayStart: (msgId) => setSpeakingMessageId(msgId),
  })

  // Chat hook
  const { messages, loading, error, retryStatus, sendMessage, initChat } = useChat({
    onVictory: setNewVictory,
    onTTS: isSessionPremium ? (text, msgId) => speak(text, msgId) : null,
    onProfile: null,
  })

  // Voice (Web Speech API)
  const { isListening, isSupported, permissionGranted, interimText, requestPermission, startListening, stopListening } =
    useVoice({
      onTranscript: (text) => {
        stopListening()
        setUserPaused(false)  // ← après envoi, on réactive l'auto-listen
        sendMessage(text)
      },
    })

  console.log('[MIC]', { voiceMode, permissionGranted, isSessionPremium, isSpeaking, isListening })

  // ── Init ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || initRanRef.current) return
    initRanRef.current = true

    const init = async () => {
      try {
        await startSession(user.id, mode)
      } catch (err) {
        console.warn('[Session] startSession failed (non-blocking):', err.message)
      }

      setSessionReady(true)
    }
    init()

    return () => { stopTTS() }
  }, [user])

  // ── Permission micro ────────────────────────────────────
  useEffect(() => {
    console.log('[Session] permission effect → isSessionPremium:', isSessionPremium, '| permissionRequested:', permissionRequested)
    if (!isSessionPremium || permissionRequested) return
    setPermissionRequested(true)
    requestPermission().catch(() => false).then(granted => {
      console.log('[Session] requestPermission result:', granted, '| setVoiceMode:', granted)
      if (granted) setVoiceMode(true)
    })
  }, [isSessionPremium, permissionRequested, requestPermission])

  useEffect(() => {
    if (sessionReady) initChat()
  }, [sessionReady, initChat])

  // Stop listening while Max speaks
  useEffect(() => {
    if (isSpeaking && isListening) stopListening()
  }, [isSpeaking, isListening, stopListening])

  // Ref to latest startListening
  const startListeningRef = useRef(startListening)
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // Auto-listen: ne redémarre pas si l'utilisateur a mis en pause volontairement
  useEffect(() => {
    if (voiceMode && !isListening && !isSpeaking && !loading && permissionGranted && sessionReady && !userPaused) {
      const timer = setTimeout(() => startListeningRef.current(), 400)
      return () => clearTimeout(timer)
    }
  }, [isListening, isSpeaking, voiceMode, loading, permissionGranted, sessionReady, userPaused])

  // ── Document / file attachment ──────────────────────────
  const handleScan = useCallback((base64, mimeType) => {
    sendMessage('', { base64, mimeType })
  }, [sendMessage])

  // ── Session end ─────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    const lastMessage = messages.findLast(m => m.role === 'assistant')
    await closeSession({ resume: lastMessage?.content?.substring(0, 200) })
    navigate('/choice')
  }, [closeSession, navigate, messages])

  const toggleVoice = () => {
    if (!voiceMode && !permissionGranted) {
      requestPermission().then(granted => {
        if (granted) setVoiceMode(true)
      })
    } else {
      if (voiceMode && isListening) stopListening()
      setVoiceMode(v => !v)
    }
  }

  // ── Gestionnaire bouton pause ────────────────────────────
  const handleVoiceButton = () => {
    if (isSpeaking) {
      stopTTS()
      setUserPaused(true)   // ← bloque l'auto-listen
    } else if (isListening) {
      stopListening()
      setUserPaused(true)   // ← bloque l'auto-listen
    } else {
      setUserPaused(false)  // ← réactive l'auto-listen
      startListening()
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
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
                Session avec Maya
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              {isSessionPremium ? '★ Premium' : 'Gratuit'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSupported && (
            <VoiceToggle voiceMode={voiceMode} onToggle={toggleVoice} />
          )}
          <button
            onClick={() => navigate('/settings')}
            title="Paramètres"
            style={{
              width: '36px', height: '36px',
              borderRadius: '9px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

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
        <MaxAvatar isSpeaking={isSpeaking} size={88} profile={profile?.intelligence_dominante ?? null} />
        <div style={{ flex: 1 }}>
          <PomodoroTimer />
        </div>
      </div>

      {/* ── Upgrade banner ── */}
      {!isSessionPremium && <UpgradeBanner visible={showUpgradeBanner} />}

      {/* ── Chat ── */}
      <ChatInterface messages={messages} loading={loading} speakingMessageId={speakingMessageId} ttsEnabled={isSessionPremium} />

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

      {/* ── Input area ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {voiceMode ? (
          /* Voice mode controls */
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

          </div>
        ) : (
          /* Text mode — mic button always visible alongside input */
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
            <div style={{ padding: '12px 0 12px 16px', flexShrink: 0 }}>
              <DocumentScanner onScan={handleScan} isPremium={isSessionPremium} />
            </div>
            <div style={{ flex: 1 }}>
              <InputArea
                onSend={sendMessage}
                disabled={loading}
                placeholder={`Réponds à Maya...`}
              />
            </div>
            <div style={{
              padding: '0 12px 12px 0',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}>
              <VoiceButton
                isListening={isListening}
                isSpeaking={isSpeaking}
                onClick={handleVoiceButton}
                disabled={!isSupported || loading}
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
