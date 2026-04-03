import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import { FormField } from '../components/FormField.jsx'
import { validators, validateFields, hasErrors } from '../utils/helpers.js'

// ─── Left panel decorative content ──────────────────────────────────────────
function PanelContent() {
  return (
    <div className="flex flex-col gap-8 max-w-xs">
      <div>
        <h2 className="font-display font-700 text-4xl text-sand-100 leading-tight mb-4">
          Welcome back to a cleaner city.
        </h2>
        <p className="font-body text-sand-500 text-sm leading-relaxed">
          Sign in to report issues, track collections, and keep your neighbourhood accountable.
        </p>
      </div>

      {/* Decorative stats — labels only, no hardcoded numbers */}
      <div className="flex flex-col gap-4">
        {[
          { label: 'Reports resolved today' },
          { label: 'Active collectors online' },
          { label: 'Neighbourhoods covered' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-4 rounded-xl bg-forest-800/50 border border-forest-700/40"
          >
            <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse-slow shrink-0" />
            <span className="font-body text-sm text-sand-400">{stat.label}</span>
            <span className="ml-auto font-mono text-xs text-forest-600">live</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate()

  const [values, setValues]   = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      // Clear field error on change
      if (errors[field]) setErrors((err) => ({ ...err, [field]: null }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    const fieldErrors = validateFields(
      {
        email:    validators.email,
        password: validators.required,
      },
      values
    )

    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      // TODO: replace with real auth call
      // await authContext.login(values)
      // navigate('/dashboard')
      throw new Error('Login API not connected yet — wire up your backend here.')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout panelContent={<PanelContent />}>
      <div className="flex flex-col gap-8 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="font-display font-700 text-3xl text-sand-100 mb-2">Sign in</h1>
          <p className="font-body text-sand-500 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-forest-400 hover:text-forest-300 transition-colors">
              Create one free →
            </Link>
          </p>
        </div>

        {/* API / global error */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm font-body">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Email address"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={set('email')}
            error={errors.email}
          />

          <div>
            <FormField
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={set('password')}
              error={errors.password}
            />
            <div className="mt-2 text-right">
              <a href="#" className="text-xs text-sand-500 hover:text-sand-300 font-body transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2.5 w-full bg-forest-500 hover:bg-forest-400 disabled:bg-forest-700 disabled:cursor-not-allowed text-white font-display font-600 px-6 py-3.5 rounded-xl transition-colors duration-200 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={17} />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-sand-600 font-body">
          By signing in you agree to our{' '}
          <a href="#" className="underline underline-offset-2 hover:text-sand-400 transition-colors">Terms</a>{' '}
          and{' '}
          <a href="#" className="underline underline-offset-2 hover:text-sand-400 transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </AuthLayout>
  )
}
