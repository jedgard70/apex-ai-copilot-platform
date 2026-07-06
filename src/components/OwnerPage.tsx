import { useEffect, useState, useCallback } from 'react'
import { getBrowserSupabaseClient } from '../lib/supabaseClient'
import { loadSupabaseAccountState } from '../lib/supabaseAuthBootstrap'

type OwnerPageProps = {
  onNavigate?: (view: string) => void
  onOpenChat?: (cmd: string) => void
}

type ProviderEntry = { id: string; name: string; status: string; message: string; balance?: string | null; topUpUrl?: string; models?: string[] }
type AnalyticsProvider = { provider: string; calls: number; successRate: number; avgLatencyMs: number; totalTokensIn: number; totalTokensOut: number; estimatedCost?: number; modelCount?: number; models?: string[] }
type AnalyticsData = { providers: AnalyticsProvider[]; summary: { totalCalls: number; successRate: number; avgLatencyMs: number; windowMinutes: number } }
type KeyLifecycleEntry = { id: string; provider: string; name: string; configured: boolean; status: string; ageDays: number | null; maxAgeDays: number; critical: boolean; recommendation: string }

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  fal: 'FAL.ai', elevenlabs: 'ElevenLabs',
  firebase: 'Firebase', brave: 'Brave Search', stripe: 'Stripe', supabase: 'Supabase',
  authkey: 'AuthKey', github: 'GitHub', ffmpeg: 'FFmpeg', aps: 'Autodesk APS',
  apexOwnEngine: 'Apex AI 2.0 Engine',
  ollama: 'Ollama (Motor IA local)',
  'apex-engine': 'Apex Engine (Motor próprio)',
  'deploy-model': 'Deploy Model (HF)',
}

// 62 modules do Ecossistema Apex
const MODULES = [
  'ArchVis', 'DirectCut', 'BIM 3D', 'Field Ops', 'Dashboard', 'Chat',
  'Owner Console', 'CRM Pipeline', 'Financeiro', 'Budget', 'Contracts',
  'Research', 'Supply Chain', 'Qualidade', 'Campaign', 'Agents',
  'Cognitive Agents', 'Digital Twin', 'Metrics', 'Knowledge Base',
  'Multi-tenant', 'PWA Mobile', 'Notifications', 'AI Cost',
  'Autoupgrade', 'Platform Map', 'Deployment', 'Governance',
  'Model Training', 'Technical Docs', 'Marketing Analytics',
  'Authentication', 'Stock Market', 'Trip Planner', 'Pipeline',
  'NR Compliance', 'Accounting', 'American Permits', 'BIM Clash',
  'Workflow', 'EVM Scheduler', 'Avatar Voice', 'Project Package',
  'Generation History', 'Export Center', 'APS', 'Copilot Execution',
  'Skill Update', 'Skill Export', 'Provider Detail', 'Auth',
  'Client Dashboard', 'Platform Navigator', 'Documentation',
  'Bolsa', 'Viagens', 'Contabilidade', 'CREA/OE', 'Arquitetura',
  'Render', 'Video', '3D Studio',
]

const STATUS_COLORS: Record<string, string> = {
  ok: '#22c55e', warning: '#f59e0b', 'needs-topup': '#ef4444', error: '#ef4444', unconfigured: '#6b7280',
}

export function OwnerPage({ onNavigate, onOpenChat }: OwnerPageProps) {
  const [providers, setProviders] = useState<ProviderEntry[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [keyLifecycle, setKeyLifecycle] = useState<KeyLifecycleEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ executive: true, engineering: false, finance: false, legal: false, dev: false })
  const toggleMenu = (m: string) => setOpenMenus(p => ({ ...p, [m]: !p[m] }))

  const NAV_MODULES = [
    {
      id: 'executive',
      title: 'Controle Executivo',
      icon: 'dashboard',
      items: [
        { label: 'Executive Home', view: 'owner' },
        { label: 'Platform Map', view: 'navigator' },
        { label: 'Marketing', view: 'marketing' },
      ]
    },
    {
      id: 'engineering',
      title: 'Engenharia & BIM',
      icon: 'architecture',
      items: [
        { label: 'BIM / 3D Studio', view: 'bim' },
        { label: 'Field Ops', view: 'fieldops' },
        { label: 'ArchVis Studio', view: 'archvis' },
        { label: "Director's Cut", view: 'directcut' },
      ]
    },
    {
      id: 'finance',
      title: 'CRM & Financeiro',
      icon: 'payments',
      items: [
        { label: 'CRM Pipeline', view: 'crm' },
        { label: 'Financeiro', view: 'finance' },
        { label: 'Budget & Cost', view: 'budget' },
        { label: 'Contracts', view: 'contracts' },
      ]
    },
    {
      id: 'legal',
      title: 'Jurídico & Corporate Global',
      icon: 'gavel',
      items: [
        { label: 'Brasil (Corporate, Imigration, Cidadania, Permits, Contratos, Fiscal)', view: 'legal_br' },
        { label: 'Estados Unidos (Corporate, Imigration, Cidadania, Permits, Contratos, Fiscal)', view: 'legal_us' },
        { label: 'Europa (Corporate, Imigration, Cidadania, Permits, Contratos, Fiscal)', view: 'legal_eu' },
        { label: 'Offshore & Nômades (Estônia, Panamá, Uruguai)', view: 'legal_off' },
        { label: 'General Contracts e Jurídico Geral BR', view: 'contracts_gen' },
      ]
    },
    {
      id: 'dev',
      title: 'Developer Tools',
      icon: 'code',
      items: [
        { label: 'Code Editor', view: 'editor' },
        { label: 'AI Control', view: 'aicontrol' },
        { label: 'Documentation', view: 'docs' },
      ]
    }
  ]


  const refresh = useCallback(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort(); setLoading(false) }, 2500)
    try {
      const { client: supabase } = getBrowserSupabaseClient();

      const [psRes, klRes] = await Promise.all([
        fetch('/api/copilot/provider-status', { signal: controller.signal }).catch(() => null),
        fetch('/api/copilot/key-lifecycle', { signal: controller.signal }).catch(() => null)
      ]);

      if (psRes && psRes.ok) {
        const d = await psRes.json().catch(() => ({}));
        setProviders(d.providers || []);
      }
      if (klRes && klRes.ok) {
        const d = await klRes.json().catch(() => ({}));
        setKeyLifecycle(d.keys || []);
      }

      if (supabase) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Fetch AI Usage
        const { data: usageData } = await supabase
          .from('ai_usage_records')
          .select('*')
          .gte('created_at', oneDayAgo);

        if (usageData) {
          const providerMap: Record<string, AnalyticsProvider> = {};
          let totalCalls = 0;
          let successfulCalls = 0;
          let totalLatency = 0;
          let latencyCount = 0;

          for (const row of usageData) {
            const p = row.provider || 'unknown';
            if (!providerMap[p]) {
              providerMap[p] = { provider: p, calls: 0, successRate: 0, avgLatencyMs: 0, totalTokensIn: 0, totalTokensOut: 0, estimatedCost: 0, modelCount: 0, models: [] };
            }

            providerMap[p].calls++;
            totalCalls++;

            if (row.success) {
              providerMap[p].successRate++; // temp store successes
              successfulCalls++;
            }

            if (row.duration_ms) {
              providerMap[p].avgLatencyMs += row.duration_ms;
              totalLatency += row.duration_ms;
              latencyCount++;
            }

            if (row.tokens_in) providerMap[p].totalTokensIn += row.tokens_in;
            if (row.tokens_out) providerMap[p].totalTokensOut += row.tokens_out;
            if (row.cost_usd) providerMap[p].estimatedCost! += row.cost_usd;

            if (row.model && !providerMap[p].models!.includes(row.model)) {
              providerMap[p].models!.push(row.model);
            }
          }

          const providersList = Object.values(providerMap).map(p => {
            return {
              ...p,
              successRate: p.calls > 0 ? Math.round((p.successRate / p.calls) * 100) : 0,
              avgLatencyMs: p.calls > 0 ? Math.round(p.avgLatencyMs / p.calls) : 0,
              modelCount: p.models!.length
            };
          });

          setAnalytics({
            providers: providersList,
            summary: {
              totalCalls,
              successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
              avgLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
              windowMinutes: 1440
            }
          });
        }
      } else {
        // Mock fallback if supabase not configured
        setAnalytics({
          providers: [],
          summary: { totalCalls: 0, successRate: 0, avgLatencyMs: 0, windowMinutes: 1440 }
        })
      }
    } catch { /* silent */ } finally { clearTimeout(timer); setLoading(false) }
  }, [])

  useEffect(() => { refresh(); const t = setInterval(refresh, 60000); return () => clearInterval(t) }, [refresh])

  const healthy = providers.filter(p => p.status === 'ok' || p.status === 'warning').length
  const failing = providers.filter(p => p.status === 'error' || p.status === 'needs-topup')
  const unconfigured = providers.filter(p => p.status === 'unconfigured')
  const sortedProviders = [...providers].sort((a, b) => {
    const order = ['error', 'needs-topup', 'unconfigured', 'warning', 'ok']
    return order.indexOf(a.status) - order.indexOf(b.status)
  })

  if (loading) return <div className="h-full bg-[#0B1221] flex items-center justify-center text-[#c6c6ce]">Loading owner data...</div>

  return (
    <div className="h-full overflow-hidden bg-[#0B1221] flex">
      {/* Sidebar — Stitch style */}
      <aside className="w-[240px] bg-[#1e2020] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="px-5 py-6 flex items-center gap-3">
          <img src="/apex-global-logo.png" alt="Apex Global" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <h2 className="text-[16px] font-bold text-[#e2e2e2] leading-tight">Apex Global</h2>
            <p className="text-[9px] text-[#c6c6ce] tracking-widest uppercase mt-0.5">Control Center</p>
          </div>
        </div>
        <nav className="flex-grow space-y-1 px-3">
          {[
            { icon: 'dashboard', label: 'Executive Home', active: true, view: 'owner' },
            { icon: 'group', label: 'CRM', active: false, view: 'crm' },
            { icon: 'payments', label: 'Finance', active: false, view: 'finance' },
            { icon: 'campaign', label: 'Marketing', active: false, view: 'marketing' },
            { icon: 'admin_panel_settings', label: 'Admin', active: false, view: 'owner' },
            { icon: 'map', label: 'Platform Map', active: false, view: 'navigator' },
            { icon: 'school', label: 'Training', active: false, view: 'training' },
            { icon: 'menu_book', label: 'Documentation', active: false, view: 'docs' },
          ].map(item => (
            <button key={item.label} onClick={() => onNavigate?.(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${item.active ? 'bg-[#6C47FF] text-white' : 'text-[#c6c6ce] hover:text-white hover:bg-white/5'
                }`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-caps text-xs">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 mt-auto pb-6 space-y-2">
          <button onClick={() => onNavigate?.('chat')}
            className="w-full py-3 bg-[#6C47FF]/20 border border-[#6C47FF]/30 text-[#c9beff] font-label-caps text-xs rounded-xl hover:bg-[#6C47FF] hover:text-white transition-all">
            Launch AI Audit
          </button>
          <div className="flex items-center gap-3 px-4 py-2 text-[#c6c6ce] hover:text-white cursor-pointer text-xs">
            <span className="material-symbols-outlined text-[18px]">support_agent</span> Support
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-[#c6c6ce] hover:text-red-400 cursor-pointer text-xs">
            <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#6C47FF]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[1440px] mx-auto p-6 space-y-6 relative z-10">

          {/* Header — Stitch style */}
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6C47FF] animate-pulse" />
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#6C47FF]">
                  System Operational · {healthy}/{providers.length} providers
                </span>
              </div>
              <h1 className="text-[32px] font-bold text-[#e2e2e2]">Owner Insights</h1>
            </div>
            <div className="flex gap-4">
              <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-3" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-[#c6c6ce] text-xs font-label-caps">View:</span>
                <span className="text-[#e2e2e2] font-bold text-sm">Global Aggregate</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
            </div>
          </div>

          {/* KPI Bento — Stitch Executive Summary style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard icon="dns" label="Providers Active" value={`${healthy}/${providers.length}`} sub={`${unconfigured.length} unconfigured`} color="#22c55e" />
            <KpiCard icon="bolt" label="API Calls (24h)" value={analytics ? String(analytics.summary.totalCalls) : '-'} sub={`${analytics?.summary.successRate || 0}% success`} color="#6C47FF" />
            <KpiCard icon="speed" label="Avg Latency" value={analytics ? `${analytics.summary.avgLatencyMs}ms` : '-'} sub="last 24h" color="#f59e0b" />
            <KpiCard icon="warning" label="Needs Attention" value={String(failing.length)} sub={failing.map(p => p.id).join(', ') || 'none'} color="#ef4444" />
          </div>

          {/* Provider Grid + Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-[#e2e2e2] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#6C47FF]">dns</span>API Providers</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sortedProviders.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[p.status] || '#6b7280' }} />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#e2e2e2]">{PROVIDER_LABELS[p.id] || p.name || p.id}</span>
                        <p className="text-[11px] text-[#c6c6ce] truncate">{p.message?.slice(0, 80)}</p>
                        {p.models && Array.isArray(p.models) && (
                          <div className="text-[9px] text-[#6C47FF] mt-1 truncate max-w-[200px]" title={p.models.join(', ')}>
                            modelos: {p.models.slice(0, 4).join(', ')}{p.models.length > 4 ? `...` : ''}
                          </div>
                        )}
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

            <div className="glass-card p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-[#e2e2e2] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#6C47FF]">analytics</span>Performance (24h)</h3>
              {analytics?.providers?.length ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.providers.map((a: AnalyticsProvider) => (
                    <div key={a.provider} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#e2e2e2]">{PROVIDER_LABELS[a.provider] || a.provider}</span>
                        <div className="flex items-center gap-2">
                          {a.estimatedCost != null && (a.estimatedCost || 0) > 0 && <span className="text-[10px] font-mono text-[#f59e0b]">${(a.estimatedCost || 0).toFixed(2)}</span>}
                          <span className="text-xs font-mono" style={{ color: a.successRate >= 90 ? '#22c55e' : a.successRate >= 70 ? '#f59e0b' : '#ef4444' }}>{a.successRate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#c6c6ce] font-mono">
                        <span>{a.calls} calls</span>
                        <span>{a.avgLatencyMs}ms avg</span>
                        <span title={`${(a.totalTokensIn || 0).toLocaleString()} in / ${(a.totalTokensOut || 0).toLocaleString()} out`}>
                          {(a.totalTokensIn + a.totalTokensOut || 0).toLocaleString()} tokens
                        </span>
                      </div>
                      {a.models && a.models.length > 0 && (
                        <div className="text-[9px] text-[#6C47FF] mt-1 truncate max-w-[300px]" title={a.models.join(', ')}>
                          modelos: {a.models.slice(0, 3).join(', ')}{a.models.length > 3 ? ` (+${a.models.length - 3})` : ''}
                        </div>
                      )}
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

          {/* Key Lifecycle Status */}
          {keyLifecycle.length > 0 && (
            <div className="glass-card p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-[#e2e2e2] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#6C47FF]">key</span>Key Lifecycle — {keyLifecycle.filter(k => k.configured).length}/{keyLifecycle.length} configured</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {keyLifecycle.filter(k => k.configured).map(k => (
                  <div key={k.id} className="p-2 rounded-lg bg-white/5 text-center">
                    <div className="text-[10px] font-mono text-[#c6c6ce] truncate">{k.name.split(' ')[0]}</div>
                    <div className="text-xs font-bold" style={{ color: k.status === 'healthy' ? '#22c55e' : k.status === 'approaching' ? '#f59e0b' : '#ef4444' }}>
                      {k.ageDays !== null ? `${k.ageDays}d` : '-'}
                    </div>
                    <div className="text-[9px] text-[#c6c6ce]/70">/{k.maxAgeDays}d</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Log — Stitch style */}
          <div className="glass-card p-6 rounded-xl" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 className="text-lg font-bold text-[#e2e2e2] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#6C47FF]">history_edu</span>Admin Log
            </h4>
            <div className="space-y-4 max-h-48 overflow-y-auto">
              {failing.length > 0 ? failing.map((p, i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/5">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-red-400">warning</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#e2e2e2]">{PROVIDER_LABELS[p.id] || p.id} — {p.status}</p>
                    <p className="text-xs text-[#c6c6ce]">{p.message?.slice(0, 100) || 'No details'}</p>
                    <span className="text-[10px] text-[#6C47FF] font-label-caps mt-1 inline-block">Active</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-[#c6c6ce]/60">
                  <span className="material-symbols-outlined text-3xl mb-2 block">check_circle</span>
                  <p className="text-sm">All systems operational — no warnings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Launch */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            {[
              { label: 'All Models', icon: 'psychology', view: 'chat' },
              { label: 'Platform Map', icon: 'map', view: 'navigator' },
              { label: 'Deployment', icon: 'rocket_launch', view: 'deployment' },
              { label: 'Training', icon: 'school', view: 'training' },
              { label: 'Treinar 🧠', icon: 'model_training', action: 'colab' },
              { label: 'Deploy 🚀', icon: 'cloud_upload', action: 'deploy' },
              { label: 'Docs', icon: 'menu_book', view: 'docs' },
              { label: 'Dashboard', icon: 'dashboard', view: 'dashboard' },
            ].map(a => (
              <button key={a.view || a.action} onClick={() => {
                if (a.action === 'colab') {
                  window.open('https://colab.research.google.com/github/jedgard70/apex-ai-copilot-platform/blob/main/notebooks/real_finetune_gemma_apex_colab.ipynb', '_blank')
                } else if (a.action === 'deploy') {
                  window.open('https://huggingface.co/new', '_blank')
                } else if (a.view) {
                  onNavigate?.(a.view)
                }
              }}
                className="p-4 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-white/5 transition-colors"
                style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="material-symbols-outlined text-[#6C47FF] text-2xl">{a.icon}</span>
                <span className="text-xs font-bold text-[#e2e2e2]">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="h-10" />
        </div>
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
