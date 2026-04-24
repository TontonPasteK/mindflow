import { useState, useRef, useEffect } from 'react'

export default function InputArea({ onSend, disabled, placeholder = 'Écris ta réponse...' }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // Focus automatique dès que disabled passe à false (Dr Mind a fini de répondre)
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '10px',
      padding: '12px 16px',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--text)',
          padding: '12px 16px',
          fontSize: '15px',
          resize: 'none',
          outline: 'none',
          lineHeight: '1.5',
          minHeight: '46px',
          maxHeight: '120px',
          transition: 'border-color 0.15s',
          fontFamily: 'var(--f-body)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        style={{
          width: '46px', height: '46px',
          borderRadius: '12px',
          background: value.trim() && !disabled ? 'var(--accent)' : 'var(--bg-input)',
          border: '1px solid var(--border)',
          color: value.trim() && !disabled ? '#080D0A' : 'var(--text-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
