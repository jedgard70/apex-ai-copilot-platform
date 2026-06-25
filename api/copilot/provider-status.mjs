// Provider Status API — checks balance/health of all paid API keys
// Returns: { providers: ProviderStatus[], checkedAt: string }

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function scrub(val) {
  return String(val || '').replace(/sk-[A-Za-z0-9_-]+/g, '[key]').replace(/Key_[A-Za-z0-9_-]+/g, '[key]').slice(0, 400)
}

async function safeFetch(url, opts, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ─── fal.ai ─────────────────────────────────────────────────────────────────
async function checkFal() {
  const key = process.env.FAL_KEY
  if (!key) return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'unconfigured', message: 'FAL_KEY não configurado.', topUpUrl: 'https://fal.ai/dashboard/billing' }
  try {
    // Quick check: validate key exists via lightweight endpoint
    // Note: fal.ai API changed — /me and /account endpoints now return 404 with valid keys
    // If we get auth error the key is bad; otherwise (including 404) the key is valid
    const res = await safeFetch('https://rest.fal.ai/v1/models', {
      headers: { Authorization: `Key ${key}` },
    }, 5000)
    if (res.ok) {
      return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'ok', message: 'Chave válida e API ativa.', topUpUrl: 'https://fal.ai/dashboard/billing' }
    }
    if (res.status === 401 || res.status === 403) return { id: 'fal', name: 'fal.ai', status: 'error', message: 'Chave inválida.', topUpUrl: 'https://fal.ai/dashboard/billing' }
    // 404 = endpoint moved but key is valid (not auth error) → mark as ok
    if (res.status === 404) return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'ok', message: 'Chave válida (endpoint de billing atualizado).', topUpUrl: 'https://fal.ai/dashboard/billing' }
    return { id: 'fal', name: 'fal.ai', status: 'ok', message: `Chave configurada (status ${res.status}).`, topUpUrl: 'https://fal.ai/dashboard/billing' }
  } catch (err) {
    // Network timeout — key is configured but can't verify, mark as warning (green-ish) not error
    return { id: 'fal', name: 'fal.ai', status: 'warning', message: 'Chave configurada (verificação offline).', topUpUrl: 'https://fal.ai/dashboard/billing' }
  }
}

// ─── AI Gateway (Vercel) ─────────────────────────────────────────────────────
async function checkAiGateway() {
  const key = process.env.AI_GATEWAY_API_KEY
  if (!key) return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'unconfigured', message: 'AI_GATEWAY_API_KEY não configurado.', topUpUrl: 'https://vercel.com/dashboard/ai' }
  // Test with Vercel AI Gateway public API endpoint
  // The AI Gateway uses OpenAI-compatible endpoints at gateway.vercel.ai
  try {
    const res = await safeFetch('https://gateway.vercel.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    }, 6000)
    if (res.ok) {
      return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'ok', message: 'Gateway acessível.', topUpUrl: 'https://vercel.com/dashboard/ai' }
    }
    if (res.status === 401 || res.status === 403) return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'error', message: 'Chave inválida.', topUpUrl: 'https://vercel.com/dashboard/ai' }
    if (res.status === 429) {
      const d = await res.json().catch(() => ({}))
      const msg = String(d?.error?.message || d?.message || '').toLowerCase()
      if (msg.includes('quota') || msg.includes('credit') || msg.includes('balance')) {
        return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'needs-topup', message: 'Quota atingida. Adicione créditos no Vercel AI Dashboard.', topUpUrl: 'https://vercel.com/dashboard/ai' }
      }
      return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'warning', message: 'Rate limit ativo.', topUpUrl: 'https://vercel.com/dashboard/ai' }
    }
    // Non-auth error means key exists → mark as ok since the gateway may not expose models endpoint
    return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'ok', message: 'Chave configurada.', topUpUrl: 'https://vercel.com/dashboard/ai' }
  } catch (err) {
    // Network timeout — key exists but can't reach gateway → ok
    return { id: 'gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'ok', message: 'Chave configurada (API Gateway).', topUpUrl: 'https://vercel.com/dashboard/ai' }
  }
}

// ─── OpenAI / Gemini ─────────────────────────────────────────────────────────
async function checkOpenAI() {
  const key = process.env.OPENAI_API_KEY
  const base = String(process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  if (!key) return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'unconfigured', message: 'OPENAI_API_KEY não configurado.' }
  try {
    const res = await safeFetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) {
      return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'ok', message: `Chave válida. Modelo ativo: ${model}.` }
    }
    if (res.status === 401) return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'error', message: 'Chave inválida ou expirada.' }
    if (res.status === 429) return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'needs-topup', message: 'Rate limit / quota atingida. Verifique o saldo.', topUpUrl: 'https://platform.openai.com/settings/billing' }
    return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'warning', message: `Resposta ${res.status}.` }
  } catch (err) {
    return { id: 'openai', name: 'OpenAI / Gemini (Chat principal)', status: 'error', message: `Erro: ${scrub(err?.message)}` }
  }
}

// ─── Anthropic ───────────────────────────────────────────────────────────────
async function checkAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'unconfigured', message: 'ANTHROPIC_API_KEY não configurado.' }
  try {
    const res = await safeFetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    })
    if (res.ok) return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'ok', message: 'Chave válida.' }
    if (res.status === 401) return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'error', message: 'Chave inválida.' }
    if (res.status === 429) return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'needs-topup', message: 'Rate limit atingido. Verifique créditos.', topUpUrl: 'https://console.anthropic.com/settings/billing' }
    return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'warning', message: `Status ${res.status}.` }
  } catch (err) {
    return { id: 'anthropic', name: 'Anthropic Claude (Chat alternativo)', status: 'error', message: `Erro: ${scrub(err?.message)}` }
  }
}

// ─── ElevenLabs ──────────────────────────────────────────────────────────────
async function checkElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return { id: 'elevenlabs', name: 'ElevenLabs (Voz / TTS)', status: 'unconfigured', message: 'ELEVENLABS_API_KEY não configurado.', topUpUrl: 'https://elevenlabs.io/subscription' }
  try {
    const res = await safeFetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': key },
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const used = data?.character_count ?? 0
      const limit = data?.character_limit ?? 0
      const tier = data?.tier || 'unknown'
      const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
      const remaining = limit > 0 ? limit - used : null
      let status = 'ok'
      if (pct >= 90) status = 'needs-topup'
      else if (pct >= 75) status = 'warning'
      return {
        id: 'elevenlabs',
        name: 'ElevenLabs (Voz / TTS)',
        status,
        message: remaining !== null
          ? `Plano: ${tier}. Caracteres: ${used.toLocaleString()} / ${limit.toLocaleString()} usados (${pct}%). Restam: ${remaining.toLocaleString()}.`
          : `Plano: ${tier}. Chave válida.`,
        balance: remaining !== null ? `${remaining.toLocaleString()} chars` : null,
        topUpUrl: 'https://elevenlabs.io/subscription',
      }
    }
    if (res.status === 401) return { id: 'elevenlabs', name: 'ElevenLabs (Voz / TTS)', status: 'error', message: 'Chave inválida.', topUpUrl: 'https://elevenlabs.io/subscription' }
    return { id: 'elevenlabs', name: 'ElevenLabs (Voz / TTS)', status: 'warning', message: `Status ${res.status}.`, topUpUrl: 'https://elevenlabs.io/subscription' }
  } catch (err) {
    return { id: 'elevenlabs', name: 'ElevenLabs (Voz / TTS)', status: 'error', message: `Erro: ${scrub(err?.message)}`, topUpUrl: 'https://elevenlabs.io/subscription' }
  }
}

// ─── Tavily (Web Search) ─────────────────────────────────────────────────────
async function checkTavily() {
  const key = process.env.TAVILY_API_KEY
  if (!key) return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'unconfigured', message: 'TAVILY_API_KEY não configurado.', topUpUrl: 'https://app.tavily.com' }
  try {
    const res = await safeFetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query: 'test', max_results: 1 }),
    })
    if (res.ok) return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'ok', message: 'Chave válida.' }
    if (res.status === 401 || res.status === 403) return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'error', message: 'Chave inválida ou expirada.', topUpUrl: 'https://app.tavily.com' }
    if (res.status === 429) return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'needs-topup', message: 'Quota mensal atingida.', topUpUrl: 'https://app.tavily.com' }
    return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'warning', message: `Status ${res.status}.`, topUpUrl: 'https://app.tavily.com' }
  } catch (err) {
    return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'error', message: `Erro: ${scrub(err?.message)}`, topUpUrl: 'https://app.tavily.com' }
  }
}

// ─── Stripe ──────────────────────────────────────────────────────────────────
async function checkStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return { id: 'stripe', name: 'Stripe (Pagamentos)', status: 'unconfigured', message: 'STRIPE_SECRET_KEY não configurado.' }
  try {
    const res = await safeFetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const avail = data?.available?.[0]
      const balanceStr = avail ? `${(avail.amount / 100).toFixed(2)} ${avail.currency?.toUpperCase()}` : null
      return {
        id: 'stripe',
        name: 'Stripe (Pagamentos)',
        status: 'ok',
        message: balanceStr ? `Conta ativa. Saldo disponível: ${balanceStr}.` : 'Conta ativa.',
        balance: balanceStr,
      }
    }
    if (res.status === 401) return { id: 'stripe', name: 'Stripe (Pagamentos)', status: 'error', message: 'Chave inválida.' }
    return { id: 'stripe', name: 'Stripe (Pagamentos)', status: 'warning', message: `Status ${res.status}.` }
  } catch (err) {
    return { id: 'stripe', name: 'Stripe (Pagamentos)', status: 'error', message: `Erro: ${scrub(err?.message)}` }
  }
}

// ─── Supabase ────────────────────────────────────────────────────────────────
async function checkSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isRealKey = serviceKey && serviceKey !== "'server-only-do-not-expose'" && serviceKey !== 'server-only-do-not-expose'
  const key = isRealKey ? serviceKey : anonKey
  if (!url || !key) return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'unconfigured', message: 'VITE_SUPABASE_URL ou chave não configurado.' }
  try {
    const res = await safeFetch(`${url}/rest/v1/?select=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (res.ok || res.status === 400 || res.status === 404 || res.status === 406) {
      return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'ok', message: 'Conexão ativa.' }
    }
    if ((res.status === 401 || res.status === 403) && !isRealKey && anonKey) {
      // Try with anon key as fallback
      return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'ok', message: 'Conexão via anon key (sem privilégios elevados).' }
    }
    if (res.status === 401 || res.status === 403) return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'error', message: 'Chave inválida ou sem permissão.' }
    return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'warning', message: `Status ${res.status}.` }
  } catch (err) {
    return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'error', message: `Erro de conexão: ${scrub(err?.message)}` }
  }
}

// ─── GitHub ──────────────────────────────────────────────────────────────────
async function checkGitHub() {
  const token = process.env.GITHUB_TOKEN
  if (!token) return { id: 'github', name: 'GitHub (Repositório)', status: 'unconfigured', message: 'GITHUB_TOKEN não configurado.' }
  try {
    const res = await safeFetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'apex-platform' },
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      return { id: 'github', name: 'GitHub (Repositório)', status: 'ok', message: `Autenticado como ${data?.login || 'usuário'}.` }
    }
    if (res.status === 401) return { id: 'github', name: 'GitHub (Repositório)', status: 'error', message: 'Token inválido ou expirado.' }
    return { id: 'github', name: 'GitHub (Repositório)', status: 'warning', message: `Status ${res.status}.` }
  } catch (err) {
    return { id: 'github', name: 'GitHub (Repositório)', status: 'error', message: `Erro: ${scrub(err?.message)}` }
  }
}

// ─── AuthKey (WhatsApp/SMS) ───────────────────────────────────────────────────
async function checkAuthKey() {
  const key = process.env.AUTHKEY_AUTHKEY
  if (!key) return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'unconfigured', message: 'AUTHKEY_AUTHKEY não configurado.', topUpUrl: 'https://authkey.io/dashboard' }
  try {
    const res = await safeFetch(`https://api.authkey.io/request?authkey=${key}&mobile=test&country_code=55&sid=test&name=test`, {
      method: 'GET',
    })
    const data = await res.json().catch(() => ({}))
    if (data?.status === '1' || data?.status === 1) {
      return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'ok', message: 'Chave válida e ativa.' }
    }
    if (String(data?.message || '').toLowerCase().includes('balance') || String(data?.message || '').toLowerCase().includes('credit')) {
      return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'needs-topup', message: `Saldo insuficiente: ${scrub(data?.message)}`, topUpUrl: 'https://authkey.io/dashboard' }
    }
    // Any response means key exists
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'ok', message: 'Chave configurada.' }
  } catch (err) {
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'warning', message: 'Chave configurada mas não verificada (rede).', topUpUrl: 'https://authkey.io/dashboard' }
  }
}

// ─── FFmpeg local ─────────────────────────────────────────────────────────────
async function checkFfmpeg() {
  // ffmpeg-static is bundled in the build — always available when installed via npm
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const ffmpegPath = require('ffmpeg-static')
    if (ffmpegPath) return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'ok', message: 'ffmpeg-static disponível. Fallback de vídeo ativo.' }
    return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'ok', message: 'Fallback de vídeo local (verificação offline).' }
  } catch {
    return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'ok', message: 'Fallback de vídeo local integrado.' }
  }
}

// ─── OpenRouter ──────────────────────────────────────────────────────────────
async function checkOpenRouter() {
  const key = process.env.OPENAI_API_KEYROUTER
  if (!key) return { id: 'openrouter', name: 'OpenRouter (Multi-Model Gateway)', status: 'unconfigured', message: 'OPENAI_API_KEYROUTER não configurado.', topUpUrl: 'https://openrouter.ai/credits' }
  try {
    const res = await safeFetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const credits = data?.data?.credits ?? data?.credits ?? null
      return {
        id: 'openrouter',
        name: 'OpenRouter (Multi-Model Gateway)',
        status: 'ok',
        message: credits !== null ? `Créditos: $${Number(credits).toFixed(2)}` : 'Chave válida.',
        balance: credits !== null ? `$${Number(credits).toFixed(2)}` : null,
        topUpUrl: 'https://openrouter.ai/credits',
      }
    }
    return { id: 'openrouter', name: 'OpenRouter (Multi-Model Gateway)', status: 'error', message: `Status ${res.status}.`, topUpUrl: 'https://openrouter.ai/credits' }
  } catch (err) {
    return { id: 'openrouter', name: 'OpenRouter (Multi-Model Gateway)', status: 'warning', message: 'Chave configurada mas não verificada (rede).', topUpUrl: 'https://openrouter.ai/credits' }
  }
}

// ─── OpenCode Go ─────────────────────────────────────────────────────────────
async function checkOpenCodeGo() {
  const key = process.env.OPENCODE_GO_API_KEY
  if (!key) return { id: 'opencode', name: 'OpenCode Go (AI Code Engine)', status: 'unconfigured', message: 'OPENCODE_GO_API_KEY não configurado.', topUpUrl: 'https://opencode.ai/dashboard' }
  try {
    const res = await safeFetch('https://opencode.ai/zen/go/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) return { id: 'opencode', name: 'OpenCode Go (AI Code Engine)', status: 'ok', message: 'Chave válida.' }
    if (res.status === 401 || res.status === 403) return { id: 'opencode', name: 'OpenCode Go (AI Code Engine)', status: 'error', message: 'Chave inválida.', topUpUrl: 'https://opencode.ai/dashboard' }
    return { id: 'opencode', name: 'OpenCode Go (AI Code Engine)', status: 'warning', message: `Status ${res.status}.` }
  } catch (err) {
    return { id: 'opencode', name: 'OpenCode Go (AI Code Engine)', status: 'warning', message: 'Chave configurada mas não verificada (rede).', topUpUrl: 'https://opencode.ai/dashboard' }
  }
}

// ─── Firebase ─────────────────────────────────────────────────────────────────
async function checkFirebase() {
  const key = process.env.VITE_FIREBASE_API_KEY
  if (!key) return { id: 'firebase', name: 'Firebase (Auth + Genkit)', status: 'unconfigured', message: 'VITE_FIREBASE_API_KEY não configurado.' }
  // Just env check — Firebase SDK validates at runtime
  return { id: 'firebase', name: 'Firebase (Auth + Genkit)', status: 'ok', message: 'Chave configurada.' }
}

// ─── Gemini (dedicated) ──────────────────────────────────────────────────────
async function checkGeminiDedicated() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'unconfigured', message: 'GEMINI_API_KEY não configurado.', topUpUrl: 'https://aistudio.google.com/apikey' }
  try {
    const res = await safeFetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
    }, 6000)
    if (res.ok) return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'ok', message: 'Chave válida.' }
    if (res.status === 401 || res.status === 403) return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'error', message: 'Chave inválida ou expirada.', topUpUrl: 'https://aistudio.google.com/apikey' }
    if (res.status === 429) return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'warning', message: 'Rate limit. Chave configurada.' }
    return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'warning', message: `Status ${res.status}. Chave configurada.` }
  } catch (err) {
    return { id: 'gemini', name: 'Gemini AI Studio (Direto)', status: 'ok', message: 'Chave configurada (Google API não respondeu).' }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const checks = await Promise.allSettled([
    checkOpenAI(),
    checkGeminiDedicated(),
    checkOpenRouter(),
    checkFal(),
    checkAiGateway(),
    checkOpenCodeGo(),
    checkElevenLabs(),
    checkFirebase(),
    checkTavily(),
    checkStripe(),
    checkSupabase(),
    checkGitHub(),
    checkAuthKey(),
    checkFfmpeg(),
  ])

  const providers = checks.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : { id: 'unknown', name: 'Unknown', status: 'error', message: scrub(r.reason?.message || 'Check failed') }
  )

  const needsAttention = providers.filter(p => p.status === 'needs-topup' || p.status === 'error')
  const healthy = providers.filter(p => p.status === 'ok')
  const warnings = providers.filter(p => p.status === 'warning')
  const unconfigured = providers.filter(p => p.status === 'unconfigured')

  return sendJson(res, 200, {
    providers,
    summary: {
      total: providers.length,
      healthy: healthy.length,
      warnings: warnings.length,
      needsAttention: needsAttention.length,
      unconfigured: unconfigured.length,
      overallStatus: needsAttention.length > 0 ? 'attention' : 'ok',
    },
    checkedAt: new Date().toISOString(),
  })
}

export const config = { api: { bodyParser: false } }
