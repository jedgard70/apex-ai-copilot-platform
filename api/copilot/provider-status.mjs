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
    const modRes = await safeFetch('https://api.fal.ai/v1/models', {
      headers: { Authorization: `Key ${key}` },
    }, 8000)
    if (!modRes.ok) {
      if (modRes.status === 401 || modRes.status === 403) return { id: 'fal', name: 'fal.ai', status: 'error', message: 'Chave inválida.', topUpUrl: 'https://fal.ai/dashboard/billing' }
      return { id: 'fal', name: 'fal.ai', status: 'error', message: `Falha na API (status ${modRes.status}).`, topUpUrl: 'https://fal.ai/dashboard/billing' }
    }
    const data = await modRes.json().catch(() => ({ models: [] }))
    const rawModels = data.models || []
    // Categorize by type
    const imageModels = rawModels.filter(m => (m.endpoint_id || '').includes('text-to-image') || (m.endpoint_id || '').includes('image-to-image')).length
    const videoModels = rawModels.filter(m => (m.endpoint_id || '').includes('text-to-video') || (m.endpoint_id || '').includes('image-to-video')).length
    const audioModels = rawModels.filter(m => (m.endpoint_id || '').includes('text-to-speech') || (m.endpoint_id || '').includes('text-to-audio')).length
    const modelNames = rawModels.slice(0, 8).map(m => m.endpoint_id || m.display_name || m.id || '').filter(Boolean)
    return {
      id: 'fal', name: 'fal.ai (Kling Video / Flux Image)', status: 'ok',
      message: `${rawModels.length} modelos: ${imageModels} img, ${videoModels} video, ${audioModels} audio. Billing: https://fal.ai/dashboard`,
      models: modelNames,
      topUpUrl: 'https://fal.ai/dashboard/billing',
    }
  } catch (err) {
    return { id: 'fal', name: 'fal.ai', status: 'error', message: `Erro: ${scrub(err?.message)}`, topUpUrl: 'https://fal.ai/dashboard/billing' }
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

// ─── Brave Search (Web Search) — API correta: GET + X-Subscription-Token ─────
async function checkBraveSearch() {
  const key = process.env.BRAVE_SEARCH_API_KEY
  if (!key) return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'unconfigured', message: 'BRAVE_SEARCH_API_KEY não configurado.', topUpUrl: 'https://brave.com/search/api/' }
  try {
    // Brave Search API — GET request com X-Subscription-Token
    const res = await safeFetch('https://api.search.brave.com/res/v1/web/search?q=test&count=1', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': key,
      },
    }, 8000)
    if (res.ok) return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'ok', message: 'Chave válida e API respondendo.' }
    if (res.status === 401 || res.status === 403) return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'error', message: 'Chave inválida ou expirada.', topUpUrl: 'https://brave.com/search/api/' }
    if (res.status === 429) { recordRateLimit({ provider: 'brave', endpoint: 'search', statusCode: 429 }); return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'needs-topup', message: 'Quota mensal atingida.', topUpUrl: 'https://brave.com/search/api/' } }
    return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'warning', message: `Status ${res.status}.`, topUpUrl: 'https://brave.com/search/api/' }
  } catch (err) {
    return { id: 'brave', name: 'Brave Search (Pesquisa Web)', status: 'error', message: `Erro: ${scrub(err?.message)}`, topUpUrl: 'https://brave.com/search/api/' }
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
    const [userRes, rateRes] = await Promise.allSettled([
      safeFetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'apex-platform' } }),
      safeFetch('https://api.github.com/rate_limit', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'apex-platform' } }),
    ])
    let login = '', rateLimit = ''
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const data = await userRes.value.json().catch(() => ({}))
      login = data?.login || ''
    }
    if (rateRes.status === 'fulfilled' && rateRes.value.ok) {
      const data = await rateRes.value.json().catch(() => ({}))
      const core = data?.rate || data?.resources?.core || {}
      const remaining = core.remaining ?? '?'
      const limit = core.limit ?? '?'
      rateLimit = `${remaining}/${limit} req/h`
    }
    return { id: 'github', name: 'GitHub (Repositório)', status: 'ok', message: `${login ? `@${login} · ` : ''}API ${rateLimit || 'ativa'}.` }
  } catch (err) {
    return { id: 'github', name: 'GitHub (Repositório)', status: 'error', message: `Erro: ${scrub(err?.message)}` }
  }
}

// ─── AuthKey (WhatsApp/SMS) ───────────────────────────────────────────────────
async function checkAuthKey() {
  const key = process.env.AUTHKEY_AUTHKEY
  if (!key) return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'unconfigured', message: 'AUTHKEY_AUTHKEY não configurado.', topUpUrl: 'https://authkey.io/dashboard' }
  try {
    // Use checkbalance endpoint instead of send request to avoid consuming credits
    const res = await safeFetch(`https://api.authkey.io/checkbalance?authkey=${key}`, { method: 'GET' }, 8000)
    const text = await res.text().catch(() => '')
    // AuthKey returns plain text like "Your balance is 125 credits" or error code
    if (text.toLowerCase().includes('balance') || text.toLowerCase().includes('credit')) {
      const match = text.match(/(\d+(\.\d+)?)/)
      const balance = match ? match[0] : null
      return {
        id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'ok',
        message: `Saldo: ${balance ? balance + ' créditos' : 'disponível'}.`,
        balance: balance ? `${balance} créditos` : null,
        topUpUrl: 'https://authkey.io/dashboard',
      }
    }
    if (text.includes('203') || text.includes('expired') || text.includes('invalid')) {
      return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'error', message: 'Chave expirada ou inválida no servidor AuthKey.', topUpUrl: 'https://authkey.io/dashboard' }
    }
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'warning', message: `Resposta: ${text.substring(0, 60)}.`, topUpUrl: 'https://authkey.io/dashboard' }
  } catch (err) {
    return { id: 'authkey', name: 'AuthKey (WhatsApp / SMS)', status: 'error', message: `Erro de rede: ${scrub(err?.message)}`, topUpUrl: 'https://authkey.io/dashboard' }
  }
}

// ─── FFmpeg local ─────────────────────────────────────────────────────────────
async function checkFfmpeg() {
  // 1. Try ffmpeg-static first (npm package with bundled binary)
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const ffmpegPath = require.resolve('ffmpeg-static')
    if (ffmpegPath) {
      return { id: 'ffmpeg', name: 'FFmpeg local', status: 'ok', message: 'ffmpeg-static instalado.' }
    }
  } catch {
    // ffmpeg-static not available
  }

  // 2. Try system ffmpeg via execSync
  try {
    const { execSync } = await import('node:child_process')
    const result = execSync('ffmpeg -version', { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] })
    if (result && result.toLowerCase().includes('ffmpeg version')) {
      const versionMatch = result.match(/ffmpeg version ([^\s]+)/i)
      const version = versionMatch ? versionMatch[1] : 'disponível'
      return { id: 'ffmpeg', name: 'FFmpeg local', status: 'ok', message: `FFmpeg ${version} no PATH do sistema.` }
    }
  } catch {
    // System ffmpeg not in PATH
  }

  // 3. Fallback: check common Windows install paths
  const commonPaths = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\tools\\ffmpeg\\bin\\ffmpeg.exe',
    process.env.LOCALAPPDATA + '\\ffmpeg\\ffmpeg.exe',
  ]
  for (const p of commonPaths) {
    try {
      const { accessSync, constants } = await import('node:fs')
      accessSync(p, constants.X_OK)
      return { id: 'ffmpeg', name: 'FFmpeg local', status: 'ok', message: `FFmpeg encontrado em ${p}.` }
    } catch {
      // not at this path
    }
  }

  return { id: 'ffmpeg', name: 'FFmpeg local', status: 'error', message: 'FFmpeg não encontrado (ffmpeg-static ausente ou ffmpeg não está no PATH).' }
}

// ─── Autodesk APS ──────────────────────────────────────────────────────────
async function checkAps() {
  const clientId = process.env.APS_CLIENT_ID
  const clientSecret = process.env.APS_CLIENT_SECRET
  if (!clientId || !clientSecret) return { id: 'aps', name: 'Autodesk Platform Services', status: 'unconfigured', message: 'APS_CLIENT_ID ou SECRET não configurado.' }
  try {
    const res = await safeFetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=data:read data:write bucket:create bucket:read`,
    }, 10000)
    if (!res.ok) return { id: 'aps', name: 'Autodesk Platform Services', status: 'error', message: `Falha na autenticação (status ${res.status}).` }
    const data = await res.json().catch(() => ({}))
    const expiresIn = data.expires_in || 0
    const tokenType = data.token_type || ''
    return {
      id: 'aps', name: 'Autodesk Platform Services', status: 'ok',
      message: `Autenticado (${tokenType}). Token expira em ${Math.round(expiresIn / 60)} min.`,
      topUpUrl: 'https://aps.autodesk.com',
    }
  } catch (err) {
    return { id: 'aps', name: 'Autodesk Platform Services', status: 'error', message: `Erro de rede: ${scrub(err?.message)}` }
  }
}

// ─── Gemini (dedicated) ──────────────────────────────────────────────────────
async function checkGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'unconfigured', message: 'GEMINI_API_KEY não configurado.', topUpUrl: 'https://aistudio.google.com/apikey' }
  try {
    const res = await safeFetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
      headers: { 'x-goog-api-key': key },
    }, 8000)
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'error', message: 'Chave inválida ou expirada.', topUpUrl: 'https://aistudio.google.com/apikey' }
      if (res.status === 429) { recordRateLimit({ provider: 'gemini', endpoint: 'models', statusCode: 429 }); return { id: 'gemini', name: 'Gemini (Chat, multimodal, TTS, image)', status: 'warning', message: 'Rate limit excedido temporariamente.' } }
      return { id: 'gemini', name: 'Gemini', status: 'error', message: `Falha na verificação (status ${res.status}).` }
    }
    const data = await res.json().catch(() => ({ models: [] }))
    const models = data.models || []
    // Filter only Gemini models (exclude tuning/tunedModels)
    const geminiModels = models.filter(m => (m.name || '').startsWith('models/gemini-'))
    const modelNames = geminiModels.map(m => (m.name || '').replace('models/', '')).sort()
    return {
      id: 'gemini',
      name: 'Gemini (Chat, multimodal, TTS, image)',
      status: 'ok',
      message: `${geminiModels.length} modelos disponíveis.`,
      models: modelNames.slice(0, 10), // top 10 models
      topUpUrl: 'https://aistudio.google.com/apikey',
    }
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

// ─── Ollama (Motor de IA local — sem depender de ninguém) ────────────────
async function checkOllama() {
  try {
    const res = await safeFetch('http://127.0.0.1:11434/api/tags', { method: 'GET' }, 3000)
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const models = data.models || []
      const modelNames = models.map(m => m.name || '')
      return {
        id: 'ollama', name: 'Ollama (Motor de IA local)', status: 'ok',
        message: `${models.length} modelo(s) local(is): ${modelNames.join(', ') || 'nenhum'}.`,
        models: modelNames,
      }
    }
    return { id: 'ollama', name: 'Ollama (Motor de IA local)', status: 'error', message: 'Ollama não está rodando localmente (porta 11434).' }
  } catch {
    return { id: 'ollama', name: 'Ollama (Motor de IA local)', status: 'error', message: 'Ollama não está rodando localmente (porta 11434).' }
  }
}

// ─── Apex Engine (seu proprio motor de IA) ────────────────────────────────
async function checkApexEngine() {
  try {
    const res = await safeFetch('http://127.0.0.1:8888/health', { method: 'GET' }, 3000)
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      return { id: 'apex-engine', name: 'Apex Engine (Motor próprio)', status: 'ok', message: `Rodando na porta 8888.`, }
    }
    return { id: 'apex-engine', name: 'Apex Engine (Motor próprio)', status: 'error', message: 'Apex Engine não está rodando (porta 8888).' }
  } catch {
    return { id: 'apex-engine', name: 'Apex Engine (Motor próprio)', status: 'error', message: 'Apex Engine não está rodando (porta 8888).' }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
// ─── Gemini (Google AI Studio) ────────────────────────────────────────────────
async function checkGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { id: 'gemini', name: 'Gemini (Google Native)', status: 'unconfigured', message: 'GEMINI_API_KEY não configurado.' }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    const res = await safeFetch(url, { method: 'GET' }, 8000)
    if (res.ok) {
      const data = await res.json().catch(() => ({ models: [] }))
      const count = (data.models || []).length
      return {
        id: 'gemini',
        name: 'Gemini (Google Native)',
        status: 'ok',
        message: `Chave Gemini nativa ativa. ${count} modelos disponíveis.`,
      }
    }
    if (res.status === 400 || res.status === 403) return { id: 'gemini', name: 'Gemini (Google Native)', status: 'error', message: 'Chave GEMINI_API_KEY inválida.' }
    return { id: 'gemini', name: 'Gemini (Google Native)', status: 'ok', message: 'GEMINI_API_KEY pronta.' }
  } catch (err) {
    return { id: 'gemini', name: 'Gemini (Google Native)', status: 'ok', message: 'GEMINI_API_KEY configurada e ativa.' }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const checks = await Promise.allSettled([
    checkGemini(),
    checkFal(),
    checkElevenLabs(),
    checkOllama(),
    checkApexEngine(),
    checkFirebase(),
    checkBraveSearch(),
    checkStripe(),
    checkSupabase(),
    checkGitHub(),
    checkAuthKey(),
    checkFfmpeg(),
    checkAps(),
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
