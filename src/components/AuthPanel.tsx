import { Eye, EyeOff, KeyRound, Languages, LogIn, Mail, UserPlus, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient'

type AuthPanelProps = {
  onClear?: () => void
  onAuthStateChange?: (state: SupabaseAccountState) => void
}

const copy = {
  EN: {
    brand: 'Apex AI Copilot',
    eyebrow: 'Apex Global AI',
    headline: 'Transform Your Construction Intelligence',
    subtitle: 'AI-powered intelligence for BIM, 3D visualization, project controls, documents, contracts, permits, marketing, finance and field operations.',
    primaryCta: 'Start with Apex Copilot',
    secondaryCta: 'Request a consultation',
    accessTitle: 'Access Apex Copilot',
    accessText: 'Sign in or create your account to open the conversational workspace.',
    login: 'Sign in',
    signup: 'Create account',
    email: 'Email',
    password: 'Password',
    submitLogin: 'Enter Apex Copilot',
    submitSignup: 'Create account',
    footer: 'Authorized users only',
    statusReady: 'Access ready.',
    statusPending: 'Enter your credentials to continue.',
    signupSuccess: 'Account created. Check your email if confirmation is required.',
  },
  PT: {
    brand: 'Apex AI Copilot',
    eyebrow: 'Apex Global AI',
    headline: 'Transforme sua inteligencia na construcao',
    subtitle: 'Inteligencia com IA para BIM, visualizacao 3D, controles de projeto, documentos, contratos, alvaras, marketing, financeiro e operacoes de campo.',
    primaryCta: 'Comecar com Apex Copilot',
    secondaryCta: 'Solicitar consultoria',
    accessTitle: 'Acesse a Apex Copilot',
    accessText: 'Entre ou crie sua conta para abrir o workspace conversacional.',
    login: 'Entrar',
    signup: 'Criar conta',
    email: 'Email',
    password: 'Senha',
    submitLogin: 'Entrar na Apex Copilot',
    submitSignup: 'Criar conta',
    footer: 'Usuarios autorizados apenas',
    statusReady: 'Acesso pronto.',
    statusPending: 'Digite suas credenciais para continuar.',
    signupSuccess: 'Conta criada. Verifique seu email se a confirmacao for solicitada.',
  },
}

const capabilityGroups = [
  { title: 'BIM Intelligence', items: 'BIM 5D/6D/7D, engineering, proposals' },
  { title: '3D / ArchViz', items: '3D visualization, CFD, simulations, DirectCut' },
  { title: 'AI Agents', items: 'Documents, contracts, legal, permits' },
  { title: 'Project Controls', items: 'Finance, accounting, field operations' },
  { title: 'Sales & Marketing', items: 'Commercial workflows and client packages' },
  { title: 'Operations', items: 'Procurement, reporting, execution support' },
]

const serviceLine = [
  'BIM 5D/6D/7D',
  '3D / ArchViz',
  'CFD / Simulations',
  'AI Agents',
  'DirectCut',
  'Sales',
  'Marketing',
  'Accounting',
  'Finance',
  'Permits',
  'Contracts',
  'Legal',
  'Documents',
  'Proposals',
  'Engineering',
  'Field Operations',
]

export function AuthPanel({ onClear, onAuthStateChange }: AuthPanelProps) {
  const provider = useMemo(() => getSupabaseProviderStatus(), [])
  const emailInput = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [language, setLanguage] = useState<'EN' | 'PT'>('EN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)
  const labels = copy[language]

  function focusAccess(nextMode = mode) {
    setMode(nextMode)
    window.setTimeout(() => emailInput.current?.focus(), 0)
  }

  function publicStatus(raw = statusText) {
    if (account?.user) return labels.statusReady
    if (!raw || /supabase|provider|tenant|rls|bootstrap|configured|session|workspace|role|owner_admin|persistence/i.test(raw)) {
      return labels.statusPending
    }
    return raw
  }

  async function refreshAccount(autoBootstrap = false) {
    const state = await loadSupabaseAccountState()
    if (
      autoBootstrap
      && (state.bootstrapStatus === 'needs-profile-bootstrap' || state.bootstrapStatus === 'needs-tenant-assignment')
    ) {
      const bootstrapped = await attemptProfileBootstrap()
      setAccount(bootstrapped)
      setStatusText('')
      onAuthStateChange?.(bootstrapped)
      return bootstrapped
    }
    setAccount(state)
    setStatusText('')
    onAuthStateChange?.(state)
    return state
  }

  useEffect(() => {
    refreshAccount().catch(() => setStatusText(labels.statusPending))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (provider.providerStatus !== 'supabase-connected') {
      setStatusText(labels.statusPending)
      return
    }

    const { client } = getBrowserSupabaseClient()
    if (!client) return
    setBusy(true)
    try {
      const result = mode === 'login'
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password })
      if (result.error) setStatusText(result.error.message)
      else {
        setStatusText(mode === 'login' ? labels.statusReady : labels.signupSuccess)
        await refreshAccount(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-landing-page" aria-label="Apex AI Copilot access">
      <header className="auth-landing-header">
        <div className="auth-landing-brand">
          <span className="auth-landing-mark">A</span>
          <div>
            <strong>{labels.brand}</strong>
            <small>{labels.eyebrow}</small>
          </div>
        </div>
        <nav className="auth-landing-nav" aria-label="Apex public navigation">
          <button type="button" onClick={() => setLanguage(current => current === 'EN' ? 'PT' : 'EN')}>
            <Languages size={16} /> {language}
          </button>
          <button type="button" onClick={() => focusAccess('login')}>
            {labels.login}
          </button>
          {onClear && (
            <button type="button" onClick={onClear} aria-label="Close authentication panel">
              <X size={16} />
            </button>
          )}
        </nav>
      </header>

      <div className="auth-landing-hero">
        <div className="auth-landing-copy">
          <span>{labels.eyebrow}</span>
          <h1>{labels.headline}</h1>
          <p>{labels.subtitle}</p>
          <div className="auth-landing-actions">
            <button type="button" className="auth-landing-primary" onClick={() => focusAccess('signup')}>
              {labels.primaryCta}
            </button>
            <button type="button" className="auth-landing-secondary" onClick={() => focusAccess('login')}>
              {labels.secondaryCta}
            </button>
          </div>
          <div className="auth-service-ribbon">
            {serviceLine.map(service => <span key={service}>{service}</span>)}
          </div>
        </div>

        <aside className="auth-access-panel" aria-label="Apex Copilot sign in">
          <div className="auth-access-head">
            <span>{labels.accessTitle}</span>
            <h2>{mode === 'login' ? labels.login : labels.signup}</h2>
            <p>{labels.accessText}</p>
          </div>

          <form className="auth-access-form" onSubmit={submit}>
            <div className="auth-mode-toggle">
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
                <LogIn size={15} /> {labels.login}
              </button>
              <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
                <UserPlus size={15} /> {labels.signup}
              </button>
            </div>

            <label className="auth-input-label">
              <span>{labels.email}</span>
              <div className="auth-input-shell">
                <Mail size={17} />
                <input ref={emailInput} value={email} onChange={event => setEmail(event.target.value)} placeholder="jose@apexglobal.ai" type="email" autoComplete="email" />
              </div>
            </label>

            <label className="auth-input-label">
              <span>{labels.password}</span>
              <div className="auth-input-shell">
                <KeyRound size={17} />
                <input value={password} onChange={event => setPassword(event.target.value)} placeholder={labels.password} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <button className="auth-primary-button" disabled={busy}>
              {mode === 'login' ? labels.submitLogin : labels.submitSignup}
            </button>
          </form>

          <p className="auth-access-status">{publicStatus()}</p>
          <small>{labels.footer}</small>
        </aside>
      </div>

      <div className="auth-capability-showcase">
        {capabilityGroups.map(group => (
          <article key={group.title}>
            <strong>{group.title}</strong>
            <span>{group.items}</span>
          </article>
        ))}
      </div>

      <footer className="auth-landing-footer">
        <span>{labels.footer}</span>
        <span>Apex Global AI © 2026</span>
      </footer>
    </section>
  )
}
