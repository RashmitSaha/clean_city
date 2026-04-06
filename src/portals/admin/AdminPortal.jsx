import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, Map, BarChart2 } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import ReportsManager from './ReportsManager.jsx'
import UsersManager from './UsersManager.jsx'
import ZoneManager from './ZoneManager.jsx'
import Analytics from './Analytics.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Reports',    href: '/admin/reports',   icon: ClipboardList   },
  { label: 'Users',      href: '/admin/users',     icon: Users           },
  { label: 'Zones',      href: '/admin/zones',     icon: Map             },
  { label: 'Analytics',  href: '/admin/analytics', icon: BarChart2       },
]

export default function AdminPortal() {
  const { user } = useAuth()
  const portalUser = {
    name:           user?.full_name ?? '',
    email:          user?.email     ?? '',
    avatarInitials: (user?.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  }
  return (
    <PortalLayout navItems={NAV} role="admin" user={portalUser}>
      <Routes>
        <Route index            element={<AdminDashboard />} />
        <Route path="reports"   element={<ReportsManager />} />
        <Route path="users"     element={<UsersManager />} />
        <Route path="zones"     element={<ZoneManager />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*"         element={<Navigate to="/admin" replace />} />
      </Routes>
    </PortalLayout>
  )
}
