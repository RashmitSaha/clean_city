import { useEffect, useState, useCallback } from 'react'
import { Calendar, Truck, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState } from '../../components/PortalUI.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Shows upcoming assigned/in-progress tasks linked to the citizen's reports.
 * We poll /api/reports and surface the ones that have a collector assigned,
 * presenting them as "scheduled pickups" until a dedicated schedule endpoint exists.
 */
export default function CitizenSchedule() {
  const { apiFetch } = useAuth()
  const [schedule, setSchedule] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/reports?limit=20&status=assigned')
      if (!res.ok) throw new Error('Failed to load schedule')
      const json = await res.json()
      // Shape reports into schedule items
      const items = (json.data ?? []).map(r => ({
        date:     r.updated_at,
        type:     r.category,
        zone:     r.zone_id ? `Zone ${r.zone_id}` : '—',
        address:  r.address,
        status:   r.status,
      }))
      setSchedule(items)
    } catch (err) {
      setError(err.message)
      setSchedule([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <PageHeader title="Collection Schedule" subtitle="Upcoming waste collection pickups linked to your reports" />

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming collections"
            body="Scheduled pickups for your reports will appear here once a collector is assigned." />
        ) : (
          <div className="divide-y divide-forest-800/30">
            {schedule.map((item, i) => {
              const d = new Date(item.date)
              return (
                <div key={i} className="flex items-center gap-5 px-5 py-4 hover:bg-forest-800/20 transition-colors">
                  <div className="shrink-0 w-16 text-center">
                    <p className="font-display font-700 text-xl text-sand-100">{d.getDate()}</p>
                    <p className="font-mono text-xs text-sand-600">{MONTHS[d.getMonth()]}</p>
                  </div>
                  <div className="w-px h-10 bg-forest-800/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-600 text-sand-200 text-sm">{item.type}</p>
                    <p className="font-body text-xs text-sand-500 mt-0.5">{item.address} · {item.zone}</p>
                  </div>
                  <Truck size={16} className="text-forest-600 shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
