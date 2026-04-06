import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, Clock, Users, Truck, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { PageHeader, StatCard, Card, Skeleton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AdminDashboard() {
  const { apiFetch } = useAuth()
  const [kpis,     setKpis]    = useState(null)
  const [recent,   setRecent]  = useState(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyticsRes, reportsRes] = await Promise.all([
        apiFetch('/api/admin/analytics?period=30d'),
        apiFetch('/api/admin/reports?limit=6&page=1'),
      ])
      if (!analyticsRes.ok) throw new Error('Failed to load analytics')
      if (!reportsRes.ok)   throw new Error('Failed to load reports')
      const analytics = await analyticsRes.json()
      const reports   = await reportsRes.json()
      setKpis({
        totalReports:        analytics.summary.total_reports,
        resolved:            analytics.summary.resolved,
        avgResolutionHours:  analytics.summary.avg_resolution_hours,
        resolutionRate:      analytics.summary.resolution_rate,
      })
      setRecent(reports.data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 flex flex-col gap-7 max-w-7xl">
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide overview — last 30 days" />

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : <>
              <StatCard label="Reports (30d)"     value={kpis?.totalReports}       icon={ClipboardList} accent="forest" />
              <StatCard label="Resolved"           value={kpis?.resolved}           icon={CheckCircle}   accent="forest" />
              <StatCard label="Avg. Resolution"    value={kpis?.avgResolutionHours != null ? `${kpis.avgResolutionHours}h` : '—'} icon={Clock} accent="sand" />
              <StatCard label="Resolution Rate"    value={kpis?.resolutionRate != null ? `${kpis.resolutionRate}%` : '—'} icon={TrendingUp} accent="forest" />
            </>
        }
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40 flex items-center justify-between">
          <h2 className="font-display font-600 text-sand-200">Recent Reports</h2>
          <Link to="/admin/reports" className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors">Manage all →</Link>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !recent || recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-body text-sand-600">No reports yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-forest-800/30">
            {recent.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-forest-800/20 transition-colors">
                <span className="font-mono text-xs text-sand-600 w-10 shrink-0">#{r.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-sand-300 truncate">{r.category}</p>
                  <p className="text-xs font-mono text-sand-600 truncate">{r.address}</p>
                </div>
                <StatusBadge status={r.priority} />
                <StatusBadge status={r.status} />
                <span className="font-mono text-xs text-sand-700 shrink-0">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
