import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, CheckCircle, Clock, Users, Truck,
  AlertTriangle, TrendingUp, Activity, AlertCircle
} from 'lucide-react'
import { PageHeader, StatCard, Card, Skeleton, EmptyState } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function AdminDashboard() {
  const [kpis,     setKpis]    = useState(null)
  const [activity, setActivity]= useState(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: replace with real API
        // const [kpiRes, actRes] = await Promise.all([
        //   fetch('/api/admin/dashboard/kpis', { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch('/api/admin/dashboard/activity?limit=8', { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // if (!kpiRes.ok || !actRes.ok) throw new Error('Failed to load dashboard')
        // setKpis(await kpiRes.json())
        //   // { totalReports, openReports, resolvedToday, avgResolutionHours,
        //   //   totalCitizens, totalCollectors, criticalPending, resolutionRate }
        // setActivity((await actRes.json()).events)
        //   // [{ id, type, description, timestamp, severity }]
        throw new Error('Dashboard API not connected — wire up /api/admin/dashboard/kpis')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const SEVERITY_STYLES = {
    info:    'text-blue-400',
    success: 'text-forest-400',
    warning: 'text-yellow-400',
    error:   'text-red-400',
  }

  return (
    <div className="p-6 flex flex-col gap-7 max-w-7xl">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform-wide overview — live data"
      />

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Total Reports"     value={kpis?.totalReports}     icon={ClipboardList}  accent="forest" />
            <StatCard label="Open Reports"      value={kpis?.openReports}      icon={Clock}          accent="yellow" />
            <StatCard label="Resolved Today"    value={kpis?.resolvedToday}    icon={CheckCircle}    accent="forest" />
            <StatCard label="Avg. Resolution"   value={kpis?.avgResolutionHours != null ? `${kpis.avgResolutionHours}h` : null} icon={TrendingUp} accent="sand" />
            <StatCard label="Citizens"          value={kpis?.totalCitizens}    icon={Users}          accent="forest" />
            <StatCard label="Collectors"        value={kpis?.totalCollectors}  icon={Truck}          accent="sand"   />
            <StatCard label="Critical Pending"  value={kpis?.criticalPending}  icon={AlertTriangle}  accent="red"    />
            <StatCard label="Resolution Rate"   value={kpis?.resolutionRate != null ? `${kpis.resolutionRate}%` : null} icon={Activity} accent="forest" />
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Activity feed */}
        <Card className="lg:col-span-3">
          <div className="px-5 py-4 border-b border-forest-800/40">
            <h2 className="font-display font-600 text-sand-200">Live Activity</h2>
          </div>

          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !activity || activity.length === 0 ? (
            <EmptyState icon={Activity} title="No recent activity" body="Platform events will stream here." />
          ) : (
            <div className="divide-y divide-forest-800/30">
              {activity.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`shrink-0 mt-0.5 ${SEVERITY_STYLES[ev.severity] ?? 'text-sand-500'}`}>
                    <Activity size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-sand-300 leading-snug">{ev.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-sand-700 whitespace-nowrap">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick links */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="font-display font-600 text-sand-200 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Assign pending reports',  href: '/admin/reports?filter=pending',  icon: ClipboardList, accent: 'text-yellow-400' },
              { label: 'View critical issues',    href: '/admin/reports?filter=critical', icon: AlertTriangle, accent: 'text-red-400'    },
              { label: 'Manage collectors',       href: '/admin/users?role=collector',    icon: Truck,         accent: 'text-sand-400'   },
              { label: 'Zone configuration',      href: '/admin/zones',                   icon: Users,         accent: 'text-forest-400' },
              { label: 'View analytics',          href: '/admin/analytics',               icon: TrendingUp,    accent: 'text-blue-400'   },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-forest-800/40 border border-transparent hover:border-forest-700/40 transition-all group"
              >
                <item.icon size={15} className={`${item.accent} shrink-0`} />
                <span className="text-sm font-body text-sand-400 group-hover:text-sand-200 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
