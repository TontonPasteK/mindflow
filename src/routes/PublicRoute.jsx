import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function PublicRoute({ children }) {
  const { authUser, loading, isLoggingOut } = useAuth()

  if (loading || isLoggingOut) return <LoadingSpinner message="Chargement..." />
  if (authUser) return <Navigate to="/choice" replace />

  return children
}
