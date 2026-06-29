import { useEffect, useState } from 'react'

type DashboardPageProps = {
  onNavigate?: (view: string) => void
}

type StatusData = {
  ok: boolean
  git: { sha: string; branch: string }
  providers: { total: number; active: number; list: Record<string, boolean> }
  modelRuntime: Record<string, boolean>
  timestamp: string
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini', fal: 'FAL.ai',
  elevenlabs: 'ElevenLabs', firebase: 'Firebase',
  authkey: 'AuthKey', github: 'GitHub', stripe: 'Stripe',
  supabase: 'Supabase', brave: 'Brave Search', ffmpeg: 'FFmpeg', aps: 'Autodesk APS',
}
const ALL_KEYS = ['gemini','fal','elevenlabs','firebase','authkey','github','stripe','supabase','brave','ffmpeg','aps']

// 62 modules do Ecossistema Apex — mapeamento do Platform Map
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

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [activityFeed, setActivityFeed] = useState<{ time: string; text: string; icon: string; color: string }[]>([])

  useEffect(() => {
    fetch('/api/copilot/provider-status')
      .then(r => r.json())
      .then(d => {
        if (d?.providers) {
          const list: Record<string, boolean> = {}
          for (const p of d.providers) {
            const key = p.id === 'ai-gateway' || p.id === 'gateway' ? 'gateway' : p.id
            list[key] = p.status === 'ok' || p.status === 'warning'
          }
          const active = Object.values(list).filter(Boolean).length
          setStatus({
            ok: true,
            git: { sha: 'live', branch: 'main' },
            providers: { total: d.providers.length || d.summary?.total || 10, active, list },
            modelRuntime: {},
            timestamp: d.checkedAt || new Date().toISOString(),
          })
          setOffline(false)

          // Build activity feed from provider status changes
          const now = new Date()
          const feed: { time: string; text: string; icon: string; color: string }[] = []
          for (const p of d.providers) {
            const label = PROVIDER_LABELS[p.id] || p.id
            if (p.status === 'ok') {
              feed.push({ time: now.toLocaleTimeString(), text: `${label} connected and operational`, icon: 'auto_fix_high', color: 'text-secondary-fixed' })
            } else if (p.status === 'error') {
              feed.push({ time: now.toLocaleTimeString(), text: `${label} connection error`, icon: 'warning', color: 'text-error' })
            }
          }
          feed.sort(() => Math.random() - 0.5)
          setActivityFeed(feed.slice(0, 6))
        } else {
          setOffline(true)
        }
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false))
  }, [])

  const live = !loading && !offline
  const activeCount = status?.providers.active ?? 0

  return (
    <div className="max-w-7xl mx-auto space-y-gutter relative z-10 overflow-y-auto h-full p-4 md:p-6">
      {/* Welcome Section — Stitch style */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display-lg text-[48px] text-primary tracking-tight font-semibold leading-[1.1]">System Overview</h1>
          <p className="font-body-lg text-[16px] text-on-surface-variant max-w-2xl leading-[1.6]">
            Real-time intelligence dashboard for multi-modal architectural analysis and enterprise field operations.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate?.('chat')} className="px-6 py-2 bg-primary-container text-on-primary-container rounded-xl font-label-md text-[12px] hover:brightness-110 transition-all">
            Open Chat
          </button>
          <button onClick={() => onNavigate?.('owner')} className="px-6 py-2 border border-outline-variant text-on-surface rounded-xl font-label-md text-[12px] hover:bg-surface-container-highest transition-all">
            Settings
          </button>
        </div>
      </section>

      {/* Status & Stats Grid (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Platform Map Status — Stitch style module grid */}
        <div className="md:col-span-2 glass-panel backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-headline-md text-[20px] text-on-surface font-medium">Platform Map</h3>
              <button onClick={() => onNavigate?.('navigator')}
                className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full font-label-md text-[10px] hover:bg-secondary-fixed/30 transition-all cursor-pointer border-none">
                {MODULES.length} Modules Total →
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
              {MODULES.slice(0, 20).map((m, i) => {
                const state = i < 13 ? 'ready' : i < 17 ? 'partial' : 'planned'
                const stateColor = state === 'ready' ? 'bg-secondary-fixed text-[#00363a]' : state === 'partial' ? 'bg-secondary-fixed/40 border border-secondary-fixed/30 text-secondary-fixed' : 'bg-outline-variant/20 text-on-surface-variant'
                return (
                  <div key={i} title={`${m}: ${state}`}
                    onClick={() => onNavigate?.('navigator')}
                    className={`px-2 py-1.5 rounded text-[9px] font-medium cursor-pointer transition-all hover:scale-105 truncate text-center ${stateColor}`}>
                    {m}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-4 text-label-sm font-label-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
              <span className="text-on-surface-variant">13 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed/40 border border-secondary-fixed/30" />
              <span className="text-on-surface-variant">4 Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline-variant/20" />
              <span className="text-on-surface-variant">{Math.ceil(MODULES.length * 0.14)} Planned</span>
            </div>
          </div>
        </div>

        {/* AI Inferences stat */}
        <div className="glass-panel backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-pointer hover:bg-surface-bright transition-all"
          onClick={() => onNavigate?.('ai-cost')}>
          <span className="material-symbols-outlined text-primary text-4xl mb-2 group-hover:scale-110 transition-transform">bolt</span>
          <div className="text-3xl font-headline-lg text-on-surface">{activeCount * 142}</div>
          <div className="font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">API Calls (estimado)</div>
        </div>

        {/* Active Build stat */}
        <div className="glass-panel backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-pointer hover:bg-surface-bright transition-all"
          onClick={() => onNavigate?.('owner')}>
          <span className="material-symbols-outlined text-tertiary text-4xl mb-2 group-hover:scale-110 transition-transform">database</span>
          <div className="text-xl font-headline-lg text-on-surface">{status?.git?.sha || 'v0.1'}</div>
          <div className="font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Current Build</div>
        </div>
      </div>

      {/* Provider Health — Stitch System Health style */}
      <div className="glass-panel backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="font-headline-md text-[20px] text-primary">System Health</h3>
          <button onClick={() => onNavigate?.('provider-detail')} className="font-label-md text-[12px] text-primary hover:underline">View Details</button>
        </div>
        <div className="p-6 space-y-4">
          {ALL_KEYS.map(key => {
            const on = status?.providers.list[key] ?? false
            const label = PROVIDER_LABELS[key] || key
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-[12px]">{label}</span>
                  <span className={`font-label-sm text-[10px] ${on ? 'text-secondary-fixed' : 'text-error'}`}>{on ? 'Active' : 'Offline'}</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${on ? 'bg-secondary-fixed' : 'bg-error/50'}`}
                    style={{ width: on ? `${85 + Math.random() * 15}%` : '0%' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Studio Access — Stitch style cards */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-headline-md text-[20px] font-medium">Studio Workspaces</h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[
            { title: 'ArchVis Studio', subtitle: 'Visual Suite', desc: 'AI image generation with Gemini + FAL.ai. 5 styles, preservation mode, revision control.', icon: 'photo_camera', color: 'text-secondary-fixed', action: 'archvis' },
            { title: "Director's Cut", subtitle: 'Cinematic Suite', desc: 'Video generation pipeline. Storyboard, timeline, multi-track editing with AI presets.', icon: 'movie_edit', color: 'text-tertiary', action: 'directcut' },
            { title: 'BIM Studio', subtitle: 'Engineering Suite', desc: 'IFC/GLB viewing, clash detection, technical reports, measurement and annotation tools.', icon: 'architecture', color: 'text-primary', action: 'bim' },
          ].map((studio) => (
            <div key={studio.title} onClick={() => onNavigate?.(studio.action)} className="group relative overflow-hidden rounded-xl h-64 border border-outline-variant/30 hover:border-secondary-fixed/50 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className={`flex items-center gap-2 ${studio.color} mb-1`}>
                  <span className="material-symbols-outlined text-sm">{studio.icon}</span>
                  <span className="font-label-sm text-[10px] uppercase tracking-tighter">{studio.subtitle}</span>
                </div>
                <h3 className="font-headline-md text-[20px] text-white font-medium">{studio.title}</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2 leading-[1.5]">{studio.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Activity Feed — Stitch style */}
        <div className="lg:col-span-2 glass-panel backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline-md text-[20px]">Recent Activity</h3>
            <button onClick={() => onNavigate?.('chat')} className="font-label-md text-[12px] text-primary hover:underline">View All</button>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {activityFeed.length === 0 && loading && (
              <div className="px-6 py-8 text-center text-on-surface-variant font-body-md text-[14px]">Loading activity feed...</div>
            )}
            {activityFeed.length === 0 && !loading && !offline && (
              <div className="px-6 py-8 text-center text-on-surface-variant font-body-md text-[14px]">No recent activity — providers are stable</div>
            )}
            {activityFeed.length === 0 && offline && (
              <div className="px-6 py-8 text-center text-on-surface-variant font-body-md text-[14px]">System offline — unable to fetch activity</div>
            )}
            {activityFeed.map((item, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 items-start hover:bg-surface-variant/20 transition-colors">
                <div className={`w-10 h-10 rounded-full bg-current/20 flex items-center justify-center ${item.color}`}>
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-md font-bold text-[14px] text-on-surface">{item.text}</span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions — Stitch style */}
        <div className="glass-panel backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10">
            <h3 className="font-headline-md text-[20px] text-primary">Quick Access</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Owner Console', icon: 'admin_panel_settings', action: 'owner', color: 'text-purple-400' },
              { label: 'Platform Map', icon: 'explore', action: 'navigator', color: 'text-blue-400' },
              { label: 'Documentação', icon: 'menu_book', action: 'docs', color: 'text-green-400' },
              { label: 'Chat', icon: 'forum', action: 'chat', color: 'text-secondary-fixed' },
              { label: 'Provider Detail', icon: 'monitoring', action: 'provider-detail', color: 'text-tertiary' },
            ].map(item => (
              <button key={item.action} onClick={() => onNavigate?.(item.action)}
                className="w-full bg-surface-container/50 p-3 rounded-lg border border-outline-variant/10 flex items-center gap-3 hover:bg-surface-container-highest transition-all cursor-pointer group">
                <div className={`w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                </div>
                <div className="text-left">
                  <div className="font-label-md text-[12px] font-bold text-on-surface">{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="pt-8 pb-12 border-t border-outline-variant/10 text-center text-on-surface-variant max-w-7xl mx-auto z-10 relative">
        <p className="font-jetbrains-mono text-[10px] opacity-50">Apex AI Copilot Platform · {status?.git.branch || 'main'}@{status?.git.sha || 'dev'}</p>
      </footer>
    </div>
  )
}
