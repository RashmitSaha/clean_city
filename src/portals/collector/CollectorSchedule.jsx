import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, MapPin, Clock, Truck, AlertCircle, Navigation } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, StatCard } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function CollectorSchedule() {
  const { apiFetch }  = useAuth()
  const [schedule,   setSchedule]  = useState(null)
  const [summary,    setSummary]   = useState(null)
  const [loading,    setLoading]   = useState(true)
  const [error,      setError]     = useState(null)
  const [dayOffset,  setDayOffset] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/collector/tasks?limit=50&status=assigned')
      if (!res.ok) throw new Error('Failed to load schedule')
      const json = await res.json()
      const stops = (json.data ?? []).map((t, i) => ({
        id:       t.id,
        order:    i + 1,
        address:  t.address,
        lat:      t.latitude,
        lng:      t.longitude,
        taskId:   t.id,
        category: t.category,
        status:   t.status,
        scheduledAt: t.updated_at,
      }))
      setSchedule(stops)
      setSummary({
        totalStops:        stops.length,
        estimatedKm:       null,   // populated by C++ /route when coordinates available
        estimatedDuration: stops.length > 0 ? `~${stops.length * 20} min` : null,
      })
    } catch (err) {
      setError(err.message)
      setSchedule([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load, dayOffset])

  const dayOptions = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { offset: i, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getDay()], date: d }
  })

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <PageHeader title="My Schedule" subtitle="Daily route and collection stops" />

      <div className="flex items-center gap-2 flex-wrap">
        {dayOptions.map(d => (
          <button key={d.offset} onClick={() => setDayOffset(d.offset)}
            className={classNames('flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs font-mono transition-all',
              dayOffset === d.offset ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                                     : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700/60 hover:text-sand-400')}>
            <span className="font-display font-600 text-base">{d.label}</span>
            <span className="text-sand-600 mt-0.5">{d.date.getDate()} {MONTHS[d.date.getMonth()]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {loading
        ? <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        : summary && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Stops"         value={summary.totalStops}        icon={MapPin}  accent="forest" />
            <StatCard label="Est. Distance" value={summary.estimatedKm ? `${summary.estimatedKm} km` : '—'} icon={Truck} accent="sand" />
            <StatCard label="Est. Duration" value={summary.estimatedDuration} icon={Clock}   accent="yellow" />
          </div>
        )
      }

      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40">
          <h2 className="font-display font-600 text-sand-200">Route Stops</h2>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No stops scheduled" body="Assigned tasks will appear here as your route." />
        ) : (
          <div className="relative px-5 py-4">
            <div className="absolute left-[2.35rem] top-6 bottom-6 w-px bg-forest-800/50" />
            <div className="flex flex-col gap-1">
              {schedule.map((stop, i) => {
                const done   = stop.status === 'resolved'
                const active = stop.status === 'in_progress'
                return (
                  <div key={stop.id ?? i} className="flex gap-4 py-3 group">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className={classNames('w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-mono z-10',
                        done   ? 'bg-forest-600 border-forest-500 text-white'
                        : active ? 'bg-sand-600/50 border-sand-400 text-sand-200 animate-pulse'
                        :          'bg-forest-900 border-forest-700 text-sand-600')}>
                        {done ? '✓' : stop.order}
                      </div>
                    </div>
                    <div className={classNames('flex-1 p-4 rounded-xl border transition-all',
                      active ? 'bg-sand-500/10 border-sand-500/30'
                      : done  ? 'bg-forest-800/20 border-forest-700/20 opacity-60'
                      :         'bg-forest-900/30 border-forest-800/40 group-hover:border-forest-700/50')}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display font-600 text-sand-200 text-sm">{stop.category}</p>
                            <StatusBadge status={stop.status} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin size={12} className="text-sand-600 shrink-0" />
                            <p className="text-xs font-body text-sand-500 truncate">{stop.address}</p>
                          </div>
                        </div>
                        {stop.lat && stop.lng && (
                          <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`, '_blank')}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-forest-400 hover:text-forest-300 border border-forest-700/40 hover:border-forest-500/50 px-2.5 py-1.5 rounded-lg transition-all">
                            <Navigation size={12} /> Navigate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
