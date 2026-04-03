import { classNames } from '../utils/helpers.js'

/** Full-width page header with title, optional subtitle and right slot */
export function PageHeader({ title, subtitle, children, className = '' }) {
  return (
    <div className={classNames('flex items-start justify-between gap-4 flex-wrap', className)}>
      <div>
        <h1 className="font-display font-700 text-2xl text-sand-100 tracking-tight">{title}</h1>
        {subtitle && <p className="font-body text-sm text-sand-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  )
}

/** Stat card — used in dashboard KPI rows */
export function StatCard({ label, value, sub, icon: Icon, accent = 'forest', className = '' }) {
  const colors = {
    forest: 'text-forest-400',
    sand:   'text-sand-400',
    red:    'text-red-400',
    yellow: 'text-yellow-400',
    blue:   'text-blue-400',
  }

  return (
    <div className={classNames(
      'p-5 rounded-2xl bg-forest-900/40 border border-forest-800/50 flex flex-col gap-3',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-sand-600 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={16} className={colors[accent] ?? colors.forest} />}
      </div>
      {/* Value — empty/loading state handled by parent passing null */}
      <div>
        <p className="font-display font-700 text-3xl text-sand-100">
          {value ?? <span className="text-forest-800 text-xl font-mono">—</span>}
        </p>
        {sub && <p className="text-xs font-body text-sand-600 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

/** Generic empty state */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-forest-800/40 border border-forest-700/40 flex items-center justify-center">
          <Icon size={24} className="text-forest-600" />
        </div>
      )}
      <div>
        <p className="font-display font-600 text-sand-300 mb-1">{title}</p>
        {body && <p className="text-sm font-body text-sand-600 max-w-xs">{body}</p>}
      </div>
      {action}
    </div>
  )
}

/** Section card wrapper */
export function Card({ children, className = '' }) {
  return (
    <div className={classNames(
      'rounded-2xl bg-forest-900/40 border border-forest-800/50',
      className
    )}>
      {children}
    </div>
  )
}

/** Table wrapper */
export function Table({ headers = [], children, className = '' }) {
  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forest-800/50">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-mono text-xs text-sand-600 uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-800/30">
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }) {
  return (
    <td className={classNames('px-4 py-3.5 font-body text-sand-400 text-sm align-middle', className)}>
      {children}
    </td>
  )
}

/** Loading skeleton bar */
export function Skeleton({ className = '' }) {
  return (
    <div className={classNames('animate-pulse rounded-lg bg-forest-800/50', className)} />
  )
}

/** Primary action button */
export function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'flex items-center gap-2 bg-forest-500 hover:bg-forest-400 disabled:bg-forest-700 disabled:cursor-not-allowed',
        'text-white font-display font-600 px-4 py-2.5 rounded-xl transition-colors duration-200 text-sm',
        className
      )}
    >
      {children}
    </button>
  )
}

/** Ghost / secondary button */
export function GhostButton({ children, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={classNames(
        'flex items-center gap-2 border border-forest-700/60 text-sand-400 hover:text-sand-200 hover:border-forest-600',
        'font-display font-500 px-4 py-2.5 rounded-xl transition-all text-sm',
        className
      )}
    >
      {children}
    </button>
  )
}
