import { Eye, EyeOff, KeyRound, Languages, LogIn, LogOut, Mail, ShieldCheck, UserPlus, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { apexRoles, getGoogleOauthStatus, permissionGroups } from '../lib/authModel'
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient'

type AuthPanelProps = {
  onClear?: () => void
  onAuthStateChange?: (state: SupabaseAccountState) => void
}

const copy = {
  EN: {
    eyebrow: 'Apex Global AI',
    title: 'Secure access for project intelligence',
    subtitle: 'Sign in to continue with real Supabase Auth. No demo session is created.',
    login: 'Sign in',
    signup: 'Create account',
    email: 'Email',
    password: 'Password',
    submitLogin: 'Sign in',
    submitSignup: 'Create account',
    google: 'Google OAuth',
    signOut: 'Sign out',
    status: 'Session status',
    bootstrap: 'Attempt safe profile bootstrap',
    assignment: 'Tenant assignment is required before Supabase project sync. No fake Owner/Admin role was created.',
    provider: 'Auth provider',
  },
  PT: {
    eyebrow: 'Apex Global AI',
    title: 'Acesso seguro para inteligencia de projetos',
    subtitle: 'Entre para continuar com Supabase Auth real. Nenhuma sessao demo e criada.',
    login: 'Entrar',
    signup: 'Criar conta',
    email: 'Email',
    password: 'Senha',
    submitLogin: 'Entrar',
    submitSignup: 'Criar conta',
    google: 'Google OAuth',
    signOut: 'Sair',
    status: 'Status da sessao',
    bootstrap: 'Tentar bootstrap seguro do perfil',
    assignment: 'A atribuicao de tenant e obrigatoria antes do sync Supabase. Nenhum papel Owner/Admin falso foi criado.',
    provider: 'Provedor Auth',
  },
}

const capabilities = ['BIM intelligence', 'EVM controls', 'Safety workflows', 'Multi-Agent execution']

export function AuthPanel({ onClear, onAuthStateChange }: AuthPanelProps) {
  const provider = useMemo(() => getSupabaseProviderStatus(), [])
  const googleStatus = getGoogleOauthStatus()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [language, setLanguage] = useState<'EN' | 'PT'>('EN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [statusText, setStatusText] = useState(provider.message)
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)
  const labels = copy[language]

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
      setStatusText('Supabase/Auth not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY later; no fake login was created.')
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
        setStatusText(mode === 'login' ? 'Supabase session returned by provider.' : 'Signup submitted to Supabase. Confirm email settings in Supabase before production.')
        await refreshAccount(true)
      }
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (provider.providerStatus !== 'supabase-connected') {
      setStatusText('Supabase/Auth not connected yet. There is no real session to sign out.')
      return
    }
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    await client.auth.signOut()
    setStatusText('Signed out through Supabase client.')
    await refreshAccount()
  }

  async function googleLogin() {
    if (provider.providerStatus !== 'supabase-connected' || googleStatus !== 'configured') {
      setStatusText('Google OAuth not configured yet.')
      return
    }
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    await client.auth.signInWithOAuth({ provider: 'google' })
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
        </div>
        <div className="auth-capability-grid">
          {capabilities.map(capability => <span key={capability}>{capability}</span>)}
        </div>
        <div className="auth-provider-pill">
          <ShieldCheck size={16} />
          <span>{provider.providerStatus}</span>
        </div>
      </aside>

      <div className="auth-form-column">
        <div className="auth-form-head">
          <div>
            <span>{labels.provider}</span>
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

          <div className="auth-secondary-actions">
            <button type="button" onClick={googleLogin}>{labels.google}</button>
            <button type="button" onClick={signOut}><LogOut size={15} /> {labels.signOut}</button>
          </div>
        </form>

        <div className="auth-status-card">
          <strong>{labels.status}</strong>
          <p>{statusText}</p>
          {account?.user && <span>Signed in as: {account.user.email}</span>}
          {account?.bootstrapStatus === 'needs-profile-bootstrap' && (
            <button type="button" disabled={busy} onClick={bootstrapProfile}>
              {labels.bootstrap}
            </button>
          )}
          {account?.bootstrapStatus === 'needs-tenant-assignment' && <p>{labels.assignment}</p>}
          <small>Google OAuth: {googleStatus}</small>
        </div>

        <div className="auth-meta-grid">
          <div>
            <strong>Roles</strong>
            <span>{apexRoles.slice(0, 4).map(role => role.label).join(' / ')}</span>
          </div>
          <div>
            <strong>Permissions</strong>
            <span>{permissionGroups.length} groups configured</span>
          </div>
        </div>
      </div>
    </section>
  )
}
