import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Leaf } from 'lucide-react'
import { classNames } from '../utils/helpers.js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => setOpen(false), [pathname])

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
  ]

  return (
    <header
      className={classNames(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-forest-950/90 backdrop-blur-md border-b border-forest-800/50 py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center group-hover:bg-forest-400 transition-colors">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display font-700 text-lg text-sand-100 tracking-tight">
            Clean<span className="text-forest-400">City</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-body text-sand-400 hover:text-sand-100 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-display font-500 text-sand-300 hover:text-sand-100 transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-display font-600 bg-forest-500 hover:bg-forest-400 text-white px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-sand-300 hover:text-sand-100 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-forest-950/95 backdrop-blur-md border-t border-forest-800/50 px-6 py-6 flex flex-col gap-5 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-body text-sand-300 hover:text-sand-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <hr className="border-forest-800/50" />
          <Link to="/login" className="text-base font-display font-500 text-sand-300">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-base font-display font-600 bg-forest-500 text-white px-5 py-3 rounded-xl text-center"
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  )
}
