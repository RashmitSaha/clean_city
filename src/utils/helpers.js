// ─── Role colour map ────────────────────────────────────────────────────────
export const ROLE_COLORS = {
  citizen:   { bg: 'bg-forest-500/20', text: 'text-forest-300', border: 'border-forest-500/40' },
  collector: { bg: 'bg-sand-500/20',   text: 'text-sand-300',   border: 'border-sand-500/40'   },
  admin:     { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40'    },
}

export function getRoleColors(role) {
  return ROLE_COLORS[role] ?? ROLE_COLORS.citizen
}

// ─── Field validators ────────────────────────────────────────────────────────
export const validators = {
  required: (value) =>
    value?.toString().trim() ? null : 'This field is required.',

  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim())
      ? null
      : 'Enter a valid email address.',

  password: (value) =>
    value?.length >= 8
      ? null
      : 'Password must be at least 8 characters.',

  confirmPassword: (password) => (value) =>
    value === password ? null : 'Passwords do not match.',

  phone: (value) =>
    !value || /^\+?[\d\s\-()]{7,15}$/.test(value.trim())
      ? null
      : 'Enter a valid phone number.',

  minLength: (min) => (value) =>
    value?.trim().length >= min
      ? null
      : `Must be at least ${min} characters.`,
}

// Run a map of { fieldName: validatorFn } against a values object
// Returns { fieldName: errorString | null }
export function validateFields(rules, values) {
  return Object.fromEntries(
    Object.entries(rules).map(([field, validate]) => [
      field,
      validate(values[field]),
    ])
  )
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

// ─── Misc helpers ────────────────────────────────────────────────────────────
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
