import { useState, useEffect } from 'react'
import { getUnacknowledgedAlerts, acknowledgeAlert, getActivityStats } from '../../services/inactivityDetection'

export default function InactivityAlertsPanel({ childId, childName }) {
  const [alerts, setAlerts] = useState([])
  const [activityStats, setActivityStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState(null)

  useEffect(() => {
    loadAlertsAndStats()
  }, [childId])

  const loadAlertsAndStats = async () => {
    if (!childId) return

    setLoading(true)
    try {
      const [alertsData, statsData] = await Promise.all([
        getUnacknowledgedAlerts(childId),
        getActivityStats(childId, 30)
      ])
      setAlerts(alertsData)
      setActivityStats(statsData)
    } catch (error) {
      console.error('Erreur chargement alertes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId) => {
    setAcknowledging(alertId)
    try {
      await acknowledgeAlert(alertId, childId)
      // Recharger les alertes
      await loadAlertsAndStats()
    } catch (error) {
      console.error('Erreur reconnaissance alerte:', error)
      alert('Erreur lors de la reconnaissance de l\'alerte')
    } finally {
      setAcknowledging(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        Chargement des alertes...
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
      }}>
        <h3 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '18px',
          margin: 0,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🔔 Alertes d'activité
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
          Suivi de la régularité du travail
        </p>
      </div>

      {/* Statistiques d'activité */}
      {activityStats && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            <StatItem
              icon="📅"
              value={activityStats.totalDays}
              label="Jours actifs (30j)"
            />
            <StatItem
              icon="💬"
              value={activityStats.totalSessions}
              label="Sessions totales"
            />
            <StatItem
              icon="⏱️"
              value={`${activityStats.avgDurationPerDay} min`}
              label="Durée moyenne/jour"
            />
            <StatItem
              icon="📊"
              value={activityStats.avgSessionsPerDay}
              label="Sessions/jour"
            />
          </div>
        </div>
      )}

      {/* Alertes */}
      {alerts.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-3)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            Aucune alerte d'inactivité
          </p>
          <p style={{ fontSize: '13px' }}>
            {childName} maintient une bonne régularité dans son travail.
          </p>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {alerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              childName={childName}
              onAcknowledge={() => handleAcknowledge(alert.id)}
              acknowledging={acknowledging === alert.id}
              formatDate={formatDate}
            />
          ))}
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

function AlertCard({ alert, childName, onAcknowledge, acknowledging, formatDate }) {
  const isCritical = alert.alert_type === 'critical'

  return (
    <div style={{
      padding: '16px',
      background: isCritical ? 'var(--error-dim)' : 'rgba(239, 68, 68, 0.05)',
      border: `1px solid ${isCritical ? 'var(--error)' : 'rgba(239, 68, 68, 0.3)'}`,
      borderRadius: '12px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>
            {isCritical ? '🚨' : '⚠️'}
          </span>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: isCritical ? 'var(--error)' : 'var(--text)',
              marginBottom: '4px',
            }}>
              {isCritical ? 'Alerte critique' : 'Avertissement'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              {formatDate(alert.created_at)}
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          background: isCritical ? 'var(--error)' : 'rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          fontSize: '11px',
          color: 'white',
          fontWeight: '600',
        }}>
          {alert.days_inactive} jours
        </div>
      </div>

      <p style={{
        fontSize: '14px',
        color: 'var(--text)',
        lineHeight: '1.6',
        marginBottom: '16px',
      }}>
        {alert.message}
      </p>

      <button
        onClick={onAcknowledge}
        disabled={acknowledging}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: isCritical ? 'var(--error)' : 'var(--text-2)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          opacity: acknowledging ? 0.5 : 1,
        }}
      >
        {acknowledging ? 'Reconnaissance...' : 'Reconnaître l\'alerte'}
      </button>
    </div>
  )
}
