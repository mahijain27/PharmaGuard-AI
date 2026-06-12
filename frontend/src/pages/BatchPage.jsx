import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import FormField from '../components/forms/FormField'
import VerdictCard from '../components/ui/VerdictCard'
import ScanLoader from '../components/ui/ScanLoader'
import ErrorAlert from '../components/ui/ErrorAlert'
import { predictBatch } from '../services/api'
import { addToHistory } from '../utils/history'

const DEFAULTS = {
  supplier_id: 5,
  temperature_log: 4.8,
  humidity_log: 44.5,
  shipment_duration_days: 3,
  barcode_checksum_valid: 1,
  packaging_seal_intact: 1,
  expiry_date_format_valid: 1,
  label_language_count: 3,
  distributor_verified: 1,
  price_deviation_pct: -2.5,
  reorder_frequency: 28,
  lot_number_format_valid: 1,
  regulatory_approval_code: 4521,
}

const SAMPLES = {
  genuine: { ...DEFAULTS },
  counterfeit: {
    supplier_id: 99,
    temperature_log: 18.0,
    humidity_log: 80.0,
    shipment_duration_days: 45,
    barcode_checksum_valid: 0,
    packaging_seal_intact: 0,
    expiry_date_format_valid: 0,
    label_language_count: 1,
    distributor_verified: 0,
    price_deviation_pct: -65.0,
    reorder_frequency: 2,
    lot_number_format_valid: 0,
    regulatory_approval_code: 42,
  },
}

const BINARY_OPTS = [
  { value: 1, text: 'Yes (1)' },
  { value: 0, text: 'No (0)' },
]

const FIELDS = [
  { name: 'supplier_id', label: 'Supplier ID', type: 'number', min: 1, max: 500, hint: '1–20 = known suppliers' },
  { name: 'temperature_log', label: 'Temperature log (°C)', type: 'number', step: '0.1', min: -20, max: 50, hint: 'Genuine cold chain: ~5°C' },
  { name: 'humidity_log', label: 'Humidity log (%)', type: 'number', step: '0.1', min: 0, max: 100, hint: 'Genuine range: 30–60%' },
  { name: 'shipment_duration_days', label: 'Shipment duration (days)', type: 'number', min: 1, max: 180 },
  { name: 'barcode_checksum_valid', label: 'Barcode checksum valid', options: BINARY_OPTS },
  { name: 'packaging_seal_intact', label: 'Packaging seal intact', options: BINARY_OPTS },
  { name: 'expiry_date_format_valid', label: 'Expiry date format valid', options: BINARY_OPTS },
  { name: 'label_language_count', label: 'Label language count', type: 'number', min: 1, max: 10 },
  { name: 'distributor_verified', label: 'Distributor verified', options: BINARY_OPTS },
  { name: 'price_deviation_pct', label: 'Price deviation (%)', type: 'number', step: '0.1', min: -100, max: 100, hint: 'Negative = cheaper than market' },
  { name: 'reorder_frequency', label: 'Reorder frequency', type: 'number', min: 1, max: 200 },
  { name: 'lot_number_format_valid', label: 'Lot number format valid', options: BINARY_OPTS },
  { name: 'regulatory_approval_code', label: 'Regulatory approval code', type: 'number', min: 1, max: 9999, hint: 'Genuine range: 1000–9999' },
]

export default function BatchPage() {
  const [form, setForm] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    const numericFields = new Set(FIELDS.filter(f => !f.options).map(f => f.name))
    const optionFields = new Set(FIELDS.filter(f => f.options).map(f => f.name))

    let parsed = value
    if (numericFields.has(name) || optionFields.has(name)) {
      parsed = value === '' ? '' : Number(value)
    }
    setForm((prev) => ({ ...prev, [name]: parsed }))
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
      const data = await predictBatch(payload)
      setResult(data)
      addToHistory({ type: 'batch', input: payload, result: data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Random Forest · Batch classification"
        title="Drug Authenticity Verification"
        description="Submit supply chain metadata for a single batch. The model returns a Genuine/Counterfeit verdict, confidence score, and risk tier."
      >
        <div className="flex gap-2">
          <button onClick={() => loadSample('genuine')} className="btn-ghost border border-navy-700 text-xs">
            Load genuine sample
          </button>
          <button onClick={() => loadSample('counterfeit')} className="btn-ghost border border-navy-700 text-xs">
            Load suspicious sample
          </button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg text-slate-100 mb-5">Batch metadata</h2>
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
                {loading ? 'Analysing…' : 'Run verification'}
                {!loading && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          {/* Result */}
          <div>
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
            {loading && <div className="card"><ScanLoader label="Scoring batch against trained model…" /></div>}
            {!loading && !error && result && <VerdictCard result={result} type="batch" />}
            {!loading && !error && !result && (
              <div className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
                <svg className="w-10 h-10 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <p className="text-sm font-mono text-slate-500">Awaiting submission</p>
                <p className="text-xs font-mono text-slate-700 mt-1">Verdict will render here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
