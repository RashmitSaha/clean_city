import { useEffect, useState } from 'react'
import { History, Search, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState, StatCard } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'

const PERIOD_OPTIONS = [
  { label: 'Last 7 days',  value: '7d'  },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time',     value: 'all' },
]

export default function JobHistory() {
  const [jobs,    setJobs]    = useState(null)
  const [summary, setSummary] = useState(null)  // { totalCompleted, avgResolutionMinutes, thisMonth }
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [period,  setPeriod]  = useState('30d')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const PER_PAGE = 15

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API
        // const params = new URLSearchParams({ page, limit: PER_PAGE, period, ...(search && { search }) })
        // const [jobsRes, sumRes] = await Promise.all([
        //   fetch(`/api/collector/history?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch(`/api/collector/history/summary?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // if (!jobsRes.ok) throw new Error('Failed to load history')
        // const json = await jobsRes.json()
        // setJobs(json.data); setTotal(json.total)
        // setSummary(await sumRes.json())
        throw new Error('History API not connected — wire up /api/collector/history')
      } catch (err) {
        setError(err.message)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, period])

  const totalPages = Math.ceil(total / PER_PAGE)

  function formatDuration(minutes) {
    if (!minutes) return '—'
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader title="Job History" subtitle="Your completed and closed collection tasks" />

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setPeriod(opt.value); setPage(1) }}
            className={classNames(
              'px-4 py-2 rounded-xl text-xs font-mono border transition-all',
              period === opt.value
                ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary KPIs */}
      {!loading && summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Completed"         value={summary.totalCompleted}    icon={CheckCircle} accent="forest" />
          <StatCard label="Avg. Resolution"   value={summary.avgResolutionMinutes ? formatDuration(summary.avgResolutionMinutes) : null} icon={Clock} accent="sand" />
          <StatCard label="This Month"        value={summary.thisMonth}         icon={Zap}         accent="yellow" />
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by location or category…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No history found"
            body="Completed and closed jobs will appear here."
          />
        ) : (
          <>
            <Table headers={['Task ID', 'Category', 'Location', 'Completed At', 'Duration', 'Status']}>
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{j.id}</span></Td>
                  <Td>{j.category}</Td>
                  <Td className="max-w-[200px] truncate text-sand-500">{j.location}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {j.completedAt ? new Date(j.completedAt).toLocaleDateString() : '—'}
                  </Td>
                  <Td className="font-mono text-xs text-sand-500">
                    {formatDuration(j.resolutionMinutes)}
                  </Td>
                  <Td><StatusBadge status={j.status} /></Td>
                </tr>
              ))}
            </Table>

            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">
                  Page {page} of {totalPages} · {total} jobs
                </p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    ← Prev
                  </button>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
