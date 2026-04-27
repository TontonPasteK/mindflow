import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { linkParentToChild, getLinkedChildren, getChildStats, getKnowledgeGraph, getProfile, getUserSessions } from '../services/supabase'
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
  const [childProfile, setChildProfile]   = useState(null)
  const [childKG, setChildKG]             = useState(null)
  const [childSessions, setChildSessions] = useState([])
  const [loadingStats, setLoadingStats]   = useState(false)
  const [linkEmail, setLinkEmail]         = useState('')
  const [linkError, setLinkError]         = useState('')
  const [linkLoading, setLinkLoading]     = useState(false)
  const [linkSuccess, setLinkSuccess]     = useState(false)

  // BLOC 2 — Mode édition profil enfant
  const [editMode, setEditMode]           = useState(false)
  const [editForm, setEditForm]           = useState({ prenom: '', niveau: '', avatar: '' })
  const [editLoading, setEditLoading]     = useState(false)
  const [editError, setEditError]         = useState('')
  const [editSuccess, setEditSuccess]     = useState(false)

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
      const [stats, kg, prof, sessions] = await Promise.allSettled([
        getChildStats(childId),
        getKnowledgeGraph(childId),
        getProfile(childId),
        getUserSessions(childId, 10),
      ])
      if (stats.status === 'fulfilled') setChildStats(stats.value)
      if (kg.status === 'fulfilled') setChildKG(kg.value)
      if (prof.status === 'fulfilled') setChildProfile(prof.value)
      if (sessions.status === 'fulfilled') setChildSessions(sessions.value)
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

  // BLOC 2 — Gestion édition profil enfant
  const handleEditProfile = () => {
    if (!childProfile) return
    setEditForm({
      prenom: childProfile.prenom || '',
      niveau: childProfile.niveau || '',
      avatar: childProfile.avatar || ''
    })
    setEditMode(true)
    setEditError('')
    setEditSuccess(false)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!selectedChild?.id) return

    setEditLoading(true)
    setEditError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          prenom: editForm.prenom,
          niveau: editForm.niveau,
          avatar: editForm.avatar
        })
        .eq('user_id', selectedChild.id)

      if (error) throw error

      setEditSuccess(true)
      setEditMode(false)

      // Recharger les données
      await selectChild(selectedChild.id, selectedChild)
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la modification')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px',
      maxWidth: '900px',
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
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '28px', marginBottom: '4px' }}>
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
          Le contenu des conversations reste confidentiel entre votre enfant et son assistant.
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
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span>{selectedChild.prenom} · 7 derniers jours</span>
            {/* BLOC 2 — Bouton modifier profil */}
            <button
              onClick={handleEditProfile}
              style={{
                padding: '4px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-3)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              title="Modifier le profil"
            >
              ✏️ Modifier
            </button>
          </h2>

          {loadingStats ? (
            <LoadingSpinner />
          ) : childStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Résumé dernière session */}
              {childSessions.length > 0 && (
                <LastSessionSummary session={childSessions[0]} />
              )}

              {/* Streak + Points */}
              {childProfile && (
                <div style={{
                  display: 'flex', gap: '12px',
                  padding: '14px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent)' }}>
                      🔥 {childProfile.streak ?? 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Jours consécutifs</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent)' }}>
                      {childProfile.points ?? 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Points accumulés</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>
                      {childStats.sessions?.length ?? 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Sessions (7j)</div>
                  </div>
                </div>
              )}

              {/* Métriques détaillées */}
              <DetailedMetrics sessions={childStats.sessions} kg={childKG} />

              {/* Alertes engagement */}
              <EngagementAlerts sessions={childStats.sessions} victories={childStats.victories} />

              {/* Ratio participation */}
              <ParticipationRatio victories={childStats.victories} sessions={childStats.sessions} />

              {/* Historique sessions */}
              <SessionsHistory sessions={childSessions} />

              <StatsCard sessions={childStats.sessions} />
              <SubjectsList sessions={childStats.sessions} />
              <VictoriesJournal victories={childStats.victories} />

              {/* Knowledge Graph */}
              {childKG && <KnowledgeGraphPanel kg={childKG} />}

              {/* Abonnement */}
              {childProfile && <SubscriptionPanel profile={childProfile} />}

              {/* Contact praticien */}
              <ContactPractitioner />
            </div>
          ) : null}
        </div>
      )}

      {/* BLOC 2 — Modal édition profil */}
      {editMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '18px',
              marginBottom: '16px',
              color: 'var(--text)',
            }}>
              Modifier le profil de {selectedChild?.prenom}
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--text-2)', marginBottom: '6px', display: 'block',
                }}>
                  Prénom
                </label>
                <Input
                  value={editForm.prenom}
                  onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div>
                <label style={{
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--text-2)', marginBottom: '6px', display: 'block',
                }}>
                  Niveau scolaire
                </label>
                <select
                  value={editForm.niveau}
                  onChange={e => setEditForm(f => ({ ...f, niveau: e.target.value }))}
                  required
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    color: editForm.niveau ? 'var(--text)' : 'var(--text-3)',
                    padding: '13px 16px',
                    fontSize: '15px',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>Choisir le niveau</option>
                  {['CM2', '6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale', 'Étudiant', 'Adulte'].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--text-2)', marginBottom: '6px', display: 'block',
                }}>
                  Avatar
                </label>
                <select
                  value={editForm.avatar}
                  onChange={e => setEditForm(f => ({ ...f, avatar: e.target.value }))}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    color: editForm.avatar ? 'var(--text)' : 'var(--text-3)',
                    padding: '13px 16px',
                    fontSize: '15px',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Par défaut</option>
                  {['Max', 'Victor', 'Léo', 'Maya', 'Noa', 'Sam', 'Alex'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {editError && (
                <p style={{
                  fontSize: '13px',
                  color: 'var(--error)',
                  padding: '10px 14px',
                  background: 'var(--error-dim)',
                  borderRadius: 'var(--r-sm)',
                  margin: 0,
                }}>{editError}</p>
              )}

              {editSuccess && (
                <p style={{
                  fontSize: '13px',
                  color: 'var(--accent)',
                  padding: '10px 14px',
                  background: 'rgba(29,158,117,0.1)',
                  borderRadius: 'var(--r-sm)',
                  margin: 0,
                }}>Profil modifié avec succès !</p>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditMode(false)}
                  disabled={editLoading}
                  style={{ flex: 1 }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={editLoading}
                  style={{ flex: 1 }}
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
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

// ─── Composants ─────────────────────────────────────────────────────────────────

function LastSessionSummary({ session }) {
  if (!session) return null

  const date = new Date(session.started_at)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
  const duration = session.duree_minutes || 0
  const matieres = session.matieres || []

  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: 'var(--text-2)' }}>
        Dernière session
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', margin: 0 }}>
        <span style={{ fontWeight: '600' }}>{formattedDate}</span> —{' '}
        {matieres.length > 0 ? matieres.join(', ') : 'Travail général'}{' '}
        ({duration} min). {session.resume || 'Session de travail régulière.'}
      </p>
    </div>
  )
}

function DetailedMetrics({ sessions, kg }) {
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duree_minutes || 0), 0)
  const avgMinutes = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0
  const notionsMaitrisees = kg?.notions_maitrisees?.length || 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    }}>
      <MetricItem
        icon="📊"
        value={sessions.length}
        label="Sessions ce mois"
      />
      <MetricItem
        icon="✅"
        value={notionsMaitrisees}
        label="Notions maîtrisées"
      />
      <MetricItem
        icon="⏱"
        value={`${avgMinutes} min`}
        label="Temps moyen"
      />
    </div>
  )
}

function MetricItem({ icon, value, label }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '16px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{
        fontSize: '22px',
        fontWeight: '700',
        fontFamily: 'var(--f-title)',
        color: 'var(--accent)',
        lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontSize: '12px',
        color: 'var(--text-3)',
        textAlign: 'center',
        lineHeight: '1.4',
      }}>{label}</span>
    </div>
  )
}

function EngagementAlerts({ sessions, victories }) {
  const alerts = []

  // Engagement suspect
  if (sessions.length === 0) {
    alerts.push({ type: 'warning', text: 'Aucune session cette semaine. Encouragez votre enfant à travailler.' })
  } else if (sessions.length < 2) {
    alerts.push({ type: 'info', text: 'Engagement léger. Une session par semaine serait idéale.' })
  } else {
    alerts.push({ type: 'success', text: 'Engagement sain. Continuez comme ça !' })
  }

  // Matière fragile
  const subjectCounts = {}
  sessions.forEach(s => {
    (s.matieres || []).forEach(m => {
      subjectCounts[m] = (subjectCounts[m] || 0) + 1
    })
  })

  const weakSubjects = Object.entries(subjectCounts)
    .filter(([_, count]) => count < 2)
    .map(([subject]) => subject)

  if (weakSubjects.length > 0) {
    alerts.push({
      type: 'warning',
      text: `Matière fragile : ${weakSubjects.join(', ')}. Plus de travail recommandé.`
    })
  }

  if (alerts.length === 0) return null

  return (
    <div style={{
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>Alertes</div>
      {alerts.map((alert, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 12px',
            background: alert.type === 'success' ? 'var(--accent-dim)' :
                       alert.type === 'warning' ? 'rgba(239, 68, 68, 0.1)' :
                       'var(--bg-2)',
            borderRadius: 'var(--r-sm)',
            marginBottom: i < alerts.length - 1 ? '8px' : 0,
            fontSize: '13px',
            color: alert.type === 'success' ? 'var(--accent)' :
                   alert.type === 'warning' ? 'var(--error)' :
                   'var(--text-2)',
          }}
        >
          <span style={{ flexShrink: 0 }}>
            {alert.type === 'success' ? '✅' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          {alert.text}
        </div>
      ))}
    </div>
  )
}

function ParticipationRatio({ victories, sessions }) {
  if (!victories || victories.length === 0) {
    return (
      <div style={{
        padding: '14px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Ratio participation</div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.7' }}>
          Pas assez de données pour évaluer le ratio.
        </div>
      </div>
    )
  }

  const totalSessions = sessions?.length || 1
  const victoryRate = Math.round((victories.length / totalSessions) * 100)

  let status = 'sain'
  let statusText = 'Ratio sain'
  let statusColor = 'var(--accent)'

  if (victoryRate < 30) {
    status = 'suspect'
    statusText = 'Ratio suspect — participation faible'
    statusColor = 'var(--error)'
  } else if (victoryRate > 80) {
    status = 'excellent'
    statusText = 'Ratio excellent — très bonne participation'
    statusColor = 'var(--accent)'
  }

  return (
    <div style={{
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Ratio participation</div>
      <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.7' }}>
        <span style={{ color: statusColor, fontWeight: '600' }}>{victoryRate}%</span> de sessions avec victoires.{' '}
        <span style={{ color: statusColor }}>{statusText}</span>
      </div>
      <div style={{
        marginTop: '10px',
        height: '6px',
        background: 'var(--bg-2)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${victoryRate}%`,
          height: '100%',
          background: statusColor,
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

function SessionsHistory({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: '14px',
      }}>
        Aucune session enregistrée
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <h4 style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: '600' }}>
        Historique des sessions
      </h4>

      {sessions.map((session, i) => {
        const date = new Date(session.started_at)
        const formattedDate = date.toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
        const matieres = session.matieres || []
        const duration = session.duree_minutes || 0

        return (
          <div
            key={session.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-2)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              animation: `fade-up 0.3s ease ${i * 0.05}s both`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500', marginBottom: '4px' }}>
                {matieres.length > 0 ? matieres.join(', ') : 'Travail général'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {formattedDate} · {duration} min
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              alignSelf: 'center',
            }}>
              {session.ended_at ? 'Terminée' : 'En cours'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KnowledgeGraphPanel({ kg }) {
  if (!kg) return null
  const maitrisees = kg.notions_maitrisees || []
  const enCours    = kg.notions_en_cours || []
  const blocages   = kg.blocages_recurrents || []

  if (maitrisees.length + enCours.length + blocages.length === 0) return null

  return (
    <div style={{
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>Carte des notions</div>
      {maitrisees.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600', marginBottom: '4px' }}>✓ Maîtrisées</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.8' }}>
            {maitrisees.slice(-8).join(' · ')}
          </div>
        </div>
      )}
      {enCours.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600', marginBottom: '4px' }}>~ En cours</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.8' }}>
            {enCours.slice(-5).join(' · ')}
          </div>
        </div>
      )}
      {blocages.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--error)', fontWeight: '600', marginBottom: '4px' }}>⚠ Points de blocage</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.8' }}>
            {blocages.slice(-5).join(' · ')}
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriptionPanel({ profile }) {
  const plan = profile.plan || 'free'
  const isPremium = plan === 'premium'

  return (
    <div style={{
      padding: '16px 20px',
      background: isPremium ? 'linear-gradient(135deg, #0E1F16, var(--bg-card))' : 'var(--bg-card)',
      border: isPremium ? '1px solid var(--border-h)' : '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px', color: 'var(--text-2)' }}>
        Abonnement
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: isPremium ? 'var(--accent)' : 'var(--text)' }}>
            {isPremium ? 'Premium' : 'Gratuit'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {isPremium ? '19€/mois · Sans engagement' : 'Fonctionnalités limitées'}
          </div>
        </div>
        {!isPremium && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#080D0A',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Passer Premium
          </button>
        )}
      </div>
    </div>
  )
}

function ContactPractitioner() {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      textAlign: 'center',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: 'var(--text-2)' }}>
        Besoin d'aide ?
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px', lineHeight: '1.6' }}>
        Contactez le praticien pour discuter de la progression de votre enfant.
      </p>
      <a
        href="mailto:scolrcoaching@gmail.com"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: 'var(--accent)',
          color: '#080D0A',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Contacter le praticien
      </a>
    </div>
  )
}
