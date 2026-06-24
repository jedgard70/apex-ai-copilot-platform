import { useEffect, useState, useCallback } from 'react'

type OwnerPageProps = {
  onNavigate?: (view: string) => void
  onOpenChat?: (cmd: string) => void
}

type ProviderEntry = { id: string; name: string; status: string; message: string; balance?: string | null; topUpUrl?: string }
type AnalyticsProvider = { provider: string; calls: number; successRate: number; avgLatencyMs: number; totalTokensIn: number; totalTokensOut: number }
type AnalyticsData = { providers: AnalyticsProvider[]; summary: { totalCalls: number; successRate: number; avgLatencyMs: number; windowMinutes: number } }

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI', gemini: 'Gemini', anthropic: 'Anthropic', openrouter: 'OpenRouter',
  fal: 'FAL.ai', elevenlabs: 'ElevenLabs', gateway: 'Gateway', opencode: 'OpenCode Go',
  firebase: 'Firebase', tavily: 'Tavily', stripe: 'Stripe', supabase: 'Supabase',
}

const STATUS_COLORS: Record<string, string> = {
  ok: '#22c55e', warning: '#f59e0b', 'needs-topup': '#ef4444', error: '#ef4444', unconfigured: '#6b7280',
}

export function OwnerPage({ onNavigate, onOpenChat }: OwnerPageProps) {
  const [providers, setProviders] = useState<ProviderEntry[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [psRes, anRes] = await Promise.all([
        fetch('/api/copilot/provider-status'),
        fetch('/api/copilot/provider-analytics?window=1440'),
      ])
      if (psRes.ok) {
        const d = await psRes.json()
        setProviders(d.providers || [])
      }
      if (anRes.ok) {
        setAnalytics(await anRes.json())
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { refresh(); const t = setInterval(refresh, 60000); return () => clearInterval(t) }, [refresh])

  const healthy = providers.filter(p => p.status === 'ok' || p.status === 'warning').length
  const failing = providers.filter(p => p.status === 'error' || p.status === 'needs-topup')
  const unconfigured = providers.filter(p => p.status === 'unconfigured')

  if (loading) return <div className="h-full bg-[#0B1221] flex items-center justify-center text-[#c6c6ce]">Loading owner data...</div>

  return (
    <div className="h-full overflow-y-auto bg-[#0B1221] relative">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#6C47FF]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] mx-auto p-6 space-y-6 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${healthy > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs tracking-widest uppercase font-bold" style={{ color: healthy > 0 ? '#22c55e' : '#ef4444' }}>
                {healthy > 0 ? `System Operational · ${healthy}/${providers.length} providers` : 'System Degraded'}
              </span>
            </div>
            <h1 className="text-[32px] font-bold text-[#e2e2e2]">Owner Console</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigate?.('chat')} className="px-4 py-2 bg-[#6C47FF]/20 text-[#c9beff] rounded-xl text-xs font-bold hover:bg-[#6C47FF]/30 transition-all">Chat</button>
            <button onClick={() => onNavigate?.('dashboard')} className="px-4 py-2 border border-white/10 text-[#c6c6ce] rounded-xl text-xs hover:bg-white/5 transition-all">Dashboard</button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard icon="hub" label="Providers Active" value={`${healthy}/${providers.length}`} sub={`${unconfigured.length} unconfigured`} color="#22c55e" />
          <KpiCard icon="bolt" label="API Calls (24h)" value={analytics ? String(analytics.summary.totalCalls) : '-'} sub={`${analytics?.summary.successRate || 0}% success`} color="#6C47FF" />
          <KpiCard icon="speed" label="Avg Latency" value={analytics ? `${analytics.summary.avgLatencyMs}ms` : '-'} sub="last 24h" color="#f59e0b" />
          <KpiCard icon="warning" label="Needs Attention" value={String(failing.length)} sub={failing.map(p => p.id).join(', ') || 'none'} color="#ef4444" />
        </div>

        {/* Provider Grid + Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-lg font-bold text-[#e2e2e2] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#6C47FF]">dns</span>API Providers</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {providers.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[p.status] || '#6b7280' }} />
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-[#e2e2e2]">{PROVIDER_LABELS[p.id] || p.name || p.id}</span>
                      <p className="text-[11px] text-[#c6c6ce] truncate">{p.message?.slice(0, 80)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {p.balance && <span className="text-xs text-green-400 font-mono block">{p.balance}</span>}
                    {p.status === 'needs-topup' && p.topUpUrl && (
                      <a href={p.topUpUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#6C47FF] hover:underline">Top up →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-lg font-bold text-[#e2e2e2] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#6C47FF]">analytics</span>Performance (24h)</h3>
            {analytics?.providers?.length ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analytics.providers.map((a: AnalyticsProvider) => (
                  <div key={a.provider} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#e2e2e2]">{PROVIDER_LABELS[a.provider] || a.provider}</span>
                      <span className="text-xs font-mono" style={{ color: a.successRate >= 90 ? '#22c55e' : a.successRate >= 70 ? '#f59e0b' : '#ef4444' }}>{a.successRate}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#c6c6ce] font-mono">
                      <span>{a.calls} calls</span>
                      <span>{a.avgLatencyMs}ms avg</span>
                      <span>{a.totalTokensIn + a.totalTokensOut} tokens</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(a.successRate, 100)}%`, backgroundColor: a.successRate >= 90 ? '#22c55e' : a.successRate >= 70 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-[#c6c6ce]/60">
                <span className="material-symbols-outlined text-4xl mb-3 block">analytics</span>
                <p className="text-sm">No API calls recorded yet.</p>
                <p className="text-xs mt-1">Data appears as users interact.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'All Models', icon: 'psychology', view: 'chat' },
            { label: 'Platform Map', icon: 'map', view: 'navigator' },
            { label: 'Deployment', icon: 'rocket_launch', view: 'deployment' },
            { label: 'Training', icon: 'school', view: 'training' },
            { label: 'Docs', icon: 'menu_book', view: 'docs' },
            { label: 'Dashboard', icon: 'dashboard', view: 'dashboard' },
          ].map(a => (
            <button key={a.view} onClick={() => onNavigate?.(a.view)} className="p-4 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-white/5 transition-colors"
              style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="material-symbols-outlined text-[#6C47FF] text-2xl">{a.icon}</span>
              <span className="text-xs font-bold text-[#e2e2e2]">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="h-10" />
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15', color }}><span className="material-symbols-outlined">{icon}</span></div>
      </div>
      <p className="text-[#c6c6ce] text-xs tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-[#e2e2e2]">{value}</h3>
      <p className="text-[10px] text-[#c6c6ce]/70 mt-1">{sub}</p>
    </div>
  )
}
