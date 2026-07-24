// Shared APS helpers — token + bucket (imported by all api/aps/*.mjs endpoints)

export const APS_CLIENT_ID = process.env.APS_CLIENT_ID || ''
export const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET || ''
export const OSS_BASE = 'https://developer.api.autodesk.com/oss/v2'
export const MD_BASE  = 'https://developer.api.autodesk.com/modelderivative/v2'
export const AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'

export const SCOPES_FULL = 'data:read data:write data:create bucket:create bucket:read viewables:read'
export const SCOPES_VIEW  = 'viewables:read'

/** Derive a deterministic bucket key from the client ID (lowercase alphanumeric, ≤ 64 chars) */
export function bucketKey() {
  const base = APS_CLIENT_ID.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
  return `apex-ai-${base || 'platform'}`
}

/** Obtain a 2-legged OAuth token */
export async function getToken(scope = SCOPES_FULL) {
  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) throw new Error('APS credentials not configured')
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope }).toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errorMessage || data.error_description || data.error || 'APS auth failed')
  return String(data.access_token)
}

/** Ensure the OSS bucket exists (creates with 'temporary' 30-day policy if missing) */
export async function ensureBucket(token) {
  const key = bucketKey()
  const check = await fetch(`${OSS_BASE}/buckets/${key}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (check.ok) return key

  const create = await fetch(`${OSS_BASE}/buckets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketKey: key, policyKey: 'temporary' }),
  })
  if (!create.ok) {
    const err = await create.json().catch(() => ({}))
    // 409 = bucket already exists (race condition) — safe to ignore
    if (create.status !== 409) throw new Error(err.reason || err.errorMessage || `Bucket create failed (${create.status})`)
  }
  return key
}

/** Convert an APS objectId to a base64url URN (no padding) */
export function toUrn(objectId) {
  return Buffer.from(objectId).toString('base64').replace(/=/g, '')
}

export function sendJson(res, status, body) {
  res.status(status).json(body)
}
