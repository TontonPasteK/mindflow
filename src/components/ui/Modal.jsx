import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = '480px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8, 13, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fade-in 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '32px',
          width: '100%',
          maxWidth,
          animation: 'fade-up 0.25s ease',
          boxShadow: 'var(--glow)',
        }}
      >
        {title && (
          <h3 style={{
            fontFamily: 'var(--f-title)',
            fontSize: '20px',
            marginBottom: '20px',
            color: 'var(--text)',
          }}>{title}</h3>
        )}
        {children}
      </div>
    </div>
  )
}
