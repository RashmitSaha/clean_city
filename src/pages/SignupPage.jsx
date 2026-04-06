import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, AlertCircle, Check, ChevronLeft } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import { FormField, SelectField } from '../components/FormField.jsx'
import { validators, validateFields, hasErrors, classNames } from '../utils/helpers.js'

// ─── Wizard steps definition ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Account'  },
  { id: 2, label: 'Profile'  },
  { id: 3, label: 'Role'     },
]

const ROLES = [
  {
    value: 'citizen',
    label: 'Citizen',
    description: 'Report waste issues and track resolutions in your neighbourhood.',
  },
  {
    value: 'collector',
    label: 'Collector',
    description: 'Accept and resolve assigned waste collection tasks.',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Oversee operations, manage users, and review analytics.',
  },
]

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done    = step.id < current
        const active  = step.id === current

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={classNames(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300',
                  done    ? 'bg-forest-500 text-white'
                  : active ? 'bg-forest-800 border-2 border-forest-400 text-forest-300'
                  :          'bg-forest-900 border border-forest-700/50 text-sand-600'
                )}
              >
                {done ? <Check size={13} /> : step.id}
              </div>
              <span
                className={classNames(
                  'text-xs font-mono tracking-wide transition-colors',
                  active ? 'text-forest-300' : done ? 'text-sand-500' : 'text-sand-700'
                )}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px w-8 mx-1 mb-5 transition-colors duration-300"
                   style={{ background: step.id < current ? 'rgb(45 158 56 / 0.6)' : 'rgb(255 255 255 / 0.08)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Left panel ───────────────────────────────────────────────────────────────
function PanelContent({ step }) {
  const messages = {
    1: {
      heading: 'Create your CleanCity account.',
      body:    'Your account is the key to a cleaner, more accountable city.',
    },
    2: {
      heading: 'Tell us a bit about yourself.',
      body:    'Your profile helps us personalise your experience and connect you with the right resources.',
    },
    3: {
      heading: 'Choose how you contribute.',
      body:    'Each role has a dedicated portal built for how you interact with the platform.',
    },
  }

  const { heading, body } = messages[step]

  return (
    <div className="flex flex-col gap-6 max-w-xs">
      <div>
        <h2 className="font-display font-700 text-4xl text-sand-100 leading-tight mb-3">
          {heading}
        </h2>
        <p className="font-body text-sand-500 text-sm leading-relaxed">{body}</p>
      </div>

      {/* Role previews shown on step 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <div key={r.value} className="p-3 rounded-xl bg-forest-800/50 border border-forest-700/40">
              <p className="font-display font-600 text-sm text-sand-200 mb-0.5">{r.label}</p>
              <p className="font-body text-xs text-sand-500 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [values, setValues] = useState({
    // Step 1
    email:           '',
    password:        '',
    confirmPassword: '',
    // Step 2
    firstName:   '',
    lastName:    '',
    phone:       '',
    // Step 3
    role:    '',
    zone:    '',
  })
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading,  setLoading]  = useState(false)

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((err) => ({ ...err, [field]: null }))
    }
  }

  // ── Per-step validation rules ─────────────────────────────────────────────
  const STEP_RULES = {
    1: {
      email:           validators.email,
      password:        validators.password,
      confirmPassword: validators.confirmPassword(values.password),
    },
    2: {
      firstName: validators.minLength(2),
      lastName:  validators.minLength(2),
      phone:     validators.phone,
    },
    3: {
      role: validators.required,
    },
  }

  function validateStep() {
    const fieldErrors = validateFields(STEP_RULES[step], values)
    setErrors(fieldErrors)
    return !hasErrors(fieldErrors)
  }

  function handleNext(e) {
    e.preventDefault()
    if (validateStep()) setStep((s) => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep((s) => s - 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateStep()) return
    setApiError(null)
    setLoading(true)
    try {
      const payload = {
        full_name: `${values.firstName} ${values.lastName}`.trim(),
        email:     values.email,
        password:  values.password,
        role:      values.role,
        phone:     values.phone || undefined,
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Signup failed')
      }
      navigate('/login?registered=1')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isLast = step === STEPS.length

  return (
    <AuthLayout panelContent={<PanelContent step={step} />}>
      <div className="flex flex-col animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-700 text-3xl text-sand-100 mb-2">Create account</h1>
          <p className="font-body text-sand-500 text-sm">
            Already have one?{' '}
            <Link to="/login" className="text-forest-400 hover:text-forest-300 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>

        <StepIndicator current={step} />

        {/* API error */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm font-body">{apiError}</p>
          </div>
        )}

        {/* Step forms */}
        <form
          key={step}
          onSubmit={isLast ? handleSubmit : handleNext}
          noValidate
          className="flex flex-col gap-5"
        >
          {/* ── Step 1: Account credentials ─────────────────────────────── */}
          {step === 1 && (
            <>
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
              <FormField
                label="Password"
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={values.password}
                onChange={set('password')}
                error={errors.password}
              />
              <FormField
                label="Confirm password"
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={values.confirmPassword}
                onChange={set('confirmPassword')}
                error={errors.confirmPassword}
              />
            </>
          )}

          {/* ── Step 2: Personal info ────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="First name"
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  value={values.firstName}
                  onChange={set('firstName')}
                  error={errors.firstName}
                />
                <FormField
                  label="Last name"
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={values.lastName}
                  onChange={set('lastName')}
                  error={errors.lastName}
                />
              </div>
              <FormField
                label="Phone number (optional)"
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
              />
            </>
          )}

          {/* ── Step 3: Role selection ───────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-display font-medium text-sand-300 tracking-wide">
                  Select your role
                </p>
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={classNames(
                      'flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200',
                      values.role === r.value
                        ? 'bg-forest-800/60 border-forest-500/70'
                        : 'bg-forest-900/40 border-forest-800/50 hover:border-forest-700/60'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={values.role === r.value}
                      onChange={set('role')}
                      className="sr-only"
                    />
                    <div
                      className={classNames(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        values.role === r.value
                          ? 'border-forest-400 bg-forest-400'
                          : 'border-forest-700'
                      )}
                    >
                      {values.role === r.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-display font-600 text-sand-100 text-sm">{r.label}</p>
                      <p className="font-body text-sand-500 text-xs mt-0.5 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </label>
                ))}
                {errors.role && (
                  <p className="text-xs text-red-400 font-mono">{errors.role}</p>
                )}
              </div>

              {/* Optional: zone/ward input for collectors */}
              {values.role === 'collector' && (
                <FormField
                  label="Collection zone / ward"
                  id="zone"
                  type="text"
                  placeholder="e.g. North District Zone 4"
                  value={values.zone}
                  onChange={set('zone')}
                  error={errors.zone}
                />
              )}
            </>
          )}

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <div className={classNames('flex gap-3 mt-2', step > 1 ? 'justify-between' : 'justify-end')}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-forest-700/60 text-sand-400 hover:text-sand-200 hover:border-forest-600 font-display font-500 text-sm transition-all"
              >
                <ChevronLeft size={15} />
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 flex-1 bg-forest-500 hover:bg-forest-400 disabled:bg-forest-700 disabled:cursor-not-allowed text-white font-display font-600 px-6 py-3.5 rounded-xl transition-colors duration-200 text-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </>
              ) : isLast ? (
                <>
                  <UserPlus size={16} />
                  Create account
                </>
              ) : (
                'Continue →'
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-sand-600 font-body">
          By continuing you agree to our{' '}
          <a href="#" className="underline underline-offset-2 hover:text-sand-400 transition-colors">Terms</a>{' '}
          and{' '}
          <a href="#" className="underline underline-offset-2 hover:text-sand-400 transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </AuthLayout>
  )
}
