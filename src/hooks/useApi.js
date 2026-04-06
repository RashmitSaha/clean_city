/**
 * useApi — thin wrapper around AuthContext.apiFetch
 *
 * const { data, loading, error, execute } = useApi('/api/reports')
 *
 * - Calls execute() to (re-)fetch.
 * - Automatically reads Bearer token from localStorage via apiFetch.
 * - Parses JSON response and surfaces error detail strings.
 */
import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export function useApi(path, { method = 'GET', immediate = false } = {}) {
  const { apiFetch } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (body = undefined, overridePath = path) => {
    setLoading(true)
    setError(null)
    try {
      const opts = { method }
      if (body !== undefined) {
        opts.body = body instanceof FormData ? body : JSON.stringify(body)
      }
      const res = await apiFetch(overridePath, opts)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.detail ?? `HTTP ${res.status}`)
      }
      setData(json)
      return json
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFetch, path, method])

  return { data, loading, error, execute, setData }
}
