import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, CheckCircle, Clock, Truck, AlertCircle, Map } from 'lucide-react'
import { PageHeader, StatCard, Card, Table, Td, Skeleton, EmptyState, PrimaryButton, GhostButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function CollectorDashboard() {
  const [stats,  setStats]  = useState(null)
  const [tasks,  setTasks]  = useState(null)
  const [loading,setLoading]= useState(true)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: replace with real API
        // const [statsRes, tasksRes] = await Promise.all([
        //   fetch('/api/collector/stats', { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch('/api/collector/tasks?filter=today', { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // setStats(await statsRes.json())
        // setTasks((await tasksRes.json()).data)
        throw new Error('API not connected — wire up /api/collector/stats and /api/collector/tasks')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function updateTaskStatus(taskId, newStatus) {
    // TODO: PATCH /api/collector/tasks/:id
    // await fetch(`/api/collector/tasks/${taskId}`, { method: 'PATCH', ... body: { status: newStatus } })
    setTasks((prev) =>
      prev?.map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
    )
  }

  return (
    <div className="p-6 flex flex-col gap-7 max-w-6xl">
      <PageHeader title="Collector Dashboard" subtitle="Your task queue and performance today">
        <Link to="/collector/map">
          <GhostButton><Map size={15} /> Map View</GhostButton>
        </Link>
        <Link to="/collector/tasks">
          <PrimaryButton><ClipboardCheck size={15} /> All Tasks</PrimaryButton>
        </Link>
      </PageHeader>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Assigned Today"  value={stats?.assignedToday}  icon={ClipboardCheck} accent="sand"   />
            <StatCard label="Completed Today" value={stats?.completedToday} icon={CheckCircle}    accent="forest" />
            <StatCard label="In Progress"     value={stats?.inProgress}     icon={Truck}          accent="yellow" />
            <StatCard label="Total This Month" value={stats?.monthTotal}    icon={CheckCircle}    accent="forest" />
          </>
        )}
      </div>

      {/* Today's tasks */}
      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40 flex items-center justify-between">
          <h2 className="font-display font-600 text-sand-200">Today's Tasks</h2>
          <Link to="/collector/tasks" className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No tasks for today"
            body="New tasks assigned to you will appear here."
          />
        ) : (
          <Table headers={['ID', 'Category', 'Priority', 'Location', 'Reported By', 'Status', 'Action']}>
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-forest-800/20 transition-colors">
                <Td><span className="font-mono text-xs text-sand-500">#{t.id}</span></Td>
                <Td>{t.category}</Td>
                <Td><StatusBadge status={t.priority} /></Td>
                <Td className="max-w-[160px] truncate text-sand-500">{t.location}</Td>
                <Td className="text-sand-500">{t.citizenName ?? '—'}</Td>
                <Td><StatusBadge status={t.status} /></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {t.status === 'assigned' && (
                      <button
                        onClick={() => updateTaskStatus(t.id, 'in_progress')}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sand-500/15 text-sand-300 border border-sand-500/30 hover:bg-sand-500/25 transition-colors whitespace-nowrap"
                      >
                        Start
                      </button>
                    )}
                    {t.status === 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(t.id, 'resolved')}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors whitespace-nowrap"
                      >
                        Complete
                      </button>
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
