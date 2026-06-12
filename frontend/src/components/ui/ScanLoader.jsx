export default function ScanLoader({ label = 'Analysing sample…' }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 animate-fade-in">
      {/* Scan box */}
      <div className="relative w-24 h-24 rounded-xl border border-teal-500/30 bg-navy-800 overflow-hidden">
        <div className="scan-line" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 text-teal-500/40">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="28" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="28" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="28" y="28" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-mono text-teal-400">{label}</p>
        <p className="text-xs font-mono text-slate-600 mt-1">Running ML inference</p>
      </div>
    </div>
  )
}
