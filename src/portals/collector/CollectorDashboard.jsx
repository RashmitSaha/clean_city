import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, CheckCircle, Clock, Truck, AlertCircle, Map } from 'lucide-react'
import { PageHeader, StatCard, Card, Table, Td, Skeleton, EmptyState, PrimaryButton, GhostButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function CollectorDashboard() {
  const { apiFetch } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [tasks,   setTasks]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/collector/tasks?limit=6&page=1')
      if (!res.ok) throw new Error('Failed to load tasks')
      const json = await res.json()
      const all  = json.data ?? []
      setTasks(all)
      setStats({
        total:      json.total,
        assigned:   all.filter(t => t.status === 'assigned').length,
        inProgress: all.filter(t => t.status === 'in_progress').length,
        resolved:   all.filter(t => t.status === 'resolved').length,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

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

  return (
    <div className="p-6 flex flex-col gap-7 max-w-6xl">
      <PageHeader title="Collector Dashboard" subtitle="Your task queue and performance today">
        <Link to="/collector/map"><GhostButton><Map size={15} /> Map View</GhostButton></Link>
        <Link to="/collector/tasks"><PrimaryButton><ClipboardCheck size={15} /> All Tasks</PrimaryButton></Link>
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
              <StatCard label="Total Tasks"   value={stats?.total}      icon={ClipboardCheck} accent="forest" />
              <StatCard label="Assigned"      value={stats?.assigned}   icon={Clock}          accent="sand"   />
              <StatCard label="In Progress"   value={stats?.inProgress} icon={Truck}          accent="yellow" />
              <StatCard label="Completed"     value={stats?.resolved}   icon={CheckCircle}    accent="forest" />
            </>
        }
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40 flex items-center justify-between">
          <h2 className="font-display font-600 text-sand-200">Active Tasks</h2>
          <Link to="/collector/tasks" className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors">View all →</Link>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No active tasks" body="Tasks assigned to you will appear here." />
        ) : (
          <Table headers={['ID', 'Category', 'Priority', 'Address', 'Status', 'Actions']}>
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-forest-800/20 transition-colors">
                <Td><span className="font-mono text-xs text-sand-500">#{t.id}</span></Td>
                <Td>{t.category}</Td>
                <Td><StatusBadge status={t.priority} /></Td>
                <Td className="max-w-[160px] truncate text-sand-500">{t.address}</Td>
                <Td><StatusBadge status={t.status} /></Td>
                <Td>
                  <div className="flex gap-2">
                    {t.status === 'assigned' && (
                      <button onClick={() => updateStatus(t.id, 'in_progress')}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sand-500/15 text-sand-300 border border-sand-500/30 hover:bg-sand-500/25 transition-colors">Start</button>
                    )}
                    {t.status === 'in_progress' && (
                      <button onClick={() => updateStatus(t.id, 'resolved')}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors">Complete</button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
