import { useState, useRef, useEffect } from 'react'
import MathEditor from '../math/MathEditor'

export default function InputArea({ onSend, disabled, placeholder = 'Écris ta réponse...' }) {
  const [value, setValue] = useState('')
  const [showMathEditor, setShowMathEditor] = useState(false)
  const [mathEquation, setMathEquation] = useState('')
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

  const handleInsertMath = () => {
    if (!mathEquation) return

    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    // Insérer l'équation avec la syntaxe LaTeX
    const newText = before + `$$${mathEquation}$$` + after
    setValue(newText)

    // Fermer l'éditeur et réinitialiser
    setShowMathEditor(false)
    setMathEquation('')

    // Restaurer le focus et positionner le curseur
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + mathEquation.length + 4 // +4 pour $$
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '12px 16px',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Éditeur mathématique */}
      {showMathEditor && (
        <div style={{
          animation: 'fade-in 0.2s ease',
        }}>
          <MathEditor
            value={mathEquation}
            onChange={setMathEquation}
            placeholder="Écris une équation mathématique..."
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleInsertMath}
              disabled={!mathEquation}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: mathEquation ? 'var(--accent)' : 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: mathEquation ? '#080D0A' : 'var(--text-3)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: mathEquation ? 'pointer' : 'not-allowed',
              }}
            >
              Insérer l'équation
            </button>
            <button
              onClick={() => {
                setShowMathEditor(false)
                setMathEquation('')
              }}
              style={{
                padding: '10px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Zone de saisie principale */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
      }}>
        <button
          onClick={() => setShowMathEditor(!showMathEditor)}
          disabled={disabled}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: showMathEditor ? 'var(--accent)' : 'var(--bg-input)',
            border: '1px solid var(--border)',
            color: showMathEditor ? '#080D0A' : 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
            fontSize: '20px',
          }}
          title="Éditeur d'équations"
        >
          ∑
        </button>

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
    </div>
  )
}
