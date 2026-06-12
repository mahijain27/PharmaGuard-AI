export function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatScore(val) {
  if (val === null || val === undefined) return '—'
  return (val * 100).toFixed(1) + '%'
}

export function riskColor(level) {
  if (!level) return 'text-slate-400'
  if (level === 'HIGH') return 'text-rose-400'
  if (level === 'MEDIUM') return 'text-amber-400'
  return 'text-teal-400'
}

export function riskBg(level) {
  if (!level) return 'bg-slate-500/10 border-slate-500/20 text-slate-400'
  if (level === 'HIGH') return 'bg-rose-500/10 border-rose-500/20 text-rose-400'
  if (level === 'MEDIUM') return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  return 'bg-teal-500/10 border-teal-500/20 text-teal-400'
}

export function verdictColors(label) {
  const genuine = label === 'GENUINE' || label === 'NORMAL'
  return {
    border: genuine ? 'border-teal-500/40' : 'border-rose-500/40',
    shadow: genuine ? 'shadow-safe-glow' : 'shadow-danger-glow',
    icon: genuine ? 'text-teal-400' : 'text-rose-400',
    bg: genuine ? 'bg-teal-500/5' : 'bg-rose-500/5',
    badge: genuine ? 'tag-genuine' : 'tag-counterfeit',
    pulse: genuine ? 'bg-teal-500' : 'bg-rose-500',
  }
}
