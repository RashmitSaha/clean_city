import { Link } from 'react-router-dom'
import { Leaf, ArrowLeft } from 'lucide-react'

/**
 * Two-column auth layout: decorative panel (left) + form panel (right).
 * On mobile, only the form panel is shown.
 */
export default function AuthLayout({ children, panelContent }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-forest-900 flex-col overflow-hidden">
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

        {/* Gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-forest-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-forest-400/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display font-700 text-lg text-sand-100 tracking-tight">
              Clean<span className="text-forest-400">City</span>
            </span>
          </Link>

          {/* Dynamic panel content slot */}
          <div className="flex-1 flex items-center">
            {panelContent}
          </div>

          {/* Bottom quote */}
          <p className="text-sand-600 text-xs font-mono leading-relaxed">
            "Every city becomes the city it deserves."
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-forest-950 relative overflow-y-auto">
        {/* Subtle gradient at the top */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-forest-900/30 to-transparent pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-500 flex items-center justify-center">
              <Leaf size={13} className="text-white" />
            </div>
            <span className="font-display font-700 text-base text-sand-100">
              Clean<span className="text-forest-400">City</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sand-400 hover:text-sand-200 text-sm transition-colors">
            <ArrowLeft size={14} />
            <span className="font-body">Back</span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
