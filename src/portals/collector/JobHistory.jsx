import { useEffect, useState, useCallback } from 'react'
import { History, Search, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState, StatCard } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const PERIOD_OPTIONS = [
  { label: 'Last 7 days',  value: '7d'  },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time',     value: 'all' },
]
const PER_PAGE = 15

function formatDuration(mins) {
  if (!mins) return '—'
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function JobHistory() {
  const { apiFetch } = useAuth()
  const [jobs,    setJobs]    = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [period,  setPeriod]  = useState('30d')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE, status: 'resolved' })
      if (search) params.set('search', search)
      const res  = await apiFetch(`/api/collector/tasks?${params}`)
      if (!res.ok) throw new Error('Failed to load history')
      const json = await res.json()
      const data = json.data ?? []
      setJobs(data)
      setTotal(json.total ?? 0)
      setSummary({
        totalCompleted:         json.total ?? 0,
        avgResolutionMinutes:   null,
        thisMonth:              data.filter(j => {
          const d = new Date(j.updated_at)
          const now = new Date()
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length,
      })
    } catch (err) {
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch, page, search, period])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader title="Job History" subtitle="Your completed collection tasks" />

      <div className="flex items-center gap-2 flex-wrap">
        {PERIOD_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => { setPeriod(opt.value); setPage(1) }}
            className={classNames('px-4 py-2 rounded-xl text-xs font-mono border transition-all',
              period === opt.value ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                                   : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400')}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading
        ? <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        : summary && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Completed"  value={summary.totalCompleted}        icon={CheckCircle} accent="forest" />
            <StatCard label="Avg. Resolution"  value={formatDuration(summary.avgResolutionMinutes)} icon={Clock} accent="sand" />
            <StatCard label="This Month"       value={summary.thisMonth}             icon={Zap}         accent="yellow" />
          </div>
        )
      }

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
        <input type="text" placeholder="Search by address…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500" />
      </div>

      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState icon={History} title="No history found" body="Completed and closed jobs will appear here." />
        ) : (
          <>
            <Table headers={['Task ID', 'Category', 'Address', 'Completed At', 'Status']}>
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{j.id}</span></Td>
                  <Td>{j.category}</Td>
                  <Td className="max-w-[200px] truncate text-sand-500">{j.address}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {j.resolved_at ? new Date(j.resolved_at).toLocaleDateString() : '—'}
                  </Td>
                  <Td><StatusBadge status={j.status} /></Td>
                </tr>
              ))}
            </Table>
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">Page {page} of {totalPages} · {total} jobs</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
