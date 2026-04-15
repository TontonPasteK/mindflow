import { useNavigate } from 'react-router-dom'

export default function UpgradeBanner({ visible }) {
  const navigate = useNavigate()

  if (!visible) return null

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '14px 18px',
      background: 'linear-gradient(135deg, rgba(29,158,117,0.12) 0%, rgba(29,158,117,0.06) 100%)',
      border: '1px solid var(--border-h)',
      borderRadius: 'var(--r-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'fade-up 0.4s ease',
    }}>
      <span style={{ fontSize: '22px' }}>🧠</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text)',
          margin: '0 0 2px',
          fontFamily: 'var(--f-title)',
        }}>
          Maya peut aller beaucoup plus loin avec toi
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
          Profil cognitif complet · Stratégies sur-mesure · Voix naturelle
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          padding: '8px 16px',
          borderRadius: '10px',
          background: 'var(--accent)',
          color: '#080D0A',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          border: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Voir Premium
      </button>
    </div>
  )
}
