import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { redirectToCheckout } from '../services/lemonsqueezy'
import Button from '../components/ui/Button'

export default function Pricing() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubscribe = async () => {
    if (!user) { navigate('/auth?mode=signup'); return }
    if (isPremium) { navigate('/session?mode=premium'); return }

    setLoading(true)
    setError('')
    try {
      await redirectToCheckout(user.id, user.email)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 24px 80px',
    }}>
      {/* Nav */}
      <div style={{ width: '100%', maxWidth: '860px', marginBottom: '48px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-2)', cursor: 'pointer',
            fontSize: '14px',
          }}
        >← Retour</button>
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '48px',
        animation: 'fade-up 0.4s ease',
        maxWidth: '560px',
      }}>
        <h1 style={{
          fontFamily: 'var(--f-title)',
          fontSize: 'clamp(28px, 5vw, 44px)',
          marginBottom: '12px',
        }}>
          Maya qui te connaît vraiment
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '17px', lineHeight: '1.7' }}>
          Passe en Premium et Maya apprend comment ton cerveau fonctionne.
          Chaque session devient une expérience sur-mesure.
        </p>
      </div>

      {/* Plans comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '680px',
        animation: 'fade-up 0.45s ease 0.08s both',
      }}>
        {/* Free */}
        <PlanCard
          name="Gratuit"
          price="0€"
          period="pour toujours"
          features={[
            'IA Groq Llama 3',
            'Aide aux devoirs guidée',
            '3 échanges max par session',
            'Mode texte uniquement',
          ]}
          cta={user ? 'Plan actuel' : 'Commencer gratuitement'}
          ctaAction={() => navigate(user ? '/session' : '/auth?mode=signup')}
          ctaVariant="secondary"
          disabled={!isPremium && !!user}
        />

        {/* Premium */}
        <PlanCard
          name="Premium"
          price="19€"
          period="par mois"
          highlighted
          features={[
            'IA Claude Sonnet (Anthropic)',
            'Profil cognitif V/A/K complet',
            'Stratégies d\'apprentissage personnalisées',
            'Voix naturelle (OpenAI TTS)',
            'Scanner de documents',
            'Dashboard parent',
            'Sessions illimitées',
          ]}
          cta={isPremium ? 'Mon plan actuel ★' : 'Passer en Premium'}
          ctaAction={handleSubscribe}
          ctaVariant="primary"
          loading={loading}
          error={error}
          badge="Le plus populaire"
        />
      </div>

      {/* FAQ */}
      <div style={{
        maxWidth: '560px',
        width: '100%',
        marginTop: '56px',
        animation: 'fade-up 0.4s ease 0.15s both',
      }}>
        <h2 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '20px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>Questions fréquentes</h2>
        {FAQ.map((item, i) => <FaqItem key={i} {...item} />)}
      </div>
    </div>
  )
}

function PlanCard({ name, price, period, features, cta, ctaAction, ctaVariant, highlighted, badge, loading, error, disabled }) {
  return (
    <div style={{
      background: highlighted ? 'linear-gradient(145deg, #0D1F17 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
      border: `1px solid ${highlighted ? 'var(--border-h)' : 'var(--border)'}`,
      borderRadius: 'var(--r-xl)',
      padding: '32px 28px',
      position: 'relative',
      boxShadow: highlighted ? 'var(--glow)' : 'none',
    }}>
      {highlighted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        }} />
      )}

      {badge && (
        <span style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'var(--accent)',
          color: '#080D0A',
          fontSize: '11px',
          fontWeight: '700',
          padding: '3px 10px',
          borderRadius: '12px',
          letterSpacing: '0.04em',
        }}>{badge}</span>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '16px',
          color: highlighted ? 'var(--accent)' : 'var(--text-2)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>{name}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--f-title)',
            fontSize: '42px',
            fontWeight: '800',
            color: 'var(--text)',
            lineHeight: 1,
          }}>{price}</span>
          <span style={{ color: 'var(--text-3)', fontSize: '14px' }}>/{period}</span>
        </div>
      </div>

      <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: '700', flexShrink: 0 }}>✓</span>
            <span style={{ color: 'var(--text-2)' }}>{f}</span>
          </li>
        ))}
      </ul>

      {error && (
        <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
      )}

      <Button
        fullWidth
        size="lg"
        variant={ctaVariant}
        onClick={ctaAction}
        loading={loading}
        disabled={disabled}
      >
        {cta}
      </Button>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      padding: '16px 0',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none',
          width: '100%', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{q}</span>
        <span style={{ color: 'var(--accent)', fontSize: '18px', flexShrink: 0 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-2)',
          marginTop: '10px',
          lineHeight: '1.65',
          animation: 'fade-up 0.2s ease',
        }}>{a}</p>
      )}
    </div>
  )
}

const FAQ = [
  { q: 'Comment fonctionne le profil cognitif ?', a: 'Maya te pose des questions naturelles sur comment tu vois les choses dans ta tête. En quelques minutes, elle détecte si tu es plutôt visuel, auditif ou kinesthésique — et adapte toutes ses explications en conséquence.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans engagement. Tu peux annuler depuis ton espace Stripe et conserver le Premium jusqu\'à la fin de la période payée.' },
  { q: 'La version gratuite est vraiment gratuite ?', a: 'Oui, sans carte bancaire. Tu peux avoir de l\'aide avec Maya en mode gratuit indéfiniment, avec 3 échanges par session.' },
  { q: 'Le dashboard parent, c\'est quoi exactement ?', a: 'Les parents peuvent voir le nombre de sessions, la durée, les matières travaillées et le journal de victoires. Le contenu des conversations reste strictement confidentiel.' },
]
