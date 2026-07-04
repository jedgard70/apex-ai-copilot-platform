/**
 * api/permits/index.mjs — American Permits API
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/globalPermits.mjs')

    if (path === '/api/permits/create' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', project: mod.createPermitProject(body) })
    }
    if (path === '/api/permits/list' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', projects: mod.listPermitProjects() })
    }
    if (path === '/api/permits/get' && req.method === 'POST') {
      const p = mod.getPermitProject(body.id); if (!p) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', project: p })
    }
    if (path === '/api/permits/checklist' && req.method === 'POST') {
      const cl = mod.generatePermitChecklist(body.id); if (!cl) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', checklist: cl })
    }
    if (path === '/api/permits/report' && req.method === 'POST') {
      const r = mod.generatePermitReport(body.id); if (!r) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', report: r })
    }
    if (path === '/api/permits/types' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', types: mod.PERMIT_TYPES })
    }
    if (path === '/api/permits/download-pdf' && req.method === 'POST') {
      try {
        const pdfBytes = await mod.generateRealPDF(body.id)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=permit_${body.id}.pdf`)
        return res.status(200).send(Buffer.from(pdfBytes))
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao gerar PDF real: ' + err.message })
      }
    }
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[permits] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
