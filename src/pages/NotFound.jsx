import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '120px',
        fontWeight: '800',
        color: '#10B981',
        marginBottom: '24px',
        animation: 'fadeIn 0.6s ease-out',
      }}>
        404
      </div>

      <h1 style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 'clamp(24px, 5vw, 36px)',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '16px',
        animation: 'fadeIn 0.6s ease-out 0.1s both',
      }}>
        Oups, page introuvable
      </h1>

      <p style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#94A3B8',
        lineHeight: '1.6',
        maxWidth: '400px',
        marginBottom: '32px',
        animation: 'fadeIn 0.6s ease-out 0.2s both',
      }}>
        Cette page n'existe pas ou a été déplacée. Mais ne t'inquiète pas, Evokia est toujours là pour t'aider !
      </p>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '16px 40px',
          background: '#10B981',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'transform 0.2s, background 0.2s',
          animation: 'fadeIn 0.6s ease-out 0.3s both',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.background = '#059669'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = '#10B981'
        }}
      >
        Retour à l'accueil →
      </button>

      <div style={{
        marginTop: '48px',
        fontSize: '48px',
        animation: 'fadeIn 0.6s ease-out 0.4s both',
      }}>
        🧠
      </div>
    </div>
  )
}
