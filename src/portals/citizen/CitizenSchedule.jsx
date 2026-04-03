// ─── CitizenSchedule.jsx ─────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Calendar, Truck, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState } from '../../components/PortalUI.jsx'

export function CitizenSchedule() {
  const [schedule, setSchedule] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: replace with real API
        // const res = await fetch('/api/citizen/schedule', { headers: { Authorization: `Bearer ${token}` } })
        // if (!res.ok) throw new Error('Failed to load schedule')
        // setSchedule(await res.json()) // [{ date, timeSlot, type, zone, collectorName, status }]
        throw new Error('Schedule API not connected — wire up /api/citizen/schedule')
      } catch (err) {
        setError(err.message)
        setSchedule([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title="Collection Schedule"
        subtitle="Upcoming waste collection pickups in your zone"
      />

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
          <EmptyState
            icon={Calendar}
            title="No upcoming collections"
            body="Collection schedules for your zone will appear here once published by your administrator."
          />
        ) : (
          <div className="divide-y divide-forest-800/30">
            {schedule.map((item, i) => (
              <div key={i} className="flex items-center gap-5 px-5 py-4 hover:bg-forest-800/20 transition-colors">
                {/* Date block */}
                <div className="shrink-0 w-16 text-center">
                  <p className="font-display font-700 text-xl text-sand-100">
                    {new Date(item.date).getDate()}
                  </p>
                  <p className="font-mono text-xs text-sand-600">
                    {MONTH_LABELS[new Date(item.date).getMonth()]}
                  </p>
                </div>

                <div className="w-px h-10 bg-forest-800/50 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="font-display font-600 text-sand-200 text-sm">{item.type ?? 'General Collection'}</p>
                  <p className="font-body text-xs text-sand-500 mt-0.5">
                    {item.timeSlot ?? '—'} · Zone: {item.zone ?? '—'}
                    {item.collectorName && ` · ${item.collectorName}`}
                  </p>
                </div>

                <div className="shrink-0">
                  <Truck size={16} className="text-forest-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default CitizenSchedule
