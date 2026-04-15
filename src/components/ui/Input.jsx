import { useState } from 'react'

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  autoComplete,
  autoFocus,
  disabled,
  style = {},
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label style={{
          fontSize: '13px',
          fontWeight: '500',
          color: error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--text-2)',
          transition: 'color 0.15s',
          letterSpacing: '0.02em',
        }}>
          {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          color: 'var(--text)',
          padding: '13px 16px',
          fontSize: '15px',
          width: '100%',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px var(--accent-dim)` : 'none',
        }}
      />

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--error)', margin: 0 }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>{hint}</p>
      )}
    </div>
  )
}
