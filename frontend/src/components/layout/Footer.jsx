import { NavLink } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-navy-700 bg-navy-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-slate-300 text-sm">
              PharmaGuard <span className="text-teal-400">AI</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5 font-mono">
              ML-powered pharmaceutical authenticity detection
            </p>
          </div>
          <nav className="flex items-center gap-4">
            {[
              { to: '/', label: 'Overview' },
              { to: '/verify', label: 'Drug Verify' },
              { to: '/anomaly', label: 'Chain Scanner' },
              { to: '/dashboard', label: 'Dashboard' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className="text-xs text-slate-500 hover:text-teal-400 transition-colors font-mono"
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-navy-700/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-mono text-slate-600">
            Models: Random Forest · Isolation Forest · CNN
          </p>
          <p className="text-xs font-mono text-slate-700">
            For research and validation use only
          </p>
        </div>
      </div>
    </footer>
  )
}
