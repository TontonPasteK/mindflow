import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AppNav from '../components/layout/AppNav'

export default function ProtectedRoute({ children }) {
  const { authUser, loading } = useAuth()

  if (loading) return <LoadingSpinner message="Chargement..." />
  if (!authUser) return <Navigate to="/" replace />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppNav />
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
