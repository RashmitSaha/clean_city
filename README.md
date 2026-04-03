# CleanCity — React + Tailwind CSS

Urban waste management platform connecting citizens, collectors, and administrators.

---

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Icons | Lucide React |
| Fonts | Syne (display) · DM Sans (body) · DM Mono (mono) |

---

## Project structure

```
cleancity/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              ← React entry point
    ├── App.jsx               ← Route definitions
    ├── index.css             ← Tailwind directives + global styles
    │
    ├── pages/
    │   ├── LandingPage.jsx   ← Public marketing page
    │   ├── LoginPage.jsx     ← Email + password sign-in
    │   └── SignupPage.jsx    ← 3-step registration wizard
    │
    ├── components/
    │   ├── Navbar.jsx        ← Sticky top nav (scroll-aware)
    │   ├── Footer.jsx        ← Site footer
    │   ├── AuthLayout.jsx    ← Split-panel auth wrapper
    │   └── FormField.jsx     ← Input, Select, Textarea with error states
    │
    ├── context/
    │   └── AuthContext.jsx   ← Auth state + login/signup/logout stubs
    │
    └── utils/
        └── helpers.js        ← Validators, classNames, role colour map
```

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Connecting to your backend

All API integration points are clearly marked with `// TODO:` comments.

### Authentication — `src/context/AuthContext.jsx`

Replace the stub implementations of `login()` and `signup()` with your real endpoint calls:

```js
// login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!res.ok) throw new Error((await res.json()).message)
const { user, token } = await res.json()
setUser(user)
localStorage.setItem('token', token) // or use HttpOnly cookies

// signup
const res = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
```

### Sign-in page — `src/pages/LoginPage.jsx`

Find the `handleSubmit` function and replace the thrown error with your auth context call:

```js
await login(values)        // calls AuthContext.login
navigate('/dashboard')     // redirect after success
```

### Sign-up page — `src/pages/SignupPage.jsx`

Find `handleSubmit` and replace with:

```js
await signup(values)
navigate('/login?registered=1')
```

---

## Validation

All field validation lives in `src/utils/helpers.js` under `validators`:

| Validator | Usage |
|---|---|
| `validators.required` | Any mandatory field |
| `validators.email` | Email format check |
| `validators.password` | Min 8 characters |
| `validators.confirmPassword(pw)` | Cross-field match |
| `validators.phone` | Optional, E.164-ish |
| `validators.minLength(n)` | Custom min length |

Add more validators to the same file; they all follow the same `(value) => string | null` signature.

---

## Role system

Three roles are defined. The `getRoleColors(role)` helper in `utils/helpers.js` returns Tailwind class strings for consistent role-coloured UI across the app.

| Role | Description |
|---|---|
| `citizen` | Reports waste issues, tracks status |
| `collector` | Receives and resolves assigned tasks |
| `admin` | Full platform oversight and analytics |

---

## Design tokens

All design decisions (colours, fonts, spacing) live in `tailwind.config.js`. The colour palette uses:

- **forest** (green) — primary brand, actions, success states  
- **sand** (warm grey) — text hierarchy on dark backgrounds  
- **red** — error / danger states  

---

## Adding new pages

1. Create `src/pages/YourPage.jsx`
2. Add a `<Route>` in `src/App.jsx`
3. Use `AuthLayout` for authenticated split-view pages, or build freely for dashboard pages

---

## Build for production

```bash
npm run build       # outputs to /dist
npm run preview     # local preview of production build
```
