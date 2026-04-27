import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { useDarkMode } from './hooks/useDarkMode'
import { useAutoLogout } from './hooks/useAutoLogout'
import AppRoutes from './routes'

function AutoLogoutWarning({ showWarning, timeUntilLogout, stayLoggedIn }) {
  if (!showWarning) return null

  const minutes = Math.floor(timeUntilLogout / 60)
  const seconds = timeUntilLogout % 60

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      left: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '2px solid var(--error)',
      borderRadius: '12px',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'fade-in 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--error)' }}>
            Déconnexion automatique
          </div>
          <div style={{ color: 'var(--text-2)', marginBottom: '12px', fontSize: '14px' }}>
            Tu n'as pas été actif depuis un moment. Déconnexion dans{' '}
            <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong>
          </div>
          <button
            onClick={stayLoggedIn}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#080D0A',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Rester connecté
          </button>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { isDarkMode, autoDarkMode } = useDarkMode()
  const { timeUntilLogout, showWarning, stayLoggedIn } = useAutoLogout()

  return (
    <>
      <AppRoutes />
      <AutoLogoutWarning
        showWarning={showWarning}
        timeUntilLogout={timeUntilLogout}
        stayLoggedIn={stayLoggedIn}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </AuthProvider>
  )
}
