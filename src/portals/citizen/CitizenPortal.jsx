import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus, ClipboardList, Calendar, Bell } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout.jsx'
import CitizenDashboard from './CitizenDashboard.jsx'
import NewReport from './NewReport.jsx'
import MyReports from './MyReports.jsx'
import CitizenSchedule from './CitizenSchedule.jsx'
import CitizenNotifications from './CitizenNotifications.jsx'

const NAV = [
  { label: 'Dashboard',         href: '/citizen',              icon: LayoutDashboard },
  { label: 'Submit Report',     href: '/citizen/report/new',   icon: FilePlus        },
  { label: 'My Reports',        href: '/citizen/reports',      icon: ClipboardList   },
  { label: 'Collection Schedule', href: '/citizen/schedule',   icon: Calendar        },
  { label: 'Notifications',     href: '/citizen/notifications',icon: Bell            },
]

// TODO: replace with real user from AuthContext
const PLACEHOLDER_USER = { name: '', email: '', avatarInitials: '?' }

export default function CitizenPortal() {
  return (
    <PortalLayout navItems={NAV} role="citizen" user={PLACEHOLDER_USER}>
      <Routes>
        <Route index element={<CitizenDashboard />} />
        <Route path="report/new" element={<NewReport />} />
        <Route path="reports" element={<MyReports />} />
        <Route path="schedule" element={<CitizenSchedule />} />
        <Route path="notifications" element={<CitizenNotifications />} />
        <Route path="*" element={<Navigate to="/citizen" replace />} />
      </Routes>
    </PortalLayout>
  )
}
