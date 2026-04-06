import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, MapPin, AlertCircle, X, CheckCircle } from 'lucide-react'
import { PageHeader, Card, PrimaryButton, GhostButton } from '../../components/PortalUI.jsx'
import { FormField, SelectField, TextareaField } from '../../components/FormField.jsx'
import { validators, validateFields, hasErrors } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const CATEGORIES = ['Illegal Dumping','Missed Pickup','Overflowing Bin','Hazardous Waste','Recycling Issue','Bulk Waste','Other']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

export default function NewReport() {
  const navigate  = useNavigate()
  const { apiFetch } = useAuth()
  const fileRef   = useRef(null)

  const [values, setValues] = useState({ category:'', priority:'Medium', description:'', address:'', latitude:'', longitude:'' })
  const [photos,   setPhotos]   = useState([])
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [locating, setLocating] = useState(false)

  function set(field) {
    return e => {
      setValues(v => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors(err => ({ ...err, [field]: null }))
    }
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - photos.length)
    setPhotos(p => [...p, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))].slice(0, 4))
  }

  function removePhoto(idx) {
    setPhotos(p => { URL.revokeObjectURL(p[idx].preview); return p.filter((_, i) => i !== idx) })
  }

  function detectLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setValues(v => ({ ...v, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })); setLocating(false) },
      () => setLocating(false)
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)
    const fieldErrors = validateFields({ category: validators.required, description: validators.minLength(10), address: validators.required }, values)
    if (hasErrors(fieldErrors)) { setErrors(fieldErrors); return }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(values).forEach(([k, v]) => { if (v !== '') formData.append(k, v) })
      photos.forEach(({ file }) => formData.append('photos', file))

      const res = await apiFetch('/api/reports', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Submission failed')
      }
      setSuccess(true)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 max-w-2xl flex flex-col items-center justify-center gap-6 py-24">
        <div className="w-16 h-16 rounded-2xl bg-forest-700/40 border border-forest-600/40 flex items-center justify-center">
          <CheckCircle size={32} className="text-forest-400" />
        </div>
        <div className="text-center">
          <h2 className="font-display font-700 text-2xl text-sand-100 mb-2">Report submitted!</h2>
          <p className="font-body text-sand-500">Your report has been received and will be assigned to a collector shortly.</p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton onClick={() => navigate('/citizen/reports')}>View my reports</PrimaryButton>
          <GhostButton onClick={() => { setSuccess(false); setValues({ category:'', priority:'Medium', description:'', address:'', latitude:'', longitude:'' }); setPhotos([]) }}>
            Submit another
          </GhostButton>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Submit a Report" subtitle="Describe the waste issue so collectors can respond quickly" />

      {apiError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <Card className="p-5 flex flex-col gap-5">
          <h3 className="font-display font-600 text-sand-200 text-sm">Issue Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Category *" id="category" value={values.category} onChange={set('category')} error={errors.category}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField label="Priority" id="priority" value={values.priority} onChange={set('priority')}>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </SelectField>
          </div>
          <TextareaField label="Description *" id="description" placeholder="Describe the issue in detail…" value={values.description} onChange={set('description')} error={errors.description} />
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-600 text-sand-200 text-sm">Location</h3>
            <button type="button" onClick={detectLocation} disabled={locating}
              className="flex items-center gap-1.5 text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors disabled:opacity-50">
              <MapPin size={13} />{locating ? 'Detecting…' : 'Use my location'}
            </button>
          </div>
          <FormField label="Street address / landmark *" id="address" type="text" placeholder="e.g. Corner of Main St & Park Ave" value={values.address} onChange={set('address')} error={errors.address} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude" id="latitude" type="text" placeholder="Auto-detected" value={values.latitude} onChange={set('latitude')} />
            <FormField label="Longitude" id="longitude" type="text" placeholder="Auto-detected" value={values.longitude} onChange={set('longitude')} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <h3 className="font-display font-600 text-sand-200 text-sm">Photos (up to 4)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-forest-700/50 group">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-forest-950/80 flex items-center justify-center text-sand-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-forest-700/50 hover:border-forest-500/60 flex flex-col items-center justify-center gap-2 text-sand-600 hover:text-sand-400 transition-all">
                <Upload size={20} />
                <span className="text-xs font-mono">Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </Card>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading
              ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
              : 'Submit Report'}
          </PrimaryButton>
          <GhostButton onClick={() => navigate('/citizen')}>Cancel</GhostButton>
        </div>
      </form>
    </div>
  )
}
