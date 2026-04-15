export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '4px 18px 18px 18px',
      width: 'fit-content',
      animation: 'fade-in 0.2s ease',
    }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: `wave-bar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}
