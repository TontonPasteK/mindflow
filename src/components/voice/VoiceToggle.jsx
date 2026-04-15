export default function VoiceToggle({ voiceMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={voiceMode ? 'Passer en mode texte' : 'Passer en mode voix'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        borderRadius: '20px',
        background: voiceMode ? 'var(--accent-dim2)' : 'var(--bg-card)',
        border: `1px solid ${voiceMode ? 'var(--border-h)' : 'var(--border)'}`,
        color: voiceMode ? 'var(--accent)' : 'var(--text-2)',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {voiceMode ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          Voix
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Texte
        </>
      )}
    </button>
  )
}
