/**
 * useSocket — connects to the Node.js realtime service with JWT auth.
 *
 * const { socket, connected } = useSocket()
 *
 * The socket is memoised for the lifetime of the AuthProvider —
 * it disconnects automatically when the user logs out (token removed).
 *
 * Usage in a component:
 *   const { socket } = useSocket()
 *   useEffect(() => {
 *     if (!socket) return
 *     socket.on('report:status_changed', handleUpdate)
 *     return () => socket.off('report:status_changed', handleUpdate)
 *   }, [socket])
 */
import { useEffect, useState, useRef } from 'react'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'http://localhost:4000'

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    if (!token) return

    // Dynamically import socket.io-client so it doesn't bloat the initial bundle
    let socket
    import('socket.io-client').then(({ io }) => {
      socket = io(REALTIME_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socket.on('connect',    () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))
      socket.on('connect_error', (err) => {
        console.warn('[socket] connect error:', err.message)
      })

      socketRef.current = socket
    })

    return () => {
      socket?.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [])   // reconnects if token changes on login/logout via page reload

  return { socket: socketRef.current, connected }
}
