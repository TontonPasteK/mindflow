export default function VoiceButton({ isListening, isSpeaking, onClick, disabled }) {
  const isActive = isListening || isSpeaking

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Pulse ring when listening */}
      {isListening && !isSpeaking && (
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          border: '2px solid var(--accent)',
          animation: 'pulse-ring 1s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '52px', height: '52px',
          borderRadius: '50%',
          background: isActive ? 'var(--accent)' : 'var(--bg-card)',
          border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
          color: isActive ? '#080D0A' : 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: disabled ? 0.4 : 1,
          flexShrink: 0,
        }}
        title={isSpeaking ? 'Couper Maya' : isListening ? 'Arrêter' : 'Parler à Maya'}
      >
        {isSpeaking ? (
          // Pause icon — stops Maya
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="4" height="16" rx="1"/>
            <rect x="15" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : isListening ? (
          // Stop icon — stops mic
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Mic icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>
    </div>
  )
}
