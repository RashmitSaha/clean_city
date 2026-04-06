import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus, ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { PageHeader, StatCard, Card, Table, Td, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function CitizenDashboard() {
  const { apiFetch } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch('/api/reports?limit=5&page=1')
        if (!res.ok) throw new Error('Failed to load reports')
        const json = await res.json()
        const all = json.data ?? []
        setReports(all)
        setStats({
          total:      json.total,
          pending:    all.filter(r => r.status === 'pending').length,
          inProgress: all.filter(r => ['assigned','in_progress'].includes(r.status)).length,
          resolved:   all.filter(r => r.status === 'resolved').length,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiFetch])

  return (
    <div className="p-6 flex flex-col gap-7 max-w-6xl">
      <PageHeader title="My Dashboard" subtitle="Overview of your waste reports and activity">
        <Link to="/citizen/report/new">
          <PrimaryButton><FilePlus size={16} /> New Report</PrimaryButton>
        </Link>
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
              <StatCard label="Total Reports"  value={stats?.total}      icon={ClipboardList} accent="forest" />
              <StatCard label="Pending"         value={stats?.pending}    icon={Clock}         accent="sand"   />
              <StatCard label="In Progress"     value={stats?.inProgress} icon={AlertCircle}   accent="yellow" />
              <StatCard label="Resolved"        value={stats?.resolved}   icon={CheckCircle}   accent="forest" />
            </>
        }
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40 flex items-center justify-between">
          <h2 className="font-display font-600 text-sand-200">Recent Reports</h2>
          <Link to="/citizen/reports" className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : !reports || reports.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No reports yet"
            body="Submit your first waste report to get started."
            action={
              <Link to="/citizen/report/new">
                <PrimaryButton><FilePlus size={15} /> Submit a Report</PrimaryButton>
              </Link>
            }
          />
        ) : (
          <Table headers={['ID', 'Category', 'Priority', 'Address', 'Date', 'Status']}>
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-forest-800/20 transition-colors">
                <Td><span className="font-mono text-xs text-sand-500">#{r.id}</span></Td>
                <Td>{r.category}</Td>
                <Td><StatusBadge status={r.priority} /></Td>
                <Td className="max-w-[180px] truncate text-sand-500">{r.address}</Td>
                <Td className="font-mono text-xs text-sand-600">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </Td>
                <Td><StatusBadge status={r.status} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
