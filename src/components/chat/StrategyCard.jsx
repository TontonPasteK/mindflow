export default function StrategyCard({ icon, titre, desc }) {
  return (
    <div style={{
      background: 'var(--accent-dim)',
      border: '1px solid var(--border-h)',
      borderRadius: '12px',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '160px',
      maxWidth: '220px',
      animation: 'fade-up 0.35s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{
          fontWeight: '600',
          fontSize: '13px',
          color: 'var(--accent)',
          fontFamily: 'var(--f-title)',
        }}>{titre}</span>
      </div>
      <p style={{
        fontSize: '12px',
        color: 'var(--text-2)',
        lineHeight: '1.5',
        margin: 0,
      }}>{desc}</p>
    </div>
  )
}
