import { useMemo, useState, useEffect, useCallback } from 'react'
import AuthContext from './auth-context'
import { login as apiLogin, logout as apiLogout, getMe } from '../../shared/services/authService'
import { getToken } from '../../shared/services/api'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore session from token
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => apiLogout()) // Invalid token - clear it
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password)
    setCurrentUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setCurrentUser(null)
  }, [])

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated: Boolean(currentUser),
    loading,
    login,
    logout,
  }), [currentUser, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
