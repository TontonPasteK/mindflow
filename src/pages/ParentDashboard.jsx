import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { linkParentToChild, getLinkedChildren, getChildStats, updateUserPlan } from '../services/supabase'
import StatsCard from '../components/parent/StatsCard'
import SubjectsList from '../components/parent/SubjectsList'
import VictoriesJournal from '../components/parent/VictoriesJournal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [children, setChildren]           = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childStats, setChildStats]       = useState(null)
  const [loadingStats, setLoadingStats]   = useState(false)
  const [linkEmail, setLinkEmail]         = useState('')
  const [linkError, setLinkError]         = useState('')
  const [linkLoading, setLinkLoading]     = useState(false)
  const [linkSuccess, setLinkSuccess]     = useState(false)

  useEffect(() => {
    if (user) loadChildren()
  }, [user])

  const loadChildren = async () => {
    try {
      const data = await getLinkedChildren(user.id)
      setChildren(data)
      if (data.length > 0) selectChild(data[0].child_id, data[0].users)
    } catch (err) {
      console.error(err)
    }
  }

  const selectChild = async (childId, childUser) => {
    setSelectedChild({ id: childId, ...childUser })
    setLoadingStats(true)
    try {
      const stats = await getChildStats(childId)
      setChildStats(stats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLink = async (e) => {
    e.preventDefault()
    if (!linkEmail.trim()) return
    setLinkLoading(true)
    setLinkError('')
    try {
      const child = await linkParentToChild(user.id, linkEmail.trim())
      setLinkSuccess(true)
      setLinkEmail('')
      await loadChildren()
    } catch (err) {
      setLinkError(err.message || 'Erreur lors de la liaison')
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px',
      maxWidth: '760px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        animation: 'fade-up 0.4s ease',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '24px', marginBottom: '4px' }}>
            Tableau de bord parent
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Vue d'ensemble du travail de votre enfant
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/choice')}>
          ← Retour
        </Button>
      </div>

      {/* Confidentiality notice */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--accent-dim)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        marginBottom: '24px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        animation: 'fade-up 0.4s ease 0.05s both',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--text)' }}>Confidentialité respectée.</strong>{' '}
          Le contenu des conversations reste confidentiel entre votre enfant et Maya.
          Ce tableau de bord affiche uniquement les données de suivi anonymisées.
        </p>
      </div>

      {/* Link a child */}
      {children.length === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '28px',
          marginBottom: '24px',
          animation: 'fade-up 0.4s ease 0.1s both',
        }}>
          <h2 style={{ fontFamily: 'var(--f-title)', fontSize: '18px', marginBottom: '8px' }}>
            Lier le compte de votre enfant
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '20px' }}>
            Entrez l'email du compte Evokia de votre enfant pour voir ses statistiques.
          </p>
          <form onSubmit={handleLink} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Input
                value={linkEmail}
                onChange={e => { setLinkEmail(e.target.value); setLinkError('') }}
                placeholder="email@enfant.fr"
                type="email"
                error={linkError}
              />
            </div>
            <Button type="submit" loading={linkLoading}>
              Lier
            </Button>
          </form>
          {linkSuccess && (
            <p style={{ color: 'var(--accent)', fontSize: '13px', marginTop: '8px' }}>
              Compte lié avec succès !
            </p>
          )}
        </div>
      )}

      {/* Child selector */}
      {children.length > 1 && (
        <div style={{
          display: 'flex', gap: '10px',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {children.map(c => (
            <button
              key={c.child_id}
              onClick={() => selectChild(c.child_id, c.users)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: `1px solid ${selectedChild?.id === c.child_id ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedChild?.id === c.child_id ? 'var(--accent-dim)' : 'var(--bg-card)',
                color: selectedChild?.id === c.child_id ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              {c.users?.prenom || 'Enfant'}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {selectedChild && (
        <div style={{ animation: 'fade-up 0.4s ease' }}>
          <h2 style={{
            fontFamily: 'var(--f-title)',
            fontSize: '18px',
            marginBottom: '16px',
            color: 'var(--text-2)',
          }}>
            {selectedChild.prenom} · 7 derniers jours
          </h2>

          {loadingStats ? (
            <LoadingSpinner />
          ) : childStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatsCard sessions={childStats.sessions} />
              <SubjectsList sessions={childStats.sessions} />
              <VictoriesJournal victories={childStats.victories} />
            </div>
          ) : null}
        </div>
      )}

      {/* Add child link */}
      {children.length > 0 && (
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={() => {}}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent)', cursor: 'pointer',
              fontSize: '13px', textDecoration: 'underline',
            }}
          >
            + Lier un autre enfant
          </button>
        </div>
      )}
    </div>
  )
}
