import { useState, useEffect } from 'react'
import { getDueReviews, getAllEbbinghausReviews, completeReview, deleteEbbinghausReview, getEbbinghausStats, getReviewCalendar } from '../../services/ebbinghaus'

export default function ReviewCalendar({ userId }) {
  const [dueReviews, setDueReviews] = useState([])
  const [allReviews, setAllReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [completing, setCompleting] = useState(null)

  useEffect(() => {
    loadReviewData()
  }, [userId])

  const loadReviewData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const [dueData, allData, statsData, calendarData] = await Promise.all([
        getDueReviews(userId),
        getAllEbbinghausReviews(userId),
        getEbbinghausStats(userId),
        getReviewCalendar(userId)
      ])
      setDueReviews(dueData)
      setAllReviews(allData)
      setStats(statsData)
      setCalendar(calendarData)
    } catch (error) {
      console.error('Erreur chargement données révisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteReview = async (reviewId) => {
    setCompleting(reviewId)
    try {
      await completeReview(reviewId, 100)
      await loadReviewData()
    } catch (error) {
      console.error('Erreur complétion révision:', error)
      alert('Erreur lors de la complétion de la révision')
    } finally {
      setCompleting(null)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Supprimer cette notion du suivi de révisions ?')) return

    try {
      await deleteEbbinghausReview(reviewId)
      await loadReviewData()
    } catch (error) {
      console.error('Erreur suppression révision:', error)
      alert('Erreur lors de la suppression de la révision')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return "Demain"

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const getMasteryColor = (level) => {
    if (level >= 80) return 'var(--accent)'
    if (level >= 50) return '#F59E0B'
    return '#EF4444'
  }

  const getMasteryLabel = (level) => {
    if (level >= 80) return 'Maîtrisé'
    if (level >= 50) return 'En cours'
    return 'À revoir'
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
        Chargement du calendrier...
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
            📅 Calendrier de révisions
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
            Suivi Ebbinghaus — J+1, J+3, J+7, J+14, J+30
          </p>
        </div>
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
            icon="📚"
            value={stats.totalNotions}
            label="Notions suivies"
          />
          <StatItem
            icon="⏰"
            value={stats.dueReviews}
            label="À réviser"
            highlight={stats.dueReviews > 0}
          />
          <StatItem
            icon="✅"
            value={stats.completedToday}
            label="Révisées aujourd'hui"
          />
          <StatItem
            icon="📊"
            value={`${stats.avgMastery}%`}
            label="Maîtrise moyenne"
          />
        </div>
      )}

      {/* Révisions à faire */}
      {dueReviews.length > 0 && (
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--text)',
          }}>
            À réviser maintenant ({dueReviews.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dueReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onComplete={() => handleCompleteReview(review.id)}
                onDelete={() => handleDeleteReview(review.id)}
                completing={completing === review.id}
                getMasteryColor={getMasteryColor}
                getMasteryLabel={getMasteryLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calendrier mensuel */}
      <div style={{ padding: '20px' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '16px',
          color: 'var(--text)',
        }}>
          Calendrier des 30 prochains jours
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
        }}>
          {Object.entries(calendar).map(([date, reviews]) => (
            <CalendarDay
              key={date}
              date={date}
              reviews={reviews}
              selected={selectedDate === date}
              onClick={() => setSelectedDate(selectedDate === date ? null : date)}
              formatDate={formatDate}
              getMasteryColor={getMasteryColor}
            />
          ))}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      {selectedDate && calendar[selectedDate] && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--text)',
          }}>
            {formatDate(selectedDate)}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {calendar[selectedDate].map(review => (
              <div
                key={review.id}
                style={{
                  padding: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                    {review.notion}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: getMasteryColor(review.masteryLevel),
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: '600',
                  }}>
                    {getMasteryLabel(review.masteryLevel)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {review.subject} · Étape {review.reviewStage + 1}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
        color: highlight ? 'var(--error)' : 'var(--accent)',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}

function ReviewCard({ review, onComplete, onDelete, completing, getMasteryColor, getMasteryLabel }) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
          {review.notion}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          {review.subject} · Étape {review.review_stage + 1}/5
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
          Maîtrise : <span style={{ color: getMasteryColor(review.mastery_level), fontWeight: '600' }}>
            {getMasteryLabel(review.masteryLevel)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onComplete}
          disabled={completing}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            color: '#080D0A',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: completing ? 0.5 : 1,
          }}
        >
          {completing ? '...' : '✓ Révisé'}
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 12px',
            background: 'var(--error-dim)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function CalendarDay({ date, reviews, selected, onClick, formatDate, getMasteryColor }) {
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today
  const hasReviews = reviews.length > 0

  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px',
        background: selected ? 'var(--accent-dim)' : hasReviews ? 'var(--bg)' : 'transparent',
        border: selected ? '1px solid var(--accent)' : hasReviews ? '1px solid var(--border)' : '1px solid transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--bg-2)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = hasReviews ? 'var(--bg)' : 'transparent'
      }}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: isToday ? '700' : '600',
        color: isToday ? 'var(--accent)' : 'var(--text-2)',
        textAlign: 'center',
      }}>
        {formatDate(date)}
      </div>
      {hasReviews && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          alignItems: 'center',
        }}>
          {reviews.slice(0, 3).map((review, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: getMasteryColor(review.masteryLevel),
              }}
            />
          ))}
          {reviews.length > 3 && (
            <div style={{ fontSize: '9px', color: 'var(--text-3)' }}>
              +{reviews.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
