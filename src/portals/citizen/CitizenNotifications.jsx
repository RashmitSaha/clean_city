import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, GhostButton } from '../../components/PortalUI.jsx'
import { classNames } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSocket } from '../../hooks/useSocket.js'

/**
 * Notifications are synthesised from report status-change events received
 * via the realtime socket, plus the last 20 reports polled from the API.
 * A dedicated /api/notifications endpoint can be wired here in the future.
 */
export default function CitizenNotifications() {
  const { apiFetch } = useAuth()
  const { socket }   = useSocket()

  const [notifications, setNotifications] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  function reportToNotification(r) {
    const statusLabel = r.status.replace('_', ' ')
    return {
      id:        `report-${r.id}`,
      title:     `Report #${r.id} — ${statusLabel}`,
      body:      `${r.category} at ${r.address}`,
      read:      r.status === 'resolved' || r.status === 'cancelled',
      createdAt: r.updated_at,
      type:      r.status === 'resolved' ? 'status_update' : 'assignment',
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/reports?limit=20&page=1')
      if (!res.ok) throw new Error('Failed to load notifications')
      const json = await res.json()
      setNotifications((json.data ?? []).map(reportToNotification))
    } catch (err) {
      setError(err.message)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  // Live updates via socket
  useEffect(() => {
    if (!socket) return
    const handler = (payload) => {
      setNotifications(prev => {
        if (!prev) return prev
        const key = `report-${payload.id}`
        const existing = prev.find(n => n.id === key)
        const newNote = {
          id:        key,
          title:     `Report #${payload.id} — ${(payload.new_status ?? '').replace('_', ' ')}`,
          body:      'Your report status was just updated.',
          read:      false,
          createdAt: new Date().toISOString(),
          type:      'status_update',
        }
        return existing
          ? prev.map(n => n.id === key ? { ...newNote, read: false } : n)
          : [newNote, ...prev]
      })
    }
    socket.on('report:status_changed', handler)
    return () => socket.off('report:status_changed', handler)
  }, [socket])

  function markAllRead() {
    setNotifications(prev => prev?.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0

  const TYPE_COLOR = {
    status_update: 'text-forest-400',
    assignment:    'text-sand-400',
    alert:         'text-red-400',
    info:          'text-blue-400',
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <PageHeader title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}>
        {unreadCount > 0 && (
          <GhostButton onClick={markAllRead}><CheckCheck size={15} /> Mark all read</GhostButton>
        )}
      </PageHeader>

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
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" body="You'll be notified when your reports are updated." />
        ) : (
          <div className="divide-y divide-forest-800/30">
            {notifications.map(n => (
              <div key={n.id} className={classNames('flex items-start gap-4 px-5 py-4 transition-colors', !n.read ? 'bg-forest-800/20' : 'hover:bg-forest-800/10')}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-forest-800/50 border border-forest-700/40">
                  <Bell size={14} className={TYPE_COLOR[n.type] ?? 'text-sand-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-600 text-sm text-sand-200">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-forest-400 shrink-0" />}
                  </div>
                  <p className="font-body text-xs text-sand-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="font-mono text-xs text-sand-700 mt-1.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
