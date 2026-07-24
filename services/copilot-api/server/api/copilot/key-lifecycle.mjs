// Key Lifecycle & Rotation API
// GET  /api/copilot/key-lifecycle — view key ages and rotation status
// POST /api/copilot/key-lifecycle?action=record-rotation&key=GEMINI_API_KEY — record a key rotation

import { getKeyLifecycleStatus, recordRotation } from '../../service/keyLifecycle.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Apex-Internal, X-Internal-Token')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  if (req.method === 'POST') {
    const reqToken = req.headers['x-apex-internal'] || req.headers['x-internal-token'] || ''
    const internalToken = process.env.APEX_INTERNAL_TOKEN
    if (internalToken && reqToken !== internalToken) {
      return sendJson(res, 403, { ok: false, error: 'invalid_token' })
    }

    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      const keyId = url.searchParams.get('key')
      if (!keyId) return sendJson(res, 400, { ok: false, error: 'key parameter required' })
      recordRotation(keyId)
      return sendJson(res, 200, { ok: true, message: `Rotation recorded for ${keyId}.`, status: getKeyLifecycleStatus() })
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error.message })
    }
  }

  // GET — return lifecycle status
  try {
    const data = getKeyLifecycleStatus()
    return sendJson(res, 200, { ok: true, ...data })
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message })
  }
}
