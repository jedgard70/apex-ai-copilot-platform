import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCw, Server, Activity, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type ProviderStatus = {
  id: string
  name: string
  status: 'ok' | 'warning' | 'needs-topup' | 'error' | 'unconfigured'
  message: string
  balance?: string | null
  topUpUrl?: string
}

type Summary = {
  total: number
  healthy: number
  needsAttention: number
  unconfigured: number
  overallStatus: 'ok' | 'attention'
}

type StatusData = {
  providers: ProviderStatus[]
  summary: Summary
  checkedAt: string
}

type Props = {
  onClear: () => void
}

const STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  warning: 'Atenção',
  'needs-topup': 'Recarregar',
  error: 'Erro',
  unconfigured: 'Não configurado',
}

const STATUS_COLORS: Record<string, string> = {
  ok: '#22c55e',
  warning: '#f59e0b',
  'needs-topup': '#ef4444',
  error: '#ef4444',
  unconfigured: '#6b7280',
}

function StatusIcon({ status, size = 16 }: { status: string; size?: number }) {
  if (status === 'ok') return <CheckCircle2 size={size} color="#22c55e" />
  if (status === 'warning') return <ShieldAlert size={size} color="#f59e0b" />
  if (status === 'needs-topup') return <DollarSign size={size} color="#ef4444" />
  if (status === 'error') return <X size={size} color="#ef4444" />
  return <Server size={size} color="#6b7280" />
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: `${STATUS_COLORS[status]}22`,
      color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}44`,
      whiteSpace: 'nowrap',
    }}>
      <StatusIcon status={status} size={11} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

export function ProviderStatusPanel({ onClear }: Props) {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/copilot/provider-status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 60000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const attention = data?.providers.filter(p => p.status === 'needs-topup' || p.status === 'error') ?? []
  const warnings = data?.providers.filter(p => p.status === 'warning') ?? []

  return (
    <PremiumPanelLayout
      title="Status e Custos"
      subtitle="Monitoramento em tempo real de provedores de IA integrados."
      headerActions={
        <>
          <button onClick={refresh} disabled={loading} style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="contracts-layout">
          <aside className="contracts-controls">
            {data && (
              <>
                <div className="contracts-card" style={{ background: data.summary.overallStatus === 'ok' ? '#22c55e11' : '#ef444411', borderColor: data.summary.overallStatus === 'ok' ? '#22c55e33' : '#ef444433' }}>
                  <strong style={{ color: data.summary.overallStatus === 'ok' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusIcon status={data.summary.overallStatus === 'ok' ? 'ok' : 'needs-topup'} size={14} />
                    {data.summary.overallStatus === 'ok' ? 'Plataforma saudável' : 'Atenção necessária'}
                  </strong>
                  <ul style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li>✅ {data.summary.healthy} provedores OK</li>
                    {data.summary.needsAttention > 0 && <li>🔴 {data.summary.needsAttention} precisam de ação</li>}
                    {warnings.length > 0 && <li>🟡 {warnings.length} com aviso</li>}
                    {data.summary.unconfigured > 0 && <li>⚫ {data.summary.unconfigured} não configurados</li>}
                  </ul>
                </div>

                {attention.length > 0 && (
                  <div className="contracts-card" style={{ borderColor: '#ef444433' }}>
                    <strong style={{ color: '#ef4444' }}>🔴 Ação necessária</strong>
                    <ul style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {attention.map(p => (
                        <li key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: '#ef4444' }}>{p.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="contracts-card" style={{ borderColor: '#ef444433' }}>
                <strong style={{ color: '#ef4444' }}>Erro ao verificar</strong>
                <p style={{ fontSize: 12, marginTop: 4 }}>{error}</p>
              </div>
            )}
          </aside>

          <div className="contracts-main">
            <div className="contracts-card contracts-table-card">
              <div className="contracts-section-head">
                <strong>Todos os provedores</strong>
              </div>
              {data ? (
                <table className="contracts-table">
                  <thead>
                    <tr><th>Provedor</th><th>Status</th><th>Saldo / Info</th></tr>
                  </thead>
                  <tbody>
                    {data.providers.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{p.balance ? `${p.balance} — ` : ''}{p.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ padding: '16px' }}>Carregando...</p>}
            </div>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
      </div>
    </PremiumPanelLayout>
  )
}
