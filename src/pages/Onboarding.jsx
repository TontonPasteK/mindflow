import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { useChat } from '../hooks/useChat'
import { useTTS } from '../hooks/useTTS'
import { useVoice } from '../hooks/useVoice'
import MaxAvatar from '../components/avatar/MaxAvatar'
import ChatInterface from '../components/chat/ChatInterface'
import InputArea from '../components/chat/InputArea'
import VoiceButton from '../components/voice/VoiceButton'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { startSession } = useSession()
  const [profileDetected, setProfileDetected] = useState(false)
  const [sessionReady, setSessionReady]       = useState(false)
  const [voiceMode, setVoiceMode]             = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const { isSpeaking, speak, stop } = useTTS({ enabled: true })

  const { messages, loading, sendMessage, initChat } = useChat({
    onProfile: () => {
      setProfileDetected(true)
      setTimeout(() => navigate('/session?mode=premium'), 2500)
    },
    onTTS: speak,
  })

  // Voice (Web Speech API)
  const {
    isListening, isSupported, permissionGranted,
    requestPermission, startListening, stopListening,
  } = useVoice({
    onTranscript: (text) => {
      stopListening()
      sendMessage(text)
    },
  })

  console.log('[MIC]', { voiceMode, permissionGranted, isSessionPremium: true, isSpeaking, isListening })

  // ── Init session ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const init = async () => {
      try {
        await startSession(user.id, 'premium')
      } catch (err) {
        console.warn('[Onboarding] startSession failed (non-blocking):', err.message)
      }
      setSessionReady(true)
    }
    init()
    return () => { stop() }
  }, [user])

  useEffect(() => {
    if (sessionReady) initChat()
  }, [sessionReady])

  // Si profil déjà complet → aller directement en session
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/session?mode=premium')
    }
  }, [profile])

  // ── Permission micro (demandée dès le mount) ──────────────
  useEffect(() => {
    if (permissionRequested) return
    setPermissionRequested(true)
    requestPermission().catch(() => false).then(granted => {
      if (granted) setVoiceMode(true)
    })
  }, [permissionRequested, requestPermission])

  // Arrêter le micro quand Max parle
  useEffect(() => {
    if (isSpeaking && isListening) stopListening()
  }, [isSpeaking, isListening, stopListening])

  // Ref pour startListening (évite stale closure dans le timer)
  const startListeningRef = useRef(startListening)
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // Auto-écoute après que Max finit de parler
  useEffect(() => {
    if (voiceMode && !isListening && !isSpeaking && !loading && permissionGranted && sessionReady) {
      const timer = setTimeout(() => startListeningRef.current(), 400)
      return () => clearTimeout(timer)
    }
  }, [isListening, isSpeaking, voiceMode, loading, permissionGranted, sessionReady])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)',
        }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>
          Découverte de ton profil cognitif
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto' }}>
          ~5 minutes
        </span>
      </div>

      {/* Avatar */}
      <div style={{
        padding: '24px 20px 16px',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <MaxAvatar isSpeaking={isSpeaking} size={100} />
      </div>

      {/* Overlay : profil détecté */}
      {profileDetected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,13,10,0.9)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
          zIndex: 100,
          animation: 'fade-in 0.3s ease',
        }}>
          <span style={{ fontSize: '64px', animation: 'float 2s ease-in-out infinite' }}>🧠</span>
          <h2 style={{ fontFamily: 'var(--f-title)', fontSize: '28px', textAlign: 'center' }}>
            Profil cognitif détecté !
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '16px' }}>
            Maya est prête à adapter chaque session pour toi
          </p>
        </div>
      )}

      {/* Chat */}
      <ChatInterface messages={messages} loading={loading} />

      {/* Input + VoiceButton */}
      <div style={{
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <InputArea onSend={sendMessage} disabled={loading || profileDetected} />
        </div>
        {isSupported && (
          <div style={{ padding: '0 12px 12px 0', flexShrink: 0 }}>
            <VoiceButton
              isListening={isListening}
              isSpeaking={isSpeaking}
              onClick={isSpeaking ? stop : (isListening ? stopListening : startListening)}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
