export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = req.method === 'POST' ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/predictiveAnalytics.mjs')
    const projeto = body.projeto || (path.includes('/delay') || path.includes('/finance') || path.includes('/bottleneck') || path.includes('/report') ? '' : '')
    if (path === '/api/predictive/delay' && req.method === 'POST') return res.status(200).json({ providerStatus:'connected', ...mod.predictDelays(projeto) })
    if (path === '/api/predictive/finance' && req.method === 'POST') return res.status(200).json({ providerStatus:'connected', ...mod.predictFinancialRisk(projeto) })
    if (path === '/api/predictive/bottleneck' && req.method === 'POST') return res.status(200).json({ providerStatus:'connected', ...mod.detectBottlenecks(projeto) })
    if (path === '/api/predictive/report' && req.method === 'POST') return res.status(200).json({ providerStatus:'connected', report: mod.generateReport(projeto) })
    return res.status(404).json({ error:'Not found' })
  } catch (err) { console.error('[predictive] Error:',err.message); return res.status(500).json({ error:err.message }) }
}
