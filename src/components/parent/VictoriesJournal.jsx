export default function VictoriesJournal({ victories }) {
  if (!victories || victories.length === 0) {
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
        Aucune victoire enregistrée pour l'instant
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
        Journal de victoires
      </h4>

      {victories.map((v, i) => (
        <div
          key={v.id}
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
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', color: 'var(--text)', margin: '0 0 4px', lineHeight: '1.5' }}>
              {v.texte}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
              {new Date(v.date).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
