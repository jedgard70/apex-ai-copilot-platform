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
  openrouter: 'OpenRouter', gemini: 'Gemini', openai: 'OpenAI', fal: 'FAL.ai',
  elevenlabs: 'ElevenLabs', opencode: 'OpenCode Go', gateway: 'Gateway', firebase: 'Firebase',
}
const ALL_KEYS = ['openrouter','gemini','openai','fal','elevenlabs','opencode','gateway','firebase']

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    fetch('/api/copilot/provider-status')
      .then(r => r.json())
      .then(d => {
        if (d?.providers) {
          // Convert provider-status format to Dashboard format
          const list: Record<string, boolean> = {}
          for (const p of d.providers) {
            const key = p.id === 'ai-gateway' || p.id === 'gateway' ? 'gateway' : p.id
            list[key] = p.status === 'ok' || p.status === 'warning'
          }
          const active = Object.values(list).filter(Boolean).length
          setStatus({
            ok: true,
            git: { sha: 'live', branch: 'main' },
            providers: { total: 8, active, list },
            modelRuntime: {},
            timestamp: d.checkedAt || new Date().toISOString(),
          })
          setOffline(false)
        } else {
          setOffline(true)
        }
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false))
  }, [])

  const live = !loading && !offline

  return (
    <div className="max-w-7xl mx-auto space-y-gutter relative z-10 overflow-y-auto h-full">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${live ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={`font-label-caps text-[12px] tracking-widest uppercase font-jetbrains-mono font-bold ${live ? 'text-green-400' : 'text-red-400'}`}>
              {loading ? 'LOADING...' : live ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <h1 className="font-sora text-[48px] text-primary tracking-tight font-semibold leading-[1.1]">System Overview</h1>
          <p className="font-inter text-[16px] text-on-surface-variant max-w-2xl leading-[1.6]">
            {status ? `${status.providers.active}/${status.providers.total} providers active · ${status.git.branch}@${status.git.sha}` : 'Connecting to platform API...'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate?.('chat')} className="px-6 py-2 bg-primary-container text-on-primary-container rounded-xl font-jetbrains-mono text-[12px] hover:brightness-110 transition-all">
            Open Chat
          </button>
          <button onClick={() => onNavigate?.('owner')} className="px-6 py-2 border border-outline-variant text-on-surface rounded-xl font-jetbrains-mono text-[12px] hover:bg-surface-container-highest transition-all">
            Owner Console
          </button>
        </div>
      </section>

      {/* Status & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Provider Status */}
        <div className="md:col-span-2 bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-sora text-[20px] text-on-surface font-medium leading-[1.4]">Provider Status</h3>
              <span className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full font-jetbrains-mono text-[10px]">{status?.providers.active || '?'} Active</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {ALL_KEYS.map(key => {
                const on = status?.providers.list[key] ?? false
                return (
                  <div key={key} className={`p-3 rounded-lg border transition-colors ${on ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${on ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">{PROVIDER_LABELS[key] || key}</span>
                    </div>
                    <span className="font-sora text-[14px] text-on-surface font-medium">{on ? 'Online' : 'Off'}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-jetbrains-mono text-on-surface-variant">
            <span>Branch: {status?.git.branch || 'main'}</span>
            <span>Commit: {status?.git.sha || 'unknown'}</span>
            <span>Updated: {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : '-'}</span>
          </div>
        </div>

        {/* Active Inferences */}
        <div className="bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-default hover:bg-surface-bright transition-all">
          <span className="material-symbols-outlined text-green-500 text-4xl mb-2 group-hover:scale-110 transition-transform">bolt</span>
          <div className="text-3xl font-sora text-on-surface font-medium">{loading ? '...' : status ? status.providers.active : '?'}</div>
          <div className="font-jetbrains-mono text-[12px] text-on-surface-variant uppercase tracking-widest">Active Providers</div>
        </div>

        {/* Git Info */}
        <div className="bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-default hover:bg-surface-bright transition-all">
          <span className="material-symbols-outlined text-blue-400 text-4xl mb-2 group-hover:scale-110 transition-transform">database</span>
          <div className="text-xl font-sora text-on-surface font-medium overflow-hidden text-ellipsis">{status?.git?.sha || 'loading...'}</div>
          <div className="font-jetbrains-mono text-[12px] text-on-surface-variant uppercase tracking-widest">Current Build</div>
        </div>
      </div>

      {/* Studio Access */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-sora text-[20px] font-medium">Studio Workspaces</h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[
            { title: 'ArchVis Studio', subtitle: 'Visual Suite', desc: 'AI image generation with OpenAI + FAL.ai. 8 styles, preservation mode, revision control.', icon: 'photo_camera', color: 'text-secondary-fixed', action: 'archvis' },
            { title: "Director's Cut", subtitle: 'Cinematic Suite', desc: 'Video generation with Kling, Sora, Veo, FLUX. Storyboard, timeline, multi-track editing.', icon: 'movie_edit', color: 'text-tertiary', action: 'directcut' },
            { title: 'BIM Studio', subtitle: 'Engineering Suite', desc: 'IFC/GLB viewing, clash detection, technical reports, measurement and annotation tools.', icon: 'architecture', color: 'text-primary', action: 'bim' },
          ].map((studio) => (
            <div key={studio.title} onClick={() => onNavigate?.(studio.action)} className="group relative overflow-hidden rounded-xl h-64 border border-outline-variant/30 hover:border-secondary-fixed/50 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className={`flex items-center gap-2 ${studio.color} mb-1`}>
                  <span className="material-symbols-outlined text-sm">{studio.icon}</span>
                  <span className="font-jetbrains-mono text-[10px] uppercase tracking-tighter">{studio.subtitle}</span>
                </div>
                <h3 className="font-sora text-[20px] text-white font-medium">{studio.title}</h3>
                <p className="font-inter text-[14px] text-on-surface-variant line-clamp-2 leading-[1.5]">{studio.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 p-6">
          <h3 className="font-sora text-[18px] text-on-surface font-medium mb-4">System</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_KEYS.filter(k => status?.providers.list[k]).map(key => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-jetbrains-mono text-[11px] text-on-surface-variant">{PROVIDER_LABELS[key]} API</span>
              </div>
            ))}
            {ALL_KEYS.filter(k => !status?.providers.list[k]).map(key => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-jetbrains-mono text-[11px] text-on-surface-variant">{PROVIDER_LABELS[key]} API</span>
              </div>
            ))}
          </div>
          <p className="font-inter text-[14px] text-on-surface-variant mt-4">Use the chat to interact. Select models from the sidebar or test all models in Owner mode.</p>
        </div>
        <div className="bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 p-6 flex flex-col items-center justify-center gap-2 text-center">
          <span className="material-symbols-outlined text-purple-400 text-4xl">auto_awesome</span>
          <p className="font-inter text-[14px] text-on-surface-variant">{status ? `${status.providers.active}/${status.providers.total} providers configured.` : 'Loading...'}</p>
          <button onClick={() => onNavigate?.('owner')} className="mt-3 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg font-jetbrains-mono text-[11px] hover:bg-purple-500/30 transition-all">Owner Console</button>
        </div>
      </div>

      <footer className="pt-8 pb-12 border-t border-outline-variant/10 text-center text-on-surface-variant max-w-7xl mx-auto z-10 relative">
        <p className="font-jetbrains-mono text-[10px] opacity-50">Apex AI Copilot Platform · {status?.git.branch || 'main'}@{status?.git.sha || 'dev'}</p>
      </footer>
    </div>
  )
}
