import ConfidenceBar from './ConfidenceBar'
import { verdictColors, formatScore, riskBg } from '../../utils/format'

function FeatureRow({ label, value }) {
  const display =
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
    typeof value === 'number'  ? value.toFixed(4) :
    String(value)
  return (
    <div className="data-row">
      <span className="data-key">{label.replace(/_/g, ' ')}</span>
      <span className="data-val">{display}</span>
    </div>
  )
}

export default function VerdictCard({ result, type = 'batch' }) {
  if (!result) return null

  const isBatch = type === 'batch'
  const isPositive = result.prediction === 0  // genuine or normal
  const c = verdictColors(result.label)

  const confidenceBar =
    isBatch
      ? <ConfidenceBar
          value={result.confidence}
          label="Model confidence"
          colorClass={isPositive ? 'bg-teal-500' : 'bg-rose-500'}
        />
      : <ConfidenceBar
          value={result.anomaly_score}
          label="Anomaly score"
          colorClass={result.anomaly_score > 0.4 ? 'bg-rose-500' : result.anomaly_score > 0.15 ? 'bg-amber-500' : 'bg-teal-500'}
        />

  return (
    <div className={`rounded-xl border ${c.border} ${c.shadow} ${c.bg} animate-verdict-in`}>
      {/* Verdict header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Pulse dot — the signature element */}
          <div className="relative shrink-0">
            <span className={`absolute inline-flex h-12 w-12 rounded-full ${c.pulse} opacity-20 animate-pulse-slow`} />
            <span className={`relative inline-flex h-12 w-12 rounded-full ${c.pulse} opacity-90 items-center justify-center`}>
              {isPositive ? (
                <svg className="w-6 h-6 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
              {isBatch ? 'Authenticity verdict' : 'Anomaly verdict'}
            </p>
            <p className={`font-display font-bold text-2xl ${c.icon} leading-none`}>
              {result.label}
            </p>
          </div>

          <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${riskBg(result.risk_level)}`}>
            {result.risk_level} RISK
          </div>
        </div>

        <div className="mt-5">
          {confidenceBar}
        </div>
      </div>

      {/* Engineered features */}
      {result.engineered_features && (
        <div className="p-6">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
            Computed features
          </p>
          <div>
            {Object.entries(result.engineered_features).map(([k, v]) => (
              <FeatureRow key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}

      {/* Raw scores row */}
      <div className="px-6 pb-5 flex flex-wrap gap-4">
        {isBatch && (
          <div className="flex flex-col gap-0.5">
            <span className="data-key">Confidence</span>
            <span className="font-mono text-base font-medium text-slate-200">{formatScore(result.confidence)}</span>
          </div>
        )}
        {!isBatch && (
          <div className="flex flex-col gap-0.5">
            <span className="data-key">Anomaly score</span>
            <span className="font-mono text-base font-medium text-slate-200">{formatScore(result.anomaly_score)}</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="data-key">Prediction code</span>
          <span className="font-mono text-base font-medium text-slate-200">{result.prediction}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="data-key">Risk level</span>
          <span className={`font-mono text-base font-medium ${
            result.risk_level === 'HIGH' ? 'text-rose-400' :
            result.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-teal-400'
          }`}>{result.risk_level}</span>
        </div>
      </div>
    </div>
  )
}
