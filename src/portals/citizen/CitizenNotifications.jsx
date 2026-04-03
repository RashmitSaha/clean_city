import { useEffect, useState } from 'react'
import { Bell, CheckCheck, AlertCircle } from 'lucide-react'
import { PageHeader, Card, Skeleton, EmptyState, GhostButton } from '../../components/PortalUI.jsx'
import { classNames } from '../../utils/helpers.js'

export function CitizenNotifications() {
  const [notifications, setNotifications] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // TODO: replace with real API
        // const res = await fetch('/api/citizen/notifications', { headers: { Authorization: `Bearer ${token}` } })
        // if (!res.ok) throw new Error('Failed to load notifications')
        // setNotifications(await res.json()) // [{ id, title, body, read, createdAt, type }]
        throw new Error('Notifications API not connected — wire up /api/citizen/notifications')
      } catch (err) {
        setError(err.message)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function markAllRead() {
    // TODO: PATCH /api/citizen/notifications/read-all
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  const TYPE_ICON_COLOR = {
    status_update: 'text-forest-400',
    assignment:    'text-sand-400',
    alert:         'text-red-400',
    info:          'text-blue-400',
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      >
        {unreadCount > 0 && (
          <GhostButton onClick={markAllRead}>
            <CheckCheck size={15} />
            Mark all read
          </GhostButton>
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
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            body="You'll be notified when your reports are updated or actions are taken."
          />
        ) : (
          <div className="divide-y divide-forest-800/30">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={classNames(
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  !n.read ? 'bg-forest-800/20' : 'hover:bg-forest-800/10'
                )}
              >
                <div className={classNames(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  'bg-forest-800/50 border border-forest-700/40'
                )}>
                  <Bell size={14} className={TYPE_ICON_COLOR[n.type] ?? 'text-sand-500'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-600 text-sm text-sand-200">{n.title}</p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-forest-400 shrink-0" />
                    )}
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

export default CitizenNotifications
