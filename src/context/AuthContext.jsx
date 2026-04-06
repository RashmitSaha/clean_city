import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_user') ?? 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function saveSession(userData, token) {
    localStorage.setItem('cc_token', token)
    localStorage.setItem('cc_user',  JSON.stringify(userData))
    setUser(userData)
  }

  function clearSession() {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Login failed')
      }
      const { access_token, user: userData } = await res.json()
      saveSession(userData, access_token)
      return userData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Signup failed')
      }
      const { access_token, user: userData } = await res.json()
      saveSession(userData, access_token)
      return userData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => { clearSession() }, [])

  const apiFetch = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('cc_token')
    const isFormData = options.body instanceof FormData
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    if (res.status === 401) { clearSession(); throw new Error('Session expired') }
    return res
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
