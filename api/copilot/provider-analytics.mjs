// Provider Analytics API — returns real-time performance stats per AI provider
// GET /api/copilot/provider-analytics?window=60 (default 60 min)

import { getAnalytics } from '../../server/service/providerAnalytics.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const windowMin = Math.min(Math.max(parseInt(url.searchParams.get('window') || '60', 10) || 60, 1), 24 * 60)
    const data = getAnalytics(windowMin)
    return sendJson(res, 200, data)
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}
