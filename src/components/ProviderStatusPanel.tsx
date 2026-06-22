import { useEffect, useState, useCallback } from 'react'
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink, X, WifiOff } from 'lucide-react'

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
  if (status === 'ok') return <CheckCircle size={size} color="#22c55e" />
  if (status === 'warning') return <AlertTriangle size={size} color="#f59e0b" />
  if (status === 'needs-topup') return <AlertTriangle size={size} color="#ef4444" />
  if (status === 'error') return <XCircle size={size} color="#ef4444" />
  return <WifiOff size={size} color="#6b7280" />
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
  const healthy = data?.providers.filter(p => p.status === 'ok') ?? []
  const warnings = data?.providers.filter(p => p.status === 'warning') ?? []
  const unconfigured = data?.providers.filter(p => p.status === 'unconfigured') ?? []

  return (
    <section className="contracts-studio" aria-label="Provider Status Panel">
      {/* Header */}
      <div className="contracts-heading">
        <div>
          <span>
            <Activity size={16} />
            {' '}Status da Plataforma
          </span>
          <h2>Provedores e Chaves de API</h2>
          <p>
            {data
              ? `Verificado às ${formatTime(data.checkedAt)} — ${data.summary.healthy}/${data.summary.total} saudáveis${data.summary.needsAttention > 0 ? ` · ${data.summary.needsAttention} precisam de atenção` : ''}`
              : 'Verificando provedores...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="ghost-action"
            onClick={refresh}
            disabled={loading}
            title="Atualizar status"
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="ghost-action" onClick={onClear}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="contracts-layout">
        {/* Sidebar — resumo */}
        <aside className="contracts-controls">
          {/* Summary cards */}
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
                        {p.topUpUrl && (
                          <a href={p.topUpUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <ExternalLink size={10} /> Recarregar agora
                          </a>
                        )}
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
              <button className="contracts-primary" onClick={refresh} style={{ marginTop: 8 }}>Tentar novamente</button>
            </div>
          )}

          {!data && loading && (
            <div className="contracts-card">
              <strong>Verificando provedores...</strong>
              <p style={{ fontSize: 12, marginTop: 4 }}>Testando conectividade e saldo de cada chave.</p>
            </div>
          )}
        </aside>

        {/* Main — tabela completa */}
        <div className="contracts-main">
          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Todos os provedores</strong>
              <span>{data?.providers.length ?? '—'}</span>
            </div>

            {data ? (
              <div className="contracts-table-wrap">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th>Provedor</th>
                      <th>Status</th>
                      <th>Saldo / Info</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.providers.map(p => (
                      <tr key={p.id} style={{ background: p.status === 'needs-topup' || p.status === 'error' ? '#ef444408' : undefined }}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 260 }}>
                          {p.balance
                            ? <span style={{ fontWeight: 600, color: p.status === 'ok' ? '#22c55e' : '#f59e0b' }}>{p.balance} — </span>
                            : null}
                          {p.message}
                        </td>
                        <td>
                          {p.topUpUrl && (p.status === 'needs-topup' || p.status === 'warning' || p.status === 'unconfigured') ? (
                            <a
                              href={p.topUpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}
                            >
                              <ExternalLink size={10} />
                              {p.status === 'needs-topup' ? 'Recarregar' : p.status === 'unconfigured' ? 'Configurar' : 'Dashboard'}
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: '#475569' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                {loading ? 'Verificando...' : 'Nenhum dado disponível.'}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="contracts-card" style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 12 }}>Legenda</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                  <StatusIcon status={key} size={12} />
                  {label}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, marginTop: 8, color: '#64748b' }}>
              Atualiza automaticamente a cada 60 segundos. Clique em Recarregar para verificar agora.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}
