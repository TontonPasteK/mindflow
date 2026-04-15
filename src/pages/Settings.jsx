import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { createPortalSession } from '../services/stripe'
import Button from '../components/ui/Button'
import PlanBadge from '../components/ui/PlanBadge'
import Modal from '../components/ui/Modal'

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, isPremium, plan } = useAuth()
  const [loading, setLoading] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleLogout = async () => {
    window.dispatchEvent(new Event('mindflow:logout'))
    localStorage.clear()
    sessionStorage.clear()
    try { await supabase.auth.signOut() } catch {}
    window.location.replace('https://mindflow-lime.vercel.app')
  }

  const handleManagePlan = async () => {
    if (!isPremium) { navigate('/pricing'); return }
    setLoading(true)
    try {
      await createPortalSession(user.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--bg)',
      padding: '24px',
      maxWidth: '520px',
      margin: '0 auto',
    }}>
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
        <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '22px' }}>Paramètres</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Profile card */}
        <Section title="Mon compte">
          <InfoRow label="Prénom" value={user?.prenom} />
          <InfoRow label="Email"  value={user?.email} />
          <InfoRow label="Plan"   value={<PlanBadge plan={plan} />} />
        </Section>

        {/* Cognitive profile */}
        {profile?.onboarding_complete && (
          <Section title="Mon profil cognitif">
            <ProfileBar label="Visuel"         value={profile.visuel} />
            <ProfileBar label="Auditif"        value={profile.auditif} />
            <ProfileBar label="Kinesthésique"  value={profile.kinesthesique} />
            {profile.projet_de_sens && (
              <InfoRow label="Projet de sens" value={profile.projet_de_sens} />
            )}
            {profile.intelligence_dominante && (
              <InfoRow label="Intelligence dominante" value={profile.intelligence_dominante} />
            )}
          </Section>
        )}

        {/* Plan management */}
        <Section title="Abonnement">
          {isPremium ? (
            <Button
              variant="secondary"
              fullWidth
              loading={loading}
              onClick={handleManagePlan}
            >
              Gérer mon abonnement →
            </Button>
          ) : (
            <Button fullWidth onClick={() => navigate('/pricing')}>
              Passer en Premium — 19€/mois
            </Button>
          )}
        </Section>

        {/* Danger zone */}
        <Section title="Compte">
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmLogout(true)}
          >
            Se déconnecter
          </Button>
        </Section>
      </div>

      {/* Logout confirm modal */}
      <Modal isOpen={confirmLogout} onClose={() => setConfirmLogout(false)} title="Se déconnecter ?">
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
          Tu seras redirigé vers la page d'accueil. Tes données sont conservées.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmLogout(false)}>
            Annuler
          </Button>
          <Button variant="danger" fullWidth onClick={handleLogout}>
            Déconnecter
          </Button>
        </div>
      </Modal>
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
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      animation: 'fade-up 0.35s ease',
    }}>
      <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{value}</span>
    </div>
  )
}

function ProfileBar({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{value}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: 'var(--accent)',
          borderRadius: '3px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}
