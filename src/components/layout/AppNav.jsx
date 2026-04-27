import { supabase } from '../../services/supabase'

export default function AppNav() {
  const handleLogout = async () => {
    window.dispatchEvent(new Event('mindflow:logout'))
    localStorage.clear()
    sessionStorage.clear()
    try { await supabase.auth.signOut() } catch {}
    window.location.replace('https://evokia-lime.vercel.app')
  }

  return (
    <div style={{
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--f-title)',
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--accent)',
        letterSpacing: '-0.01em',
      }}>
        Evokia
      </span>

      <button
        onClick={handleLogout}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
          borderRadius: '8px',
          padding: '5px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--error)'
          e.currentTarget.style.borderColor = 'var(--error)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-3)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        Se déconnecter
      </button>
    </div>
  )
}
