import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — normalise errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED' ? 'Request timed out. Is the backend running?' : null) ||
      (err.code === 'ERR_NETWORK' ? 'Cannot reach the API server. Check that the backend is running on ' + BASE_URL : null) ||
      err.message ||
      'An unexpected error occurred.'
    return Promise.reject(new Error(message))
  }
)

// ── Health ─────────────────────────────────────────────────────────────
export async function getHealth() {
  const { data } = await client.get('/api/health')
  return data
}

export async function getModelsInfo() {
  const { data } = await client.get('/api/models/info')
  return data
}

// ── Batch prediction (Random Forest) ──────────────────────────────────
export async function predictBatch(payload) {
  const { data } = await client.post('/api/predict/batch', payload)
  return data
}

export async function getFeaturesBatch() {
  const { data } = await client.get('/api/features/batch')
  return data
}

// ── Transaction prediction (Isolation Forest) ─────────────────────────
export async function predictTransaction(payload) {
  const { data } = await client.post('/api/predict/transaction', payload)
  return data
}

export async function getFeaturesTransaction() {
  const { data } = await client.get('/api/features/transaction')
  return data
}

export default client
