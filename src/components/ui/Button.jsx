const variants = {
  primary: {
    background: 'var(--accent)',
    color: '#080D0A',
    border: 'none',
    fontWeight: '600',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    fontWeight: '500',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-2)',
    border: 'none',
    fontWeight: '500',
  },
  danger: {
    background: 'var(--error-dim)',
    color: 'var(--error)',
    border: '1px solid rgba(224,82,82,0.25)',
    fontWeight: '500',
  },
}

const sizes = {
  sm: { padding: '8px 16px', fontSize: '13px', borderRadius: '8px' },
  md: { padding: '12px 24px', fontSize: '15px', borderRadius: '12px' },
  lg: { padding: '16px 32px', fontSize: '16px', borderRadius: '14px' },
  xl: { padding: '18px 40px', fontSize: '17px', borderRadius: '16px' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style = {},
}) {
  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.md

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.18s ease',
    fontFamily: 'var(--f-body)',
    letterSpacing: '0.01em',
    ...v,
    ...s,
    ...style,
  }

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      style={baseStyle}
      onMouseEnter={e => {
        if (disabled || loading) return
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--accent-h)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        } else if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'var(--border-h)'
          e.currentTarget.style.background = 'var(--accent-dim)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.background
        e.currentTarget.style.transform = 'translateY(0)'
        if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {loading ? (
        <span style={{
          width: '16px', height: '16px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
        }} />
      ) : null}
      {children}
    </button>
  )
}
