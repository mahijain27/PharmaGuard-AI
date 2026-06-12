import { useState, useEffect } from 'react'
import { getHealth } from '../services/api'

export function useApiStatus() {
  const [status, setStatus] = useState(null)   // null | 'ok' | 'degraded' | 'offline'
  const [models, setModels] = useState({})
  const [checking, setChecking] = useState(true)

  async function check() {
    setChecking(true)
    try {
      const data = await getHealth()
      setStatus(data.status)
      setModels(data.models_loaded || {})
    } catch {
      setStatus('offline')
      setModels({})
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return { status, models, checking, refresh: check }
}
