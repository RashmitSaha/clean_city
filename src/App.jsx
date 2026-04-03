import { Routes, Route } from 'react-router-dom'
import LandingPage     from './pages/LandingPage.jsx'
import LoginPage       from './pages/LoginPage.jsx'
import SignupPage      from './pages/SignupPage.jsx'
import CitizenPortal   from './portals/citizen/CitizenPortal.jsx'
import CollectorPortal from './portals/collector/CollectorPortal.jsx'
import AdminPortal     from './portals/admin/AdminPortal.jsx'

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/"       element={<LandingPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Portals ────────────────────────────────────────────────────────── */}
      {/*
        TODO: Wrap each with <ProtectedRoute role="..."> once AuthContext is wired.
        ProtectedRoute should check the session and redirect to /login if
        unauthenticated, or /unauthorized if the role doesn't match.
      */}
      <Route path="/citizen/*"   element={<CitizenPortal />} />
      <Route path="/collector/*" element={<CollectorPortal />} />
      <Route path="/admin/*"     element={<AdminPortal />} />
    </Routes>
  )
}
