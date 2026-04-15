import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
