/**
 * api/autofix/index.mjs — Vercel serverless endpoint
 *
 * POST /api/autofix/check   → scan for problems
 * POST /api/autofix/run     → auto-fix detected problems
 * GET  /api/autofix/status  → get current auto-fix status
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/autoFix.mjs')

    if (path === '/api/autofix/check' && req.method === 'POST') {
      const problems = await mod.detectProblems()
      return res.status(200).json({ providerStatus: 'connected', problems, count: problems.length })
    }

    if (path === '/api/autofix/run' && req.method === 'POST') {
      const targetProblems = body.problems || await mod.detectProblems()
      const result = await mod.autoFixProblems(targetProblems.filter(p => p.autoFixable))
      return res.status(200).json({
        providerStatus: 'connected',
        fixed: result.fixed,
        failed: result.failed,
        fixedCount: result.fixed.length,
        failedCount: result.failed.length,
      })
    }

    if (path === '/api/autofix/status' && req.method === 'GET') {
      const queryRaw = req.url?.split('?')[1] || ''
      const query = new URLSearchParams(queryRaw)
      const deep = ['1', 'true', 'yes'].includes(String(query.get('deep') || '').toLowerCase())
      const status = await mod.getAutoFixStatus({ deep })
      return res.status(200).json({ providerStatus: 'connected', ...status })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[autofix] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
