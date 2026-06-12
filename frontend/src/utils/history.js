const STORAGE_KEY = 'pharmaguard_history'
const MAX_ENTRIES = 200

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(entry) {
  try {
    const history = getHistory()
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }
    const updated = [newEntry, ...history].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newEntry
  } catch {
    return null
  }
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getHistoryStats() {
  const history = getHistory()
  const batches = history.filter((h) => h.type === 'batch')
  const transactions = history.filter((h) => h.type === 'transaction')

  return {
    total: history.length,
    batchTotal: batches.length,
    transactionTotal: transactions.length,
    counterfeits: batches.filter((b) => b.result?.prediction === 1).length,
    anomalies: transactions.filter((t) => t.result?.prediction === 1).length,
    highRisk: history.filter((h) => h.result?.risk_level === 'HIGH').length,
  }
}
