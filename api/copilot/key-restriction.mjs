// API Key Restriction Management API
// GET  /api/copilot/key-restriction — view current config
// POST /api/copilot/key-restriction — update allowed origins (requires internal token)

import { getKeyRestrictionConfig, validateOrigin } from '../../server/middleware/keyRestriction.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Apex-Internal, X-Internal-Token')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  // GET — return current config
  if (req.method === 'GET') {
    const config = getKeyRestrictionConfig()
    // Test the current request origin
    const origin = req.headers['origin'] || req.headers['referer'] || ''
    const validation = validateOrigin(origin)
    return sendJson(res, 200, {
      ok: true,
      config,
      currentRequest: {
        origin: origin || '(none — non-browser request)',
        allowed: validation.allowed,
        ...(validation.reason ? { reason: validation.reason } : {}),
      },
    })
  }

  // POST — requires internal token
  if (req.method === 'POST') {
    const reqToken = req.headers['x-apex-internal'] || req.headers['x-internal-token'] || ''
    const internalToken = process.env.APEX_INTERNAL_TOKEN
    if (internalToken && reqToken !== internalToken) {
      return sendJson(res, 403, { ok: false, error: 'invalid_token', message: 'Valid internal token required.' })
    }

    try {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
      // Key restriction config is managed via env vars — this endpoint is read-only for config
      // To update, use vercel env add or edit .env.local
      return sendJson(res, 200, {
        ok: true,
        message: 'Key restriction config is managed via ALLOWED_ORIGINS and ALLOWED_IPS env vars.',
        config: getKeyRestrictionConfig(),
        envDocs: 'Set ALLOWED_ORIGINS=https://mysite.com,https://app.mysite.com in Vercel env or .env.local',
      })
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid_body' })
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' })
}
