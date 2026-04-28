import { useState, useEffect, useRef } from 'react'
import StrategyCard from './StrategyCard'
import MathRenderer from '../math/MathRenderer'

const MS_PER_WORD = 400

// Fonction helper pour détecter et extraire les équations LaTeX
function parseLatex(text) {
  if (!text) return []

  const parts = []
  let lastIndex = 0
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Ajouter le texte avant l'équation
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index)
      if (plainText) {
        parts.push({ type: 'text', content: plainText })
      }
    }

    // Ajouter l'équation
    const latex = match[1] || match[2]
    const isDisplayMode = !!match[1] // $$...$$ est display mode
    parts.push({ type: 'latex', content: latex, displayMode })

    lastIndex = regex.lastIndex
  }

  // Ajouter le texte restant
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex)
    if (plainText) {
      parts.push({ type: 'text', content: plainText })
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

export default function MessageBubble({ role, content, strategies, fileAttachment, isSpeaking, isLatestAssistant, ttsEnabled, avatarName = 'Dr Mind' }) {
  const isMax = role === 'assistant'

  const shouldAnimate = isMax && isLatestAssistant && ttsEnabled

  const [visibleCount, setVisibleCount] = useState(
    shouldAnimate ? 0 : Infinity
  )
  const animRef    = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isMax || !isSpeaking || !shouldAnimate || startedRef.current) return
    startedRef.current = true

    const words = content.split(' ')
    let count = 0
    setVisibleCount(0)

    animRef.current = setInterval(() => {
      count++
      setVisibleCount(count)
      if (count >= words.length) {
        clearInterval(animRef.current)
        animRef.current = null
      }
    }, MS_PER_WORD)

    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [isSpeaking]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSpeaking && startedRef.current) {
      if (animRef.current) {
        clearInterval(animRef.current)
        animRef.current = null
      }
      setVisibleCount(Infinity)
    }
  }, [isSpeaking])

  useEffect(() => {
    if (!shouldAnimate) return
    const fallback = setTimeout(() => {
      if (!startedRef.current) setVisibleCount(Infinity)
    }, 3000)
    return () => clearTimeout(fallback)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const words       = content ? content.split(' ') : []
  const displayText = isMax && visibleCount < words.length
    ? words.slice(0, visibleCount).join(' ')
    : content

  // Parser le contenu pour détecter les équations LaTeX
  const parsedContent = parseLatex(displayText)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMax ? 'flex-start' : 'flex-end',
      gap: '8px',
      animation: isMax ? 'slide-in-left 0.3s ease both' : 'slide-in-right 0.3s ease both',
    }}>
      {isMax && (
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          color: 'var(--accent)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          paddingLeft: '4px',
        }}>{avatarName}</span>
      )}

      <div style={{
        maxWidth: '85%',
        padding: isMax ? '14px 18px' : '12px 18px',
        borderRadius: isMax ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
        background: isMax
          ? 'linear-gradient(135deg, var(--bg-card) 0%, #121E15 100%)'
          : 'var(--accent-dim)',
        border: `1px solid ${isMax ? 'var(--border)' : 'var(--border-h)'}`,
        color: 'var(--text)',
        fontSize: '15px',
        lineHeight: '1.65',
      }}>
        {fileAttachment && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '12px',
            color: 'var(--text-2)',
            marginBottom: content ? '10px' : '0',
          }}>
            {fileAttachment.mimeType === 'application/pdf' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
            {fileAttachment.mimeType === 'application/pdf'
              ? `PDF envoyé à ${avatarName}`
              : `Image envoyée à ${avatarName}`}
          </div>
        )}

        {displayText ? (
          <div>
            {parsedContent.map((part, i) => {
              if (part.type === 'latex') {
                return (
                  <MathRenderer
                    key={i}
                    latex={part.content}
                    displayMode={part.displayMode}
                  />
                )
              }
              return <span key={i}>{part.content}</span>
            })}
          </div>
        ) : isMax && visibleCount === 0 ? (
          <div style={{ color: 'var(--accent)', opacity: 0.6 }}>▌</div>
        ) : null}
      </div>

      {strategies && strategies.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          maxWidth: '85%',
        }}>
          {strategies.map((s, i) => (
            <StrategyCard key={i} icon={s.icon} titre={s.titre} desc={s.desc} />
          ))}
        </div>
      )}
    </div>
  )
}
