import { ReactNode, useState } from 'react'
import { useIsMobile, useIsTablet } from '../lib/useIsMobile'
import { PwaInstallBanner, IosInstallBanner } from './PwaInstallBanner'

const sidebarItems = [
  { icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
  { icon: 'forum', label: 'Chat', id: 'chat' },
  { icon: 'architecture', label: 'BIM / 3D Studio', id: 'bim' },
  { icon: 'engineering', label: 'Field Operations', id: 'fieldops' },
  { icon: 'request_quote', label: 'Budget / Quantity', id: 'budget' },
  { icon: 'description', label: 'Contracts / Permits', id: 'contracts' },
  { icon: 'account_balance', label: 'Financiamento (Caixa)', id: 'caixa_mcmv' },
  { icon: 'search', label: 'Research', id: 'research' },
  { icon: 'groups', label: 'CRM / Sales', id: 'crm' },
  { icon: 'account_balance_wallet', label: 'Finance', id: 'finance' },
  { icon: 'verified_user', label: 'Governance / EVMS', id: 'governance' },
  { icon: 'insights', label: 'Marketing / Campaign', id: 'marketing' },
  { icon: 'photo_camera', label: 'ArchVis Studio', id: 'archvis' },
  { icon: 'movie_edit', label: "Director's Cut", id: 'directcut' },
  { icon: 'admin_panel_settings', label: 'Owner Console', id: 'owner' },
  { icon: 'rocket_launch', label: 'Deployment', id: 'deployment' },
  { icon: 'explore', label: 'Platform Map', id: 'navigator' },
  { icon: 'school', label: 'Training', id: 'training' },
  { icon: 'menu_book', label: 'Documentation', id: 'docs' },
  { icon: 'smart_toy', label: 'Cérebro IA', id: 'aicontrol' },
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
  userRole?: string
}

/** ── Provider LED colors ── */
const LED_GREEN = '#22c55e'
const LED_RED = '#ef4444'
const LED_AMBER = '#f59e0b'

const normalizeRole = (role: string | null | undefined): string => {
  if (!role) return 'owner_admin'
  const normalized = role.toLowerCase().replace(/\s+/g, '_')
  if (normalized === 'owner/admin') return 'owner_admin'
  return normalized
}

const roleSidebarMap: Record<string, string[]> = {
  owner_admin: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'research', 'crm', 'finance', 'governance', 'marketing', 'archvis',
    'directcut', 'owner', 'deployment', 'navigator', 'training', 'docs', 'aicontrol', 'caixa_mcmv'
  ],
  internal_team: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'crm', 'archvis', 'directcut', 'training', 'docs', 'caixa_mcmv'
  ],
  client: [
    'dashboard', 'chat', 'bim', 'fieldops', 'budget', 'contracts',
    'archvis', 'directcut', 'caixa_mcmv'
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
    'dashboard', 'chat', 'budget', 'finance', 'contracts'
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
    'crm', 'finance', 'governance', 'marketing', 'archvis', 'directcut'
  ]
}

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
  userRole,
}: AppLayoutProps) {
  const [navActive, setNavActive] = useState(activeNav)
  const [ledTooltip, setLedTooltip] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const normalizedRole = normalizeRole(userRole)
  const allowedItems = roleSidebarMap[normalizedRole] || roleSidebarMap.owner_admin
  const filteredSidebarItems = sidebarItems.filter(item => allowedItems.includes(item.id))

  // Debug: mostrar status na tela (temporário)
  const debugInfo = `Mobile: ${isMobile} | Tablet: ${isTablet} | Width: ${typeof window !== 'undefined' ? window.innerWidth : 'N/A'}`

  const handleNav = (id: string) => {
    setNavActive(id)
    onNavChange?.(id)
    setMobileMenuOpen(false)
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
      {/* ── HEADER ── */}
      <header className={`fixed top-0 w-full z-40 bg-surface/90 border-b border-outline-variant/10 backdrop-blur-md flex justify-between items-center px-container-margin ${isMobile ? 'h-14 px-3' : 'h-toolbar-width'}`}>
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="material-symbols-outlined text-[24px] text-on-surface-variant hover:text-on-surface transition-colors mr-1"
              aria-label="Menu"
            >
              {mobileMenuOpen ? 'close' : 'menu'}
            </button>
          )}
          <img src="/apex-global-logo.png" alt="Apex Global" style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="font-sora text-[14px] font-bold text-primary tracking-tight">Apex Global</span>
              <span style={{ fontSize: 8, color: 'rgba(180,197,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI Platform</span>
            </div>
          )}
          {/* Platform Status Badge */}
          {!isMobile && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary-fixed/20 rounded-full border border-secondary-fixed/30">
              <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', backgroundColor: LED_GREEN, boxShadow: `0 0 4px ${LED_GREEN}88` }} />
              <span className="font-jetbrains-mono text-[9px] text-secondary-fixed font-medium">{projectStatus}</span>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2.5">
          {/* Provider LEDs — only 3 main */}
          {!isMobile && (
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/20">
              {['gemini', 'fal', 'elevenlabs'].map(id => {
                const led = leds.find(l => l.id === id)
                const hasKey = led?.hasKey || false
                const color = hasKey ? LED_GREEN : LED_RED
                return (
                  <div key={id} className="flex items-center gap-1.5" title={led?.tooltip || (hasKey ? `${id}: OK` : `${id}: Off`)}>
                    <span className="inline-block rounded-full flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: color, boxShadow: `0 0 4px ${color}88` }} />
                    <span className="font-jetbrains-mono text-[9px] text-on-surface-variant whitespace-nowrap">{id === 'gemini' ? 'Gemini' : id === 'fal' ? 'FAL' : 'Eleven'}</span>
                  </div>
                )
              })}
              <span className="font-jetbrains-mono text-[8px] text-on-surface-variant ml-1 opacity-50">+{totalProviders - 3}</span>
            </div>
          )}

          {/* Action icons */}
          {!isMobile && (
            <div className="flex gap-2.5 text-on-surface-variant items-center">
              {allowedItems.includes('navigator') && (
                <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[18px]" onClick={() => onNavChange?.('navigator')} title="Platform Map">map</span>
              )}
              {allowedItems.includes('owner') && (
                <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[18px]" onClick={() => onNavChange?.('owner')} title="Owner Console">admin_panel_settings</span>
              )}
              {normalizedRole === 'owner_admin' && (
                <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[18px]" onClick={() => onNavChange?.('provider-detail')} title="Provedores">monitoring</span>
              )}
              <span className="material-symbols-outlined hover:text-on-surface cursor-pointer transition-all text-[18px]" onClick={() => onNavChange?.('chat')} title="Mensagens">forum</span>
            </div>
          )}

          {/* Profile avatar — real user photo */}
          <div className="relative">
            <div className={`rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
              onClick={() => setProfileMenuOpen(prev => !prev)} title={normalizedRole === 'owner_admin' ? (avatarUrl ? 'Perfil' : 'Owner Console') : 'Perfil / Configurações'}>
              {avatarUrl ? (
                <img className="w-full h-full object-cover" src={avatarUrl} alt="avatar" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: isMobile ? '16px' : '18px' }}>account_circle</span>
              )}
            </div>
            {/* Profile dropdown menu */}
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/10">
                    <div className="font-jetbrains-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{normalizedRole === 'owner_admin' ? 'Administrador' : normalizedRole === 'client' ? 'Cliente' : 'Usuário'}</div>
                    <div className="font-inter text-[13px] text-on-surface font-medium mt-0.5 truncate">{title}</div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileMenuOpen(false); onProfileClick?.() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      <span className="font-inter text-[13px]">Configurar</span>
                    </button>
                    <button
                      onClick={() => { setProfileMenuOpen(false); onProfileClick?.() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span className="font-inter text-[13px]">Personalizar Usuário</span>
                    </button>
                    <button
                      onClick={() => { setProfileMenuOpen(false); onNavChange?.('chat') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">forum</span>
                      <span className="font-inter text-[13px]">Suporte</span>
                    </button>
                  </div>
                </div>
              </>
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

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className={`flex h-screen overflow-hidden ${isMobile ? 'pt-14 pb-16' : isTablet ? 'pt-14' : 'pt-toolbar-width'}`}>
        {/* ── SIDEBAR NAV ── */}
        {isMobile ? (
          /* Mobile: Slide-in drawer from left */
          <nav
            className={`fixed top-14 left-0 bottom-16 z-30 flex flex-col bg-surface-container border-r border-outline-variant/10 backdrop-blur-xl overflow-hidden transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ width: '280px' }}
          >
            <div className="shrink-0 p-4 border-b border-outline-variant/10">
              <span className="font-sora text-[16px] font-bold text-on-surface capitalize">{navActive}</span>
              {subtitle && <p className="font-inter text-[12px] text-on-surface-variant opacity-70 mt-1">{subtitle}</p>}
            </div>
            <ul className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto p-2">
              {filteredSidebarItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer duration-150 rounded-lg ${
                    navActive === item.id
                      ? 'text-primary bg-primary/10 border-r-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-jetbrains-mono text-[11px] uppercase tracking-wider">{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="shrink-0 m-3 p-3 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-center mb-2">
                <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">Providers</span>
                <span className="font-jetbrains-mono text-[10px] text-secondary-fixed">{healthyProviders}/{totalProviders} OK</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-secondary-fixed h-full" style={{ width: totalProviders > 0 ? `${Math.round((healthyProviders / totalProviders) * 100)}%` : '0%', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </nav>
        ) : (
          /* Desktop/Tablet: Fixed sidebar */
          <nav className={`${isTablet ? 'w-16' : 'w-sidebar-wide'} h-full flex flex-col py-gutter px-gutter bg-surface-container border-r border-outline-variant/10 backdrop-blur-xl overflow-hidden`}>
            <div className="mb-6 shrink-0">
              <span className={`font-sora font-bold text-on-surface capitalize ${isTablet ? 'text-[14px]' : 'text-[20px]'}`}>{navActive}</span>
              {!isTablet && <p className="font-inter text-[14px] text-on-surface-variant opacity-70">{subtitle}</p>}
            </div>
            <ul className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              {filteredSidebarItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer duration-150 rounded-lg ${
                    navActive === item.id
                      ? 'text-primary bg-primary/10 border-r-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  } ${isTablet ? 'px-2 py-2 justify-center' : ''}`}
                  title={isTablet ? item.label : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {!isTablet && <span className="font-jetbrains-mono text-[12px] uppercase tracking-wider">{item.label}</span>}
                </li>
              ))}
            </ul>
            {!isTablet && (
              <div className="shrink-0 mt-3 p-4 bg-surface-container/70 backdrop-blur-md rounded-xl border border-outline-variant/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-jetbrains-mono text-[10px] text-on-surface-variant">Providers</span>
                  <span className="font-jetbrains-mono text-[10px] text-secondary-fixed">{healthyProviders}/{totalProviders} OK</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary-fixed h-full" style={{ width: totalProviders > 0 ? `${Math.round((healthyProviders / totalProviders) * 100)}%` : '0%', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}
          </nav>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className={`flex-1 h-full overflow-hidden relative ${isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-gutter'}`}>
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-around px-2 py-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
          {[
            { icon: 'dashboard', label: 'Home', id: 'dashboard' },
            { icon: 'forum', label: 'Chat', id: 'chat' },
            { icon: 'explore', label: 'Map', id: 'navigator' },
            { icon: 'account_balance', label: 'Finance', id: 'finance' },
            { icon: 'menu', label: 'More', id: '__menu__' },
          ].filter(item => item.id === '__menu__' || allowedItems.includes(item.id))
          .map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === '__menu__') {
                  setMobileMenuOpen(!mobileMenuOpen)
                } else {
                  handleNav(item.id)
                }
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors min-w-0 ${
                navActive === item.id ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[9px] font-medium truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── PWA INSTALL BANNERS (Mobile only) ── */}
      {isMobile && (
        <>
          <PwaInstallBanner />
          <IosInstallBanner />
        </>
      )}
    </div>
  )
}
