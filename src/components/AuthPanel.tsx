import { Eye, EyeOff, KeyRound, Languages, LogIn, LogOut, Mail, UserPlus, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient'

type AuthPanelProps = {
  onClear?: () => void
  onAuthStateChange?: (state: SupabaseAccountState) => void
}

const copy = {
  EN: {
    eyebrow: 'Apex Global AI',
    title: 'Construction Intelligence Platform',
    subtitle: 'Intelligence for construction, BIM and project execution.',
    login: 'Sign in',
    signup: 'Create account',
    email: 'Email',
    password: 'Password',
    submitLogin: 'Sign in',
    submitSignup: 'Create account',
    signOut: 'Sign out',
    bootstrap: 'Prepare workspace',
    footer: 'Authorized users only',
    statusReady: 'Access ready.',
    statusPending: 'Check your credentials and try again.',
  },
  PT: {
    eyebrow: 'Apex Global AI',
    title: 'Plataforma de inteligencia para construcao',
    subtitle: 'Inteligencia para construcao, BIM e execucao de projetos.',
    login: 'Entrar',
    signup: 'Criar conta',
    email: 'Email',
    password: 'Senha',
    submitLogin: 'Entrar',
    submitSignup: 'Criar conta',
    signOut: 'Sair',
    bootstrap: 'Preparar workspace',
    footer: 'Usuarios autorizados apenas',
    statusReady: 'Acesso pronto.',
    statusPending: 'Verifique suas credenciais e tente novamente.',
  },
}

const capabilities = ['BIM Intelligence', 'Project Controls', 'Field Operations', 'Multi-Agent AI']

export function AuthPanel({ onClear, onAuthStateChange }: AuthPanelProps) {
  const provider = useMemo(() => getSupabaseProviderStatus(), [])
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [language, setLanguage] = useState<'EN' | 'PT'>('EN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [statusText, setStatusText] = useState(provider.message)
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)
  const labels = copy[language]
  const publicStatus = account?.user ? labels.statusReady : labels.statusPending

  async function refreshAccount(autoBootstrap = false) {
    const state = await loadSupabaseAccountState()
    if (
      autoBootstrap
      && (state.bootstrapStatus === 'needs-profile-bootstrap' || state.bootstrapStatus === 'needs-tenant-assignment')
    ) {
      const bootstrapped = await attemptProfileBootstrap()
      setAccount(bootstrapped)
      setStatusText(bootstrapped.message)
      onAuthStateChange?.(bootstrapped)
      return bootstrapped
    }
    setAccount(state)
    setStatusText(state.message)
    onAuthStateChange?.(state)
    return state
  }

  useEffect(() => {
    refreshAccount().catch(error => setStatusText(error instanceof Error ? error.message : 'Could not load Supabase session.'))
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
        setStatusText(mode === 'login' ? labels.statusReady : 'Account created. Check your email if confirmation is required.')
        await refreshAccount(true)
      }
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (provider.providerStatus !== 'supabase-connected') {
      setStatusText(labels.statusPending)
      return
    }
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    await client.auth.signOut()
    setStatusText(labels.statusPending)
    await refreshAccount()
  }

  async function bootstrapProfile() {
    setBusy(true)
    try {
      const state = await attemptProfileBootstrap()
      setAccount(state)
      setStatusText(state.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-premium-panel" aria-label="Apex Global AI authentication">
      {onClear && (
        <button className="auth-close-button" onClick={onClear} aria-label="Close authentication panel">
          <X size={17} />
        </button>
      )}

      <aside className="auth-brand-column">
        <div>
          <span className="auth-eyebrow">{labels.eyebrow}</span>
          <h2>Apex Global AI</h2>
          <p>{labels.title}</p>
          <small>Operational intelligence for modern construction.</small>
        </div>
        <div className="auth-capability-grid">
          {capabilities.map(capability => <span key={capability}>{capability}</span>)}
        </div>
      </aside>

      <div className="auth-form-column">
        <div className="auth-form-head">
          <div>
            <h3>{mode === 'login' ? labels.login : labels.signup}</h3>
            <p>{labels.subtitle}</p>
          </div>
          <button className="auth-language-toggle" type="button" onClick={() => setLanguage(current => current === 'EN' ? 'PT' : 'EN')}>
            <Languages size={15} /> {language}
          </button>
        </div>

        <form className="auth-premium-form" onSubmit={submit}>
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
              <input value={email} onChange={event => setEmail(event.target.value)} placeholder="jose@apexglobal.ai" type="email" autoComplete="email" />
            </div>
          </label>

          <label className="auth-input-label">
            <span>{labels.password}</span>
            <div className="auth-input-shell">
              <KeyRound size={17} />
              <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <button className="auth-primary-button" disabled={busy}>
            {mode === 'login' ? labels.submitLogin : labels.submitSignup}
          </button>

          {account?.user && (
            <div className="auth-secondary-actions">
              <button type="button" onClick={signOut}><LogOut size={15} /> {labels.signOut}</button>
            </div>
          )}
        </form>

        <div className="auth-status-card public">
          <p>{statusText && !/supabase|provider|tenant|rls|bootstrap|configured|session/i.test(statusText) ? statusText : publicStatus}</p>
          {account?.user && <span>{account.user.email}</span>}
          {account?.bootstrapStatus === 'needs-profile-bootstrap' && (
            <button type="button" disabled={busy} onClick={bootstrapProfile}>
              {labels.bootstrap}
            </button>
          )}
          <small>{labels.footer}</small>
        </div>
      </div>
    </section>
  )
}
