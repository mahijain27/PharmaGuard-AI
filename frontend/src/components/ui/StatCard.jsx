export default function StatCard({ label, value, sub, accent = false, icon }) {
  return (
    <div className={`card p-5 ${accent ? 'border-teal-500/20 shadow-teal-glow' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className={`font-display font-semibold text-3xl ${accent ? 'text-teal-400' : 'text-slate-100'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-600 font-mono mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-teal-500/10 text-teal-400' : 'bg-navy-700 text-slate-400'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
