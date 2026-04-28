import { useState, useRef, useEffect } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathEditor({ value, onChange, placeholder = 'Écris une équation...' }) {
  const [latex, setLatex] = useState(value || '')
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    setLatex(value || '')
  }, [value])

  useEffect(() => {
    if (latex) {
      try {
        const rendered = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
        })
        setPreview(rendered)
      } catch (error) {
        setPreview('Erreur de syntaxe LaTeX')
      }
    } else {
      setPreview('')
    }
  }, [latex])

  const handleChange = (e) => {
    const newValue = e.target.value
    setLatex(newValue)
    onChange?.(newValue)
  }

  const insertSymbol = (symbol) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = latex
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    const newText = before + symbol + after
    setLatex(newText)
    onChange?.(newText)

    // Restaurer le focus et positionner le curseur
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + symbol.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const commonSymbols = [
    { label: 'x²', value: 'x^2' },
    { label: '√', value: '\\sqrt{}' },
    { label: 'π', value: '\\pi' },
    { label: '∑', value: '\\sum' },
    { label: '∫', value: '\\int' },
    { label: '∞', value: '\\infty' },
    { label: 'α', value: '\\alpha' },
    { label: 'β', value: '\\beta' },
    { label: 'θ', value: '\\theta' },
    { label: '≠', value: '\\neq' },
    { label: '≤', value: '\\leq' },
    { label: '≥', value: '\\geq' },
    { label: '→', value: '\\rightarrow' },
    { label: '±', value: '\\pm' },
    { label: '÷', value: '\\div' },
    { label: '×', value: '\\times' },
  ]

  const fractions = [
    { label: 'Fraction', value: '\\frac{}{}' },
    { label: 'Puissance', value: '^{}' },
    { label: 'Indice', value: '_{}' },
  ]

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      {/* Barre d'outils */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {commonSymbols.map((symbol, i) => (
            <button
              key={i}
              onClick={() => insertSymbol(symbol.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.background = 'rgba(29,158,117,0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.background = 'var(--bg-card)'
              }}
            >
              {symbol.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {fractions.map((symbol, i) => (
            <button
              key={i}
              onClick={() => insertSymbol(symbol.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#080D0A',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone de saisie */}
      <div style={{ padding: '12px' }}>
        <textarea
          ref={textareaRef}
          value={latex}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: 'var(--text)',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Aperçu */}
      {showPreview && preview && (
        <div style={{
          padding: '16px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px' }}>
            Aperçu :
          </div>
          <div
            style={{
              fontSize: '18px',
              color: 'var(--text)',
              textAlign: 'center',
              padding: '12px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
            }}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      )}

      {/* Bouton toggle aperçu */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: '8px 16px',
            background: showPreview ? 'var(--accent)' : 'var(--bg-card)',
            border: showPreview ? 'none' : '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            color: showPreview ? '#080D0A' : 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {showPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
        </button>
      </div>
    </div>
  )
}
