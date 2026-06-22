import { Eye, EyeOff, KeyRound, Mail, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient'

type AuthPanelProps = {
  onClear?: () => void
  onAuthStateChange?: (state: SupabaseAccountState) => void
}

const logoSrc = '/apex-global-logo.png'

const copy = {
  EN: {
    product: 'APEX AI COPILOT',
    subtitle: 'Full intelligence copilot platform',
    platformTitle: 'CONSTRUCTION INTELLIGENCE PLATFORM',
    introStrong: 'Operational Intelligence for Construction & Business',
    intro: 'AI-powered platform for construction, BIM, EVM and executive intelligence.',
    login: 'Sign in',
    signup: 'Create account',
    formTitleLogin: 'Sign in to the platform',
    formTitleSignup: 'Create your account',
    formText: 'AI-powered platform for construction, BIM, EVM and executive intelligence.',
    email: 'Email',
    password: 'Password',
    submitLogin: 'Sign in',
    submitSignup: 'Create account',
    footer: 'Authorized users only',
    statusReady: 'Access ready.',
    statusPending: 'Enter your credentials to continue.',
    signupSuccess: 'Account created. Check your email if confirmation is required.',
  },
  PT: {
    product: 'APEX AI COPILOT',
    subtitle: 'Full intelligence copilot platform',
    platformTitle: 'PLATAFORMA DE INTELIGENCIA PARA CONSTRUCAO',
    introStrong: 'Inteligencia operacional para construcao e negocios',
    intro: 'Plataforma com IA para construcao, BIM, EVM e inteligencia executiva.',
    login: 'Entrar',
    signup: 'Criar conta',
    formTitleLogin: 'Entrar na plataforma',
    formTitleSignup: 'Criar sua conta',
    formText: 'Plataforma com IA para construcao, BIM, EVM e inteligencia executiva.',
    email: 'Email',
    password: 'Senha',
    submitLogin: 'Entrar',
    submitSignup: 'Criar conta',
    footer: 'Usuarios autorizados apenas',
    statusReady: 'Acesso pronto.',
    statusPending: 'Digite suas credenciais para continuar.',
    signupSuccess: 'Conta criada. Verifique seu email se a confirmacao for solicitada.',
  },
}

const highlights = [
  { code: 'A', title: 'BIM Intelligence', detail: 'IFC, RVT, NWD, DWG, clash detection' },
  { code: 'E', title: 'EVM Controls', detail: 'CPI, SPI, EAC, VAC, live performance signals' },
  { code: 'S', title: 'Safety & Standards', detail: 'ABNT, NR-18, NR-35, NR-10, NR-6' },
  { code: 'AI', title: 'Multi-Agent AI', detail: 'Specialized agents for planning and execution' },
]

export function AuthPanel({ onClear, onAuthStateChange }: AuthPanelProps) {
  const provider = useMemo(() => getSupabaseProviderStatus(), [])
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [language, setLanguage] = useState<'EN' | 'PT'>('EN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)
  const labels = copy[language]

  function publicStatus(raw = statusText) {
    if (account?.user) return labels.statusReady
    if (/not configured|environment is not configured|VITE_SUPABASE/i.test(raw)) return raw
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
      setStatusText('Supabase browser environment is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, rebuild, then sign in again.')
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
    <section className="auth-legacy-panel" aria-label="Apex AI Copilot access">
      {onClear && (
        <button className="auth-close-button" type="button" onClick={onClear} aria-label="Close authentication panel">
          <X size={17} />
        </button>
      )}

      <aside className="auth-legacy-left">
        <div className="auth-legacy-brand">
          <img src={logoSrc} alt="Apex Global" />
          <div>
            <strong>{labels.product}</strong>
            <span>{labels.subtitle}</span>
          </div>
        </div>

        <div className="auth-legacy-copy">
          <h1>{labels.platformTitle}</h1>
          <strong>{labels.introStrong}</strong>
          <p>{labels.intro}</p>
        </div>

        <div className="auth-legacy-highlights">
          {highlights.map(item => (
            <article key={item.title}>
              <span>{item.code}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          ))}
        </div>

        <footer>2026 Apex Global AI. All rights reserved.</footer>
      </aside>

      <div className="auth-legacy-form-side">
        <div className="auth-legacy-language">
          <button type="button" className={language === 'EN' ? 'active' : ''} onClick={() => setLanguage('EN')}>EN</button>
          <button type="button" className={language === 'PT' ? 'active' : ''} onClick={() => setLanguage('PT')}>PT</button>
        </div>

        <form className="auth-legacy-form" onSubmit={submit}>
          <div className="auth-mode-toggle">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              {labels.login}
            </button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              {labels.signup}
            </button>
          </div>

          <div className="auth-legacy-form-head">
            <h2>{mode === 'login' ? labels.formTitleLogin : labels.formTitleSignup}</h2>
            <p>{labels.formText}</p>
          </div>

          <label className="auth-input-label">
            <span>{labels.email}</span>
            <div className="auth-input-shell">
              <Mail size={17} />
              <input value={email} onChange={event => setEmail(event.target.value)} placeholder="jedgard70@gmail.com" type="email" autoComplete="email" />
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

        <div className="auth-legacy-status">
          <p>{publicStatus()}</p>
          <small>{labels.footer}</small>
        </div>
      </div>
    </section>
  )
}
