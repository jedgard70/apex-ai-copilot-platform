/**
 * api/dashboard/index.mjs — DashboardByRole API (ACIP)
 *
 * GET  /api/dashboard/roles       → Lista roles disponíveis
 * POST /api/dashboard/generate    → Gera dashboard para um role
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = req.method === 'POST' ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/dashboardByRole.mjs')

    if (path === '/api/dashboard/roles' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', roles: mod.listRoles() })
    }

    if (path === '/api/dashboard/generate' && req.method === 'POST') {
      const dash = await mod.generateDashboard(body.roleId, body.context || {})
      if (dash.error) return res.status(400).json({ error: dash.error })
      return res.status(200).json({ providerStatus: 'connected', dashboard: dash })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[dashboard] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
