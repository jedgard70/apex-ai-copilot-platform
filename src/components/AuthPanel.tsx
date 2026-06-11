import { LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { apexRoles, getGoogleOauthStatus, permissionGroups } from '../lib/authModel'
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient'

type AuthPanelProps = {
  onClear?: () => void
  onAuthStateChange?: (state: SupabaseAccountState) => void
}

export function AuthPanel({ onClear, onAuthStateChange }: AuthPanelProps) {
  const provider = useMemo(() => getSupabaseProviderStatus(), [])
  const googleStatus = getGoogleOauthStatus()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusText, setStatusText] = useState(provider.message)
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)

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
    <section className="studio-panel auth-panel">
      <div className="studio-panel-header">
        <div>
          <span className="eyebrow">Auth scaffold</span>
          <h2>Supabase / Auth</h2>
          <p>{provider.providerStatus === 'supabase-connected' ? 'Supabase browser client is configured.' : 'Supabase/Auth not connected yet.'}</p>
        </div>
        {onClear && <button className="ghost-button" onClick={onClear}>Close</button>}
      </div>

      <div className="status-strip warning">
        <ShieldCheck size={16} />
        <span>{provider.providerStatus} · no fake auth success · service role is server-only future config</span>
      </div>

      <form className="studio-form" onSubmit={submit}>
        <div className="segmented-control">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            <LogIn size={15} /> Login
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            <UserPlus size={15} /> Signup
          </button>
        </div>
        <label>
          Email
          <input value={email} onChange={event => setEmail(event.target.value)} placeholder="user@example.com" type="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" type="password" />
        </label>
        <div className="button-row">
          <button className="primary-action" disabled={busy}>{mode === 'login' ? 'Login with email' : 'Create account'}</button>
          <button type="button" className="secondary-action" onClick={googleLogin}>Google OAuth</button>
          <button type="button" className="secondary-action" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      </form>

      <div className="panel-card">
        <h3>Session status</h3>
        <p>{statusText}</p>
        {account?.user && <p>Signed in as: {account.user.email}</p>}
        {account?.bootstrapStatus === 'needs-profile-bootstrap' && (
          <button type="button" className="secondary-action" disabled={busy} onClick={bootstrapProfile}>
            Attempt safe profile bootstrap
          </button>
        )}
        {account?.bootstrapStatus === 'needs-tenant-assignment' && (
          <p>Tenant assignment is required before Supabase project sync. No fake Owner/Admin role was created.</p>
        )}
        <p>Google OAuth: {googleStatus}</p>
      </div>

      <div className="panel-grid two">
        <div className="panel-card">
          <h3>Planned roles</h3>
          <ul>{apexRoles.map(role => <li key={role.id}>{role.label}</li>)}</ul>
        </div>
        <div className="panel-card">
          <h3>Permission groups</h3>
          <ul>{permissionGroups.slice(0, 14).map(permission => <li key={permission}>{permission}</li>)}</ul>
          <small>{permissionGroups.length} groups total.</small>
        </div>
      </div>
    </section>
  )
}
