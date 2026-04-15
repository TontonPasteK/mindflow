import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import AppRoutes from './routes'

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </AuthProvider>
  )
}
