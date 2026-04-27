import { useNavigate } from 'react-router-dom'

export default function Landing() {
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
      gap: '32px',
    }}>
      {/* Logo / Nom */}
      <div style={{
        textAlign: 'center',
        animation: 'fadeIn 0.8s ease-out',
      }}>
        <h1 style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 'clamp(48px, 10vw, 72px)',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '16px',
        }}>
          Evokia
        </h1>
        <p style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 'clamp(18px, 3vw, 24px)',
          color: '#94A3B8',
          lineHeight: '1.5',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          La méthode Dr Mind, tous les soirs à la maison
        </p>
      </div>

      {/* Lien Comment ça marche */}
      <div style={{
        animation: 'fadeIn 0.8s ease-out 0.3s both',
      }}>
        <button
          onClick={() => navigate('/how-it-works')}
          style={{
            background: 'none',
            border: 'none',
            color: '#10B981',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'underline',
            padding: '8px 0',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#059669'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#10B981'
          }}
        >
          Comment ça marche ? →
        </button>
      </div>

      {/* Boutons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '320px',
        animation: 'fadeIn 0.8s ease-out 0.2s both',
      }}>
        <button
          onClick={() => navigate('/auth')}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'transform 0.2s, background 0.2s',
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
          Essayer gratuitement
        </button>

        <button
          onClick={() => navigate('/auth')}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: 'transparent',
            color: '#FFFFFF',
            border: '2px solid #334155',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'transform 0.2s, background 0.2s, borderColor 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.background = '#334155'
            e.currentTarget.style.borderColor = '#475569'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#334155'
          }}
        >
          Je suis parent
        </button>
      </div>

      {/* Footer avec liens légaux */}
      <div style={{
        marginTop: 'auto',
        fontSize: '13px',
        color: '#64748B',
        animation: 'fadeIn 0.8s ease-out 0.4s both',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/legal')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            Mentions légales
          </button>
          <button
            onClick={() => navigate('/privacy')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            Confidentialité
          </button>
          <button
            onClick={() => navigate('/how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            Comment ça marche
          </button>
        </div>
        <div>
          © 2026 Evokia — Tous droits réservés
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
