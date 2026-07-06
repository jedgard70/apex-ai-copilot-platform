// Security Audit Log API — view API key usage audit trail
// GET /api/copilot/security-audit?window=60&provider=openai&failuresOnly=true

import { queryAuditLog, getAuditConfig } from '../../server/service/securityAudit.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const windowMin = Math.min(Math.max(parseInt(url.searchParams.get('window') || '60', 10) || 60, 1), 24 * 60)
    const provider = url.searchParams.get('provider') || undefined
    const action = url.searchParams.get('action') || undefined
    const failuresOnly = url.searchParams.get('failuresOnly') === 'true'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500)

    const data = queryAuditLog({ windowMinutes: windowMin, provider, action, failuresOnly, limit })
    return sendJson(res, 200, { ok: true, ...data, config: getAuditConfig() })
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}
