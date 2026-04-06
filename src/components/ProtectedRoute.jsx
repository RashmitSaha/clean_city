import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Wraps a route and redirects to /login if unauthenticated,
 * or to /unauthorized if the user's role isn't in the allowed list.
 *
 * Usage:
 *   <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminPortal /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
