export default function StatsCard({ sessions }) {
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duree_minutes || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMin = totalMinutes % 60

  const allMatieres = [...new Set(
    sessions.flatMap(s => s.matieres || [])
  )]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    }}>
      <StatItem
        icon="📚"
        value={sessions.length}
        label="Sessions cette semaine"
      />
      <StatItem
        icon="⏱"
        value={totalHours > 0 ? `${totalHours}h${String(remainingMin).padStart(2,'0')}` : `${totalMinutes}min`}
        label="Temps total de travail"
      />
      <StatItem
        icon="🎯"
        value={allMatieres.length || '—'}
        label={allMatieres.length > 0 ? allMatieres.slice(0,2).join(', ') : 'Matières travaillées'}
      />
    </div>
  )
}

function StatItem({ icon, value, label }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '20px 16px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <span style={{
        fontSize: '26px',
        fontWeight: '800',
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
