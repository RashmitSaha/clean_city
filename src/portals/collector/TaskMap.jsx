import { useEffect, useState, useCallback } from 'react'
import { Map, AlertCircle, MapPin, Navigation } from 'lucide-react'
import { PageHeader, Card, Skeleton } from '../../components/PortalUI.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TaskMap() {
  const { apiFetch }   = useAuth()
  const [tasks,        setTasks]    = useState(null)
  const [loading,      setLoading]  = useState(true)
  const [error,        setError]    = useState(null)
  const [selected,     setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/collector/tasks?limit=50&page=1')
      if (!res.ok) throw new Error('Failed to load tasks')
      const json = await res.json()
      // Only show tasks that have coordinates
      setTasks((json.data ?? []).filter(t => t.latitude && t.longitude))
    } catch (err) {
      setError(err.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  function openInMaps(task) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`, '_blank')
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <PageHeader title="Map View" subtitle="Geographical overview of your assigned tasks" />

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map slot */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {loading ? (
              <Skeleton className="h-[420px] rounded-2xl" />
            ) : (
              <div className="h-[420px] flex flex-col items-center justify-center gap-4 bg-forest-900/30 border-2 border-dashed border-forest-700/40 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-forest-800/40 border border-forest-700/40 flex items-center justify-center">
                  <Map size={26} className="text-forest-600" />
                </div>
                <div className="text-center px-6">
                  <p className="font-display font-600 text-sand-300 mb-1">Map Integration Slot</p>
                  <p className="text-xs font-body text-sand-600 max-w-xs">
                    Drop in <span className="text-forest-400 font-mono">react-leaflet</span> or <span className="text-forest-400 font-mono">@vis.gl/react-google-maps</span> here.
                    Task pins are ready in the sidebar — pass <span className="font-mono text-sand-400">tasks</span> as markers.
                  </p>
                </div>
                {tasks && tasks.length > 0 && (
                  <p className="font-mono text-xs text-forest-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''} with coordinates loaded</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Task sidebar */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono text-sand-600 uppercase tracking-widest">Task Pins</p>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            : !tasks || tasks.length === 0
              ? <Card className="p-5"><p className="text-sm font-body text-sand-600 text-center">No tasks with location data.</p></Card>
              : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px]">
                  {tasks.map(t => (
                    <button key={t.id} onClick={() => setSelected(t.id === selected ? null : t.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected === t.id ? 'bg-forest-700/40 border-forest-500/60' : 'bg-forest-900/30 border-forest-800/40 hover:border-forest-700/60'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs text-sand-500">#{t.id}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="font-body text-sm text-sand-300 truncate">{t.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={11} className="text-sand-600 shrink-0" />
                        <p className="text-xs text-sand-600 truncate">{t.address}</p>
                      </div>
                      {selected === t.id && (
                        <button onClick={e => { e.stopPropagation(); openInMaps(t) }}
                          className="mt-2 flex items-center gap-1.5 text-xs font-mono text-forest-400 hover:text-forest-300 border border-forest-700/40 hover:border-forest-500/50 px-2.5 py-1 rounded-lg transition-all">
                          <Navigation size={11} /> Navigate
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              )
          }
        </div>
      </div>
    </div>
  )
}
