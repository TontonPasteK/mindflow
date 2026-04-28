import { useState, useEffect } from 'react'
import { getConversationSessions, getConversationStats, deleteConversationHistory } from '../../services/conversationHistory'

export default function ConversationHistoryPanel({ childId, childName }) {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    loadConversationData()
  }, [childId])

  const loadConversationData = async () => {
    if (!childId) return

    setLoading(true)
    try {
      const [sessionsData, statsData] = await Promise.all([
        getConversationSessions(childId),
        getConversationStats(childId)
      ])
      setSessions(sessionsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHistory = async () => {
    if (!childId) return

    setDeleteLoading(true)
    try {
      await deleteConversationHistory(childId)
      setSessions([])
      setStats({
        totalMessages: 0,
        totalSessions: 0,
        totalSubjects: 0,
        subjects: [],
        lastActivity: null
      })
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Erreur suppression historique:', error)
      alert('Erreur lors de la suppression de l\'historique')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays < 7) return `Il y a ${diffDays} j`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return '< 1 min'
    if (diffMins < 60) return `${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}min`
  }

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--text-3)',
      }}>
        Chargement de l'historique...
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--f-title)',
            fontSize: '18px',
            margin: 0,
            color: 'var(--text)',
          }}>
            💬 Historique des conversations
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
            Suivi des échanges avec l'assistant
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '8px 16px',
              background: 'var(--error-dim)',
              border: '1px solid var(--error)',
              borderRadius: '8px',
              color: 'var(--error)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            🗑️ Supprimer tout
          </button>
        )}
      </div>

      {/* Statistiques */}
      {stats && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          <StatItem
            icon="💬"
            value={stats.totalMessages}
            label="Messages"
          />
          <StatItem
            icon="📚"
            value={stats.totalSessions}
            label="Sessions"
          />
          <StatItem
            icon="📖"
            value={stats.totalSubjects}
            label="Matières"
          />
          <StatItem
            icon="🕐"
            value={stats.lastActivity ? formatDate(stats.lastActivity) : '-'}
            label="Dernière activité"
          />
        </div>
      )}

      {/* Liste des sessions */}
      {sessions.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-3)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            Aucune conversation enregistrée
          </p>
          <p style={{ fontSize: '13px' }}>
            L'historique des conversations apparaîtra ici après les premières sessions.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {sessions.map((session, index) => (
            <SessionItem
              key={session.sessionId}
              session={session}
              index={index}
              totalSessions={sessions.length}
              isSelected={selectedSession?.sessionId === session.sessionId}
              onSelect={() => setSelectedSession(session)}
              formatDate={formatDate}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}

      {/* Détail de la session sélectionnée */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          formatDate={formatDate}
        />
      )}

      {/* Modal de confirmation suppression */}
      {showDeleteConfirm && (
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
              marginBottom: '12px',
              color: 'var(--text)',
            }}>
              Supprimer tout l'historique ?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6', marginBottom: '20px' }}>
              Cette action est irréversible. Toutes les conversations de {childName} seront définitivement supprimées.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteHistory}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              >
                {deleteLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ icon, value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}

function SessionItem({ session, index, totalSessions, isSelected, onSelect, formatDate, formatDuration }) {
  const userMessages = session.messages.filter(m => m.role === 'user').length
  const assistantMessages = session.messages.filter(m => m.role === 'assistant').length

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '16px 20px',
        borderBottom: index < totalSessions - 1 ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
        background: isSelected ? 'var(--accent-dim)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-2)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
            {session.subject || 'Session générale'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            {formatDate(session.startTime)} · {formatDuration(session.startTime, session.endTime)}
          </div>
        </div>
        {session.avatar && (
          <div style={{
            padding: '4px 10px',
            background: 'var(--bg-2)',
            borderRadius: '12px',
            fontSize: '11px',
            color: 'var(--text-2)',
            fontWeight: '600',
          }}>
            {session.avatar}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
        <span>💬 {userMessages} messages</span>
        <span>🤖 {assistantMessages} réponses</span>
      </div>
    </div>
  )
}

function SessionDetail({ session, onClose, formatDate }) {
  return (
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
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '18px',
              margin: 0,
              color: 'var(--text)',
            }}>
              {session.subject || 'Session générale'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
              {formatDate(session.startTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {session.messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--accent)' : 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: isUser ? '#080D0A' : 'var(--text)',
        fontSize: '14px',
        lineHeight: '1.6',
      }}>
        <div style={{ fontSize: '11px', color: isUser ? 'rgba(8,13,10,0.6)' : 'var(--text-3)', marginBottom: '4px', fontWeight: '600' }}>
          {isUser ? '👤 Élève' : '🤖 Assistant'}
        </div>
        {message.content}
      </div>
    </div>
  )
}
