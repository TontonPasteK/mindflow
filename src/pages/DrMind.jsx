import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { useChat } from '../hooks/useChat'
import { useTTS } from '../hooks/useTTS'
import { useVoice } from '../hooks/useVoice'
import MaxAvatar from '../components/avatar/MaxAvatar'
import ChatInterface from '../components/chat/ChatInterface'
import InputArea from '../components/chat/InputArea'
import VoiceButton from '../components/voice/VoiceButton'

export default function DrMind() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const seance = parseInt(searchParams.get('seance') || '1')

  const { user, profile } = useAuth()
  const { startSession } = useSession()
  const [profileDetected, setProfileDetected] = useState(false)
  const [sessionReady, setSessionReady]       = useState(false)
  const [voiceMode, setVoiceMode]             = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const { isSpeaking, speak, stop } = useTTS({ enabled: false })

  const { messages, loading, sendMessage, initChat } = useChat({
    mode: 'drMind',
    seance,
    onProfile: (profileData) => {
      setProfileDetected(true)
      if (profileData?.onboarding_complete) {
        setTimeout(() => navigate('/session?mode=premium'), 3000)
      } else {
        setTimeout(() => navigate('/choice?drMind=seance1'), 2500)
      }
    },
    onSeanceComplete: () => {
      setProfileDetected(true)
      setTimeout(() => navigate('/session?mode=premium'), 3000)
    },
    onTTS: null,
  })

  const {
    isListening, isSupported, permissionGranted,
    requestPermission, startListening, stopListening,
  } = useVoice({
    onTranscript: (text) => {
      stopListening()
      sendMessage(text)
    },
  })

  // Init session
  useEffect(() => {
    if (!user) return
    const init = async () => {
      try {
        await startSession(user.id, 'premium')
      } catch (err) {
        console.warn('[DrMind] startSession failed:', err.message)
      }
      setSessionReady(true)
    }
    init()
    return () => { stop() }
  }, [user])

  useEffect(() => {
    if (sessionReady) initChat()
  }, [sessionReady])

  // Si profil déjà complet → session directe
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/session?mode=premium')
    }
  }, [profile])

  // Permission micro
  useEffect(() => {
    if (permissionRequested) return
    setPermissionRequested(true)
    requestPermission().catch(() => false).then(granted => {
      if (granted) setVoiceMode(true)
    })
  }, [permissionRequested, requestPermission])

  // Arrêter micro quand Dr Mind parle
  useEffect(() => {
    if (isSpeaking && isListening) stopListening()
  }, [isSpeaking, isListening, stopListening])

  const startListeningRef = useRef(startListening)
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // Auto-écoute après que Dr Mind finit de parler
  useEffect(() => {
    if (voiceMode && !isListening && !isSpeaking && !loading && permissionGranted && sessionReady) {
      const timer = setTimeout(() => startListeningRef.current(), 400)
      return () => clearTimeout(timer)
    }
  }, [isListening, isSpeaking, voiceMode, loading, permissionGranted, sessionReady])

  const seanceLabel = seance === 1 ? 'Séance 1 — Découverte' : 'Séance 2 — Profil complet'
  const seanceEstimee = seance === 1 ? '~20 minutes' : '~20 minutes'

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
          background: '#6C63FF',
          boxShadow: '0 0 8px #6C63FF',
        }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#6C63FF' }}>
          Dr Mind · {seanceLabel}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {seanceEstimee}
        </span>
      </div>

      {/* Avatar Dr Mind — violet pour le différencier */}
      <div style={{
        padding: '24px 20px 16px',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ position: 'relative' }}>
          <MaxAvatar isSpeaking={isSpeaking} size={100} />
          {/* Badge Dr Mind */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#6C63FF',
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}>
            DR MIND
          </div>
        </div>
      </div>

      {/* Overlay profil détecté */}
      {profileDetected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,13,10,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
          zIndex: 100,
          animation: 'fade-in 0.3s ease',
        }}>
          <span style={{ fontSize: '64px', animation: 'float 2s ease-in-out infinite' }}>🧠</span>
          <h2 style={{ fontFamily: 'var(--f-title)', fontSize: '28px', textAlign: 'center' }}>
            {seance === 1 ? 'Profil en construction !' : 'Profil cognitif complet !'}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '16px', textAlign: 'center', maxWidth: '320px' }}>
            {seance === 1
              ? 'Ton assistant t\'attend. Reviens vite pour la séance 2 !'
              : 'Ton assistant personnel est prêt. Il sait maintenant comment tu penses.'}
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
