import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus, ClipboardList, Calendar, Bell } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout.jsx'
import CitizenDashboard from './CitizenDashboard.jsx'
import NewReport from './NewReport.jsx'
import MyReports from './MyReports.jsx'
import CitizenSchedule from './CitizenSchedule.jsx'
import CitizenNotifications from './CitizenNotifications.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { label: 'Dashboard',           href: '/citizen',               icon: LayoutDashboard },
  { label: 'Submit Report',       href: '/citizen/report/new',    icon: FilePlus        },
  { label: 'My Reports',          href: '/citizen/reports',       icon: ClipboardList   },
  { label: 'Collection Schedule', href: '/citizen/schedule',      icon: Calendar        },
  { label: 'Notifications',       href: '/citizen/notifications', icon: Bell            },
]

export default function CitizenPortal() {
  const { user } = useAuth()
  const portalUser = {
    name:           user?.full_name ?? '',
    email:          user?.email     ?? '',
    avatarInitials: (user?.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  }
  return (
    <PortalLayout navItems={NAV} role="citizen" user={portalUser}>
      <Routes>
        <Route index                   element={<CitizenDashboard />} />
        <Route path="report/new"       element={<NewReport />} />
        <Route path="reports"          element={<MyReports />} />
        <Route path="schedule"         element={<CitizenSchedule />} />
        <Route path="notifications"    element={<CitizenNotifications />} />
        <Route path="*"                element={<Navigate to="/citizen" replace />} />
      </Routes>
    </PortalLayout>
  )
}
