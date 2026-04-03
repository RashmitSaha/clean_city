import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { classNames } from '../utils/helpers.js'

export function FormField({ label, id, type = 'text', error, className = '', ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-sand-300 font-display tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={classNames(
            'w-full px-4 py-3 rounded-xl bg-forest-900/60 border text-sand-100 placeholder-sand-600',
            'font-body text-sm focus:outline-none focus:ring-2 transition-all duration-200',
            'backdrop-blur-sm',
            error
              ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500'
              : 'border-forest-700/60 focus:ring-forest-500/30 focus:border-forest-500',
            isPassword ? 'pr-12' : ''
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-sand-300 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-0.5 font-mono">{error}</p>
      )}
    </div>
  )
}

export function SelectField({ label, id, error, children, className = '', ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-sand-300 font-display tracking-wide">
          {label}
        </label>
      )}
      <select
        id={id}
        className={classNames(
          'w-full px-4 py-3 rounded-xl bg-forest-900/60 border text-sand-100',
          'font-body text-sm focus:outline-none focus:ring-2 transition-all duration-200',
          'backdrop-blur-sm appearance-none cursor-pointer',
          error
            ? 'border-red-500/60 focus:ring-red-500/30'
            : 'border-forest-700/60 focus:ring-forest-500/30 focus:border-forest-500'
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-red-400 mt-0.5 font-mono">{error}</p>
      )}
    </div>
  )
}

export function TextareaField({ label, id, error, className = '', ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-sand-300 font-display tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={classNames(
          'w-full px-4 py-3 rounded-xl bg-forest-900/60 border text-sand-100 placeholder-sand-600',
          'font-body text-sm focus:outline-none focus:ring-2 transition-all duration-200',
          'backdrop-blur-sm resize-none',
          error
            ? 'border-red-500/60 focus:ring-red-500/30'
            : 'border-forest-700/60 focus:ring-forest-500/30 focus:border-forest-500'
        )}
        rows={4}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 mt-0.5 font-mono">{error}</p>
      )}
    </div>
  )
}
