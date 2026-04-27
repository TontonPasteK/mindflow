import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px',
      maxWidth: '680px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-2)', borderRadius: '8px',
            padding: '6px 10px', cursor: 'pointer', fontSize: '16px',
          }}
        >←</button>
        <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '24px' }}>
          Politique de confidentialité
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Introduction */}
        <Section title="Notre engagement">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Evokia s'engage à protéger les données personnelles de vos enfants, conformément au RGPD.
            Nous collectons uniquement les données nécessaires pour fournir un accompagnement cognitif personnalisé.
          </p>
        </Section>

        {/* Données collectées */}
        <Section title="Données collectées">
          <DataItem
            title="Prénom"
            description="Pour personnaliser les interactions avec l'assistant."
          />
          <DataItem
            title="Niveau scolaire"
            description="Pour adapter le contenu pédagogique (CM2 à Terminale)."
          />
          <DataItem
            title="Profil cognitif"
            description="Visuel, auditif, kinesthésique — pour adapter la méthode d'apprentissage."
          />
          <DataItem
            title="Historique des sessions"
            description="Matières travaillées, notions abordées, durée des sessions."
          />
          <DataItem
            title="Journal de victoires"
            description="Moments de compréhension validés par l'assistant."
          />
        </Section>

        {/* Utilisation des données */}
        <Section title="Utilisation des données">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Vos données sont utilisées exclusivement pour :
          </p>
          <ul style={{
            fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8',
            paddingLeft: '20px', marginTop: '12px',
          }}>
            <li>Personnaliser l'accompagnement cognitif de votre enfant</li>
            <li>Adapter les explications à son profil d'apprentissage</li>
            <li>Assurer la continuité entre les sessions</li>
            <li>Améliorer nos services (données anonymisées)</li>
          </ul>
        </Section>

        {/* Protection des mineurs */}
        <Section title="Protection des mineurs">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            <strong style={{ color: 'var(--text)' }}>Conformément au RGPD :</strong>
          </p>
          <ul style={{
            fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8',
            paddingLeft: '20px', marginTop: '12px',
          }}>
            <li>Le consentement parental est obligatoire pour tout mineur</li>
            <li>Les données ne sont jamais partagées avec des tiers</li>
            <li>Le contenu des conversations reste confidentiel</li>
            <li>Les parents peuvent accéder au tableau de bord de suivi</li>
            <li>Les données peuvent être supprimées sur simple demande</li>
          </ul>
        </Section>

        {/* Conservation des données */}
        <Section title="Conservation des données">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Vos données sont conservées tant que le compte est actif. En cas de suppression de compte,
            toutes les données sont définitivement effacées de nos serveurs dans un délai de 30 jours.
          </p>
        </Section>

        {/* Vos droits */}
        <Section title="Vos droits">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul style={{
            fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8',
            paddingLeft: '20px', marginTop: '12px',
          }}>
            <li><strong>Droit d'accès :</strong> consulter vos données</li>
            <li><strong>Droit de rectification :</strong> modifier vos données</li>
            <li><strong>Droit à l'effacement :</strong> supprimer toutes vos données</li>
            <li><strong>Droit à la portabilité :</strong> récupérer vos données</li>
            <li><strong>Droit d'opposition :</strong> refuser le traitement</li>
          </ul>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7', marginTop: '12px' }}>
            Pour exercer ces droits, contactez-nous à :{' '}
            <a href="mailto:scolrcoaching@gmail.com" style={{ color: 'var(--accent)' }}>
              scolrcoaching@gmail.com
            </a>
          </p>
        </Section>

        {/* Sécurité */}
        <Section title="Sécurité">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Vos données sont protégées par :
          </p>
          <ul style={{
            fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8',
            paddingLeft: '20px', marginTop: '12px',
          }}>
            <li>Chiffrement des données en transit et au repos</li>
            <li>Authentification sécurisée via Supabase</li>
            <li>Accès restreint aux données sensibles</li>
            <li>Conformité aux normes de sécurité RGPD</li>
          </ul>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>
            Pour toute question concernant vos données ou cette politique de confidentialité :
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '12px' }}>
            <strong>Email :</strong>{' '}
            <a href="mailto:scolrcoaching@gmail.com" style={{ color: 'var(--accent)' }}>
              scolrcoaching@gmail.com
            </a>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '8px' }}>
            Dernière mise à jour : Avril 2026
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '20px',
      animation: 'fade-up 0.35s ease',
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '700',
        color: 'var(--text)',
        marginBottom: '12px',
        fontFamily: 'var(--f-title)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function DataItem({ title, description }) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      marginBottom: '8px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>
        {description}
      </div>
    </div>
  )
}
