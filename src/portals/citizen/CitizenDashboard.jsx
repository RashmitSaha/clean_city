import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus, ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { PageHeader, StatCard, Card, Table, Td, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function CitizenDashboard() {
  const [stats,   setStats]   = useState(null)   // { total, pending, resolved, inProgress }
  const [reports, setReports] = useState(null)   // array of report objects
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: replace with real API calls
        // const [statsRes, reportsRes] = await Promise.all([
        //   fetch('/api/citizen/stats', { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch('/api/citizen/reports?limit=5&sort=createdAt:desc', { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // if (!statsRes.ok || !reportsRes.ok) throw new Error('Failed to load dashboard data')
        // setStats(await statsRes.json())
        // setReports((await reportsRes.json()).data)
        throw new Error('API not connected — wire up /api/citizen/stats and /api/citizen/reports')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 flex flex-col gap-7 max-w-6xl">
      <PageHeader
        title="My Dashboard"
        subtitle="Overview of your waste reports and activity"
      >
        <Link to="/citizen/report/new">
          <PrimaryButton>
            <FilePlus size={16} />
            New Report
          </PrimaryButton>
        </Link>
      </PageHeader>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard label="Total Reports"  value={stats?.total}      icon={ClipboardList} accent="forest" />
            <StatCard label="Pending"        value={stats?.pending}    icon={Clock}         accent="yellow" />
            <StatCard label="In Progress"    value={stats?.inProgress} icon={AlertCircle}   accent="sand"   />
            <StatCard label="Resolved"       value={stats?.resolved}   icon={CheckCircle}   accent="forest" />
          </>
        )}
      </div>

      {/* Recent reports */}
      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40 flex items-center justify-between">
          <h2 className="font-display font-600 text-sand-200">Recent Reports</h2>
          <Link to="/citizen/reports" className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
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
          <Table headers={['Report ID', 'Category', 'Location', 'Date', 'Status']}>
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-forest-800/20 transition-colors">
                <Td><span className="font-mono text-xs text-sand-500">#{r.id}</span></Td>
                <Td>{r.category}</Td>
                <Td className="text-sand-500 max-w-[200px] truncate">{r.location}</Td>
                <Td className="text-sand-600 font-mono text-xs">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
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
