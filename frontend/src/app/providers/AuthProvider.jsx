import { useMemo, useState } from 'react'
import AuthContext from './auth-context'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  const loginAs = (role) => {
    const safeRole = role === 'admin' ? 'admin' : 'technician'
    setCurrentUser({ role: safeRole, name: safeRole === 'admin' ? 'Administrador' : 'Carlos Rojas' })
  }

  const logout = () => setCurrentUser(null)

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      loginAs,
      logout,
    }),
    [currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
