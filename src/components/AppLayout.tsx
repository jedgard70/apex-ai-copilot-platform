import { ReactNode, useState } from 'react'

const sidebarItems = [
  { icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
  { icon: 'forum', label: 'Chat', id: 'chat' },
  { icon: 'architecture', label: 'BIM', id: 'bim' },
  { icon: 'engineering', label: 'Field Ops', id: 'fieldops' },
  { icon: 'groups', label: 'CRM', id: 'crm' },
  { icon: 'admin_panel_settings', label: 'Owner', id: 'owner' },
  { icon: 'rocket_launch', label: 'Deployment', id: 'deployment' },
  { icon: 'verified_user', label: 'Governance', id: 'governance' },
  { icon: 'insights', label: 'Marketing', id: 'marketing' },
  { icon: 'explore', label: 'Navigator', id: 'navigator' },
  { icon: 'model_training', label: 'Training', id: 'training' },
  { icon: 'description', label: 'Docs', id: 'docs' },
]

type AppLayoutProps = {
  children: ReactNode
  activeNav?: string
  onNavChange?: (id: string) => void
  title?: string
  subtitle?: string
  avatarUrl?: string
  connectors?: { label: string; active: boolean }[]
}

export default function AppLayout({
  children,
  activeNav = 'dashboard',
  onNavChange,
  title = 'Apex AI Copilot',
  subtitle = 'Main Interface',
  avatarUrl,
  connectors,
}: AppLayoutProps) {
  const [navActive, setNavActive] = useState(activeNav)

  const handleNav = (id: string) => {
    setNavActive(id)
    onNavChange?.(id)
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-inter selection:bg-primary/30">
      <header className="fixed top-0 w-full z-40 bg-surface/90 border-b border-outline-variant/10 backdrop-blur-md flex justify-between items-center h-toolbar-width px-container-margin">
        <div className="flex items-center gap-4">
          <span className="font-sora text-[20px] font-bold text-primary tracking-tight">{title}</span>
          <div className="hidden md:flex gap-4 ml-8">
            <span className="text-primary font-bold font-jetbrains-mono text-label-md">Project Alpha</span>
            <span className="text-on-surface-variant font-jetbrains-mono text-label-md">Status: Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {connectors && (
            <div className="flex items-center gap-3 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/20">
              {connectors.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5" style={connectors.indexOf(c) > 0 ? { borderLeft: '1px solid var(--color-outline-variant)', paddingLeft: '12px' } : {}}>
                  <span className={`w-2 h-2 rounded-full ${c.active ? 'bg-secondary-fixed' : 'bg-outline-variant/50'}`} />
                  <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">{c.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]">notifications</span>
            <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]">map</span>
            <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]">account_tree</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img className="w-full h-full object-cover" src={avatarUrl} alt="avatar" />
            ) : (
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-toolbar-width h-screen overflow-hidden">
        <nav className="w-sidebar-wide h-full flex flex-col py-gutter px-gutter bg-surface-container border-r border-outline-variant/10 backdrop-blur-xl">
          <div className="mb-8">
            <span className="font-sora text-[20px] font-bold text-on-surface capitalize">{navActive}</span>
            <p className="font-inter text-[14px] text-on-surface-variant opacity-70">{subtitle}</p>
          </div>
          <ul className="flex flex-col gap-1">
            {sidebarItems.map((item) => (
              <li
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer duration-150 rounded-lg ${
                  navActive === item.id
                    ? 'text-primary bg-primary/10 border-r-2 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-jetbrains-mono text-[12px] uppercase tracking-wider">{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto p-4 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">System Load</span>
              <span className="font-jetbrains-mono text-[10px] text-secondary-fixed">14%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-secondary-fixed h-full w-[14%]" />
            </div>
          </div>
        </nav>

        <main className="flex-1 h-full overflow-y-auto p-gutter relative">
          {children}
        </main>
      </div>
    </div>
  )
}
