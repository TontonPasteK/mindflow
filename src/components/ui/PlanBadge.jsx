export default function PlanBadge({ plan }) {
  const isPremium = plan === 'premium'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: isPremium ? 'var(--accent-dim2)' : 'rgba(223,240,232,0.07)',
      color: isPremium ? 'var(--accent)' : 'var(--text-3)',
      border: `1px solid ${isPremium ? 'var(--border-h)' : 'var(--border)'}`,
    }}>
      {isPremium ? '★ Premium' : 'Gratuit'}
    </span>
  )
}
