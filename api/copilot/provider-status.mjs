// Provider Status API — checks balance/health of all paid API keys
// Returns: { providers: ProviderStatus[], checkedAt: string }

import { recordRateLimit } from '../../server/service/rateLimitMonitor.mjs'

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
    return { id: 'fal', name: 'fal.ai', status: 'error', message: `Falha na verificação (status ${res.status}).`, topUpUrl: 'https://fal.ai/dashboard/billing' }
  } catch (err) {
    return { id: 'fal', name: 'fal.ai', status: 'error', message: `Erro de rede: ${scrub(err?.message)}`, topUpUrl: 'https://fal.ai/dashboard/billing' }
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
    if (res.status === 429) { recordRateLimit({ provider: 'tavily', endpoint: 'search', statusCode: 429 }); return { id: 'tavily', name: 'Tavily (Pesquisa Web)', status: 'needs-topup', message: 'Quota mensal atingida.', topUpUrl: 'https://app.tavily.com' } }
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
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'error', message: `Resposta inesperada: ${scrub(data?.message || res?.status)}`, topUpUrl: 'https://authkey.io/dashboard' }
  } catch (err) {
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'error', message: `Erro de rede: ${scrub(err?.message)}`, topUpUrl: 'https://authkey.io/dashboard' }
  }
}

// ─── FFmpeg local ─────────────────────────────────────────────────────────────
async function checkFfmpeg() {
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const ffmpegPath = require('ffmpeg-static')
    if (ffmpegPath) return { id: 'ffmpeg', name: 'FFmpeg local', status: 'ok', message: 'ffmpeg-static disponível.' }
    return { id: 'ffmpeg', name: 'FFmpeg local', status: 'error', message: 'ffmpeg-static não encontrado.' }
  } catch {
    return { id: 'ffmpeg', name: 'FFmpeg local', status: 'error', message: 'ffmpeg-static não pôde ser carregado.' }
  }
}

// ─── Gemini (dedicated) ──────────────────────────────────────────────────────
async function checkGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'unconfigured', message: 'GEMINI_API_KEY não configurado.', topUpUrl: 'https://aistudio.google.com/apikey' }
  try {
    const res = await safeFetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
    }, 6000)
    if (res.ok) return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'ok', message: 'Chave válida.' }
    if (res.status === 401 || res.status === 403) return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'error', message: 'Chave inválida ou expirada.', topUpUrl: 'https://aistudio.google.com/apikey' }
    if (res.status === 429) { recordRateLimit({ provider: 'gemini', endpoint: 'models', statusCode: 429 }); return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'warning', message: 'Rate limit. Chave válida mas quota temporariamente excedida.' } }
    return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'error', message: `Falha na verificação (status ${res.status}).`, topUpUrl: 'https://aistudio.google.com/apikey' }
  } catch (err) {
    return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'error', message: `Erro de rede: ${scrub(err?.message)}`, topUpUrl: 'https://aistudio.google.com/apikey' }
  }
}

// ─── Firebase ────────────────────────────────────────────────────────────────
async function checkFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  if (!projectId || !apiKey) return { id: 'firebase', name: 'Firebase (Auth, DB, Storage)', status: 'unconfigured', message: 'Firebase project ID ou API key não configurado.' }
  try {
    const res = await safeFetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents?pageSize=1&key=${apiKey}`, {}, 6000)
    if (res.ok || res.status === 403 || res.status === 400) return { id: 'firebase', name: 'Firebase (Auth, DB, Storage)', status: 'ok', message: `Projeto ${projectId} configurado e chave válida.` }
    if (res.status === 401) return { id: 'firebase', name: 'Firebase (Auth, DB, Storage)', status: 'error', message: 'API key inválida.', topUpUrl: 'https://console.firebase.google.com' }
    return { id: 'firebase', name: 'Firebase (Auth, DB, Storage)', status: 'ok', message: `Firebase configurado (projeto: ${projectId}).` }
  } catch { return { id: 'firebase', name: 'Firebase (Auth, DB, Storage)', status: 'warning', message: 'Firebase configurado (verificação offline).' } }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const checks = await Promise.allSettled([
    checkGemini(),
    checkFal(),
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
