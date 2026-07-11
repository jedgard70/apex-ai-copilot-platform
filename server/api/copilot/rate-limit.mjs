// Rate Limit Monitoring API — view rate limit events and alerts
// GET /api/copilot/rate-limit?window=60

import { getRateLimitEvents } from '../../service/rateLimitMonitor.mjs'

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
    const data = getRateLimitEvents(windowMin)
    return sendJson(res, 200, {
      ok: true,
      ...data,
      note: 'Rate limit events tracked in memory. Data resets on server restart.',
      config: {
        webhookConfigured: Boolean(process.env.RATE_LIMIT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL),
        alertsEnabled: String(process.env.RATE_LIMIT_ALERTS ?? '1') !== '0',
        consecutiveResetMinutes: 5,
      },
    })
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}
