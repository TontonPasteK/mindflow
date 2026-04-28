import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathRenderer({ latex, displayMode = true, style = {} }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !latex) return

    try {
      katex.render(latex, containerRef.current, {
        throwOnError: false,
        displayMode,
      })
    } catch (error) {
      containerRef.current.textContent = latex
    }
  }, [latex, displayMode])

  if (!latex) return null

  return (
    <span
      ref={containerRef}
      style={{
        display: displayMode ? 'block' : 'inline',
        textAlign: 'center',
        padding: displayMode ? '12px' : '0',
        margin: displayMode ? '8px 0' : '0',
        ...style,
      }}
    />
  )
}
