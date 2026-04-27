import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { useDarkMode } from './hooks/useDarkMode'
import AppRoutes from './routes'

function AppContent() {
  const { isDarkMode, autoDarkMode } = useDarkMode()

  return <AppRoutes />
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
