import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { createPortalSession } from '../services/stripe'
import { deleteAllMemories } from '../services/mem0'
import Button from '../components/ui/Button'
import PlanBadge from '../components/ui/PlanBadge'
import Modal from '../components/ui/Modal'
import ReferralPanel from '../components/referral/ReferralPanel'
import MemoryViewer from '../components/student/MemoryViewer'

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, isPremium, plan } = useAuth()
  const [loading, setLoading] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleLogout = async () => {
    window.dispatchEvent(new Event('mindflow:logout'))
    localStorage.clear()
    sessionStorage.clear()
    try { await supabase.auth.signOut() } catch {}
    window.location.replace('https://evokia-lime.vercel.app')
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      // Supprimer toutes les mémoires Mem0 (droit à l'oubli)
      try {
        await deleteAllMemories(user.id)
      } catch (mem0Error) {
        console.error('Erreur suppression mémoires Mem0:', mem0Error)
        // Continuer même si Mem0 échoue
      }

      // Supprimer toutes les données de l'utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id)

      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', user.id)

      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .in('session_id', (
          await supabase.from('sessions').select('id').eq('user_id', user.id)
        ).data?.map(s => s.id) || [])

      const { error: victoriesError } = await supabase
        .from('victories')
        .delete()
        .eq('user_id', user.id)

      const { error: kgError } = await supabase
        .from('knowledge_graph')
        .delete()
        .eq('user_id', user.id)

      const { error: notionsError } = await supabase
        .from('notions_travaillees')
        .delete()
        .eq('user_id', user.id)

      const { error: parentLinksError } = await supabase
        .from('parent_links')
        .delete()
        .or(`parent_id.eq.${user.id},child_id.eq.${user.id}`)

      // Supprimer le compte utilisateur
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id)

      if (userError) throw userError

      // Déconnexion et redirection
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('https://evokia-lime.vercel.app')
    } catch (err) {
      console.error('Erreur suppression compte:', err)
      alert('Erreur lors de la suppression du compte. Contactez le support.')
    } finally {
      setDeleteLoading(false)
      setConfirmDelete(false)
    }
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

        {/* Mem0 memories */}
        <Section title="Mes mémoires inter-sessions">
          <MemoryViewer />
        </Section>

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

        {/* BLOC 12 — Parrainage */}
        <ReferralPanel />

        {/* Danger zone */}
        <Section title="Compte">
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmLogout(true)}
          >
            Se déconnecter
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmDelete(true)}
            style={{ marginTop: '8px' }}
          >
            Supprimer mon compte et toutes mes données
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

      {/* Delete account confirm modal */}
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer le compte ?">
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '12px', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--error)' }}>Attention : cette action est irréversible.</strong>
        </p>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
          Toutes tes données seront définitivement supprimées :
        </p>
        <ul style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.7', marginBottom: '20px', paddingLeft: '20px' }}>
          <li>Profil et informations personnelles</li>
          <li>Historique des sessions</li>
          <li>Profil cognitif</li>
          <li>Journal de victoires</li>
          <li>Connaissances et notions travaillées</li>
          <li>Mémoires inter-sessions (Mem0)</li>
        </ul>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button variant="danger" fullWidth onClick={handleDeleteAccount} loading={deleteLoading}>
            Supprimer définitivement
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
