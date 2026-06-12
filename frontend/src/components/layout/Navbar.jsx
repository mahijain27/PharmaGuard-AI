import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useApiStatus } from '../../hooks/useApiStatus'

const LINKS = [
  { to: '/',          label: 'Overview',      exact: true },
  { to: '/verify',    label: 'Drug Verify'              },
  { to: '/anomaly',   label: 'Chain Scanner'            },
  { to: '/dashboard', label: 'Dashboard'                },
]

function StatusDot({ status }) {
  const color =
    status === 'ok'       ? 'bg-teal-500' :
    status === 'degraded' ? 'bg-amber-500' :
    status === 'offline'  ? 'bg-rose-500' :
                            'bg-slate-600'
  const title =
    status === 'ok'       ? 'API online' :
    status === 'degraded' ? 'Some models offline' :
    status === 'offline'  ? 'API unreachable' : 'Checking…'

  return (
    <span title={title} className="relative flex items-center gap-1.5">
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`}>
        {status === 'ok' && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />
        )}
      </span>
      <span className="text-xs font-mono text-slate-500 hidden sm:inline">{title}</span>
    </span>
  )
}

export default function Navbar() {
  const { status } = useApiStatus()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-navy-700 bg-navy-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
            <rect width="28" height="28" rx="7" fill="#00D4B4" fillOpacity="0.12" />
            <path d="M14 4 L14 24 M8 10 L20 10 M8 18 L20 18" stroke="#00D4B4" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="14" cy="14" r="3.5" fill="#00D4B4" fillOpacity="0.9" />
          </svg>
          <span className="font-display font-semibold text-slate-100 text-[15px] tracking-tight">
            PharmaGuard <span className="text-teal-400">AI</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-navy-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <StatusDot status={status} />

          {/* Mobile burger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-700"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-navy-700 bg-navy-900 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-slate-100 hover:bg-navy-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
