import { useEffect, useState } from 'react'

type ProviderDetail = {
  id: string
  name: string
  status: string
  message: string
  balance?: string | null
  topUpUrl?: string
}

type AnalyticsRecord = {
  provider: string
  calls: number
  successRate: number
  avgLatencyMs: number
  totalTokensIn: number
  totalTokensOut: number
  modelCount: number
  models: string[]
  recentErrors: string[]
}

type ProviderDetailPanelProps = {
  onClear: () => void
}

export function ProviderDetailPanel({ onClear }: ProviderDetailPanelProps) {
  const [providers, setProviders] = useState<ProviderDetail[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/copilot/provider-status').then(r => r.json()),
      fetch('/api/copilot/provider-analytics?window=1440').then(r => r.json()).catch(() => ({ providers: [] })),
    ])
      .then(([statusData, analyticsData]) => {
        if (statusData?.providers) setProviders(statusData.providers)
        if (analyticsData?.providers) setAnalytics(analyticsData.providers)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const bg = '#121414'
  const surface = '#1e2020'
  const surface2 = '#282a2b'
  const text = '#e2e2e2'
  const textDim = '#909098'
  const green = '#22c55e'
  const red = '#ef4444'
  const yellow = '#eab308'
  const primary = '#bbc5eb'

  const statusColor = (s: string) => s === 'ok' ? green : s === 'warning' ? yellow : red
  const statusIcon = (s: string) => s === 'ok' ? '✅' : s === 'warning' ? '⚠️' : '❌'

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ height: 48, background: surface, borderBottom: `1px solid ${textDim}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textDim, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            ← Fechar
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Provider Details</span>
          <span style={{ fontSize: 11, color: providers.length > 0 ? green : textDim, fontWeight: 600 }}>
            {providers.filter(p => p.status === 'ok').length}/{providers.length} online
          </span>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ color: textDim, textAlign: 'center', padding: 40 }}>Carregando...</div>}
        {error && <div style={{ color: red, textAlign: 'center', padding: 20 }}>Erro: {error}</div>}

        {providers.map(p => {
          const a = analytics.find(a => a.provider === p.id)
          return (
            <div key={p.id} style={{ background: surface, borderRadius: 12, border: `1px solid ${statusColor(p.status)}30`, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* Status indicator */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${statusColor(p.status)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {statusIcon(p.status)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: statusColor(p.status), background: `${statusColor(p.status)}15`, padding: '2px 8px', borderRadius: 999 }}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: textDim, lineHeight: 1.5 }}>{p.message}</div>

                {/* Balance if available */}
                {p.balance && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: textDim }}>Saldo:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>{p.balance}</span>
                  </div>
                )}

                {/* Analytics if available */}
                {a && a.calls > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: textDim }}>📞 {a.calls} chamadas</span>
                    <span style={{ fontSize: 10, color: a.successRate > 80 ? green : yellow }}>✅ {a.successRate}% sucesso</span>
                    <span style={{ fontSize: 10, color: textDim }}>⏱ {a.avgLatencyMs}ms média</span>
                    {a.totalTokensIn > 0 && <span style={{ fontSize: 10, color: textDim }}>📥 {a.totalTokensIn} tokens in</span>}
                    {a.totalTokensOut > 0 && <span style={{ fontSize: 10, color: textDim }}>📤 {a.totalTokensOut} tokens out</span>}
                    {a.models.length > 0 && <span style={{ fontSize: 10, color: textDim }}>🧠 {a.modelCount} modelos</span>}
                  </div>
                )}

                {/* Top-up link */}
                {p.topUpUrl && (
                  <a href={p.topUpUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: primary, textDecoration: 'none' }}>
                    🔗 Recarregar/Ver fatura →
                  </a>
                )}
              </div>

              {/* Models count badge (from analytics) */}
              {a && a.modelCount > 0 && (
                <div style={{ fontSize: 10, color: textDim, background: surface2, padding: '4px 8px', borderRadius: 6, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{a.modelCount}</div>
                  <div>modelos</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
