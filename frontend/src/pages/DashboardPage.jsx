import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import { getHistory, clearHistory, getHistoryStats } from '../utils/history'
import { formatTimestamp, formatScore, riskBg } from '../utils/format'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'batch', label: 'Batches' },
  { key: 'transaction', label: 'Transactions' },
]

function HistoryRow({ entry }) {
  const isBatch = entry.type === 'batch'
  const r = entry.result || {}
  const isPositive = r.prediction === 0
  const scoreLabel = isBatch ? 'Confidence' : 'Anomaly score'
  const scoreVal = isBatch ? r.confidence : r.anomaly_score

  return (
    <tr className="border-b border-navy-700 hover:bg-navy-700/30 transition-colors">
      <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
        {formatTimestamp(entry.timestamp)}
      </td>
      <td className="py-3 px-4">
        <span className="text-xs font-mono text-slate-400 uppercase">{entry.type}</span>
      </td>
      <td className="py-3 px-4">
        <span className={isPositive ? 'tag-genuine' : (isBatch ? 'tag-counterfeit' : 'tag-anomaly')}>
          {r.label || '—'}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-mono text-slate-300">
        {formatScore(scoreVal)}
        <span className="text-slate-600 ml-1.5 text-xs">{scoreLabel}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded text-xs font-mono border ${riskBg(r.risk_level)}`}>
          {r.risk_level || '—'}
        </span>
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')

  function refresh() {
    setHistory(getHistory())
    setStats(getHistoryStats())
  }

  useEffect(() => { refresh() }, [])

  function handleClear() {
    if (window.confirm('Clear all prediction history? This cannot be undone.')) {
      clearHistory()
      refresh()
    }
  }

  const filtered = history.filter((h) => filter === 'all' || h.type === filter)

  return (
    <div>
      <PageHeader
        eyebrow="Session history · Local storage"
        title="Results Dashboard"
        description="A running record of every verification and scan from this browser session, stored locally on your device."
      >
        {history.length > 0 && (
          <button onClick={handleClear} className="btn-ghost border border-navy-700 text-xs text-rose-400 hover:text-rose-300">
            Clear history
          </button>
        )}
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        {stats && stats.total > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total checks" value={stats.total} />
            <StatCard label="Batches verified" value={stats.batchTotal} />
            <StatCard label="Transactions scanned" value={stats.transactionTotal} />
            <StatCard label="Counterfeits found" value={stats.counterfeits} accent={stats.counterfeits > 0} />
            <StatCard label="Anomalies found" value={stats.anomalies} accent={stats.anomalies > 0} />
          </div>
        ) : (
          <div className="card p-12 flex flex-col items-center justify-center text-center mb-8">
            <svg className="w-10 h-10 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-sm font-mono text-slate-500 mb-1">No checks run yet</p>
            <p className="text-xs font-mono text-slate-700 mb-5">Run a verification or scan to see results here</p>
            <div className="flex gap-2">
              <Link to="/verify" className="btn-primary text-xs px-4 py-2">Verify a batch</Link>
              <Link to="/anomaly" className="btn-ghost border border-navy-700 text-xs px-4 py-2">Scan a transaction</Link>
            </div>
          </div>
        )}

        {/* History table */}
        {history.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-navy-700">
              <h2 className="font-display font-semibold text-slate-100">Recent activity</h2>
              <div className="flex gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      filter === f.key ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-700">
                    <th className="text-left py-2.5 px-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Time</th>
                    <th className="text-left py-2.5 px-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="text-left py-2.5 px-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Verdict</th>
                    <th className="text-left py-2.5 px-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Score</th>
                    <th className="text-left py-2.5 px-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => <HistoryRow key={entry.id} entry={entry} />)}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-sm font-mono text-slate-600 py-8">No entries for this filter</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
