export default function SoundWaves({ active = false }) {
  const bars = [0.3, 0.6, 1, 0.8, 0.5, 0.9, 0.4, 0.7, 1, 0.6, 0.3]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      height: '28px',
      opacity: active ? 1 : 0.25,
      transition: 'opacity 0.3s',
    }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: active ? `${h * 24}px` : '4px',
            borderRadius: '2px',
            background: 'var(--accent)',
            transformOrigin: 'center',
            transition: active ? 'none' : 'height 0.3s',
            animation: active
              ? `wave-bar ${0.4 + i * 0.07}s ease-in-out ${i * 0.05}s infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}
