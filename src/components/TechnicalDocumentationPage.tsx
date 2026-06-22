export function TechnicalDocumentationPage() {
  return (
    <div className="h-full bg-[#051424] text-[#d4e4fa] flex flex-col overflow-hidden">
      {/* TopNavBar */}
      <header className="flex justify-between items-center px-6 h-16 bg-[#051424] border-b border-[#3b494b] shrink-0">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold text-[#00f0ff] tracking-tighter" style={{ fontFamily: 'Geist, sans-serif' }}>Apex Global AI</span>
          <nav className="hidden md:flex gap-6">
            <span className="text-sm text-[#00f0ff] border-b-2 border-[#00f0ff] pb-1 cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Docs</span>
            <span className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>API</span>
            <span className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Pricing</span>
            <span className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Changelog</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <input className="bg-[#0d1c2d] border border-[#3b494b] text-sm px-4 py-1.5 w-64 focus:outline-none focus:border-[#00f0ff] transition-all text-[#d4e4fa] placeholder:text-[#b9cacb]" placeholder="Search documentation..." type="text" />
            <span className="material-symbols-outlined absolute right-2 top-1.5 text-[#849495] text-sm">search</span>
          </div>
          <button className="text-[#b9cacb] hover:text-[#00f0ff] cursor-pointer">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-[#b9cacb] hover:text-[#00f0ff] cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full border border-[#3b494b] bg-[#273647] overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDA4pHGPeCCKU4FDaJwvFogAjeR-Erpuv9ukBlexabISg6yicoyGaB2SdUG1IcKMLKAzd80I_zjJh8bObmmdLvovub-LiXWycAwv_fvOLfbzwmiSvw-C1kBW-7KeimYuTVR0Ad2sP3koL51xogfvapEWabbHvqAPfMciUuXsLw7zOKO09z4MwFYK8l0_KO6elyGm6dAhUpRti2fLX5xoaHuYNXNTv30DW7R-z0M-fvSA-spZ9tLTfut5l6RUSSmzHvmc2wglOaubWw')", backgroundSize: 'cover' }}></div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-[#0d1c2d] border-r border-[#3b494b] flex flex-col pt-8 pb-4 hidden md:flex shrink-0">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#00f0ff] rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-[#00363a]">terminal</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#00f0ff]" style={{ fontFamily: 'Geist, sans-serif' }}>Developer Portal</h2>
                <p className="text-[10px] text-[#849495] font-bold uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>v2.4.0-stable</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {[
              { icon: 'bolt', label: 'Quickstart', active: false },
              { icon: 'hub', label: 'Architecture', active: true },
              { icon: 'code', label: 'API Reference', active: false },
              { icon: 'lock', label: 'Security', active: false },
              { icon: 'verified_user', label: 'Compliance', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 pl-4 py-2 cursor-pointer transition-all ${
                  item.active
                    ? 'text-[#00f0ff] font-bold border-l-2 border-[#00f0ff] bg-[#1c2b3c]'
                    : 'text-[#b9cacb] hover:bg-[#122131]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="mt-auto px-4 py-4 border-t border-[#3b494b]">
            <button className="w-full bg-[#00f0ff] text-[#00363a] py-2 font-bold text-sm rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-sm">api</span>
              API Reference
            </button>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-3 text-[#b9cacb] hover:text-[#d4e4fa] px-2 py-1 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-sm">help</span>
                <span className="text-xs font-bold uppercase tracking-widest">Support</span>
              </div>
              <div className="flex items-center gap-3 text-[#b9cacb] hover:text-[#d4e4fa] px-2 py-1 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                <span className="text-xs font-bold uppercase tracking-widest">Feedback</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <div className="px-6 py-4 border-b border-[#3b494b] flex items-center justify-between bg-[#051424]/50 shrink-0">
            <nav className="flex items-center text-[11px] text-[#849495] space-x-2" style={{ fontFamily: 'Geist, sans-serif' }}>
              <span className="hover:text-[#00f0ff] transition-colors cursor-pointer">Docs</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="hover:text-[#00f0ff] transition-colors cursor-pointer">Architecture</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-[#d4e4fa]">Ecosystem Overview</span>
            </nav>
            <button className="flex items-center gap-1.5 text-xs text-[#849495] hover:text-[#00f0ff] transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit page
            </button>
          </div>

          {/* Content + Right Sidebar */}
          <div className="flex flex-1 overflow-hidden">
            <article className="flex-1 overflow-y-auto px-6 py-12 max-w-[800px] mx-auto">
              <header className="mb-12">
                <h1 className="text-3xl font-bold text-[#00f0ff] mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>Ecosystem Overview</h1>
                <p className="text-lg text-[#b9cacb] leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  A high-level architectural walkthrough of the Apex Global AI Platform, designed for security-first enterprise integration and autonomous intelligence scaling.
                </p>
              </header>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-[#dbfcff] border-b border-[#3b494b] pb-2 mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>Core Philosophy</h2>
                  <p className="leading-relaxed mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    The Apex platform is built on the principle of "Encapsulated Intelligence." This means every model, dataset, and pipeline is treated as a secure, isolated entity that can communicate via our proprietary{' '}
                    <code className="bg-[#273647] px-1.5 py-0.5 rounded text-[#7df4ff]">ApexBridge</code> protocol.
                  </p>
                  <div className="my-8 rounded-lg overflow-hidden border border-[#3b494b] bg-[#122131]" style={{ boxShadow: '0 0 15px rgba(0,240,255,0.15)' }}>
                    <div className="px-4 py-2 flex justify-between items-center" style={{ background: 'rgba(18,20,28,0.8)', borderBottom: '1px solid #3b494b' }}>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#849495]" style={{ fontFamily: 'Geist, sans-serif' }}>architecture-manifest.yaml</span>
                      <button className="text-[#849495] hover:text-[#00f0ff] cursor-pointer">
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                    <pre className="p-6 text-sm text-[#b9cacb] overflow-x-auto" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <code>{`version: "2.4.0-stable"
services:
  gateway:
    type: secure_ingress
    auth: OIDC_ENFORCED
  intelligence_core:
    nodes: auto_scale
    isolation: kernel_level`}</code>
                    </pre>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-[#dbfcff] border-b border-[#3b494b] pb-2 mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>The Triad Structure</h2>
                  <p className="mb-6" style={{ fontFamily: 'JetBrains Mono, monospace' }}>The ecosystem consists of three primary layers that work in orchestration:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: 'layers', label: 'Foundation', desc: 'Scalable GPU clusters and distributed storage systems.', color: 'text-[#d1bcff]', bg: 'bg-[#7000ff]/20' },
                      { icon: 'psychology', label: 'Inference', desc: 'Proprietary LLMs and specialized RAG architectures.', color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/20' },
                      { icon: 'integration_instructions', label: 'Interface', desc: 'Robust APIs, SDKs, and visual engineering studios.', color: 'text-[#f5f4ff]', bg: 'bg-[#d8d8e4]/20' },
                    ].map((item) => (
                      <div key={item.label} className="p-6 bg-[#0d1c2d] border border-[#3b494b] rounded-lg">
                        <div className={`w-10 h-10 mb-4 ${item.bg} flex items-center justify-center rounded`}>
                          <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                        </div>
                        <h3 className={`text-lg font-semibold ${item.color} mb-2`} style={{ fontFamily: 'Geist, sans-serif' }}>{item.label}</h3>
                        <p className="text-sm text-[#b9cacb]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="p-4 border-l-4 border-[#00f0ff] bg-[#273647]/30 rounded-r">
                  <h4 className="font-bold text-[#00f0ff] text-sm flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    NOTE
                  </h4>
                  <p className="text-sm italic" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Architectural compliance is validated at every commit. Any divergence from the defined security protocol will trigger an automated platform freeze.</p>
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-24 pt-12 border-t border-[#3b494b] flex flex-col md:flex-row justify-between items-center">
                <span className="text-xs text-[#849495]" style={{ fontFamily: 'Geist, sans-serif' }}>© 2024 Apex Global AI. All rights reserved. Built for secure intelligence.</span>
                <div className="flex gap-6 mt-4 md:mt-0">
                  <span className="text-xs text-[#849495] hover:text-[#00f0ff] transition-all cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Privacy Policy</span>
                  <span className="text-xs text-[#849495] hover:text-[#00f0ff] transition-all cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Terms of Service</span>
                  <span className="text-xs text-[#849495] hover:text-[#00f0ff] transition-all cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Security Whitepaper</span>
                  <span className="text-xs text-[#849495] hover:text-[#00f0ff] transition-all cursor-pointer" style={{ fontFamily: 'Geist, sans-serif' }}>Status</span>
                </div>
              </footer>
            </article>

            {/* On this page right sidebar */}
            <aside className="hidden lg:block w-72 overflow-y-auto py-12 pr-6 pl-4 shrink-0">
              <div className="mb-10">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#d4e4fa] mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>On this page</h4>
                <ul className="space-y-3 text-[13px] border-l border-[#3b494b]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <li className="pl-4 border-l-2 border-[#00f0ff] -ml-[1px]"><span className="text-[#00f0ff] cursor-pointer">Core Philosophy</span></li>
                  {['The Triad Structure', 'Infrastructure Layers', 'Connectivity Graph', 'Compliance Benchmarks'].map((item) => (
                    <li key={item} className="pl-4 hover:text-[#00f0ff] transition-colors cursor-pointer"><span className="text-[#849495]">{item}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#d4e4fa] mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>Related Modules</h4>
                <div className="space-y-4">
                  {[
                    { title: 'BIM Studio', desc: 'Intelligence for construction management.' },
                    { title: 'AI Copilot', desc: 'Real-time developer assistance.' },
                    { title: 'Vision Core', desc: 'Edge-based computer vision engine.' },
                  ].map((mod) => (
                    <div key={mod.title} className="group block p-3 rounded bg-[#122131] border border-[#3b494b] hover:border-[#00f0ff] transition-all cursor-pointer">
                      <h5 className="text-xs font-bold group-hover:text-[#00f0ff]">{mod.title}</h5>
                      <p className="text-[10px] text-[#849495] mt-1">{mod.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
