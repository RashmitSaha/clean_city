import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage     from './pages/LandingPage.jsx'
import LoginPage       from './pages/LoginPage.jsx'
import SignupPage      from './pages/SignupPage.jsx'
import CitizenPortal   from './portals/citizen/CitizenPortal.jsx'
import CollectorPortal from './portals/collector/CollectorPortal.jsx'
import AdminPortal     from './portals/admin/AdminPortal.jsx'
import ProtectedRoute  from './components/ProtectedRoute.jsx'

function Unauthorized() {
  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center text-sand-400 font-body">
      <div className="text-center">
        <p className="text-4xl font-display font-700 text-sand-200 mb-2">403</p>
        <p className="text-sand-500">You don't have permission to view this page.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<LandingPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/signup"      element={<SignupPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected portals */}
      <Route path="/citizen/*" element={
        <ProtectedRoute role="citizen"><CitizenPortal /></ProtectedRoute>
      } />
      <Route path="/collector/*" element={
        <ProtectedRoute role="collector"><CollectorPortal /></ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute role="admin"><AdminPortal /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
