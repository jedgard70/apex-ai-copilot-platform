import { ReactNode, useState } from 'react'

const sidebarItems = [
  { icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
  { icon: 'forum', label: 'Chat', id: 'chat' },
  { icon: 'architecture', label: 'BIM / 3D Studio', id: 'bim' },
  { icon: 'engineering', label: 'Field Operations', id: 'fieldops' },
  { icon: 'request_quote', label: 'Budget / Quantity', id: 'budget' },
  { icon: 'description', label: 'Contracts / Permits', id: 'contracts' },
  { icon: 'search', label: 'Research', id: 'research' },
  { icon: 'groups', label: 'CRM / Sales', id: 'crm' },
  { icon: 'account_balance', label: 'Finance', id: 'finance' },
  { icon: 'verified_user', label: 'Governance / EVMS', id: 'governance' },
  { icon: 'insights', label: 'Marketing / Campaign', id: 'marketing' },
  { icon: 'photo_camera', label: 'ArchVis Studio', id: 'archvis' },
  { icon: 'movie_edit', label: "Director's Cut", id: 'directcut' },
  { icon: 'admin_panel_settings', label: 'Owner Console', id: 'owner' },
  { icon: 'rocket_launch', label: 'Deployment', id: 'deployment' },
  { icon: 'explore', label: 'Platform Map', id: 'navigator' },
  { icon: 'school', label: 'Training', id: 'training' },
  { icon: 'menu_book', label: 'Documentation', id: 'docs' },
]

/** Individual provider LED */
type ProviderLed = {
  id: string
  label: string
  /** green led = hasApiKey, red led = no key */
  hasKey: boolean
  /** optional tooltip with balance info */
  tooltip?: string
  /** URL para recarga se !hasKey */
  topUpUrl?: string
}

type AppLayoutProps = {
  children: ReactNode
  activeNav?: string
  onNavChange?: (id: string) => void
  title?: string
  subtitle?: string
  avatarUrl?: string
  /** @deprecated use providerLeds instead */
  connectors?: { label: string; active: boolean }[]
  /** All provider LED indicators */
  providerLeds?: ProviderLed[]
  /** Dynamic project info (left side of header) */
  projectName?: string
  projectStatus?: string
  /** Click handlers for right-side icons */
  onNotificationsClick?: () => void
  onMapClick?: () => void
  onAccountTreeClick?: () => void
  onProfileClick?: () => void
}

/** ── Provider LED colors ── */
const LED_GREEN = '#22c55e'
const LED_RED = '#ef4444'
const LED_AMBER = '#f59e0b'

export default function AppLayout({
  children,
  activeNav = 'dashboard',
  onNavChange,
  title = 'Apex AI Copilot',
  subtitle = '',
  avatarUrl,
  connectors,
  providerLeds,
  projectName = 'Project Alpha',
  projectStatus = 'Ready',
  onNotificationsClick,
  onMapClick,
  onAccountTreeClick,
  onProfileClick,
}: AppLayoutProps) {
  const [navActive, setNavActive] = useState(activeNav)
  const [ledTooltip, setLedTooltip] = useState<string | null>(null)

  const handleNav = (id: string) => {
    setNavActive(id)
    onNavChange?.(id)
  }

  // Use providerLeds if provided, otherwise fall back to legacy connectors
  const leds: ProviderLed[] = providerLeds ?? (connectors?.map(c => ({
    id: c.label.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    label: c.label,
    hasKey: c.active,
  })) ?? [])

  // Count totals
  const totalProviders = leds.length
  const healthyProviders = leds.filter(l => l.hasKey).length

  return (
    <div className="min-h-screen bg-background text-on-surface font-inter selection:bg-primary/30">
      <header className="fixed top-0 w-full z-40 bg-surface/90 border-b border-outline-variant/10 backdrop-blur-md flex justify-between items-center h-toolbar-width px-container-margin">
        {/* ── LEFT SIDE: Logo + Title + Project Info ── */}
        <div className="flex items-center gap-4">
          <img src="/apex-global-logo.png" alt="Apex Global" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          <span className="font-sora text-[20px] font-bold text-primary tracking-tight">{title}</span>
          <div className="hidden md:flex items-center gap-3 ml-6">
            <span className="text-primary font-bold font-jetbrains-mono text-label-md">{projectName}</span>
            <span className="text-on-surface-variant font-jetbrains-mono text-label-md">Status: {projectStatus}</span>
          </div>
        </div>

        {/* ── RIGHT SIDE: Provider LEDs + Icons + Avatar ── */}
        <div className="flex items-center gap-5">
          {/* Provider LEDs */}
          {leds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-full border border-outline-variant/20">
              {/* Summary: total healthy / total */}
              <span
                title={`${healthyProviders}/${totalProviders} provedores com chave`}
                className="font-jetbrains-mono text-[10px] text-on-surface-variant mr-1"
                style={{ cursor: 'help' }}
              >
                {healthyProviders}/{totalProviders}
              </span>
              {leds.map((led, idx) => {
                const ledColor = led.hasKey ? LED_GREEN : LED_RED
                const showBorder = idx > 0
                return (
                  <div
                    key={led.id}
                    className="flex items-center gap-1.5"
                    style={{
                      ...(showBorder ? { borderLeft: '1px solid var(--color-outline-variant)', paddingLeft: '8px' } : {}),
                      cursor: led.tooltip ? 'help' : 'default',
                    }}
                    title={led.tooltip || (led.hasKey ? `${led.label}: Chave OK` : `${led.label}: Sem chave`)}
                    onMouseEnter={() => led.tooltip && setLedTooltip(led.tooltip)}
                    onMouseLeave={() => setLedTooltip(null)}
                  >
                    <span
                      className="inline-block rounded-full flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: ledColor,
                        boxShadow: `0 0 6px ${ledColor}88`,
                      }}
                    />
                    <span className="font-jetbrains-mono text-[10px] text-on-surface-variant whitespace-nowrap">
                      {led.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Action icons */}
          <div className="flex gap-3 text-on-surface-variant">
            <span
              className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]"
              onClick={onNotificationsClick || (() => onNavChange?.('owner'))}
              title="Owner Console"
            >notifications</span>
            <span
              className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]"
              onClick={onMapClick || (() => onNavChange?.('navigator'))}
              title="Platform Map"
            >map</span>
            <span
              className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[20px]"
              onClick={onAccountTreeClick || (() => onNavChange?.('deployment'))}
              title="Deployment"
            >account_tree</span>
          </div>

          {/* Profile avatar */}
          <div
            className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-outline-variant/60 transition-colors"
            onClick={onProfileClick}
            title="Perfil"
          >
            {avatarUrl ? (
              <img className="w-full h-full object-cover" src={avatarUrl} alt="avatar" />
            ) : (
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
            )}
          </div>
        </div>
      </header>

      {/* Led tooltip popup */}
      {ledTooltip && (
        <div style={{
          position: 'fixed',
          top: '56px',
          right: '180px',
          zIndex: 50,
          background: '#1e293b',
          color: '#e2e8f0',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          maxWidth: '260px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          {ledTooltip}
        </div>
      )}

      <div className="flex pt-toolbar-width h-screen overflow-hidden">
        <nav className="w-sidebar-wide h-full flex flex-col py-gutter px-gutter bg-surface-container border-r border-outline-variant/10 backdrop-blur-xl overflow-hidden">
          <div className="mb-6 shrink-0">
            <span className="font-sora text-[20px] font-bold text-on-surface capitalize">{navActive}</span>
            <p className="font-inter text-[14px] text-on-surface-variant opacity-70">{subtitle}</p>
          </div>
          <ul className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
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
          <div className="shrink-0 mt-3 p-4 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">Providers</span>
              <span className="font-jetbrains-mono text-[10px] text-secondary-fixed">{healthyProviders}/{totalProviders} OK</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-secondary-fixed h-full" style={{ width: totalProviders > 0 ? `${Math.round((healthyProviders / totalProviders) * 100)}%` : '0%', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </nav>

        <main className="flex-1 h-full overflow-hidden p-gutter relative">
          {children}
        </main>
      </div>
    </div>
  )
}
