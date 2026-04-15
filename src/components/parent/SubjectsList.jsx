export default function SubjectsList({ sessions }) {
  const subjectMap = {}

  sessions.forEach(s => {
    const matieres = s.matieres || []
    matieres.forEach(m => {
      if (!subjectMap[m]) subjectMap[m] = { count: 0, minutes: 0 }
      subjectMap[m].count++
      subjectMap[m].minutes += (s.duree_minutes || 0)
    })
  })

  const entries = Object.entries(subjectMap).sort((a, b) => b[1].minutes - a[1].minutes)

  if (entries.length === 0) {
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
        Aucune matière travaillée cette semaine
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
        Matières travaillées
      </h4>
      {entries.map(([matiere, stats]) => (
        <div key={matiere} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ flex: 1, fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
            {matiere}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {stats.count} session{stats.count > 1 ? 's' : ''}
          </span>
          <span style={{
            fontSize: '12px',
            color: 'var(--accent)',
            background: 'var(--accent-dim)',
            padding: '3px 10px',
            borderRadius: '20px',
            fontWeight: '600',
          }}>
            {stats.minutes}min
          </span>
        </div>
      ))}
    </div>
  )
}
