import crypto from 'node:crypto'

export const APEX_API_PLANS = {
  developer: {
    id: 'developer',
    name: 'Developer',
    monthlyRequests: 1000,
    includedScopes: ['read:*', 'operate:images', 'operate:projects'],
  },
  engineer_pro: {
    id: 'engineer_pro',
    name: 'Engineer Pro',
    monthlyRequests: 10000,
    includedScopes: ['read:*', 'operate:images', 'operate:projects', 'operate:revit'],
  },
  studio_firm: {
    id: 'studio_firm',
    name: 'Studio/Firm',
    monthlyRequests: 50000,
    includedScopes: ['read:*', 'operate:*', 'write:files'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyRequests: 250000,
    includedScopes: ['read:*', 'operate:*', 'write:files', 'write:revit', 'admin:billing'],
  },
}

const usageBuckets = new Map()

function splitList(value = '') {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function safeEqual(left = '', right = '') {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function readApiKeys() {
  const raw = String(process.env.APEX_PUBLIC_API_KEYS || '').trim()
  const keys = []

  for (const entry of raw.split(/[;\n]+/).map(item => item.trim()).filter(Boolean)) {
    const [key, orgId = 'default-org', plan = 'developer', scopesRaw = ''] = entry.split(':')
    if (!key) continue
    const planDef = APEX_API_PLANS[plan] || APEX_API_PLANS.developer
    keys.push({
      key,
      orgId,
      plan: planDef.id,
      scopes: scopesRaw ? splitList(scopesRaw) : planDef.includedScopes,
    })
  }

  const ownerKey = String(process.env.APEX_API_KEY || process.env.APEX_OWNER_API_KEY || process.env.APEX_API_TOKEN || '').trim()
  if (ownerKey) {
    keys.push({
      key: ownerKey,
      orgId: 'apex-owner',
      plan: 'enterprise',
      scopes: ['read:*', 'operate:*', 'write:files', 'write:revit', 'admin:billing'],
    })
  }

  if (!keys.length && process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    keys.push({
      key: 'apex-dev-key',
      orgId: 'local-dev',
      plan: 'enterprise',
      scopes: ['read:*', 'operate:*', 'write:files', 'write:revit', 'admin:billing'],
    })
  }

  return keys
}

function extractApiKey(req) {
  const auth = String(req.headers?.authorization || '')
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim()
  return String(req.headers?.['x-api-key'] || req.query?.api_key || '').trim()
}

export function scopeMatches(granted = '', required = '') {
  if (!required) return true
  if (granted === '*' || granted === required) return true
  const [gAction, gTarget] = String(granted).split(':')
  const [rAction, rTarget] = String(required).split(':')
  return (gAction === '*' || gAction === rAction) && (gTarget === '*' || gTarget === rTarget)
}

function hasScope(auth, requiredScope) {
  return auth.scopes.some(scope => scopeMatches(scope, requiredScope))
}

export function authenticateApexApi(req, requiredScopes = []) {
  const apiKey = extractApiKey(req)
  const configuredKeys = readApiKeys()
  if (!configuredKeys.length) {
    return {
      ok: false,
      status: 503,
      error: 'api_keys_not_configured',
      message: 'APEX_PUBLIC_API_KEYS ou APEX_API_KEY precisa estar configurado no backend.',
    }
  }
  const match = configuredKeys.find(item => safeEqual(item.key, apiKey))
  if (!match) {
    return {
      ok: false,
      status: 401,
      error: 'invalid_api_key',
      message: 'API key ausente ou inválida.',
    }
  }

  const auth = {
    ok: true,
    apiKey,
    orgId: match.orgId,
    plan: match.plan,
    scopes: match.scopes,
  }
  const missingScopes = requiredScopes.filter(scope => !hasScope(auth, scope))
  if (missingScopes.length) {
    return {
      ok: false,
      status: 403,
      error: 'missing_scope',
      message: `API key sem escopo necessário: ${missingScopes.join(', ')}`,
      orgId: auth.orgId,
      plan: auth.plan,
      grantedScopes: auth.scopes,
      missingScopes,
    }
  }
  return auth
}

function approvalSecret() {
  return String(process.env.APEX_APPROVAL_SECRET || process.env.APEX_API_TOKEN || process.env.APEX_API_KEY || 'apex-approval-dev-secret')
}

export function createApprovalToken({ auth, scopes = [], operation = 'write', ttlSeconds = 600 }) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(30, Math.min(Number(ttlSeconds) || 600, 1800))
  const payload = {
    orgId: auth.orgId,
    plan: auth.plan,
    scopes,
    operation: String(operation || 'write').slice(0, 80),
    exp,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', approvalSecret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyApprovalToken(req, auth, requiredScopes = []) {
  const token = String(req.headers?.['x-apex-approval-token'] || '').trim()
  if (!requiredScopes.some(scope => String(scope).startsWith('write:'))) {
    return { ok: true, required: false }
  }
  if (!token || !token.includes('.')) {
    return {
      ok: false,
      required: true,
      status: 409,
      error: 'approval_required',
      message: 'Chamadas write exigem X-Apex-Approval-Token de curta duração.',
    }
  }

  const [encoded, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', approvalSecret()).update(encoded).digest('base64url')
  if (!safeEqual(sig, expected)) {
    return { ok: false, required: true, status: 403, error: 'invalid_approval_token', message: 'Token de aprovação inválido.' }
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return { ok: false, required: true, status: 403, error: 'invalid_approval_payload', message: 'Payload de aprovação inválido.' }
  }

  if (payload.orgId !== auth.orgId || Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) {
    return { ok: false, required: true, status: 403, error: 'expired_or_wrong_approval', message: 'Token expirado ou emitido para outra organização.' }
  }

  const tokenScopes = Array.isArray(payload.scopes) ? payload.scopes : []
  const missing = requiredScopes.filter(scope => String(scope).startsWith('write:') && !tokenScopes.some(granted => scopeMatches(granted, scope)))
  if (missing.length) {
    return { ok: false, required: true, status: 403, error: 'approval_scope_missing', message: `Aprovação sem escopo: ${missing.join(', ')}` }
  }

  return { ok: true, required: true, payload }
}

export function recordUsage({ auth, service, projectId = 'default', inputTokens = 0, outputTokens = 0, unit = 'request' }) {
  const month = new Date().toISOString().slice(0, 7)
  const key = `${auth.orgId}:${projectId}:${service}:${month}`
  const previous = usageBuckets.get(key) || {
    orgId: auth.orgId,
    projectId,
    service,
    month,
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    units: {},
  }
  previous.requests += 1
  previous.inputTokens += Number(inputTokens) || 0
  previous.outputTokens += Number(outputTokens) || 0
  previous.units[unit] = (previous.units[unit] || 0) + 1
  usageBuckets.set(key, previous)
  return previous
}

export function sendJson(res, status, body, usage = null) {
  if (usage) {
    res.setHeader('X-Apex-Usage-Org', usage.orgId)
    res.setHeader('X-Apex-Usage-Project', usage.projectId)
    res.setHeader('X-Apex-Usage-Service', usage.service)
    res.setHeader('X-Apex-Usage-Requests-Month', String(usage.requests))
  }
  return res.status(status).json(body)
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
