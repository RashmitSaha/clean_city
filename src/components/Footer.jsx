import { Link } from 'react-router-dom'
import { Leaf, Twitter, Github, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-forest-800/40 bg-forest-950">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display font-700 text-lg text-sand-100 tracking-tight">
                Clean<span className="text-forest-400">City</span>
              </span>
            </Link>
            <p className="text-sand-500 text-sm font-body leading-relaxed max-w-xs">
              Connecting communities with waste management services for a cleaner, greener urban future.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-sand-600 hover:text-sand-300 transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-sand-600 hover:text-sand-300 transition-colors" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="mailto:hello@cleancity.io" className="text-sand-600 hover:text-sand-300 transition-colors" aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-600 text-sand-200 text-sm mb-4 tracking-wide uppercase">Platform</h4>
            <ul className="space-y-3">
              {['How it works', 'Features', 'Pricing', 'API Docs'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sand-500 hover:text-sand-300 text-sm font-body transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-600 text-sand-200 text-sm mb-4 tracking-wide uppercase">Company</h4>
            <ul className="space-y-3">
              {['About', 'Blog', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sand-500 hover:text-sand-300 text-sm font-body transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-forest-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sand-600 text-xs font-mono">
            © {new Date().getFullYear()} CleanCity. All rights reserved.
          </p>
          <p className="text-sand-700 text-xs font-mono">
            Built for cleaner communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
