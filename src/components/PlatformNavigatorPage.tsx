export function PlatformNavigatorPage() {
  const sections = [
    {
      icon: 'psychology', label: 'Intelligence Core', color: 'text-[#b4c5ff]', screens: '5 SCREENS',
      items: [
        { icon: 'auto_awesome', label: 'AI Copilot', color: 'text-[#b4c5ff]' },
        { icon: 'chat', label: 'Intelligence Chat', color: 'text-[#b4c5ff]' },
        { icon: 'settings_input_component', label: 'Model Settings', color: 'text-[#b4c5ff]' },
        { icon: 'model_training', label: 'Training Hub', color: 'text-[#b4c5ff]' },
        { icon: 'policy', label: 'AI Governance', color: 'text-[#b4c5ff]' },
      ]
    },
    {
      icon: 'architecture', label: 'Vertical Engineering Studios', color: 'text-[#ecb2ff]', screens: '7 SCREENS',
      items: [
        { icon: 'layers', label: 'BIM Studio', color: 'text-[#ecb2ff]' },
        { icon: 'foundation', label: 'ArchVis Studio', color: 'text-[#ecb2ff]' },
        { icon: 'movie_filter', label: "Director's Cut", color: 'text-[#ecb2ff]' },
        { icon: 'inventory_2', label: 'Supply Chain', color: 'text-[#ecb2ff]' },
        { icon: 'engineering', label: 'Field Ops', color: 'text-[#ecb2ff]' },
        { icon: 'science', label: 'R&D Research', color: 'text-[#ecb2ff]' },
        { icon: 'precision_manufacturing', label: 'Structural AI', color: 'text-[#ecb2ff]' },
      ]
    },
    {
      icon: 'admin_panel_settings', label: 'Owner Panel', color: 'text-[#7df4ff]', screens: '5 SCREENS',
      items: [
        { icon: 'monitoring', label: 'Executive Overview', color: 'text-[#7df4ff]' },
        { icon: 'payments', label: 'Finance Desk', color: 'text-[#7df4ff]' },
        { icon: 'handshake', label: 'Market CRM', color: 'text-[#7df4ff]' },
        { icon: 'insights', label: 'Marketing Analytics', color: 'text-[#7df4ff]' },
        { icon: 'deployed_code', label: 'Digital Twin', color: 'text-[#7df4ff]' },
      ]
    },
    {
      icon: 'dns', label: 'SaaS Infrastructure', color: 'text-[#c3c6d7]', screens: '5 SCREENS',
      items: [
        { icon: 'shopping_cart', label: 'Marketplace', color: 'text-[#c3c6d7]' },
        { icon: 'receipt_long', label: 'Billing Portal', color: 'text-[#c3c6d7]' },
        { icon: 'api', label: 'API Portal', color: 'text-[#c3c6d7]' },
        { icon: 'person_add', label: 'Client Onboarding', color: 'text-[#c3c6d7]' },
        { icon: 'security', label: 'Admin Console', color: 'text-[#c3c6d7]' },
      ]
    },
    {
      icon: 'menu_book', label: 'Authentication & Docs', color: 'text-[#8d90a0]', screens: '2 SCREENS',
      items: [
        { icon: 'login', label: 'Login Screen', color: 'text-[#8d90a0]' },
        { icon: 'description', label: 'Technical Docs', color: 'text-[#8d90a0]' },
      ]
    },
  ]

  return (
    <div className="h-full bg-[#060d20] flex overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        <header className="bg-surface/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 h-12 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight text-[#dbe2fd]">Project Navigator</h1>
            <span className="px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] text-[10px] font-medium uppercase tracking-widest border border-[#b4c5ff]/20">Master Index</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c3c6d7] group-focus-within:text-[#b4c5ff] text-sm">search</span>
              <input className="bg-[#060d20] border-none rounded-lg pl-9 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-[#b4c5ff] placeholder:text-[#c3c6d7]/40 transition-all w-64 text-[#dbe2fd]" placeholder="Filter screens..." type="text" />
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
              <img className="w-full h-full object-cover" alt="avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaMLvEN7jZ96ltzzG_CxCdZkb2_NxS9vClPAtAbpn0w7TxCLPYaWqtzVmQVPUCAn9cz4X7iCzRdqOH0wPP2m1aK-rYJYvsbTO9tRtRn1m8GMvrITy2WHliCp7xVkO0cwNFxhhuVd9bN2OShu0fS3giIaLjDHdeDwdUnHjQ8l0LApTLb0wmiNehInwpVdBRF6Lp0aCFLVM6adk-jGDYKrkw87S4Iu1ynQbgtpLJbeQ8KUhK-QUHbD_GrZfYROK_abRX8VKW8jqOnIU" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-[#0b1326] to-[#060d20]">
          <div className="max-w-7xl mx-auto space-y-10 py-4">
            {sections.map((section) => (
              <section key={section.label}>
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2">
                  <span className={`material-symbols-outlined ${section.color}`}>{section.icon}</span>
                  <h2 className="text-[10px] font-medium text-[#dbe2fd] uppercase tracking-widest">{section.label}</h2>
                  <span className="ml-auto text-xs text-[#c3c6d7] text-[10px] font-medium">{section.screens}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {section.items.map((item: { icon: string; label: string; color?: string }) => (
                    <div
                      key={item.label}
                      className="group rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: 'rgba(23,31,51,0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <span className={`material-symbols-outlined ${item.color || 'text-[#c3c6d7]'} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[#dbe2fd]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="max-w-7xl mx-auto mt-12 mb-8">
              <div className="relative overflow-hidden rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: 'rgba(23,31,51,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.2)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.2) 50%, rgba(37,99,235,0) 100%)', backgroundSize: '200% 100%' }}></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#b4c5ff]/20 flex items-center justify-center text-[#b4c5ff]">
                    <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-[#dbe2fd]">Jump to Latest Simulation</h3>
                    <p className="text-[#c3c6d7] text-sm">Project Alpha: Structural Load Simulation #412</p>
                  </div>
                </div>
                <button className="bg-[#b4c5ff] text-[#002a78] px-8 py-3 rounded-xl text-[10px] font-medium uppercase tracking-widest shadow-lg shadow-[#b4c5ff]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-10">
                  Launch Current Environment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
