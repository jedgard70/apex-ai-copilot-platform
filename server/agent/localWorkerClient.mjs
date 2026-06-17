/**
 * Apex AI Copilot — Local Worker Client (H6.0)
 * Bridge between production backend and the Apex Local Worker running on the user's PC.
 * Reads LOCAL_WORKER_URL + LOCAL_WORKER_TOKEN from ENV.
 * Never logs or returns the token.
 * H6.0: risk-tiered actions — READ/VALIDATE execute directly; WRITE/DANGEROUS require confirmed:true.
 */

const TIMEOUT_MS = 8000

// READ — execute without confirmation
const READ_ACTIONS = new Set([
  'system.info', 'node.version', 'npm.version', 'git.version',
  'project.git_status', 'project.git_log', 'project.git_log10',
  'project.git_diff', 'project.git_diff_stat', 'project.git_branch', 'project.git_remote',
  'npm.list', 'npm.outdated', 'npm.audit',
])

// VALIDATE — execute directly (may be slow)
const VALIDATE_ACTIONS = new Set([
  'project.build_check', 'npm.test', 'npm.lint',
  'project.validate_h44', 'project.validate_h5', 'project.validate_h6',
  'project.validate_h7', 'project.validate_final',
])

// WRITE — require confirmed:true
const WRITE_ACTIONS = new Set([
  'project.git_add', 'project.git_commit', 'project.git_push', 'project.git_push_u',
  'project.git_fetch', 'project.git_stash', 'project.git_stash_pop',
  'npm.install', 'project.raw_shell', 'mcp.run_stdio',
])

// DANGEROUS — require confirmed:true + rollbackAcknowledged:true
const DANGEROUS_ACTIONS = new Set([
  'project.git_push_force',
])

const ALL_ALLOWED_ACTIONS = new Set([
  ...READ_ACTIONS, ...VALIDATE_ACTIONS, ...WRITE_ACTIONS, ...DANGEROUS_ACTIONS,
])

function workerConfig() {
  const url = (process.env.LOCAL_WORKER_URL || '').trim()
  const token = (process.env.LOCAL_WORKER_TOKEN || '').trim()
  return { url, token, configured: Boolean(url && token) }
}

function makeMissingConfigResult() {
  return {
    ok: false,
    configured: false,
    reachable: false,
    status: 'unavailable',
    reason: 'LOCAL_WORKER_URL ou LOCAL_WORKER_TOKEN não configurados no Vercel. Configure ambos para ativar o Local Worker.',
    secretsExposed: false,
  }
}

async function fetchWorker(path, method, body = null) {
  const { url, token, configured } = workerConfig()
  if (!configured) return { ok: false, configMissing: true }

  if (!globalThis.fetch) {
    return { ok: false, error: 'fetch não disponível neste ambiente' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }
    if (body) options.body = JSON.stringify(body)

    const response = await fetch(`${url}${path}`, options).finally(() => clearTimeout(timer))
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err?.name === 'AbortError'
    return {
      ok: false,
      error: isTimeout
        ? `Timeout após ${TIMEOUT_MS / 1000}s — worker pode estar offline ou inacessível.`
        : (err?.message || 'Erro de rede ao acessar Local Worker.'),
    }
  }
}

export function isReadAction(action)      { return READ_ACTIONS.has(action) }
export function isValidateAction(action)  { return VALIDATE_ACTIONS.has(action) }
export function isWriteAction(action)     { return WRITE_ACTIONS.has(action) }
export function isDangerousAction(action) { return DANGEROUS_ACTIONS.has(action) }
export function isAllowedAction(action)   { return ALL_ALLOWED_ACTIONS.has(action) }

// Legacy aliases
export function isLightAction(action) { return READ_ACTIONS.has(action) }
export function isHeavyAction(action) { return VALIDATE_ACTIONS.has(action) }

export async function readLocalWorkerHealth() {
  const { configured } = workerConfig()
  if (!configured) return makeMissingConfigResult()

  const { ok, data, error, status } = await fetchWorker('/health', 'GET')
  if (error) {
    return {
      ok: false,
      configured: true,
      reachable: false,
      status: 'unavailable',
      reason: error,
      secretsExposed: false,
    }
  }

  if (!ok) {
    return {
      ok: false,
      configured: true,
      reachable: true,
      status: 'partial',
      reason: `Worker respondeu HTTP ${status} — verificar token e configuração.`,
      secretsExposed: false,
    }
  }

  return {
    ok: true,
    configured: true,
    reachable: true,
    status: 'available',
    checkpoint: data.checkpoint || 'unknown',
    projectPath: data.projectPath || '',
    platform: data.platform || '',
    discoveredTools: data.discoveredTools || {},
    allowedActions: Array.isArray(data.allowedActions) ? data.allowedActions : [],
    secretsExposed: false,
  }
}

export async function runLocalWorkerAction(action, { confirmed = false, rollbackAcknowledged = false, params = {} } = {}) {
  if (!isAllowedAction(action)) {
    return {
      ok: false,
      action,
      blocked: true,
      reason: `Ação "${action}" não está no catálogo H6.0 permitido.`,
      secretsExposed: false,
    }
  }

  const { configured } = workerConfig()
  if (!configured) {
    return {
      ok: false,
      action,
      configured: false,
      reason: 'LOCAL_WORKER_URL ou LOCAL_WORKER_TOKEN não configurados.',
      secretsExposed: false,
    }
  }

  const body = { action, confirmed, rollbackAcknowledged, params }
  const { ok, data, error, status } = await fetchWorker('/run', 'POST', body)

  if (error) {
    return {
      ok: false,
      action,
      configured: true,
      reachable: false,
      reason: error,
      secretsExposed: false,
    }
  }

  if (!ok) {
    return {
      ok: false,
      action,
      configured: true,
      reachable: true,
      reason: `Worker respondeu HTTP ${status}.`,
      blocked: data?.blocked || false,
      secretsExposed: false,
    }
  }

  return {
    ok: data?.ok ?? false,
    partial: data?.partial ?? false,
    action,
    configured: true,
    reachable: true,
    label: data?.label || action,
    stdout: String(data?.stdout || '').slice(0, 4000),
    stderr: String(data?.stderr || '').slice(0, 1000),
    exitCode: data?.exitCode ?? -1,
    durationMs: data?.durationMs ?? 0,
    results: data?.results || [],
    secretsExposed: false,
  }
}
