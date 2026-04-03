import { useEffect, useState } from 'react'
import { Map, Plus, Pencil, Trash2, AlertCircle, X, Users } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import { FormField, TextareaField } from '../../components/FormField.jsx'
import { validators, validateFields, hasErrors } from '../../utils/helpers.js'
import StatusBadge from '../../components/StatusBadge.jsx'

const EMPTY_FORM = { name: '', description: '', collectorIds: [] }

function ZoneFormModal({ zone, collectors, onClose, onSave }) {
  const [values, setValues]   = useState(zone ?? EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const isEditing = !!zone?.id

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((e2) => ({ ...e2, [field]: null }))
    }
  }

  function toggleCollector(id) {
    setValues((v) => ({
      ...v,
      collectorIds: v.collectorIds.includes(id)
        ? v.collectorIds.filter((c) => c !== id)
        : [...v.collectorIds, id],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const fieldErrors = validateFields({ name: validators.minLength(2) }, values)
    if (hasErrors(fieldErrors)) { setErrors(fieldErrors); return }
    setSaving(true)
    try {
      // TODO: POST /api/admin/zones (create) or PUT /api/admin/zones/:id (update)
      // const method = isEditing ? 'PUT' : 'POST'
      // const url    = isEditing ? `/api/admin/zones/${zone.id}` : '/api/admin/zones'
      // const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(values) })
      // if (!res.ok) throw new Error((await res.json()).message)
      // const saved = await res.json()
      onSave({ ...values, id: zone?.id ?? Date.now() }) // placeholder until API connected
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-700 text-sand-100">{isEditing ? 'Edit Zone' : 'New Zone'}</h3>
          <button onClick={onClose} className="text-sand-500 hover:text-sand-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <FormField
            label="Zone Name *"
            id="zoneName"
            type="text"
            placeholder="e.g. North District"
            value={values.name}
            onChange={set('name')}
            error={errors.name}
          />

          <TextareaField
            label="Description"
            id="zoneDesc"
            placeholder="Describe this zone's boundaries or coverage area…"
            value={values.description}
            onChange={set('description')}
          />

          {/* Collector assignment */}
          {collectors && collectors.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-display font-medium text-sand-300 tracking-wide">
                Assign Collectors
              </p>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {collectors.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-forest-800/50 hover:border-forest-700/60 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={values.collectorIds.includes(c.id)}
                      onChange={() => toggleCollector(c.id)}
                      className="w-4 h-4 rounded accent-forest-500"
                    />
                    <span className="text-sm font-body text-sand-300">{c.name}</span>
                    {c.zone && <span className="ml-auto text-xs font-mono text-sand-600">{c.zone}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Zone'}
            </PrimaryButton>
            <button type="button" onClick={onClose}
              className="flex items-center gap-2 border border-forest-700/60 text-sand-400 hover:text-sand-200 font-display font-500 px-4 py-2.5 rounded-xl transition-all text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ZoneManager() {
  const [zones,      setZones]      = useState(null)
  const [collectors, setCollectors] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [modal,      setModal]      = useState(null) // null | 'new' | zone object

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API
        // const [zonesRes, collectorsRes] = await Promise.all([
        //   fetch('/api/admin/zones', { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch('/api/admin/collectors', { headers: { Authorization: `Bearer ${token}` } }),
        // ])
        // setZones((await zonesRes.json()).data)
        //   // [{ id, name, description, collectorIds, collectorNames, activeReports, totalReports, status }]
        // setCollectors((await collectorsRes.json()).data)
        throw new Error('Zones API not connected — wire up /api/admin/zones')
      } catch (err) {
        setError(err.message)
        setZones([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleSaved(zone) {
    setZones((prev) => {
      const exists = prev?.find((z) => z.id === zone.id)
      return exists
        ? prev.map((z) => z.id === zone.id ? zone : z)
        : [...(prev ?? []), zone]
    })
  }

  async function deleteZone(id) {
    if (!window.confirm('Delete this zone? This cannot be undone.')) return
    // TODO: DELETE /api/admin/zones/:id
    setZones((prev) => prev?.filter((z) => z.id !== id))
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {modal !== null && (
        <ZoneFormModal
          zone={modal === 'new' ? null : modal}
          collectors={collectors}
          onClose={() => setModal(null)}
          onSave={handleSaved}
        />
      )}

      <PageHeader title="Zones" subtitle="Define and manage collection zones and collector assignments">
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
          <EmptyState
            icon={Map}
            title="No zones defined"
            body="Create your first zone to start assigning collectors and tracking reports geographically."
            action={<PrimaryButton onClick={() => setModal('new')}><Plus size={15} /> Create Zone</PrimaryButton>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((z) => (
            <div
              key={z.id}
              className="p-5 rounded-2xl bg-forest-900/40 border border-forest-800/50 hover:border-forest-700/50 transition-all flex flex-col gap-4 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-600 text-sand-100 truncate">{z.name}</h3>
                  {z.description && (
                    <p className="text-xs font-body text-sand-600 mt-0.5 line-clamp-2">{z.description}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModal(z)}
                    className="p-1.5 rounded-lg text-sand-500 hover:text-sand-200 hover:bg-forest-800/50 transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteZone(z.id)}
                    className="p-1.5 rounded-lg text-sand-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Zone stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-forest-800/30 border border-forest-700/30">
                  <p className="font-display font-700 text-lg text-sand-100">
                    {z.activeReports ?? <span className="text-sand-700 text-sm font-mono">—</span>}
                  </p>
                  <p className="text-xs font-mono text-sand-600">Active</p>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-800/30 border border-forest-700/30">
                  <p className="font-display font-700 text-lg text-sand-100">
                    {z.totalReports ?? <span className="text-sand-700 text-sm font-mono">—</span>}
                  </p>
                  <p className="text-xs font-mono text-sand-600">Total</p>
                </div>
              </div>

              {/* Collectors */}
              <div className="flex items-center gap-2">
                <Users size={13} className="text-sand-600 shrink-0" />
                <p className="text-xs font-body text-sand-500 truncate">
                  {z.collectorNames?.join(', ') || <span className="text-sand-700">No collectors assigned</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
