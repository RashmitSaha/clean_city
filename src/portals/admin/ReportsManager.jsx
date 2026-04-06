import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Search, AlertCircle, UserCheck, X } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { SelectField } from '../../components/FormField.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_FILTERS   = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved']
const PRIORITY_FILTERS = ['All Priorities', 'Critical', 'High', 'Medium', 'Low']
const PER_PAGE = 20

function AssignModal({ report, onClose, onAssigned }) {
  const { apiFetch } = useAuth()
  const [collectors, setCollectors] = useState(null)
  const [selected,   setSelected]   = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    apiFetch('/api/admin/users?role=collector&limit=100')
      .then(r => r.json())
      .then(j => setCollectors(j.data ?? []))
      .catch(() => setCollectors([]))
      .finally(() => setLoading(false))
  }, [apiFetch])

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ collector_id: parseInt(selected, 10), status: 'assigned' }),
      })
      if (!res.ok) throw new Error('Assignment failed')
      onAssigned(report.id, parseInt(selected, 10))
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-700 text-sand-100">Assign Report #{report.id}</h3>
          <button onClick={onClose} className="text-sand-500 hover:text-sand-300"><X size={16} /></button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {loading ? <p className="text-sand-500 text-sm">Loading collectors…</p>
          : collectors.length === 0 ? <p className="text-sand-500 text-sm">No collectors available.</p>
          : (
            <SelectField label="Select collector" id="collector" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose…</option>
              {collectors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </SelectField>
          )
        }
        <div className="flex gap-3 mt-5">
          <button onClick={handleAssign} disabled={!selected || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-display font-600 bg-forest-500 hover:bg-forest-400 text-white transition-colors disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign'}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border border-forest-700/60 text-sand-400 hover:text-sand-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function ReportsManager() {
  const { apiFetch } = useAuth()
  const [reports, setReports]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error,   setError]         = useState(null)
  const [search,  setSearch]        = useState('')
  const [status,  setStatus]        = useState('All')
  const [priority,setPriority]      = useState('All Priorities')
  const [page,    setPage]          = useState(1)
  const [total,   setTotal]         = useState(0)
  const [assigning, setAssigning]   = useState(null)   // report being assigned

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE })
      if (search)                        params.set('search', search)
      if (status !== 'All')              params.set('status', status.toLowerCase().replace(' ', '_'))
      const res  = await apiFetch(`/api/admin/reports?${params}`)
      if (!res.ok) throw new Error('Failed to load reports')
      const json = await res.json()
      setReports(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err.message)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch, page, search, status])

  useEffect(() => { load() }, [load])

  async function updateStatus(reportId, newStatus) {
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      setReports(prev => prev?.map(r => r.id === reportId ? { ...r, status: newStatus } : r))
    } catch (err) {
      setError(err.message)
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      <PageHeader title="Reports" subtitle="All platform reports — assign, update and track" />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
          <input type="text" placeholder="Search by address…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={classNames('px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                status === s ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                             : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700/60 hover:text-sand-400')}>
              {s}
            </button>
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
        ) : !reports || reports.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reports found" body="Try adjusting your filters." />
        ) : (
          <>
            <Table headers={['ID', 'Category', 'Priority', 'Address', 'Status', 'Score', 'Actions']}>
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{r.id}</span></Td>
                  <Td>{r.category}</Td>
                  <Td><StatusBadge status={r.priority} /></Td>
                  <Td className="max-w-[180px] truncate text-sand-500">{r.address}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="font-mono text-xs text-forest-400">{r.priority_score != null ? r.priority_score.toFixed(1) : '—'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {r.status === 'pending' && (
                        <button onClick={() => setAssigning(r)}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors flex items-center gap-1">
                          <UserCheck size={11} /> Assign
                        </button>
                      )}
                      {r.status === 'assigned' && (
                        <button onClick={() => updateStatus(r.id, 'in_progress')}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sand-500/15 text-sand-300 border border-sand-500/30 hover:bg-sand-500/25 transition-colors">Start</button>
                      )}
                      {r.status === 'in_progress' && (
                        <button onClick={() => updateStatus(r.id, 'resolved')}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors">Resolve</button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">Page {page} of {totalPages} · {total} reports</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {assigning && (
        <AssignModal
          report={assigning}
          onClose={() => setAssigning(null)}
          onAssigned={(id, collectorId) => {
            setReports(prev => prev?.map(r => r.id === id ? { ...r, status: 'assigned', collector_id: collectorId } : r))
            setAssigning(null)
          }}
        />
      )}
    </div>
  )
}
