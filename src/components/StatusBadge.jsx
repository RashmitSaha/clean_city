import { classNames } from '../utils/helpers.js'

const STATUS_STYLES = {
  // Report / task statuses
  pending:     'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  assigned:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_progress: 'bg-sand-500/15 text-sand-300 border-sand-500/30',
  resolved:    'bg-forest-500/15 text-forest-300 border-forest-500/30',
  closed:      'bg-forest-800/40 text-sand-600 border-forest-700/30',
  cancelled:   'bg-red-500/15 text-red-300 border-red-500/30',
  // Priority
  low:         'bg-forest-500/15 text-forest-300 border-forest-500/30',
  medium:      'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  high:        'bg-orange-500/15 text-orange-300 border-orange-500/30',
  critical:    'bg-red-500/15 text-red-300 border-red-500/30',
  // User statuses
  active:      'bg-forest-500/15 text-forest-300 border-forest-500/30',
  inactive:    'bg-forest-800/40 text-sand-600 border-forest-700/30',
  suspended:   'bg-red-500/15 text-red-300 border-red-500/30',
}

const STATUS_LABELS = {
  pending:     'Pending',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
  cancelled:   'Cancelled',
  low:         'Low',
  medium:      'Medium',
  high:        'High',
  critical:    'Critical',
  active:      'Active',
  inactive:    'Inactive',
  suspended:   'Suspended',
}

export default function StatusBadge({ status, className = '' }) {
  const key = status?.toLowerCase().replace(/\s+/g, '_')
  return (
    <span className={classNames(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono border tracking-wide',
      STATUS_STYLES[key] ?? 'bg-forest-800/40 text-sand-500 border-forest-700/30',
      className
    )}>
      {STATUS_LABELS[key] ?? status}
    </span>
  )
}
