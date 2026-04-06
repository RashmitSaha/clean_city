import { useEffect, useState, useCallback } from 'react'
import { Map, Plus, Pencil, Trash2, AlertCircle, X, Users } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import { FormField, TextareaField } from '../../components/FormField.jsx'
import { validators, validateFields, hasErrors } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

// ── Zone form modal ───────────────────────────────────────────────────────────
function ZoneFormModal({ zone, collectors, onClose, onSaved }) {
  const { apiFetch } = useAuth()
  const isEditing    = !!zone?.id
  const [values, setValues] = useState({ name: zone?.name ?? '', description: zone?.description ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState(null)

  function set(field) {
    return e => {
      setValues(v => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors(err => ({ ...err, [field]: null }))
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    const fieldErrors = validateFields({ name: validators.minLength(2) }, values)
    if (hasErrors(fieldErrors)) { setErrors(fieldErrors); return }
    setSaving(true)
    setApiErr(null)
    try {
      // Create only for now — the API doesn't yet expose PUT /zones/:id
      // Extend with a PUT endpoint to enable editing existing zones
      const res  = await apiFetch('/api/admin/zones', {
        method: 'POST',
        body:   JSON.stringify({ name: values.name, description: values.description }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail ?? 'Save failed')
      onSaved(json)
      onClose()
    } catch (err) {
      setApiErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-700 text-sand-100">{isEditing ? 'Edit Zone' : 'New Zone'}</h3>
          <button onClick={onClose} className="text-sand-500 hover:text-sand-300 transition-colors"><X size={18} /></button>
        </div>

        {apiErr && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body mb-4">
            <AlertCircle size={13} className="shrink-0" /> {apiErr}
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <FormField label="Zone Name *" id="zoneName" type="text"
            placeholder="e.g. North District"
            value={values.name} onChange={set('name')} error={errors.name} />
          <TextareaField label="Description" id="zoneDesc"
            placeholder="Describe this zone's boundaries or coverage area…"
            value={values.description} onChange={set('description')} />

          {/* Collector list — informational; assignment happens via user zone_id */}
          {collectors.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-display font-medium text-sand-300">Collectors in this zone</p>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {collectors.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-forest-800/40 bg-forest-900/30">
                    <div className="w-6 h-6 rounded-full bg-forest-800 flex items-center justify-center text-xs text-forest-400 shrink-0">
                      {c.full_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-body text-sand-300 truncate">{c.full_name}</span>
                    <span className="ml-auto text-xs font-mono text-sand-600">{c.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-display font-600 bg-forest-500 hover:bg-forest-400 text-white transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Zone'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border border-forest-700/60 text-sand-400 hover:text-sand-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteConfirm({ zone, onCancel, onDeleted }) {
  const { apiFetch } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/admin/zones/${zone.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Delete failed')
      onDeleted(zone.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-600 text-sand-100">Delete Zone</h3>
          <button onClick={onCancel} className="text-sand-500 hover:text-sand-300"><X size={16} /></button>
        </div>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <p className="text-sm font-body text-sand-400 mb-6">
          Delete <span className="text-sand-200 font-600">{zone.name}</span>? Reports linked to this zone will lose their zone assignment. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-display font-600 bg-red-500 hover:bg-red-400 text-white transition-colors disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete Zone'}
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm border border-forest-700/60 text-sand-400 hover:text-sand-200 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ZoneManager() {
  const { apiFetch }  = useAuth()
  const [zones,      setZones]      = useState(null)
  const [collectors, setCollectors] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [modal,      setModal]      = useState(null)   // null | 'new' | zone-object
  const [delTarget,  setDelTarget]  = useState(null)   // zone to delete

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [zonesRes, usersRes] = await Promise.all([
        apiFetch('/api/admin/zones'),
        apiFetch('/api/admin/users?role=collector&limit=100'),
      ])
      if (!zonesRes.ok) throw new Error('Failed to load zones')
      const zonesJson   = await zonesRes.json()
      const usersJson   = usersRes.ok ? await usersRes.json() : { data: [] }
      setZones(zonesJson)
      setCollectors(usersJson.data ?? [])
    } catch (err) {
      setError(err.message)
      setZones([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  // Collectors assigned to a given zone (by zone_id match)
  function collectorsForZone(zoneId) {
    return collectors.filter(c => c.zone_id === zoneId)
  }

  // Count reports per zone — we don't have a per-zone endpoint yet,
  // so we show a placeholder stat that can be replaced when the endpoint is added
  function handleSaved(zone) {
    setZones(prev => {
      const exists = prev?.find(z => z.id === zone.id)
      return exists ? prev.map(z => z.id === zone.id ? zone : z) : [...(prev ?? []), zone]
    })
  }

  function handleDeleted(zoneId) {
    setZones(prev => prev?.filter(z => z.id !== zoneId))
    setDelTarget(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">

      {modal !== null && (
        <ZoneFormModal
          zone={modal === 'new' ? null : modal}
          collectors={modal !== 'new' ? collectorsForZone(modal.id) : []}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {delTarget && (
        <DeleteConfirm
          zone={delTarget}
          onCancel={() => setDelTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      <PageHeader title="Zones" subtitle="Define collection zones and track their activity">
        <PrimaryButton onClick={() => setModal('new')}>
          <Plus size={16} /> New Zone
        </PrimaryButton>
      </PageHeader>

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : !zones || zones.length === 0 ? (
        <Card>
          <EmptyState icon={Map} title="No zones defined"
            body="Create your first zone to start assigning collectors and tracking reports geographically."
            action={<PrimaryButton onClick={() => setModal('new')}><Plus size={15} /> Create Zone</PrimaryButton>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(z => {
            const zoneCollectors = collectorsForZone(z.id)
            return (
              <div key={z.id}
                className="p-5 rounded-2xl bg-forest-900/40 border border-forest-800/50 hover:border-forest-700/50 transition-all flex flex-col gap-4 group">

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-600 text-sand-100 truncate">{z.name}</h3>
                    {z.description && (
                      <p className="text-xs font-body text-sand-600 mt-0.5 line-clamp-2">{z.description}</p>
                    )}
                  </div>
                  {/* Edit / Delete — visible on hover */}
                  <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(z)}
                      className="p-1.5 rounded-lg text-sand-500 hover:text-sand-200 hover:bg-forest-800/50 transition-all"
                      title="Edit zone">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDelTarget(z)}
                      className="p-1.5 rounded-lg text-sand-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete zone">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Zone ID badge */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-forest-800/50 text-forest-400 border border-forest-700/30">
                    ID #{z.id}
                  </span>
                </div>

                {/* Collectors assigned */}
                <div className="flex items-start gap-2 min-h-[2rem]">
                  <Users size={13} className="text-sand-600 shrink-0 mt-0.5" />
                  {zoneCollectors.length === 0 ? (
                    <p className="text-xs font-body text-sand-700">No collectors assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {zoneCollectors.slice(0, 3).map(c => (
                        <span key={c.id}
                          className="px-2 py-0.5 rounded-full text-xs font-body bg-forest-800/40 text-sand-400 border border-forest-700/30 truncate max-w-[100px]"
                          title={c.full_name}>
                          {c.full_name.split(' ')[0]}
                        </span>
                      ))}
                      {zoneCollectors.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono text-sand-600">
                          +{zoneCollectors.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
