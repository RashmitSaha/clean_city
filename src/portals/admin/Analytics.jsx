import { useEffect, useState, useCallback } from 'react'
import { BarChart2, TrendingUp, AlertCircle, PieChart, Activity, Clock } from 'lucide-react'
import { PageHeader, Card, StatCard, Skeleton } from '../../components/PortalUI.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const PERIOD_OPTIONS = [
  { label: '7 days',  value: '7d'  },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year',  value: '1y'  },
]

function BarChartViz({ data, label }) {
  if (!data || data.length === 0) return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-xs font-mono text-sand-700">No data for this period</p>
    </div>
  )
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs font-mono text-sand-600 tabular-nums">{d.value}</span>
            <div className="w-full rounded-t-md bg-forest-600/60 border border-forest-500/30 transition-all duration-500"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center min-w-0">
            <span className="text-xs font-mono text-sand-700 truncate block">{d.label}</span>
          </div>
        ))}
      </div>
      {label && <p className="text-xs font-mono text-sand-600 text-center">{label}</p>}
    </div>
  )
}

function DonutChart({ segments }) {
  if (!segments || segments.length === 0) return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-xs font-mono text-sand-700">No data for this period</p>
    </div>
  )
  const total = segments.reduce((s, g) => s + g.value, 0) || 1
  let cumulative = 0
  const colors = ['#2d9e38','#aeae6a','#e8e8ce','#1e7e2a','#969654']
  const gradient = segments.map((seg, i) => {
    const start = (cumulative / total) * 360; cumulative += seg.value
    return `${colors[i % colors.length]} ${start}deg ${(cumulative / total) * 360}deg`
  }).join(', ')
  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32 rounded-full shrink-0"
        style={{ background: `conic-gradient(${gradient})`, WebkitMask: 'radial-gradient(circle, transparent 40%, black 41%)' }} />
      <div className="flex flex-col gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="text-xs font-body text-sand-400">{seg.label}</span>
            <span className="ml-auto text-xs font-mono text-sand-600 pl-4">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { apiFetch } = useAuth()
  const [period,  setPeriod]  = useState('30d')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData({
        summary:            json.summary,
        reportsOverTime:    json.reports_over_time,
        reportsByCategory:  json.reports_by_category,
        reportsByStatus:    json.reports_by_status,
        reportsByZone:      json.reports_by_zone,
        topCollectors:      json.top_collectors,
      })
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [apiFetch, period])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 flex flex-col gap-7 max-w-7xl">
      <PageHeader title="Analytics" subtitle="Platform performance metrics and trends">
        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={classNames('px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                period === opt.value ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                                     : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400')}>
              {opt.label}
            </button>
          ))}
        </div>
      </PageHeader>

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
              <StatCard label="Reports (period)" value={data?.summary?.total_reports}  icon={BarChart2}  accent="forest" />
              <StatCard label="Resolved"          value={data?.summary?.resolved}       icon={TrendingUp} accent="forest" />
              <StatCard label="Avg. Resolution"   value={data?.summary?.avg_resolution_hours != null ? `${data.summary.avg_resolution_hours}h` : '—'} icon={Clock} accent="sand" />
              <StatCard label="Resolution Rate"   value={data?.summary?.resolution_rate != null ? `${data.summary.resolution_rate}%` : '—'} icon={Activity} accent="forest" />
            </>
        }
      </div>

      <Card className="p-5">
        <h2 className="font-display font-600 text-sand-200 mb-5">Reports Over Time</h2>
        {loading ? <Skeleton className="h-52" /> : <BarChartViz data={data?.reportsOverTime} label="Reports submitted per period" />}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5"><h2 className="font-display font-600 text-sand-200">By Category</h2><PieChart size={15} className="text-sand-600" /></div>
          {loading ? <Skeleton className="h-40" /> : <DonutChart segments={data?.reportsByCategory} />}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5"><h2 className="font-display font-600 text-sand-200">By Status</h2><Activity size={15} className="text-sand-600" /></div>
          {loading ? <Skeleton className="h-40" /> : <DonutChart segments={data?.reportsByStatus} />}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5"><h2 className="font-display font-600 text-sand-200">Reports by Zone</h2><BarChart2 size={15} className="text-sand-600" /></div>
          {loading ? <Skeleton className="h-40" /> : <BarChartViz data={data?.reportsByZone} label="Reports per zone" />}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5"><h2 className="font-display font-600 text-sand-200">Top Collectors</h2><TrendingUp size={15} className="text-sand-600" /></div>
          {loading ? <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : !data?.topCollectors || data.topCollectors.length === 0
              ? <p className="text-xs font-mono text-sand-700 text-center py-8">No resolved tasks yet</p>
              : (
                <div className="flex flex-col divide-y divide-forest-800/30">
                  {data.topCollectors.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className="font-mono text-xs text-sand-700 w-5 text-right shrink-0">{i + 1}</span>
                      <span className="flex-1 font-body text-sm text-sand-300 truncate">{c.name}</span>
                      <span className="font-mono text-xs text-forest-400">{c.completed} jobs</span>
                      {c.avg_minutes && (
                        <span className="font-mono text-xs text-sand-600">
                          ~{c.avg_minutes < 60 ? `${c.avg_minutes}m` : `${Math.floor(c.avg_minutes / 60)}h`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )
          }
        </Card>
      </div>
    </div>
  )
}
