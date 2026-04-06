import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import { FormField } from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { validators, validateFields, hasErrors } from '../utils/helpers.js'

const ROLE_REDIRECT = { citizen: '/citizen', collector: '/collector', admin: '/admin' }

export default function LoginPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { login }      = useAuth()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading]   = useState(false)

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((err) => ({ ...err, [field]: null }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)
    const fieldErrors = validateFields(
      { email: validators.email, password: validators.required },
      values
    )
    if (hasErrors(fieldErrors)) { setErrors(fieldErrors); return }

    setLoading(true)
    try {
      const user = await login(values)
      navigate(ROLE_REDIRECT[user.role] ?? '/')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your CleanCity account"
    >
      {params.get('registered') && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forest-700/30 border border-forest-600/40 text-forest-300 text-sm font-body mb-4">
          <CheckCircle size={15} /> Account created — sign in below
        </div>
      )}

      {apiError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body mb-4">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-display font-600 text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in…</>
            : 'Sign in'}
        </button>

        <p className="text-center text-sm font-body text-sand-600">
          No account?{' '}
          <Link to="/signup" className="text-forest-400 hover:text-forest-300 underline underline-offset-2">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
