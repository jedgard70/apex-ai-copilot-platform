import { useEffect, useState } from 'react'

type DashboardPageProps = {
  onNavigate?: (view: string) => void
}

type StatusData = {
  git: { sha: string; branch: string }
  providers: { total: number; active: number; list: Record<string, boolean> }
  modelRuntime: Record<string, boolean>
  timestamp: string
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/copilot/status')
      .then(r => r.json())
      .then(d => { if (d.ok) setStatus(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeProviders = status?.providers?.list
    ? Object.entries(status.providers.list).filter(([, v]) => v).map(([k]) => k)
    : ['openrouter', 'gemini', 'openai', 'anthropic', 'fal', 'elevenlabs']

  return (
    <div className="max-w-7xl mx-auto space-y-gutter relative z-10 overflow-y-auto h-full">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-sora text-[48px] text-primary tracking-tight font-semibold leading-[1.1]">System Overview</h1>
          <p className="font-inter text-[16px] text-on-surface-variant max-w-2xl leading-[1.6]">
            {status ? `${status.providers.active}/${status.providers.total} providers active · ${status.git.branch}@${status.git.sha}` : 'Loading real platform data...'}
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
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { key: 'openrouter', label: 'OpenRouter' },
                { key: 'gemini', label: 'Gemini' },
                { key: 'openai', label: 'OpenAI' },
                { key: 'anthropic', label: 'Anthropic' },
                { key: 'fal', label: 'FAL.ai' },
                { key: 'elevenlabs', label: 'ElevenLabs' },
              ].map(p => (
                <div key={p.key} className={`p-3 rounded-lg border ${status?.providers.list[p.key] ? 'bg-secondary-fixed/10 border-secondary-fixed/30' : 'bg-surface-variant/30 border-outline-variant/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${status?.providers.list[p.key] ? 'bg-secondary-fixed' : 'bg-outline-variant'}`} />
                    <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">{p.label}</span>
                  </div>
                  <span className="font-sora text-[14px] text-on-surface font-medium">{status?.providers.list[p.key] ? 'Connected' : 'N/A'}</span>
                </div>
              ))}
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
          <span className="material-symbols-outlined text-primary text-4xl mb-2 group-hover:scale-110 transition-transform">bolt</span>
          <div className="text-3xl font-sora text-on-surface font-medium">{loading ? '...' : status?.providers.active || 0}</div>
          <div className="font-jetbrains-mono text-[12px] text-on-surface-variant uppercase tracking-widest">Active Providers</div>
        </div>

        {/* Git Info */}
        <div className="bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-default hover:bg-surface-bright transition-all">
          <span className="material-symbols-outlined text-tertiary text-4xl mb-2 group-hover:scale-110 transition-transform">database</span>
          <div className="text-3xl font-sora text-on-surface font-medium text-[16px] overflow-hidden text-ellipsis">{status?.git.sha || 'dev'}</div>
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
            <div key={studio.title} onClick={() => onNavigate?.('chat')} className="group relative overflow-hidden rounded-xl h-64 border border-outline-variant/30 hover:border-secondary-fixed/50 transition-all cursor-pointer">
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
        {/* Connected Providers */}
        <div className="lg:col-span-2 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-sora text-[20px] font-medium">Connected Providers</h3>
            <span className="text-primary font-jetbrains-mono text-[12px]">{activeProviders.length} active</span>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {activeProviders.map(p => (
              <div key={p} className="px-6 py-4 flex gap-4 items-start hover:bg-surface-variant/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-inter font-bold text-on-surface text-[14px] capitalize">{p}</span>
                    <span className="font-jetbrains-mono text-[10px] text-secondary-fixed">Connected</span>
                  </div>
                  <p className="text-on-surface-variant font-inter text-[14px] leading-[1.5]">
                    {p === 'openrouter' ? '340+ models available via OpenRouter routing' :
                     p === 'gemini' ? 'Gemini 2.5 Flash, Gemini 3.5 Flash (Interactions)' :
                     p === 'openai' ? 'GPT-4o, GPT-4o Mini direct access' :
                     p === 'anthropic' ? 'Claude Sonnet 4.6, Claude 3.5 Haiku' :
                     p === 'fal' ? 'Kling, Sora, Veo, FLUX, LLaMA +50 models' :
                     p === 'elevenlabs' ? 'Text-to-speech and voice generation' : 'Available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10">
            <h3 className="font-sora text-[20px] text-primary font-medium">System</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {[
                { label: 'OpenRouter API', status: status?.providers.list?.openrouter ? 'Active' : 'N/A', value: status?.providers.list?.openrouter ? '100%' : '0%' },
                { label: 'Gemini API', status: status?.providers.list?.gemini ? 'Active' : 'N/A', value: status?.providers.list?.gemini ? '100%' : '0%' },
                { label: 'FAL.ai', status: status?.providers.list?.fal ? 'Active' : 'N/A', value: status?.providers.list?.fal ? '100%' : '0%' },
              ].map((svc) => (
                <div key={svc.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-jetbrains-mono text-[12px]">{svc.label}</span>
                    <span className="text-secondary-fixed font-jetbrains-mono text-[10px]">{svc.status}</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-fixed rounded-full" style={{ width: svc.value }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3 text-primary mb-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span className="font-jetbrains-mono text-[12px] font-bold">Platform</span>
              </div>
              <p className="font-inter text-[14px] text-on-surface-variant leading-relaxed">
                All providers configured. Use the chat to interact or select a model from the sidebar.
              </p>
            </div>
            <button onClick={() => onNavigate?.('owner')} className="w-full py-3 bg-transparent border border-outline-variant hover:bg-surface-variant transition-all rounded-lg font-jetbrains-mono text-[12px]">
              Owner Console
            </button>
          </div>
        </div>
      </div>

      <footer className="pt-8 pb-12 border-t border-outline-variant/10 text-center text-on-surface-variant max-w-7xl mx-auto z-10 relative">
        <p className="font-jetbrains-mono text-[10px] opacity-50">Apex AI Copilot Platform · {status?.git.branch || 'main'}@{status?.git.sha || 'dev'}</p>
      </footer>
    </div>
  )
}
