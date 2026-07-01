import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type RuntimeStatus = 'running' | 'down' | 'unknown'

function isApexLocalSelected(): boolean {
  try {
    const selected = String(localStorage.getItem('apex_selected_model') || '').trim().toLowerCase()
    if (!selected) return false
    return selected === 'apex-local' || selected.startsWith('apex-local|')
  } catch {
    return false
  }
}

export const RuntimeStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<RuntimeStatus>('unknown')
  const [dismissed, setDismissed] = useState(false)
  const [selectedLocal, setSelectedLocal] = useState<boolean>(() => isApexLocalSelected())

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'apex_selected_model') {
        setSelectedLocal(isApexLocalSelected())
        setDismissed(false)
      }
    }

    window.addEventListener('storage', onStorage)
    const syncInterval = setInterval(() => {
      setSelectedLocal(isApexLocalSelected())
    }, 3000)

    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(syncInterval)
    }
  }, [])

  useEffect(() => {
    if (!selectedLocal) {
      setStatus('unknown')
      return
    }

    let cancelled = false
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/copilot/runtime-status', { cache: 'no-store' })
        const data = response.ok ? await response.json().catch(() => ({})) : {}
        if (cancelled) return
        setStatus(data?.status === 'running' ? 'running' : 'down')
      } catch {
        if (!cancelled) setStatus('down')
      }
    }

    checkStatus()
    const intervalId = setInterval(checkStatus, 60000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [selectedLocal])

  const shouldShowWarning = useMemo(() => {
    return selectedLocal && status === 'down' && !dismissed
  }, [selectedLocal, status, dismissed])

  if (!shouldShowWarning) return null

  return (
    <div className="fixed bottom-4 right-4 z-[1200] max-w-sm rounded-xl border border-amber-400/40 bg-amber-950/90 p-3 text-amber-100 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Apex local indisponivel</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
            O modelo ativo e <strong>apex-local</strong>, mas o Apex Runtime nao respondeu. Inicie o runtime local e o aviso sera revalidado automaticamente a cada 60 segundos.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dispensar aviso"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-amber-200 hover:bg-amber-900/60 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
