import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus, ClipboardList, Search, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed']

export default function MyReports() {
  const [reports,  setReports]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PER_PAGE = 10

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API
        // const params = new URLSearchParams({
        //   page, limit: PER_PAGE,
        //   ...(search && { search }),
        //   ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase().replace(' ', '_') }),
        // })
        // const res = await fetch(`/api/citizen/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        // if (!res.ok) throw new Error('Failed to load reports')
        // const json = await res.json()
        // setReports(json.data)
        // setTotal(json.total)
        throw new Error('Reports API not connected — wire up /api/citizen/reports')
      } catch (err) {
        setError(err.message)
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, statusFilter])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader title="My Reports" subtitle="All waste reports you have submitted">
        <Link to="/citizen/report/new">
          <PrimaryButton><FilePlus size={16} /> New Report</PrimaryButton>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by location or category…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                statusFilter === s
                  ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                  : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700/60 hover:text-sand-400'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !reports || reports.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No reports found"
            body={search || statusFilter !== 'All' ? 'Try adjusting your filters.' : "You haven't submitted any reports yet."}
            action={
              <Link to="/citizen/report/new">
                <PrimaryButton><FilePlus size={15} /> Submit a Report</PrimaryButton>
              </Link>
            }
          />
        ) : (
          <>
            <Table headers={['ID', 'Category', 'Priority', 'Location', 'Submitted', 'Status', 'Collector']}>
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{r.id}</span></Td>
                  <Td>{r.category}</Td>
                  <Td><StatusBadge status={r.priority} /></Td>
                  <Td className="max-w-[180px] truncate text-sand-500">{r.location}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="text-sand-500">{r.collectorName ?? <span className="text-sand-700">Unassigned</span>}</Td>
                </tr>
              ))}
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">
                  Page {page} of {totalPages} · {total} reports
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
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
