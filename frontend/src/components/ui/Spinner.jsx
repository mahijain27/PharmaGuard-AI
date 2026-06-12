export default function Spinner({ size = 'md', label = 'Processing…' }) {
  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg
        className={`${dim} animate-spin text-teal-500`}
        fill="none" viewBox="0 0 24 24"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label && <span className="text-xs font-mono text-slate-500">{label}</span>}
    </span>
  )
}
