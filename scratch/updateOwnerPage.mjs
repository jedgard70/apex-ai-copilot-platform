import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/OwnerPage.tsx');
let content = fs.readFileSync(file, 'utf8');

// I need to add state for the accordion. Let's find the OwnerPage component start
const newSidebarState = `
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
      title: 'Jurídico & Compliance',
      icon: 'gavel',
      items: [
        { label: 'Global Permits', view: 'permits' },
        { label: 'Caixa / MCMV', view: 'caixa_mcmv' },
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
`;

content = content.replace("  const [loading, setLoading] = useState(true)", "  const [loading, setLoading] = useState(true)\n" + newSidebarState);

const oldSidebar = `<nav className="flex-grow space-y-1 px-3">
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
              className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all \${
                item.active ? 'bg-[#6C47FF] text-white' : 'text-[#c6c6ce] hover:text-white hover:bg-white/5'
              }\`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-caps text-xs">{item.label}</span>
            </button>
          ))}
        </nav>`;

const newSidebarHTML = `<nav className="flex-grow overflow-y-auto px-3 space-y-3 py-2 scrollbar-thin">
          {NAV_MODULES.map(cat => (
            <div key={cat.id} className="space-y-1">
              <button onClick={() => toggleMenu(cat.id)} className="w-full flex items-center justify-between px-3 py-2 text-[#c6c6ce] hover:text-white transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  <span className="font-label-caps text-[11px] uppercase tracking-wider">{cat.title}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] transition-transform" style={{ transform: openMenus[cat.id] ? 'rotate(180deg)' : 'none' }}>expand_more</span>
              </button>
              {openMenus[cat.id] && (
                <div className="pl-9 space-y-0.5">
                  {cat.items.map(item => (
                    <button key={item.label} onClick={() => onNavigate?.(item.view)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-all">
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>`;

content = content.replace(oldSidebar, newSidebarHTML);

// Next, inject the MODULES list from DashboardPage
const modulesList = `// 62 modules do Ecossistema Apex
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
`;

content = content.replace("const STATUS_COLORS: Record<string, string> = {", modulesList + "\nconst STATUS_COLORS: Record<string, string> = {");

const dashboardHeader = `
      {/* Main Content Area */}
      <main className="flex-grow p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">Unified Control Hub</h1>
            <p className="text-[#a1a1aa] text-sm mt-1 max-w-xl">
              Monitoramento executivo da infraestrutura Apex, uso de IA (Telemetria) e roteamento de módulos da plataforma.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigate?.('navigator')} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all">
              Platform Map →
            </button>
            <button onClick={() => onOpenChat?.('Analise a integridade do sistema')} className="px-5 py-2 bg-[#6C47FF] hover:bg-[#5835eb] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">bot</span> Run AI Audit
            </button>
          </div>
        </header>

        {/* Platform Map Status */}
        <section className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[18px] text-white font-medium">Ecossistema Modular Apex (62 Módulos)</h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-6">
            {MODULES.slice(0, 24).map((m, i) => {
              const state = i < 13 ? 'ready' : i < 17 ? 'partial' : 'planned'
              const bg = state === 'ready' ? 'bg-[#22c55e]/20 text-[#22c55e]' : state === 'partial' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-white/5 text-[#a1a1aa]'
              return (
                <div key={i} title={\`\${m}: \${state}\`}
                  onClick={() => onNavigate?.('navigator')}
                  className={\`px-2 py-2 rounded text-[10px] font-medium cursor-pointer transition-all hover:scale-105 truncate text-center \${bg}\`}>
                  {m}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> <span className="text-[#a1a1aa]">13 Prontos</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> <span className="text-[#a1a1aa]">4 Em Progresso</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/20" /> <span className="text-[#a1a1aa]">{MODULES.length - 17} Planejados</span></div>
          </div>
        </section>

        {/* Existing Grid starts here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
`;

// Replace the old header with the new one
const oldHeaderRegex = /<main className="flex-grow p-8 overflow-y-auto">[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-3 gap-6">/;
content = content.replace(oldHeaderRegex, dashboardHeader);

fs.writeFileSync(file, content);
console.log('OwnerPage refactored!');
