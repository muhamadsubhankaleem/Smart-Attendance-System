import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)

  const setAuth = useCallback((tokenData) => {
    const { access_token, refresh_token, user: u } = tokenData
    window.__accessToken = access_token
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    window.__accessToken = null
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  // Restore session from refresh token on mount
  useEffect(() => {
    const init = async () => {
      const rt = localStorage.getItem('refresh_token')
      if (!rt) { setLoading(false); return }
      try {
        const data = await authApi.refresh(rt)
        setAuth(data)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [setAuth, logout])

  return (
    <AuthContext.Provider value={{ user, setAuth, logout, loading, isAdmin: user?.role === 'admin', isStudent: user?.role === 'student' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
