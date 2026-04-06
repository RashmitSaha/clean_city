import { useEffect, useState, useCallback } from 'react'
import { ClipboardCheck, Search, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_FILTERS = ['All', 'Assigned', 'In Progress', 'Resolved']
const PER_PAGE = 10

export default function TaskList() {
  const { apiFetch } = useAuth()
  const [tasks,   setTasks]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE })
      if (search)           params.set('search', search)
      if (filter !== 'All') params.set('status', filter.toLowerCase().replace(' ', '_'))
      const res  = await apiFetch(`/api/collector/tasks?${params}`)
      if (!res.ok) throw new Error('Failed to load tasks')
      const json = await res.json()
      setTasks(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch, page, search, filter])

  useEffect(() => { load() }, [load])

  async function updateStatus(taskId, newStatus) {
    try {
      const res = await apiFetch(`/api/collector/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      setTasks(prev => prev?.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      setError(err.message)
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader title="My Tasks" subtitle="All waste collection tasks assigned to you" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
          <input type="text" placeholder="Search by address…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1) }}
              className={classNames('px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                filter === s ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                             : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700/60 hover:text-sand-400'
              )}>{s}</button>
          ))}
        </div>
      </div>

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No tasks found" body="Try adjusting filters or check back later." />
        ) : (
          <>
            <Table headers={['ID', 'Category', 'Priority', 'Address', 'Assigned At', 'Status', 'Actions']}>
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{t.id}</span></Td>
                  <Td>{t.category}</Td>
                  <Td><StatusBadge status={t.priority} /></Td>
                  <Td className="max-w-[180px] truncate text-sand-500">{t.address}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      {t.status === 'assigned' && (
                        <button onClick={() => updateStatus(t.id, 'in_progress')}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sand-500/15 text-sand-300 border border-sand-500/30 hover:bg-sand-500/25 transition-colors">Start</button>
                      )}
                      {t.status === 'in_progress' && (<>
                        <button onClick={() => updateStatus(t.id, 'resolved')}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors">Complete</button>
                        <button onClick={() => updateStatus(t.id, 'cancelled')}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Cancel</button>
                      </>)}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">Page {page} of {totalPages} · {total} tasks</p>
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
