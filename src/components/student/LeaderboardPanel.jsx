import { useState, useEffect } from 'react'
import { getLeaderboard, getUserLeaderboardStats } from '../../services/leaderboard'

export default function LeaderboardPanel({ userId }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    loadLeaderboard()
  }, [userId])

  const loadLeaderboard = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const [leaderboardData, userStatsData] = await Promise.all([
        getLeaderboard(showFull ? 50 : 10),
        getUserLeaderboardStats(userId)
      ])

      // Marquer l'utilisateur courant
      const markedLeaderboard = leaderboardData.map(entry => ({
        ...entry,
        isCurrentUser: userStatsData && entry.anonymous_pseudo === userStatsData.anonymous_pseudo
      }))

      setLeaderboard(markedLeaderboard)
      setUserStats(userStatsData)
    } catch (error) {
      console.error('Erreur chargement leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#CD7F32'
    return 'var(--text-2)'
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
        Chargement du classement...
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🏆 Classement anonyme
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
            Compétition saine basée sur la régularité
          </p>
        </div>
        <button
          onClick={() => setShowFull(!showFull)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-2)'
            e.currentTarget.style.borderColor = 'var(--border-h)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          {showFull ? 'Top 10' : 'Top 50'}
        </button>
      </div>

      {/* Statistiques utilisateur */}
      {userStats && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--accent-dim)',
          borderBottom: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          <StatItem
            icon="🎯"
            value={`#${userStats.rank}`}
            label="Ton rang"
            highlight={true}
          />
          <StatItem
            icon="📊"
            value={userStats.score}
            label="Score"
          />
          <StatItem
            icon="🔥"
            value={userStats.consistency_streak}
            label="Streak"
          />
          <StatItem
            icon="🏆"
            value={userStats.total_quiz_victories}
            label="Victoires"
          />
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ padding: '20px' }}>
        {leaderboard.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Aucun classement disponible
            </p>
            <p style={{ fontSize: '13px' }}>
              Sois le premier à grimper dans le classement !
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((entry, index) => (
              <LeaderboardEntry
                key={index}
                entry={entry}
                getRankBadge={getRankBadge}
                getRankColor={getRankColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--text-3)',
        textAlign: 'center',
      }}>
        💡 Le score combine : sessions (10pts), victoires quiz (50pts), temps d'étude (0.5pts/min), streak (20pts)
      </div>
    </div>
  )
}

function StatItem({ icon, value, label, highlight = false }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: highlight ? 'var(--accent)' : 'var(--text)',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}

function LeaderboardEntry({ entry, getRankBadge, getRankColor }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: entry.isCurrentUser ? 'var(--accent-dim)' : 'var(--bg)',
        border: entry.isCurrentUser ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!entry.isCurrentUser) {
          e.currentTarget.style.background = 'var(--bg-2)'
          e.currentTarget.style.borderColor = 'var(--border-h)'
        }
      }}
      onMouseLeave={(e) => {
        if (!entry.isCurrentUser) {
          e.currentTarget.style.background = 'var(--bg)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }
      }}
    >
      {/* Rang */}
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: getRankColor(entry.rank),
        minWidth: '50px',
        textAlign: 'center',
      }}>
        {getRankBadge(entry.rank)}
      </div>

      {/* Pseudo */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: entry.isCurrentUser ? 'var(--accent)' : 'var(--text)',
          marginBottom: '4px',
        }}>
          {entry.anonymous_pseudo}
          {entry.isCurrentUser && (
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              padding: '2px 8px',
              background: 'var(--accent)',
              borderRadius: '10px',
              color: '#080D0A',
              fontWeight: '700',
            }}>
              Toi
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          Score : {entry.score}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: 'var(--text-2)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', color: 'var(--text)' }}>
            {entry.total_sessions}
          </div>
          <div style={{ fontSize: '11px' }}>Sessions</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', color: 'var(--text)' }}>
            {entry.total_quiz_victories}
          </div>
          <div style={{ fontSize: '11px' }}>Victoires</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '600', color: 'var(--text)' }}>
            {entry.consistency_streak}🔥
          </div>
          <div style={{ fontSize: '11px' }}>Streak</div>
        </div>
      </div>
    </div>
  )
}
