import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, MapPin, Bell, BarChart2, Users,
  Truck, ShieldCheck, Zap, ChevronDown
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// ─── Static feature / step data (UI copy, not backend data) ─────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    icon: MapPin,
    title: 'Report an issue',
    description: 'Citizens pinpoint waste, illegal dumping, or missed pickups on an interactive map.',
  },
  {
    step: '02',
    icon: Truck,
    title: 'Collectors respond',
    description: 'Verified collectors receive geo-assigned tasks and update status in real time.',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'City stays clean',
    description: 'Admins monitor resolution rates and identify recurring problem zones automatically.',
  },
]

const FEATURES = [
  {
    icon: MapPin,
    title: 'Live incident map',
    description: 'Real-time geospatial view of all active reports, colour-coded by status and severity.',
  },
  {
    icon: Bell,
    title: 'Smart notifications',
    description: 'Role-aware alerts keep citizens informed and collectors on schedule without noise.',
  },
  {
    icon: BarChart2,
    title: 'Analytics dashboard',
    description: 'Track resolution times, collection efficiency, and neighbourhood trends over any period.',
  },
  {
    icon: Users,
    title: 'Multi-role access',
    description: 'Distinct portals for citizens, collectors, and administrators — one platform.',
  },
  {
    icon: Zap,
    title: 'Instant dispatch',
    description: 'Reports auto-assigned to nearest available collector based on zone and capacity.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified collectors',
    description: 'Every collector account is vetted and linked to a licensed waste management entity.',
  },
]

// ─── Animation helper ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-6')
            entry.target.classList.add('opacity-100', 'translate-y-0')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    const els = ref.current.querySelectorAll('[data-reveal]')
    els.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const howRef  = useReveal()
  const featRef = useReveal()

  return (
    <div className="flex flex-col min-h-screen bg-forest-950 text-sand-100">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-forest-700/25 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-forest-500/15 rounded-full blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-800/60 border border-forest-600/40 backdrop-blur-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse-slow" />
            <span className="text-xs font-mono text-forest-300 tracking-widest uppercase">
              Urban Waste Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-800 text-5xl md:text-7xl leading-[1.05] tracking-tight text-balance animate-fade-up">
            Cleaner cities,
            <br />
            <span className="text-forest-400">smarter</span> communities.
          </h1>

          {/* Sub-headline */}
          <p className="font-body text-lg md:text-xl text-sand-400 max-w-2xl leading-relaxed animate-fade-up animate-delay-200">
            CleanCity connects residents, waste collectors, and city administrators on one platform — making urban waste management transparent, responsive, and efficient.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up animate-delay-400">
            <Link
              to="/signup"
              className="group flex items-center gap-2 bg-forest-500 hover:bg-forest-400 text-white font-display font-600 px-7 py-3.5 rounded-xl transition-all duration-200 text-base shadow-lg shadow-forest-900/40"
            >
              Get started free
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-sand-400 hover:text-sand-200 font-display font-500 text-base px-4 py-3.5 transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Scroll indicator */}
          <a
            href="#how-it-works"
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sand-600 hover:text-sand-400 transition-colors animate-bounce"
          >
            <ChevronDown size={22} />
          </a>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" ref={howRef} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            data-reveal
            className="mb-16 opacity-0 translate-y-6 transition-all duration-700"
          >
            <p className="font-mono text-xs text-forest-400 uppercase tracking-widest mb-3">Process</p>
            <h2 className="font-display font-700 text-4xl md:text-5xl text-sand-100 tracking-tight">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                data-reveal
                className="opacity-0 translate-y-6 transition-all duration-700 group"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="relative p-8 rounded-2xl bg-forest-900/40 border border-forest-800/50 hover:border-forest-600/60 transition-all duration-300 hover:bg-forest-900/60 h-full flex flex-col gap-6">
                  {/* Step number */}
                  <span className="font-mono text-5xl font-300 text-forest-800 absolute top-6 right-8 select-none">
                    {item.step}
                  </span>

                  <div className="w-12 h-12 rounded-xl bg-forest-700/50 flex items-center justify-center border border-forest-600/30 group-hover:bg-forest-600/50 transition-colors">
                    <item.icon size={22} className="text-forest-300" />
                  </div>

                  <div>
                    <h3 className="font-display font-600 text-lg text-sand-100 mb-2">
                      {item.title}
                    </h3>
                    <p className="font-body text-sand-500 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" ref={featRef} className="py-24 px-6 border-t border-forest-800/30">
        <div className="max-w-7xl mx-auto">
          <div
            data-reveal
            className="mb-16 opacity-0 translate-y-6 transition-all duration-700 flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <p className="font-mono text-xs text-forest-400 uppercase tracking-widest mb-3">Features</p>
              <h2 className="font-display font-700 text-4xl md:text-5xl text-sand-100 tracking-tight">
                Everything you need,<br />nothing you don't.
              </h2>
            </div>
            <Link
              to="/signup"
              className="shrink-0 flex items-center gap-2 text-forest-400 hover:text-forest-300 font-display font-500 text-sm transition-colors"
            >
              Start for free <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                data-reveal
                className="opacity-0 translate-y-6 transition-all duration-700 p-6 rounded-2xl bg-forest-900/30 border border-forest-800/40 hover:border-forest-700/60 hover:bg-forest-900/50 transition-all duration-300 group"
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-forest-700/40 flex items-center justify-center mb-4 group-hover:bg-forest-600/50 transition-colors border border-forest-700/30">
                  <feat.icon size={18} className="text-forest-300" />
                </div>
                <h3 className="font-display font-600 text-sand-100 mb-2">{feat.title}</h3>
                <p className="font-body text-sand-500 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-forest-800/40 border border-forest-700/40 overflow-hidden p-12 md:p-16 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-forest-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <p className="font-mono text-xs text-forest-400 uppercase tracking-widest">Join the movement</p>
              <h2 className="font-display font-700 text-4xl md:text-5xl text-sand-100 tracking-tight text-balance">
                Ready to clean up your city?
              </h2>
              <p className="font-body text-sand-400 text-lg max-w-xl leading-relaxed">
                Sign up today as a citizen, collector, or administrator and be part of the solution.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/signup"
                  className="group flex items-center gap-2 bg-forest-500 hover:bg-forest-400 text-white font-display font-600 px-7 py-3.5 rounded-xl transition-colors text-base"
                >
                  Create your account
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="text-sand-400 hover:text-sand-200 font-display font-500 text-base px-4 py-3.5 transition-colors"
                >
                  Already have an account?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
