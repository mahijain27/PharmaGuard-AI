export default function ConfidenceBar({ value, label, colorClass = 'bg-teal-500' }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-mono font-medium text-slate-200">{pct}%</span>
      </div>
      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
