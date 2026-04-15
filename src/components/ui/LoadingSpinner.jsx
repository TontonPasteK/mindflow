export default function LoadingSpinner({ size = 40, message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '16px', padding: '40px',
    }}>
      <div style={{
        width: size, height: size,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      {message && (
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{message}</p>
      )}
    </div>
  )
}
