import { Link } from 'react-router-dom'
import { useApiStatus } from '../hooks/useApiStatus'
import { getHistoryStats } from '../utils/history'
import { useState, useEffect } from 'react'

const MODEL_CARDS = [
  {
    name: 'Random Forest',
    task: 'Batch authenticity classification',
    detail: '200-tree ensemble trained on 18 supply chain features — checksum integrity, cold-chain logs, distributor verification, and pricing deviation.',
    to: '/verify',
    cta: 'Run verification',
    metric: '~95% accuracy',
  },
  {
    name: 'Isolation Forest',
    task: 'Distribution anomaly detection',
    detail: 'Unsupervised outlier detection across order volume, delivery timing, invoice value, and route deviation in real transactions.',
    to: '/anomaly',
    cta: 'Scan transaction',
    metric: '~0.90 ROC-AUC',
  },
  {
    name: 'CNN Vision',
    task: 'Packaging image authentication',
    detail: 'Convolutional network inspects packaging photographs for print quality, seal placement, and label consistency markers.',
    to: '/verify',
    cta: 'Coming online',
    metric: 'In training',
  },
]

const PIPELINE_STEPS = [
  { label: 'Input', detail: 'Batch metadata or transaction record submitted via form' },
  { label: 'Feature engineering', detail: 'Trust score, cold-chain flags, and risk ratios computed' },
  { label: 'Inference', detail: 'Scaled vector passed to the trained model' },
  { label: 'Verdict', detail: 'Label, confidence, and risk tier returned' },
]

export default function HomePage() {
  const { status, models } = useApiStatus()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setStats(getHistoryStats())
  }, [])

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-navy-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <p className="text-xs font-mono text-teal-500 uppercase tracking-widest mb-4">
            Supply chain security · ML inference
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-slate-100 leading-[1.05] max-w-3xl">
            Verify a batch.<br />
            Scan a transaction.<br />
            <span className="text-teal-400">Catch it before it ships.</span>
          </h1>
          <p className="mt-6 text-base text-slate-400 max-w-xl leading-relaxed">
            PharmaGuard AI runs supply chain metadata and transaction records through trained
            classifiers to flag counterfeit batches and anomalous distribution activity —
            in under a second, with full feature-level transparency.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/verify" className="btn-primary">
              Verify a drug batch
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link to="/anomaly" className="btn-ghost border border-navy-700">
              Scan a transaction
            </Link>
          </div>

          {/* Live status strip */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono">
            <span className="flex items-center gap-2 text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-teal-500' : status === 'offline' ? 'bg-rose-500' : 'bg-slate-600'}`} />
              API {status === 'ok' ? 'operational' : status === 'offline' ? 'unreachable' : 'checking…'}
            </span>
            <span className="flex items-center gap-2 text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${models.random_forest ? 'bg-teal-500' : 'bg-slate-600'}`} />
              Random Forest {models.random_forest ? 'loaded' : 'offline'}
            </span>
            <span className="flex items-center gap-2 text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${models.isolation_forest ? 'bg-teal-500' : 'bg-slate-600'}`} />
              Isolation Forest {models.isolation_forest ? 'loaded' : 'offline'}
            </span>
            <span className="flex items-center gap-2 text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${models.cnn ? 'bg-teal-500' : 'bg-slate-600'}`} />
              CNN {models.cnn ? 'loaded' : 'offline'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Session stats (if any history) ───────────────────── */}
      {stats && stats.total > 0 && (
        <section className="border-b border-navy-700 bg-navy-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">This session</p>
                <p className="font-display font-semibold text-xl text-slate-100 mt-1">{stats.total} checks run</p>
              </div>
              <div className="flex gap-6 text-sm font-mono">
                <span className="text-slate-400">{stats.batchTotal} batches</span>
                <span className="text-slate-400">{stats.transactionTotal} transactions</span>
                <span className="text-rose-400">{stats.counterfeits} counterfeit</span>
                <span className="text-amber-400">{stats.anomalies} anomalies</span>
              </div>
              <Link to="/dashboard" className="ml-auto text-sm font-mono text-teal-400 hover:text-teal-300">
                View dashboard →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Models ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-xs font-mono text-teal-500 uppercase tracking-widest mb-2">Detection models</p>
        <h2 className="font-display font-semibold text-2xl md:text-3xl text-slate-100 mb-10">
          Three models, one pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODEL_CARDS.map((m) => (
            <div key={m.name} className="card p-6 flex flex-col hover:border-teal-500/30 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-lg text-slate-100">{m.name}</h3>
                <span className="text-xs font-mono text-slate-600">{m.metric}</span>
              </div>
              <p className="text-sm font-medium text-teal-400 mb-2">{m.task}</p>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{m.detail}</p>
              <Link
                to={m.to}
                className="mt-5 text-sm font-mono text-slate-300 hover:text-teal-400 transition-colors inline-flex items-center gap-1.5"
              >
                {m.cta}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────────── */}
      <section className="border-t border-navy-700 bg-navy-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <p className="text-xs font-mono text-teal-500 uppercase tracking-widest mb-2">How a check runs</p>
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-slate-100 mb-10">
            From submission to verdict
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-navy-700 rounded-xl overflow-hidden">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="bg-navy-800 p-6 relative">
                <span className="font-mono text-xs text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-display font-medium text-slate-100 mt-3 mb-1.5">{step.label}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{step.detail}</p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <svg className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 text-navy-600 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
