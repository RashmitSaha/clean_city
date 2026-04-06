import { useEffect, useState, useCallback } from 'react'
import { Users, Search, AlertCircle, ShieldOff, ShieldCheck, X, UserPlus } from 'lucide-react'
import { PageHeader, Card, Table, Td, Skeleton, EmptyState, PrimaryButton } from '../../components/PortalUI.jsx'
import { FormField, SelectField } from '../../components/FormField.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'

const ROLE_TABS = ['All', 'Citizen', 'Collector']
const PER_PAGE  = 12

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, dangerous = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-600 text-sand-100">Confirm Action</h3>
          <button onClick={onCancel} className="text-sand-500 hover:text-sand-300"><X size={16} /></button>
        </div>
        <p className="text-sm font-body text-sand-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className={classNames('flex-1 py-2.5 rounded-xl text-sm font-display font-600 transition-colors',
              dangerous ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-forest-500 hover:bg-forest-400 text-white')}>
            Confirm
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

// ── Create user modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const { apiFetch } = useAuth()
  const [values, setValues] = useState({ full_name: '', email: '', password: '', role: 'citizen', phone: '' })
  const [error,  setError]  = useState(null)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return e => setValues(v => ({ ...v, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!values.full_name || !values.email || !values.password) {
      setError('Name, email and password are required.'); return
    }
    setSaving(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/admin/users', {
        method: 'POST',
        body:   JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail ?? 'Failed to create user')
      onCreated(json)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-forest-900 border border-forest-700/60 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-700 text-sand-100">Create User</h3>
          <button onClick={onClose} className="text-sand-500 hover:text-sand-300"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body mb-4">
            <AlertCircle size={13} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Full Name *"   id="fn" type="text"     value={values.full_name} onChange={set('full_name')} placeholder="Jane Smith" />
          <FormField label="Email *"       id="em" type="email"    value={values.email}     onChange={set('email')}     placeholder="jane@example.com" />
          <FormField label="Password *"    id="pw" type="password" value={values.password}  onChange={set('password')}  placeholder="Min 8 characters" />
          <FormField label="Phone"         id="ph" type="text"     value={values.phone}     onChange={set('phone')}     placeholder="+1-555-0100" />
          <SelectField label="Role" id="role" value={values.role} onChange={set('role')}>
            <option value="citizen">Citizen</option>
            <option value="collector">Collector</option>
            <option value="admin">Admin</option>
          </SelectField>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-display font-600 bg-forest-500 hover:bg-forest-400 text-white transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create User'}
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

// ── Main component ────────────────────────────────────────────────────────────
const ROLE_BADGE = {
  citizen:   'bg-forest-500/15 text-forest-300 border-forest-500/30',
  collector: 'bg-sand-500/15 text-sand-300 border-sand-500/30',
  admin:     'bg-red-500/15 text-red-300 border-red-500/30',
}

export default function UsersManager() {
  const { apiFetch } = useAuth()
  const [users,   setUsers]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [roleTab, setRoleTab] = useState('All')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [confirm, setConfirm] = useState(null)   // { userId, action, message, dangerous }
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE })
      if (roleTab !== 'All') params.set('role', roleTab.toLowerCase())
      const res  = await apiFetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to load users')
      const json = await res.json()
      setUsers(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch, page, roleTab])

  useEffect(() => { load() }, [load])

  // Client-side search filter (the API doesn't yet support search by name)
  const filtered = search
    ? (users ?? []).filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : (users ?? [])

  async function applyAction(userId, action) {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/deactivate`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Action failed')
      // Optimistic update — mark inactive in local state
      setUsers(prev => prev?.map(u => u.id === userId ? { ...u, is_active: action !== 'suspend' } : u))
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirm(null)
    }
  }

  function requestAction(user, action) {
    const isSuspend = action === 'suspend'
    setConfirm({
      userId:    user.id,
      action,
      message:   isSuspend
        ? `Deactivate ${user.full_name}? They will lose platform access until reactivated.`
        : `Reactivate ${user.full_name}? They will regain full access to their portal.`,
      dangerous: isSuspend,
    })
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          dangerous={confirm.dangerous}
          onConfirm={() => applyAction(confirm.userId, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={newUser => {
            setUsers(prev => [newUser, ...(prev ?? [])])
            setTotal(t => t + 1)
          }}
        />
      )}

      <PageHeader title="Users" subtitle="All registered citizens and collectors">
        <PrimaryButton onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Create User
        </PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-600 pointer-events-none" />
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-900/60 border border-forest-700/50 text-sand-200 placeholder-sand-600 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500" />
        </div>
        <div className="flex items-center gap-2">
          {ROLE_TABS.map(t => (
            <button key={t} onClick={() => { setRoleTab(t); setPage(1) }}
              className={classNames('px-4 py-2 rounded-xl text-xs font-mono border transition-all',
                roleTab === t ? 'bg-forest-700/50 border-forest-500/60 text-forest-300'
                              : 'bg-transparent border-forest-800/50 text-sand-600 hover:border-forest-700 hover:text-sand-400')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-body">{error}</p>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" body="Try adjusting your search or role filter." />
        ) : (
          <>
            <Table headers={['User', 'Email', 'Role', 'Zone', 'Joined', 'Status', 'Actions']}>
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-forest-800/20 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-forest-800 flex items-center justify-center text-xs font-mono text-forest-300 shrink-0">
                        {u.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-body text-sand-200 text-sm">{u.full_name}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-sand-500">{u.email}</Td>
                  <Td>
                    <span className={classNames('px-2.5 py-1 rounded-full text-xs font-mono border',
                      ROLE_BADGE[u.role] ?? 'bg-forest-800/40 text-sand-500 border-forest-700/30')}>
                      {u.role}
                    </span>
                  </Td>
                  <Td className="text-sand-500 text-sm">{u.zone_id ? `Zone ${u.zone_id}` : '—'}</Td>
                  <Td className="font-mono text-xs text-sand-600">
                    {/* Users don't have created_at in the current UserOut schema — show ID as proxy */}
                    #{u.id}
                  </Td>
                  <Td>
                    <span className={classNames('px-2.5 py-1 rounded-full text-xs font-mono border',
                      u.is_active
                        ? 'bg-forest-500/15 text-forest-300 border-forest-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td>
                    {u.is_active ? (
                      <button onClick={() => requestAction(u, 'suspend')}
                        className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                        <ShieldOff size={11} /> Deactivate
                      </button>
                    ) : (
                      <button onClick={() => requestAction(u, 'reactivate')}
                        className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-forest-500/15 text-forest-300 border border-forest-500/30 hover:bg-forest-500/25 transition-colors">
                        <ShieldCheck size={11} /> Reactivate
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>

            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-forest-800/40 flex items-center justify-between">
                <p className="text-xs font-mono text-sand-600">Page {page} of {totalPages} · {total} users</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono border border-forest-800/50 text-sand-500 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
