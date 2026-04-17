import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const roleMap = { ADMIN: 'admin', TECNICO_CONTRATISTA: 'technician' }

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles) {
    const mappedRole = roleMap[currentUser.rol] ?? currentUser.rol
    if (!allowedRoles.includes(mappedRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

