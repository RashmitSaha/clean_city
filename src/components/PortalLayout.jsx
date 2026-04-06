import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Leaf, Bell, ChevronDown, Menu, X, LogOut } from 'lucide-react'
import { classNames } from '../utils/helpers.js'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * PortalLayout
 * Props:
 *   navItems   — [{ label, href, icon: LucideIcon, badge? }]
 *   role       — 'citizen' | 'collector' | 'admin'
 *   user       — { name, email, avatarInitials }
 *   children   — page content
 */
export default function PortalLayout({ navItems = [], role, user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unread,      setUnread]      = useState(false)
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  // Poll unread state for citizens — light check, no heavy payload
  useState(() => {
    if (role !== 'citizen') return
    apiFetch('/api/reports?limit=1&status=assigned')
      .then(r => r.json())
      .then(j => setUnread((j.total ?? 0) > 0))
      .catch(() => {})
  })

  const roleAccent = {
    citizen:   { pill: 'bg-forest-500/20 text-forest-300 border-forest-500/30', dot: 'bg-forest-400' },
    collector: { pill: 'bg-sand-500/20 text-sand-300 border-sand-500/30',       dot: 'bg-sand-400'   },
    admin:     { pill: 'bg-red-500/20 text-red-300 border-red-500/30',           dot: 'bg-red-400'    },
  }[role] ?? { pill: 'bg-forest-500/20 text-forest-300 border-forest-500/30', dot: 'bg-forest-400' }

  const roleLabel = { citizen: 'Citizen', collector: 'Collector', admin: 'Admin' }[role] ?? role

  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-forest-800/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-forest-500 flex items-center justify-center">
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-display font-700 text-base text-sand-100 tracking-tight">
            Clean<span className="text-forest-400">City</span>
          </span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-5 pb-3">
        <span className={classNames(
          'inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border tracking-widest uppercase',
          roleAccent.pill
        )}>
          <span className={classNames('w-1.5 h-1.5 rounded-full', roleAccent.dot)} />
          {roleLabel} Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => classNames(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-150 group',
                  isActive
                    ? 'bg-forest-700/50 text-sand-100 border border-forest-600/40'
                    : 'text-sand-500 hover:text-sand-200 hover:bg-forest-800/40'
                )}
              >
                <item.icon size={17} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span className="text-xs font-mono bg-forest-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-5 pt-3 border-t border-forest-800/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-sand-600 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={16} className="shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-forest-950 overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-forest-900/60 border-r border-forest-800/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 h-full bg-forest-900 border-r border-forest-800/50 animate-slide-right">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 h-14 px-6 flex items-center justify-between border-b border-forest-800/50 bg-forest-950/80 backdrop-blur-sm">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-sand-400 hover:text-sand-200 transition-colors mr-3"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page breadcrumb slot — filled by children via context or just empty here */}
          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-sand-500 hover:text-sand-200 hover:bg-forest-800/50 transition-all">
              <Bell size={17} />
              {unread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-forest-800/50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-xs font-mono font-500 text-forest-200">
                  {user?.avatarInitials ?? '?'}
                </div>
                <span className="hidden md:block text-sm font-body text-sand-300 max-w-[120px] truncate">
                  {user?.name ?? 'User'}
                </span>
                <ChevronDown size={14} className="text-sand-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-forest-900 border border-forest-700/60 rounded-xl shadow-xl py-1 z-30 animate-fade-in">
                  <div className="px-4 py-3 border-b border-forest-800/50">
                    <p className="text-xs font-display font-600 text-sand-200 truncate">{user?.name}</p>
                    <p className="text-xs font-mono text-sand-600 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); navigate(`/${role}/settings`) }}
                    className="w-full text-left px-4 py-2.5 text-sm font-body text-sand-400 hover:text-sand-200 hover:bg-forest-800/50 transition-colors"
                  >
                    Account settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-body text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
