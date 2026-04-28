import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import PlanBadge from '../components/ui/PlanBadge'
import ReviewCalendar from '../components/student/ReviewCalendar'

export default function Choice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const drMindSeance1Done = searchParams.get('drMind') === 'seance1'
  const { user, isPremium, profile } = useAuth()

  const handleFree = () => navigate('/session?mode=free')

  const handlePremium = () => {
    if (isPremium) {
      if (!profile?.onboarding_complete) {
        // Séance 1 faite mais pas séance 2 → proposer séance 2
        const seanceDrMind = profile?.seance_drMind ?? 0
        if (seanceDrMind >= 1) {
          navigate('/drMind?seance=2')
        } else {
          navigate('/drMind?seance=1')
        }
      } else {
        navigate('/session?mode=premium')
      }
    } else {
      navigate('/pricing')
    }
  }

  // Message d'incitation après séance 1
  const incitationMsg = drMindSeance1Done
    ? 'Ton profil est à 50%. Plus vite tu fais la séance 2, plus ton assistant sera précis pour toi.'
    : null

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)',
      gap: '32px',
      position: 'relative',
    }}>
      {/* Settings button */}
      <button
        onClick={() => navigate('/settings')}
        title="Paramètres"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-h)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      <div style={{ textAlign: 'center', animation: 'fade-up 0.4s ease' }}>
        <PlanBadge plan={user?.plan || 'free'} />
        <h1 style={{
          fontFamily: 'var(--f-title)',
          fontSize: 'clamp(24px, 5vw, 36px)',
          marginTop: '16px',
          marginBottom: '8px',
        }}>
          Salut {user?.prenom} ! C'est quoi ce soir ?
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '16px' }}>
          Choisis comment tu veux travailler
        </p>
      </div>

      {/* Bandeau incitation séance 2 */}
      {incitationMsg && (
        <div
          onClick={handlePremium}
          style={{
            width: '100%',
            maxWidth: '680px',
            padding: '14px 20px',
            background: 'rgba(108,99,255,0.12)',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 'var(--r-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fade-up 0.4s ease',
          }}
        >
          <span style={{ fontSize: '24px' }}>🧠</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#6C63FF', margin: 0 }}>
              Complète ton profil cognitif
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '2px 0 0' }}>
              {incitationMsg}
            </p>
          </div>
          <span style={{ marginLeft: 'auto', color: '#6C63FF', fontSize: '14px', fontWeight: '600' }}>
            Séance 2 →
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '680px',
        animation: 'fade-up 0.45s ease 0.05s both',
      }}>
        {/* Free card */}
        <ChoiceCard
          emoji="📝"
          title="Aide-moi pour mes devoirs maintenant"
          desc="Maya t'aide à avancer sur tes devoirs de ce soir. Rapide et efficace."
          tag="Gratuit"
          tagColor="var(--text-3)"
          onClick={handleFree}
          cta="Commencer →"
        />

        {/* Premium card */}
        <ChoiceCard
          emoji="🚀"
          title="Je veux de meilleures notes et bosser moins longtemps"
          desc={
            isPremium && !profile?.onboarding_complete
              ? "Dr Mind va d'abord découvrir comment tu penses. Ça change tout."
              : "Ton assistant adapte chaque explication à ta façon de penser."
          }
          tag={isPremium ? '★ Premium' : '★ Premium · 19€/mois'}
          tagColor="var(--accent)"
          onClick={handlePremium}
          cta={
            isPremium && !profile?.onboarding_complete
              ? 'Rencontrer Dr Mind →'
              : isPremium
              ? 'Session Premium →'
              : 'Découvrir →'
          }
          highlighted
        />
      </div>

      {/* Mode Épreuve */}
      <div
        onClick={() => navigate('/quiz')}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
          border: '1px solid #3B82F6',
          borderRadius: 'var(--r-xl)',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          animation: 'fade-up 0.5s ease 0.1s both',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px' }}>📝</span>
          <div>
            <h3 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '18px',
              margin: 0,
              color: '#3B82F6',
            }}>
              Mode Épreuve
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
              Teste tes connaissances
            </p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5', margin: 0 }}>
          Quiz interactifs avec timer, feedback instantané et explications détaillées.
          <br />
          <span style={{ color: '#3B82F6', fontWeight: '600' }}>
            {isPremium ? 'Questions personnalisées selon ton profil' : 'Passe Premium pour des questions adaptées'}
          </span>
        </p>
      </div>

      {/* Calendrier de révisions */}
      <ReviewCalendar userId={user?.id} />

      {/* Parent dashboard link */}
      <button
        onClick={() => navigate('/parent')}
        style={{
          background: 'none', border: 'none',
          color: 'var(--text-3)', fontSize: '13px',
          cursor: 'pointer', textDecoration: 'underline',
          animation: 'fade-in 0.5s ease 0.2s both',
        }}
      >
        Accéder au tableau de bord parent →
      </button>
    </div>
  )
}

function ChoiceCard({ emoji, title, desc, tag, tagColor, onClick, cta, highlighted }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: highlighted
          ? 'linear-gradient(145deg, #0E1F16 0%, var(--bg-card) 100%)'
          : 'var(--bg-card)',
        border: `1px solid ${highlighted ? 'var(--border-h)' : 'var(--border)'}`,
        borderRadius: 'var(--r-xl)',
        padding: '28px 24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.2s',
        boxShadow: highlighted ? 'var(--glow)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = highlighted
          ? '0 8px 40px rgba(29,158,117,0.3)'
          : '0 8px 32px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = highlighted ? 'var(--glow)' : 'none'
      }}
    >
      {highlighted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        }} />
      )}

      <span style={{ fontSize: '36px' }}>{emoji}</span>

      <div>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tagColor,
        }}>{tag}</span>
        <h3 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '17px',
          marginTop: '8px',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>{desc}</p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: highlighted ? 'var(--accent)' : 'var(--text)',
        }}>{cta}</span>
      </div>
    </div>
  )
}
