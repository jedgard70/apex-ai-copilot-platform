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
    const res = await safeFetch('https://rest.alpha.fal.ai/me', {
      headers: { Authorization: `Key ${key}` },
    })
    if (res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({}))
      const reason = String(data?.detail || data?.message || '').toLowerCase()
      if (reason.includes('exhaust') || reason.includes('balance') || reason.includes('locked')) {
        return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'needs-topup', message: 'Saldo esgotado. Recarregue para usar geração de vídeo e imagem.', topUpUrl: 'https://fal.ai/dashboard/billing' }
      }
      return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'error', message: `Auth error ${res.status}: ${scrub(reason)}`, topUpUrl: 'https://fal.ai/dashboard/billing' }
    }
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const credits = data?.credits ?? data?.balance ?? null
      return {
        id: 'fal',
        name: 'fal.ai (Kling Video / Flux Image)',
        status: 'ok',
        message: credits !== null ? `Saldo: $${Number(credits).toFixed(2)}` : 'Chave válida.',
        balance: credits !== null ? `$${Number(credits).toFixed(2)}` : null,
        topUpUrl: 'https://fal.ai/dashboard/billing',
      }
    }
    // Fallback: try a minimal text-to-video submit to check if key is valid vs exhausted
    const testRes = await safeFetch('https://fal.run/fal-ai/kling-video/v1.6/pro/text-to-video', {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test', duration: 5, aspect_ratio: '16:9' }),
    })
    if (testRes.status === 403) {
      const d = await testRes.json().catch(() => ({}))
      const msg = String(d?.detail || '').toLowerCase()
      if (msg.includes('exhaust') || msg.includes('balance') || msg.includes('locked')) {
        return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'needs-topup', message: 'Saldo esgotado. Recarregue para usar geração de vídeo.', topUpUrl: 'https://fal.ai/dashboard/billing' }
      }
    }
    return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'warning', message: `Resposta inesperada (${res.status}). Verifique a conta.`, topUpUrl: 'https://fal.ai/dashboard/billing' }
  } catch (err) {
    return { id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'error', message: `Timeout ou rede: ${scrub(err?.message)}`, topUpUrl: 'https://fal.ai/dashboard/billing' }
  }
}

// ─── AI Gateway (Vercel) ─────────────────────────────────────────────────────
async function checkAiGateway() {
  const key = process.env.AI_GATEWAY_API_KEY
  if (!key) return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'unconfigured', message: 'AI_GATEWAY_API_KEY não configurado.', topUpUrl: 'https://vercel.com/dashboard/ai' }
  // Test with a models-list style call via the AI SDK or a lightweight probe
  try {
    const res = await safeFetch('https://api.v.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'ok', message: 'Gateway acessível.', topUpUrl: 'https://vercel.com/dashboard/ai' }
    }
    if (res.status === 429) {
      const d = await res.json().catch(() => ({}))
      const msg = String(d?.error?.message || d?.message || '').toLowerCase()
      if (msg.includes('quota') || msg.includes('credit') || msg.includes('balance')) {
        return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'needs-topup', message: 'Quota atingida. Adicione créditos no Vercel AI Dashboard.', topUpUrl: 'https://vercel.com/dashboard/ai' }
      }
      return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'warning', message: 'Rate limit ativo.', topUpUrl: 'https://vercel.com/dashboard/ai' }
    }
    return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'warning', message: `Status ${res.status}. Verifique o dashboard.`, topUpUrl: 'https://vercel.com/dashboard/ai' }
  } catch (err) {
    // Mark as warning (not error) since the gateway may just be unreachable from the probe
    return { id: 'ai-gateway', name: 'AI Gateway / Google Veo (Vídeo)', status: 'warning', message: 'Não foi possível sondar o gateway. Chave configurada.', topUpUrl: 'https://vercel.com/dashboard/ai' }
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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'unconfigured', message: 'VITE_SUPABASE_URL ou chave não configurado.' }
  try {
    const res = await safeFetch(`${url}/rest/v1/?select=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (res.ok || res.status === 400 || res.status === 404) {
      return { id: 'supabase', name: 'Supabase (Banco de dados)', status: 'ok', message: 'Conexão ativa.' }
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
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const path = require('ffmpeg-static')
    if (path) return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'ok', message: 'ffmpeg-static disponível. Fallback de vídeo ativo.' }
    return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'warning', message: 'ffmpeg-static não encontrado.' }
  } catch {
    return { id: 'ffmpeg', name: 'FFmpeg local (Fallback vídeo)', status: 'warning', message: 'Não disponível no runtime serverless.' }
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
    checkAnthropic(),
    checkFal(),
    checkAiGateway(),
    checkElevenLabs(),
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
  const unconfigured = providers.filter(p => p.status === 'unconfigured')

  return sendJson(res, 200, {
    providers,
    summary: {
      total: providers.length,
      healthy: healthy.length,
      needsAttention: needsAttention.length,
      unconfigured: unconfigured.length,
      overallStatus: needsAttention.length > 0 ? 'attention' : 'ok',
    },
    checkedAt: new Date().toISOString(),
  })
}

export const config = { api: { bodyParser: false } }
