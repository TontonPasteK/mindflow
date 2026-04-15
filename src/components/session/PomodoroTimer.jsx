import { usePomodoro } from '../../hooks/usePomodoro'

export default function PomodoroTimer() {
  const { phase, display, progress, isRunning, cycles, toggle, reset } = usePomodoro()

  const circumference = 2 * Math.PI * 20
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
    }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="20" fill="none" stroke="var(--border)" strokeWidth="2" />
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke={phase === 'work' ? 'var(--accent)' : '#E07D3A'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '700',
          color: phase === 'work' ? 'var(--accent)' : '#E07D3A',
          fontFamily: 'var(--f-title)',
        }}>
          {phase === 'work' ? '⚡' : '☕'}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          fontFamily: 'var(--f-title)',
          color: 'var(--text)',
          lineHeight: 1,
        }}>{display}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
          {phase === 'work' ? 'Focus' : 'Pause'} · {cycles} cycle{cycles > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={toggle}
          style={{
            width: '30px', height: '30px',
            borderRadius: '8px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
        <button
          onClick={reset}
          style={{
            width: '30px', height: '30px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >↺</button>
      </div>
    </div>
  )
}
