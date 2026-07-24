/**
 * api/nr/index.mjs — NR Compliance API
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/nrCompliance.mjs')

    if (path === '/api/nr/create' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', project: mod.createNRProject(body) })
    }
    if (path === '/api/nr/list' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', projects: mod.listNRProjects() })
    }
    if (path === '/api/nr/get' && req.method === 'POST') {
      const p = mod.getNRProject(body.id); if (!p) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', project: p })
    }
    if (path === '/api/nr/generate' && req.method === 'POST') {
      const docs = mod.generateNRDocument(body.id)
      if (!docs) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', documents: docs })
    }
    if (path === '/api/nr/list-types' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', nrs: mod.NR_LIST })
    }
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[nr] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
