const roleSidebarMap: Record<string, string[]> = {
  owner_admin: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'research', 'crm', 'finance', 'governance', 'marketing', 'archvis',
    'directcut', 'owner', 'deployment', 'navigator', 'training', 'docs', 'caixa_mcmv', 'service-catalog', 'prompt-catalog'
  ],
  internal_team: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'crm', 'archvis', 'directcut', 'training', 'docs', 'caixa_mcmv', 'service-catalog'
  ],
  client: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'archvis', 'directcut', 'caixa_mcmv', 'service-catalog'
  ],
  partner: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'archvis', 'directcut'
  ],
  viewer: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'archvis', 'directcut'
  ],
  contractor: [
    'dashboard', 'chat', 'fieldops', 'contracts'
  ],
  finance: [
    'dashboard', 'chat', 'budget', 'finance', 'contracts', 'caixa_mcmv'
  ],
  sales: [
    'dashboard', 'chat', 'crm', 'contracts', 'budget'
  ],
  field: [
    'dashboard', 'chat', 'fieldops'
  ],
  bim_manager: [
    'dashboard', 'chat', 'bim', 'archvis', 'directcut', 'budget'
  ],
  project_manager: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'crm', 'finance', 'governance', 'marketing', 'archvis', 'directcut', 'caixa_mcmv'
  ]
}

export function PlatformNavigatorPage({ onNavigate, userRole }: { onNavigate?: (view: string) => void; userRole?: string }) {
  const normalizedRole = userRole ? userRole.toLowerCase().replace(/\s+/g, '_') : 'owner_admin'
  const isClient = normalizedRole === 'client'
  const allowedViews = roleSidebarMap[normalizedRole] || roleSidebarMap.owner_admin

  const sections = [
    {
      icon: 'psychology', label: 'Intelligence Core', color: 'text-[#b4c5ff]', screens: '5 SCREENS',
      items: [
        { icon: 'auto_awesome', label: 'AI Copilot', action: 'chat' },
        { icon: 'chat', label: 'Intelligence Chat', action: 'chat' },
        { icon: 'settings_input_component', label: 'Model Settings', action: 'training' },
        { icon: 'model_training', label: 'Training Hub', action: 'training' },
        { icon: 'policy', label: 'AI Governance', action: 'governance' },
      ]
    },
    {
      icon: 'architecture', label: 'Vertical Engineering Studios', color: 'text-[#ecb2ff]', screens: '7 SCREENS',
      items: [
        { icon: 'layers', label: 'BIM Studio', action: 'bim' },
        { icon: 'foundation', label: 'ArchVis Studio', action: 'archvis' },
        { icon: 'movie_filter', label: "Director's Cut", action: 'directcut' },
        { icon: 'inventory_2', label: 'Supply Chain', action: 'budget' },
        { icon: 'engineering', label: 'Field Ops', action: 'fieldops' },
        { icon: 'science', label: 'R&D Research', action: 'research' },
        { icon: 'precision_manufacturing', label: 'Structural AI', action: 'bim' },
      ]
    },
    {
      icon: 'admin_panel_settings', label: 'Owner Panel', color: 'text-[#7df4ff]', screens: '5 SCREENS',
      items: [
        { icon: 'monitoring', label: 'Executive Overview', action: 'owner' },
        { icon: 'payments', label: 'Finance Desk', action: 'finance' },
        { icon: 'handshake', label: 'Market CRM', action: 'crm' },
        { icon: 'insights', label: 'Marketing Analytics', action: 'marketing' },
        { icon: 'deployed_code', label: 'Digital Twin', action: 'digital-twin' },
      ]
    },
    {
      icon: 'dns', label: 'SaaS Infrastructure', color: 'text-[#c3c6d7]', screens: '5 SCREENS',
      items: [
        { icon: 'storefront', label: 'Service Catalog', action: 'service-catalog' },
        { icon: 'library_books', label: 'Biblioteca de Prompts', action: 'prompt-catalog' },
        { icon: 'shopping_cart', label: 'Marketplace', action: 'navigator' },
        { icon: 'receipt_long', label: 'Billing Portal', action: 'finance' },
        { icon: 'api', label: 'API Portal', action: 'docs' },
        { icon: 'person_add', label: 'Client Onboarding', action: 'crm' },
        { icon: 'security', label: 'Admin Console', action: 'owner' },
      ]
    },
    {
      icon: 'menu_book', label: 'Authentication & Docs', color: 'text-[#8d90a0]', screens: '2 SCREENS',
      items: [
        { icon: 'login', label: 'Login Screen', action: 'chat' },
        { icon: 'description', label: 'Technical Docs', action: 'docs' },
      ]
    },
  ]

  const filteredSections = sections.map(sec => {
    const filteredItems = sec.items.filter(item => {
      if (isClient) {
        const clientAllowedMap = ['chat', 'bim', 'archvis', 'directcut', 'fieldops', 'budget', 'contracts', 'docs']
        return clientAllowedMap.includes(item.action)
      }
      return allowedViews.includes(item.action) || item.action === 'chat'
    })
    return { ...sec, items: filteredItems }
  }).filter(sec => sec.items.length > 0)

  return (
    <div className="h-full bg-[#060d20] flex overflow-hidden">
      {/* SideNavBar — Stitch style */}
      <aside className="w-[280px] bg-[#060d20]/95 backdrop-blur-md flex flex-col p-4 gap-unit border-r border-white/10 shadow-xl flex-shrink-0">
        <div className="flex items-center gap-3 mb-6 px-2">
          <img src="/apex-global-logo.png" alt="Apex Global" className="w-10 h-10 rounded-xl object-cover shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
          <div>
            <h2 className="text-[20px] font-medium tracking-tight text-[#dbe2fd]">Apex Global</h2>
            <p className="text-[12px] tracking-widest text-[#c3c6d7]">AI Platform Map</p>
          </div>
        </div>
        <button onClick={() => onNavigate?.('chat')}
          className="w-full bg-[#2563eb] text-[#eeefff] py-3 rounded-xl text-[12px] tracking-widest font-medium mb-6 hover:brightness-110 active:translate-x-1 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          New Simulation
        </button>
        <nav className="flex-1 space-y-2">
          <div className="bg-[#2563eb] text-[#eeefff] rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-3 p-3 transition-all duration-200 cursor-default">
            <span className="material-symbols-outlined">map</span>
            <span className="text-[12px] tracking-widest font-medium">Platform Map</span>
          </div>
          {[
            { icon: 'dashboard', label: 'Dashboard', view: 'dashboard' },
            { icon: 'smart_toy', label: 'AI Chat', view: 'chat' },
            { icon: 'storefront', label: 'Service Catalog', view: 'service-catalog' },
            { icon: 'admin_panel_settings', label: 'Owner Console', view: 'owner' },
          ].filter(item => item.view !== 'owner' || allowedViews.includes('owner'))
          .map(item => (
            <div key={item.label} onClick={() => onNavigate?.(item.view)}
              className="text-[#c3c6d7] hover:bg-[#222a3e] rounded-xl flex items-center gap-3 p-3 transition-all duration-200 cursor-pointer group">
              <span className="material-symbols-outlined group-hover:text-[#b4c5ff]">{item.icon}</span>
              <span className="text-[12px] tracking-widest">{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
          <div className="text-[#c3c6d7] hover:bg-[#222a3e] rounded-xl flex items-center gap-3 p-3 transition-all duration-200 cursor-pointer">
            <span className="material-symbols-outlined">help</span>
            <span className="text-[12px] tracking-widest">Help</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopAppBar — Stitch style */}
        <header className="bg-[#0b1326]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 h-12 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium tracking-tight text-[#dbe2fd]">Project Navigator</h1>
            <span className="px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] text-[10px] uppercase tracking-widest border border-[#b4c5ff]/20">Master Index</span>
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

        {/* Navigator Scroll Area — Stitch style */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-[#0b1326] to-[#060d20]">
          <div className="max-w-7xl mx-auto space-y-10 py-4">
            {filteredSections.map((section) => (
              <section key={section.label}>
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2">
                  <span className={`material-symbols-outlined ${section.color}`}>{section.icon}</span>
                  <h2 className="text-[12px] tracking-widest uppercase text-[#dbe2fd]">{section.label}</h2>
                  <span className="ml-auto text-[10px] text-[#c3c6d7]">{section.screens}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      onClick={() => item.action && onNavigate?.(item.action)}
                      className="nav-grid-item rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2563eb]/10 hover:border-[#2563eb]/30"
                      style={{
                        background: 'rgba(23,31,51,0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <span className={`material-symbols-outlined ${section.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                      <span className="text-[12px] tracking-widest uppercase text-[#dbe2fd]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Quick Navigation Shortcut — Stitch style */}
            <div className="max-w-7xl mx-auto mt-12 mb-8">
              <div className="relative overflow-hidden rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 glass-panel" style={{ background: 'rgba(23,31,51,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.2)' }}>
                <div className="ai-shimmer absolute inset-0 pointer-events-none opacity-10" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.2) 50%, rgba(37,99,235,0) 100%)', backgroundSize: '200% 100%' }}></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#b4c5ff]/20 flex items-center justify-center text-[#b4c5ff]">
                    <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-[#dbe2fd]">Jump to Latest Simulation</h3>
                    <p className="text-[#c3c6d7] text-sm">Project Alpha: Structural Load Simulation #412</p>
                  </div>
                </div>
                <button onClick={() => onNavigate?.('chat')}
                  className="bg-[#b4c5ff] text-[#002a78] px-8 py-3 rounded-xl text-[12px] tracking-widest uppercase font-medium shadow-lg shadow-[#b4c5ff]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-10">
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
