import { useEffect, useState } from 'react'
import { ClipboardList, Search, AlertCircle, UserCheck, AlertTriangle, X } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState, PrimaryButton, GhostButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { SelectField } from '../../components/FormField.jsx'
import { classNames } from '../../utils/helpers.js'

const STATUS_FILTERS   = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed']
const PRIORITY_FILTERS = ['All Priorities', 'Critical', 'High', 'Medium', 'Low']

// Modal to assign a report to a collector
function AssignModal({ report, onClose, onAssign }) {
  const [collectors, setCollectors] = useState(null)
  const [selected,   setSelected]   = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    async function loadCollectors() {
      try {
        // TODO: fetch available collectors
        // const res = await fetch('/api/admin/collectors?available=true', { headers: { Authorization: `Bearer ${token}` } })
        // setCollectors((await res.json()).data)
        setCollectors([]) // placeholder — real data from API
      } catch {
        setCollectors([])
      } finally {
        setLoading(false)
      }
    }
    loadCollectors()
  }, [])

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    try {
      // TODO: PATCH /api/admin/reports/:id { collectorId: selected, status: 'assigned' }
      onAssign(report.id, selected)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-700 text-sand-100">Assign Report #{report.id}</h3>
          <button onClick={onClose} className="text-sand-500 hover:text-sand-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm font-body text-sand-500 mb-5">
          Category: <span className="text-sand-300">{report.category}</span> ·
          Location: <span className="text-sand-300 truncate">{report.location}</span>
        </p>

        {loading ? (
          <Skeleton className="h-12 w-full mb-4" />
        ) : collectors.length === 0 ? (
          <p className="text-sm font-body text-yellow-400 mb-4">
            No collectors found. Make sure /api/admin/collectors returns available collectors.
          </p>
        ) : (
          <SelectField
            label="Select Collector"
            id="collector"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mb-5"
          >
            <option value="">Choose a collector…</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.zone ?? 'Unzoned'}</option>
            ))}
          </SelectField>
        )}

        <div className="flex gap-3">
          <PrimaryButton onClick={handleAssign} disabled={!selected || saving} className="flex-1 justify-center">
            {saving ? 'Assigning…' : 'Assign'}
          </PrimaryButton>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  )
}

export default function ReportsManager() {
  const [reports,  setReports]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('All')
  const [priority, setPriority] = useState('All Priorities')
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [assignTarget, setAssignTarget] = useState(null) // report being assigned
  const PER_PAGE = 12

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API
        // const params = new URLSearchParams({
        //   page, limit: PER_PAGE,
        //   ...(search && { search }),
        //   ...(status !== 'All' && { status: status.toLowerCase().replace(' ', '_') }),
        //   ...(priority !== 'All Priorities' && { priority: priority.toLowerCase() }),
        // })
        // const res = await fetch(`/api/admin/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        // if (!res.ok) throw new Error('Failed to load reports')
        // const json = await res.json()
        // setReports(json.data); setTotal(json.total)
        throw new Error('Admin reports API not connected — wire up /api/admin/reports')
      } catch (err) {
        setError(err.message)
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, status, priority])

  async function updateStatus(reportId, newStatus) {
    // TODO: PATCH /api/admin/reports/:id { status: newStatus }
    setReports((prev) => prev?.map((r) => r.id === reportId ? { ...r, status: newStatus } : r))
  }

  function handleAssigned(reportId, collectorId) {
    setReports((prev) => prev?.map((r) =>
      r.id === reportId ? { ...r, status: 'assigned', collectorId } : r
    ))
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      {assignTarget && (
        <AssignModal
          report={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssigned}
        />
      )}

      <PageHeader title="Reports" subtitle="All platform waste reports — assign, escalate, or close" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ID, location, category…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                status === s
                  ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                  : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400'
              )}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {PRIORITY_FILTERS.map((p) => (
            <button key={p} onClick={() => { setPriority(p); setPage(1) }}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                priority === p
                  ? 'bg-red-700/30 border-red-500/50 text-red-300'
                  : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400'
              )}>
              {p}
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
            <Table headers={['ID', 'Category', 'Priority', 'Location', 'Citizen', 'Collector', 'Date', 'Status', 'Actions']}>
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td><span className="font-mono text-xs text-sand-500">#{r.id}</span></Td>
                  <Td>{r.category}</Td>
                  <Td><StatusBadge status={r.priority} /></Td>
                  <Td className="max-w-[140px] truncate text-sand-500">{r.location}</Td>
                  <Td className="text-sand-500">{r.citizenName ?? '—'}</Td>
                  <Td className="text-sand-500">{r.collectorName ?? <span className="text-sand-700">Unassigned</span>}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(r.status === 'pending' || r.status === 'assigned') && (
                        <button
                          onClick={() => setAssignTarget(r)}
                          className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors whitespace-nowrap"
                        >
                          <UserCheck size={11} /> Assign
                        </button>
                      )}
                      {r.status !== 'critical' && r.priority !== 'critical' && r.status !== 'resolved' && r.status !== 'closed' && (
                        <button
                          onClick={() => updateStatus(r.id, 'critical')}
                          className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                          <AlertTriangle size={11} /> Escalate
                        </button>
                      )}
                      {r.status !== 'closed' && r.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(r.id, 'closed')}
                          className="text-xs font-mono px-2 py-1 rounded-lg bg-forest-800/40 text-sand-600 border border-forest-700/30 hover:text-sand-400 transition-colors"
                        >
                          Close
                        </button>
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
