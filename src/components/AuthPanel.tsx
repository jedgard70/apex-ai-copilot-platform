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
    <div className="w-full max-w-[440px] bg-[#0d1c2d] border border-[#273647] p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00f0ff]"></div>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute top-4 right-4 text-[#849495] hover:text-[#d4e4fa] transition-colors z-10"
          aria-label="Close authentication panel"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setLanguage('EN')}
            className={`font-label-caps text-label-caps px-2 py-1 rounded transition-colors ${language === 'EN' ? 'text-[#00f0ff] bg-[#273647]' : 'text-[#849495] hover:text-[#d4e4fa]'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('PT')}
            className={`font-label-caps text-label-caps px-2 py-1 rounded transition-colors ${language === 'PT' ? 'text-[#00f0ff] bg-[#273647]' : 'text-[#849495] hover:text-[#d4e4fa]'}`}
          >
            PT
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`font-label-caps text-label-caps px-2 py-1 rounded transition-colors ${mode === 'login' ? 'text-[#00f0ff] bg-[#273647]' : 'text-[#849495] hover:text-[#d4e4fa]'}`}
          >
            {labels.login}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`font-label-caps text-label-caps px-2 py-1 rounded transition-colors ${mode === 'signup' ? 'text-[#00f0ff] bg-[#273647]' : 'text-[#849495] hover:text-[#d4e4fa]'}`}
          >
            {labels.signup}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center mb-10">
        <img src={logoSrc} alt="Apex Global AI Logo" className="w-16 h-16 mb-6 object-contain" />
        <h1 className="font-headline-lg text-headline-lg text-[#d4e4fa] tracking-tighter">
          {mode === 'login' ? 'Platform Access' : 'Create Account'}
        </h1>
        <p className="font-body-md text-[#b9cacb] text-center mt-2 opacity-80">
          {mode === 'login'
            ? 'Secure authentication for Engineering & AI Operations'
            : 'Register to access the platform'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-[#849495] uppercase tracking-widest" htmlFor="email">
            {labels.email}
          </label>
          <div className="relative flex items-center bg-[#010f1f] border border-[#273647] rounded-lg transition-all duration-200 focus-within:border-[#00f0ff] focus-within:shadow-[inset_0_0_4px_rgba(0,240,255,0.1)]">
            <span className="material-symbols-outlined ml-4 text-[#849495]">alternate_email</span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@apexglobal.ai"
              required
              autoComplete="email"
              className="w-full bg-transparent border-none focus:ring-0 text-[#d4e4fa] py-3 px-4 placeholder:text-[#849495]/50 font-body-md outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-label-caps text-label-caps text-[#849495] uppercase tracking-widest" htmlFor="password">
              {language === 'EN' ? 'Secret Key' : 'Senha'}
            </label>
            {mode === 'login' && (
              <a href="#" className="font-label-caps text-label-caps text-[#00f0ff] hover:text-[#dbfcff] transition-colors">
                {language === 'EN' ? 'Forgot Password?' : 'Esqueceu a senha?'}
              </a>
            )}
          </div>
          <div className="relative flex items-center bg-[#010f1f] border border-[#273647] rounded-lg transition-all duration-200 focus-within:border-[#00f0ff] focus-within:shadow-[inset_0_0_4px_rgba(0,240,255,0.1)]">
            <span className="material-symbols-outlined ml-4 text-[#849495]">lock</span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-transparent border-none focus:ring-0 text-[#d4e4fa] py-3 px-4 placeholder:text-[#849495]/50 font-body-md outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="mr-4 text-[#849495] hover:text-[#d4e4fa] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#00f0ff] text-[#006970] font-bold py-4 px-6 rounded shadow-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] hover:shadow-[0_0_15px_rgba(0,219,233,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-nav-link text-nav-link">
            {mode === 'login' ? (language === 'EN' ? 'SIGN IN' : 'ENTRAR') : (language === 'EN' ? 'CREATE ACCOUNT' : 'CRIAR CONTA')}
          </span>
          <span className="material-symbols-outlined text-[20px]">login</span>
        </button>

        {mode === 'login' && (
          <>
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-grow bg-[#3b494b]"></div>
              <span className="font-label-caps text-label-caps text-[#3b494b]">{language === 'EN' ? 'OR CONTINUE WITH' : 'OU CONTINUE COM'}</span>
              <div className="h-[1px] flex-grow bg-[#3b494b]"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-[#273647] bg-[#1c2b3c] hover:bg-[#273647] transition-colors group rounded-lg cursor-pointer">
                <span className="material-symbols-outlined text-[18px] text-[#849495] group-hover:text-[#00f0ff]">fingerprint</span>
                <span className="font-label-caps text-label-caps">MFA</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-[#273647] bg-[#1c2b3c] hover:bg-[#273647] transition-colors group rounded-lg cursor-pointer">
                <span className="material-symbols-outlined text-[18px] text-[#849495] group-hover:text-[#00f0ff]">hub</span>
                <span className="font-label-caps text-label-caps">SSO</span>
              </button>
            </div>
          </>
        )}
      </form>

      {statusText && (
        <div className="mt-6 text-center">
          <p className="font-body-md text-sm text-[#b9cacb]">{publicStatus()}</p>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-[#3b494b]/30 flex justify-center">
        <p className="font-label-caps text-label-caps text-[#b9cacb]">
          {language === 'EN' ? 'New to the environment?' : 'Novo no ambiente?'}
          <a href="#" className="text-[#00f0ff] hover:text-[#dbfcff] ml-1 transition-colors">
            {language === 'EN' ? 'Request Access' : 'Solicitar Acesso'}
          </a>
        </p>
      </div>
    </div>
  )
}
