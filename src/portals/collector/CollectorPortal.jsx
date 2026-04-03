import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, Map, CalendarDays, History } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout.jsx'
import CollectorDashboard from './CollectorDashboard.jsx'
import TaskList from './TaskList.jsx'
import TaskMap from './TaskMap.jsx'
import CollectorSchedule from './CollectorSchedule.jsx'
import JobHistory from './JobHistory.jsx'

const NAV = [
  { label: 'Dashboard',    href: '/collector',          icon: LayoutDashboard },
  { label: 'My Tasks',     href: '/collector/tasks',    icon: ClipboardCheck  },
  { label: 'Map View',     href: '/collector/map',      icon: Map             },
  { label: 'My Schedule',  href: '/collector/schedule', icon: CalendarDays    },
  { label: 'Job History',  href: '/collector/history',  icon: History         },
]

// TODO: replace with real user from AuthContext
const PLACEHOLDER_USER = { name: '', email: '', avatarInitials: '?' }

export default function CollectorPortal() {
  return (
    <PortalLayout navItems={NAV} role="collector" user={PLACEHOLDER_USER}>
      <Routes>
        <Route index element={<CollectorDashboard />} />
        <Route path="tasks"    element={<TaskList />} />
        <Route path="map"      element={<TaskMap />} />
        <Route path="schedule" element={<CollectorSchedule />} />
        <Route path="history"  element={<JobHistory />} />
        <Route path="*"        element={<Navigate to="/collector" replace />} />
      </Routes>
    </PortalLayout>
  )
}
