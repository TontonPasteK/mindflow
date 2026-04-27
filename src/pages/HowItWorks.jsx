import { useNavigate } from 'react-router-dom'

export default function HowItWorks() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        paddingTop: '32px',
        paddingBottom: '48px',
        animation: 'fadeIn 0.6s ease-out',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Retour
        </button>

        <h1 style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '16px',
        }}>
          Comment ça marche ?
        </h1>

        <p style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          color: '#94A3B8',
          lineHeight: '1.6',
          maxWidth: '600px',
        }}>
          En 4 étapes simples, Evokia transforme la façon dont votre enfant apprend.
        </p>
      </div>

      {/* Steps */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        paddingBottom: '64px',
      }}>
        {/* Step 1 */}
        <StepCard
          number="1"
          title="Dr Mind découvre comment votre enfant pense"
          description="En 2 séances de 20 minutes, Dr Mind construit le profil cognitif de votre enfant. Visuel, auditif ou kinesthésique ? Chaque explication sera adaptée à sa façon d'apprendre."
          icon="🧠"
          delay="0.1s"
        />

        {/* Step 2 */}
        <StepCard
          number="2"
          title="7 avatars personnalisés selon le profil"
          description="Max pour les visuels, Victor pour les auditifs, Léo pour les kinesthésiques... Chaque avatar reçoit le dossier Dr Mind et applique la méthode adaptée à votre enfant."
          icon="👥"
          delay="0.2s"
        />

        {/* Step 3 */}
        <StepCard
          number="3"
          title="La méthode Dr Mind appliquée chaque soir"
          description="Tri sélectif systématique, effet miroir enrichissant, questions guidées... Votre assistant applique les principes de la gestion mentale pour chaque devoir."
          icon="📚"
          delay="0.3s"
        />

        {/* Step 4 */}
        <StepCard
          number="4"
          title="Dashboard parent pour suivre les progrès"
          description="Nombre de sessions, matières travaillées, journal de victoires... Vous voyez l'évolution de votre enfant sans intrusion dans ses conversations."
          icon="📊"
          delay="0.4s"
        />
      </div>

      {/* CTA */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
        paddingBottom: '64px',
        animation: 'fadeIn 0.6s ease-out 0.5s both',
      }}>
        <button
          onClick={() => navigate('/auth')}
          style={{
            padding: '18px 48px',
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
          Commencer maintenant →
        </button>
      </div>
    </div>
  )
}

function StepCard({ number, title, description, icon, delay }) {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(51, 65, 85, 0.5)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: `fadeIn 0.6s ease-out ${delay}s both`,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          {icon}
        </div>

        <div style={{
          flex: 1,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <span style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              color: '#10B981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
            }}>
              Étape {number}
            </span>
          </div>

          <h3 style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFFFFF',
            margin: 0,
            lineHeight: '1.3',
          }}>
            {title}
          </h3>
        </div>
      </div>

      <p style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#94A3B8',
        lineHeight: '1.7',
        margin: 0,
      }}>
        {description}
      </p>
    </div>
  )
}
