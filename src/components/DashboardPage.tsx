type DashboardPageProps = {
  onNavigate?: (view: string) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-gutter relative z-10">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-sora text-[48px] text-primary tracking-tight font-semibold leading-[1.1]">System Overview</h1>
          <p className="font-inter text-[16px] text-on-surface-variant max-w-2xl leading-[1.6]">
            Real-time intelligence dashboard for multi-modal architectural analysis and enterprise field operations.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-primary-container text-on-primary-container rounded-xl font-jetbrains-mono text-[12px] hover:brightness-110 transition-all">
            Generate Report
          </button>
          <button className="px-6 py-2 border border-outline-variant text-on-surface rounded-xl font-jetbrains-mono text-[12px] hover:bg-surface-container-highest transition-all">
            Settings
          </button>
        </div>
      </section>

      {/* Status & Stats Grid (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Platform Map Status */}
        <div className="md:col-span-2 bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-sora text-[20px] text-on-surface font-medium leading-[1.4]">Platform Map</h3>
              <span className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full font-jetbrains-mono text-[10px]">28 Modules Total</span>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 21 }).map((_, i) => {
                const active = [0, 1, 2, 3, 5, 6, 7, 11, 12, 13].includes(i)
                const partial = [4, 10].includes(i)
                const planned = [8, 9].includes(i)
                return (
                  <div
                    key={i}
                    className={`h-8 rounded ${active ? 'bg-secondary-fixed' : partial ? 'bg-secondary-fixed/40 border border-secondary-fixed/30' : planned ? 'bg-outline-variant/20' : 'bg-secondary-fixed'}`}
                    title={active ? 'Active' : partial ? 'Partial' : planned ? 'Planned' : 'Active'}
                  />
                )
              })}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
              <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">19 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed/40 border border-secondary-fixed/30" />
              <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">5 Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline-variant/20" />
              <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">4 Planned</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-pointer hover:bg-surface-bright transition-all">
          <span className="material-symbols-outlined text-primary text-4xl mb-2 group-hover:scale-110 transition-transform">bolt</span>
          <div className="text-3xl font-sora text-on-surface font-medium">1,248</div>
          <div className="font-jetbrains-mono text-[12px] text-on-surface-variant uppercase tracking-widest">AI Inferences (24h)</div>
        </div>
        <div className="bg-surface-container/70 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10 flex flex-col justify-center gap-2 text-center group cursor-pointer hover:bg-surface-bright transition-all">
          <span className="material-symbols-outlined text-tertiary text-4xl mb-2 group-hover:scale-110 transition-transform">database</span>
          <div className="text-3xl font-sora text-on-surface font-medium">84.2GB</div>
          <div className="font-jetbrains-mono text-[12px] text-on-surface-variant uppercase tracking-widest">Active Model Cache</div>
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
            { title: 'ArchVis Studio', subtitle: 'Visual Suite', desc: 'Real-time raytracing and material library for high-fidelity structural visualization.', icon: 'photo_camera', color: 'text-secondary-fixed' },
            { title: "Director's Cut", subtitle: 'Cinematic Suite', desc: 'Automated narrative fly-throughs and client presentation sequencing.', icon: 'movie_edit', color: 'text-tertiary' },
            { title: 'BIM Studio', subtitle: 'Engineering Suite', desc: 'Enterprise-grade Building Information Modeling with AI-driven collision detection.', icon: 'architecture', color: 'text-primary' },
          ].map((studio) => (
            <div key={studio.title} className="group relative overflow-hidden rounded-xl h-64 border border-outline-variant/30 hover:border-secondary-fixed/50 transition-all cursor-pointer">
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
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-sora text-[20px] font-medium">Recent Activity</h3>
            <button className="text-primary font-jetbrains-mono text-[12px] hover:underline">View All History</button>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {[
              { icon: 'auto_fix_high', bg: 'bg-secondary-fixed/20', color: 'text-secondary-fixed', title: 'AI Rendering Complete', time: '12m ago', desc: "Project 'Apex Tower' high-fidelity textures processed via fal.ai model. 4K export ready." },
              { icon: 'group_add', bg: 'bg-tertiary/20', color: 'text-tertiary', title: 'New Collaborator Joined', time: '1h ago', desc: "David Miller joined 'Bridge Nexus' as Lead Structural Engineer." },
              { icon: 'warning', bg: 'bg-error/20', color: 'text-error', title: 'Collision Warning', time: '3h ago', desc: 'Major MEP conflict detected in Level 4 HVAC ducting vs Structural Steel Beam B12.' },
            ].map((item) => (
              <div key={item.title} className="px-6 py-4 flex gap-4 items-start hover:bg-surface-variant/20 transition-colors">
                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-inter font-bold text-on-surface text-[14px]">{item.title}</span>
                    <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">{item.time}</span>
                  </div>
                  <p className="text-on-surface-variant font-inter text-[14px] leading-[1.5]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10">
            <h3 className="font-sora text-[20px] text-primary font-medium">System Health</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {[
                { label: 'OpenAI API', status: 'Active', value: '98%' },
                { label: 'fal.ai Cluster', status: 'Optimal', value: '92%' },
                { label: 'ElevenLabs Voice', status: 'Active', value: '100%' },
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
                <span className="font-jetbrains-mono text-[12px] font-bold">Copilot Insight</span>
              </div>
              <p className="font-inter text-[14px] text-on-surface-variant leading-relaxed">
                I&apos;ve analyzed your recent BIM revisions. Project Alpha is showing a 14% improvement in thermal efficiency after the latest facade update.
              </p>
            </div>
            <button className="w-full py-3 bg-transparent border border-outline-variant hover:bg-surface-variant transition-all rounded-lg font-jetbrains-mono text-[12px]">
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>

      <footer className="pt-8 pb-12 border-t border-outline-variant/10 text-center text-on-surface-variant max-w-7xl mx-auto z-10 relative">
        <p className="font-jetbrains-mono text-[10px] opacity-50">&copy; 2024 Apex Enterprise AI Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}
