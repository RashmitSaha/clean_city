import { useEffect, useState } from 'react'
import { Map, AlertCircle, MapPin, ExternalLink } from 'lucide-react'
import { PageHeader, Card, Skeleton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function TaskMap() {
  const [tasks,   setTasks]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: fetch tasks with lat/lng for map pins
        // const res = await fetch('/api/collector/tasks?hasCoords=true', { headers: { Authorization: `Bearer ${token}` } })
        // if (!res.ok) throw new Error('Failed to load task locations')
        // setTasks((await res.json()).data)
        throw new Error('Map API not connected — wire up /api/collector/tasks with coordinates')
      } catch (err) {
        setError(err.message)
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader
        title="Map View"
        subtitle="Geographical overview of your assigned tasks"
      />

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map canvas — integrate your map library here */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {loading ? (
              <Skeleton className="h-[420px] rounded-2xl" />
            ) : (
              <div className="h-[420px] flex flex-col items-center justify-center gap-4 bg-forest-900/30 border-2 border-dashed border-forest-700/40 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-forest-800/40 border border-forest-700/40 flex items-center justify-center">
                  <Map size={26} className="text-forest-600" />
                </div>
                <div className="text-center">
                  <p className="font-display font-600 text-sand-300 mb-1">Map Integration Slot</p>
                  <p className="text-xs font-body text-sand-600 max-w-xs">
                    Integrate your preferred map library here — Leaflet, Mapbox, or Google Maps.
                    Feed task coordinates from the API to render pins.
                  </p>
                </div>
                {/* Leaflet example snippet */}
                <div className="mt-2 px-4 py-3 rounded-xl bg-forest-950/60 border border-forest-800/40 text-xs font-mono text-sand-600 max-w-xs text-center">
                  <p className="text-forest-500 mb-1">// Quick start with Leaflet</p>
                  <p>npm install react-leaflet leaflet</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Task list sidebar */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono text-sand-600 uppercase tracking-widest">Task Pins</p>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : !tasks || tasks.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm font-body text-sand-600 text-center">No tasks with location data.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px]">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id === selected ? null : t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selected === t.id
                      ? 'bg-forest-700/40 border-forest-500/60'
                      : 'bg-forest-900/30 border-forest-800/40 hover:border-forest-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs text-sand-500">#{t.id}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="font-body text-sm text-sand-300 truncate">{t.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-sand-600 shrink-0" />
                    <p className="text-xs text-sand-600 truncate">{t.location}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
