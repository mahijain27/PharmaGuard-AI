import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import FormField from '../components/forms/FormField'
import VerdictCard from '../components/ui/VerdictCard'
import ScanLoader from '../components/ui/ScanLoader'
import ErrorAlert from '../components/ui/ErrorAlert'
import { predictTransaction } from '../services/api'
import { addToHistory } from '../utils/history'

const DEFAULTS = {
  order_quantity: 480.0,
  delivery_time_hours: 22.5,
  invoice_amount_usd: 9800.0,
  return_rate_pct: 1.8,
  complaint_count: 1,
  route_deviation_km: 4.2,
  customs_clearance_days: 1.9,
  storage_temp_avg: 5.1,
}

const SAMPLES = {
  normal: { ...DEFAULTS },
  anomaly: {
    order_quantity: 50000.0,
    delivery_time_hours: 0.1,
    invoice_amount_usd: 1.0,
    return_rate_pct: 95.0,
    complaint_count: 100,
    route_deviation_km: 5000.0,
    customs_clearance_days: 0.0,
    storage_temp_avg: 45.0,
  },
}

const FIELDS = [
  { name: 'order_quantity', label: 'Order quantity (units)', type: 'number', step: '1', min: 0, hint: 'Normal: ~500 units' },
  { name: 'delivery_time_hours', label: 'Delivery time (hours)', type: 'number', step: '0.1', min: 0, hint: 'Normal: ~24 hours' },
  { name: 'invoice_amount_usd', label: 'Invoice amount (USD)', type: 'number', step: '1', min: 0, hint: 'Normal: ~$10,000' },
  { name: 'return_rate_pct', label: 'Return rate (%)', type: 'number', step: '0.1', min: 0, max: 100, hint: 'Normal: ~2%' },
  { name: 'complaint_count', label: 'Complaint count', type: 'number', min: 0, hint: 'Normal: ~1' },
  { name: 'route_deviation_km', label: 'Route deviation (km)', type: 'number', step: '0.1', min: 0, hint: 'Normal: ~5 km' },
  { name: 'customs_clearance_days', label: 'Customs clearance (days)', type: 'number', step: '0.1', min: 0, hint: 'Normal: ~2 days' },
  { name: 'storage_temp_avg', label: 'Avg storage temp (°C)', type: 'number', step: '0.1', min: -30, max: 60, hint: 'Normal: ~5°C' },
]

export default function TransactionPage() {
  const [form, setForm] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }))
  }

  function loadSample(key) {
    setForm(SAMPLES[key])
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload = {}
      for (const f of FIELDS) {
        payload[f.name] = Number(form[f.name])
      }
      const data = await predictTransaction(payload)
      setResult(data)
      addToHistory({ type: 'transaction', input: payload, result: data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Isolation Forest · Anomaly detection"
        title="Supply Chain Anomaly Detection"
        description="Submit a distribution transaction record. The model returns a Normal/Anomaly verdict, a normalised anomaly score, and a risk tier."
      >
        <div className="flex gap-2">
          <button onClick={() => loadSample('normal')} className="btn-ghost border border-navy-700 text-xs">
            Load normal sample
          </button>
          <button onClick={() => loadSample('anomaly')} className="btn-ghost border border-navy-700 text-xs">
            Load anomaly sample
          </button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg text-slate-100 mb-5">Transaction record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((f) => (
                  <FormField
                    key={f.name}
                    {...f}
                    value={form[f.name]}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Scanning…' : 'Scan transaction'}
                {!loading && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          {/* Result */}
          <div>
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
            {loading && <div className="card"><ScanLoader label="Computing anomaly score…" /></div>}
            {!loading && !error && result && <VerdictCard result={result} type="transaction" />}
            {!loading && !error && !result && (
              <div className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
                <svg className="w-10 h-10 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                </svg>
                <p className="text-sm font-mono text-slate-500">Awaiting submission</p>
                <p className="text-xs font-mono text-slate-700 mt-1">Anomaly score will render here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
