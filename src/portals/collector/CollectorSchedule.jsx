import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Clock, Truck, AlertCircle, Navigation } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, StatCard } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { classNames } from '../../utils/helpers.js'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(d) {
  const date = new Date(d)
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function CollectorSchedule() {
  const [schedule, setSchedule] = useState(null)
  const [summary,  setSummary]  = useState(null)  // { totalStops, estimatedKm, estimatedDuration }
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  // Selected day offset — 0 = today, 1 = tomorrow, etc.
  const [dayOffset, setDayOffset] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API
        // const date = new Date()
        // date.setDate(date.getDate() + dayOffset)
        // const dateStr = date.toISOString().split('T')[0]
        // const [schedRes, sumRes] = await Promise.all([
        //   fetch(`/api/collector/schedule?date=${dateStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch(`/api/collector/schedule/summary?date=${dateStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // if (!schedRes.ok) throw new Error('Failed to load schedule')
        // setSchedule((await schedRes.json()).stops)   // [{ id, order, address, lat, lng, taskId, category, scheduledAt, status, estimatedDuration }]
        // setSummary(await sumRes.json())
        throw new Error('Schedule API not connected — wire up /api/collector/schedule')
      } catch (err) {
        setError(err.message)
        setSchedule([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dayOffset])

  // Day selector — today + next 4 days
  const dayOptions = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return { offset: i, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getDay()], date: d }
  })

  async function openInMaps(stop) {
    if (!stop.lat || !stop.lng) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`, '_blank')
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title="My Schedule"
        subtitle="Daily route and collection stops"
      />

      {/* Day selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {dayOptions.map((d) => (
          <button
            key={d.offset}
            onClick={() => setDayOffset(d.offset)}
            className={classNames(
              'flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs font-mono transition-all',
              dayOffset === d.offset
                ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700/60 hover:text-sand-400'
            )}
          >
            <span className="font-display font-600 text-base">{d.label}</span>
            <span className="text-sand-600 mt-0.5">
              {d.date.getDate()} {MONTHS[d.date.getMonth()]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {/* Route summary KPIs */}
      {!loading && summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Stops"              value={summary.totalStops}        icon={MapPin}  accent="forest" />
          <StatCard label="Est. Distance"      value={summary.estimatedKm ? `${summary.estimatedKm} km` : null} icon={Truck}   accent="sand"   />
          <StatCard label="Est. Duration"      value={summary.estimatedDuration} icon={Clock}   accent="yellow" />
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {/* Stop list — timeline style */}
      <Card>
        <div className="px-5 py-4 border-b border-forest-800/40">
          <h2 className="font-display font-600 text-sand-200">Route Stops</h2>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No stops scheduled"
            body="Your administrator hasn't assigned any collection stops for this day yet."
          />
        ) : (
          <div className="relative px-5 py-4">
            {/* Vertical line */}
            <div className="absolute left-[2.35rem] top-6 bottom-6 w-px bg-forest-800/50" />

            <div className="flex flex-col gap-1">
              {schedule.map((stop, i) => {
                const done = stop.status === 'resolved' || stop.status === 'completed'
                const active = stop.status === 'in_progress'

                return (
                  <div key={stop.id ?? i} className="flex gap-4 py-3 group">
                    {/* Step dot */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className={classNames(
                        'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-mono z-10',
                        done   ? 'bg-forest-600 border-forest-500 text-white'
                        : active ? 'bg-sand-600/50 border-sand-400 text-sand-200 animate-pulse'
                        :          'bg-forest-900 border-forest-700 text-sand-600'
                      )}>
                        {done ? '✓' : stop.order ?? i + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={classNames(
                      'flex-1 p-4 rounded-xl border transition-all',
                      active ? 'bg-sand-500/10 border-sand-500/30'
                      : done  ? 'bg-forest-800/20 border-forest-700/20 opacity-60'
                      :         'bg-forest-900/30 border-forest-800/40 group-hover:border-forest-700/50'
                    )}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display font-600 text-sand-200 text-sm">{stop.category ?? 'Collection Stop'}</p>
                            <StatusBadge status={stop.status} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin size={12} className="text-sand-600 shrink-0" />
                            <p className="text-xs font-body text-sand-500 truncate">{stop.address ?? '—'}</p>
                          </div>
                          {stop.scheduledAt && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock size={12} className="text-sand-600 shrink-0" />
                              <p className="text-xs font-mono text-sand-600">{formatTime(stop.scheduledAt)}</p>
                              {stop.estimatedDuration && (
                                <span className="text-sand-700">· ~{stop.estimatedDuration} min</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Navigate button */}
                        {(stop.lat && stop.lng) && (
                          <button
                            onClick={() => openInMaps(stop)}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-forest-400 hover:text-forest-300 border border-forest-700/40 hover:border-forest-500/50 px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            <Navigation size={12} />
                            Navigate
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
