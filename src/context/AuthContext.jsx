import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Replace these with real API calls ──────────────────────────────────────

  async function login({ email, password }) {
    setLoading(true)
    setError(null)
    try {
      // TODO: replace with real endpoint
      // const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } })
      // if (!res.ok) throw new Error((await res.json()).message)
      // const data = await res.json()
      // setUser(data.user)
      throw new Error('Login API not connected yet.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function signup(payload) {
    setLoading(true)
    setError(null)
    try {
      // TODO: replace with real endpoint
      // const res = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      // if (!res.ok) throw new Error((await res.json()).message)
      // const data = await res.json()
      // setUser(data.user)
      throw new Error('Signup API not connected yet.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    // TODO: invalidate server session / token
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
