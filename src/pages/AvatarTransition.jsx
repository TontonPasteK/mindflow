import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MaxAvatar from '../components/avatar/MaxAvatar'
import { playAvatarSound } from '../utils/avatarSounds'

// Couleurs par avatar
const AVATAR_COLORS = {
  Max: '#8B5CF6',      // violet électrique
  Victor: '#F97316',   // orange chaud
  Léo: '#22C55E',      // vert dynamique
  Maya: '#14B8A6',     // bleu turquoise
  Noa: '#EAB308',      // jaune vif
  Sam: '#EF4444',      // rouge énergique
  Alex: '#1E3A8A',     // bleu nuit
}

// Messages par avatar
const AVATAR_MESSAGES = {
  Max: 'Ton assistant Max est prêt !',
  Victor: 'Ton assistant Victor est prêt !',
  Léo: 'Ton assistant Léo est prêt !',
  Maya: 'Ton assistant Maya est prête !',
  Noa: 'Ton assistant Noa est prêt !',
  Sam: 'Ton assistant Sam est prêt !',
  Alex: 'Ton assistant Alex est prêt !',
}

export default function AvatarTransition() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [animate, setAnimate] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)

  const avatar = profile?.avatar || 'Maya'
  const avatarColor = AVATAR_COLORS[avatar] || AVATAR_COLORS.Maya
  const message = AVATAR_MESSAGES[avatar] || AVATAR_MESSAGES.Maya

  // Animation d'entrée + son
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Son d'entrée distinctif
  useEffect(() => {
    if (!soundPlayed) {
      playAvatarSound(avatar)
      setSoundPlayed(true)
    }
  }, [avatar, soundPlayed])

  const handleStart = () => {
    navigate('/session?mode=premium')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: avatarColor,
      padding: '32px 24px',
      gap: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Particules d'arrière-plan */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Avatar en grand */}
      <div style={{
        transform: animate ? 'scale(1)' : 'scale(0.5)',
        opacity: animate ? 1 : 0,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out',
        zIndex: 1,
      }}>
        <MaxAvatar isSpeaking={false} size={180} profile={profile?.intelligence_dominante ?? null} />
      </div>

      {/* Message d'annonce */}
      <div style={{
        textAlign: 'center',
        transform: animate ? 'translateY(0)' : 'translateY(20px)',
        opacity: animate ? 1 : 0,
        transition: 'transform 0.6s ease-out 0.3s, opacity 0.6s ease-out 0.3s',
        zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '28px',
          color: 'white',
          marginBottom: '8px',
          textShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {message}
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.9)',
          maxWidth: '400px',
          lineHeight: '1.5',
        }}>
          Ton profil cognitif est prêt. {avatar} sait exactement comment t'aider.
        </p>
      </div>

      {/* Bouton Commencer */}
      <button
        onClick={handleStart}
        style={{
          padding: '16px 48px',
          background: 'white',
          color: avatarColor,
          borderRadius: '16px',
          fontWeight: '700',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          transform: animate ? 'scale(1)' : 'scale(0.9)',
          opacity: animate ? 1 : 0,
          transition: 'transform 0.4s ease-out 0.6s, opacity 0.4s ease-out 0.6s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Commencer →
      </button>

      {/* Indicateur de progression */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 1,
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
