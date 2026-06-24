/**
 * api/accounting/index.mjs — Contabilidade API (PJ + PF)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/accounting.mjs')

    // ── PJ ──
    if (path === '/api/accounting/create' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', company: mod.createCompany(body) })
    }
    if (path === '/api/accounting/list' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', companies: mod.listCompanies() })
    }
    if (path === '/api/accounting/get' && req.method === 'POST') {
      const c = mod.getCompany(body.id); if (!c) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', company: c })
    }
    if (path === '/api/accounting/report' && req.method === 'POST') {
      const report = mod.generateFiscalReport(body.id, body.period)
      if (!report) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', report })
    }
    if (path === '/api/accounting/obrigacoes-pj' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', obrigacoes: mod.listObrigacoesPJ() })
    }

    // ── PF ──
    if (path === '/api/accounting/pf/create' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', person: mod.createPerson(body) })
    }
    if (path === '/api/accounting/pf/list' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', persons: mod.listPersons() })
    }
    if (path === '/api/accounting/pf/get' && req.method === 'POST') {
      const p = mod.getPerson(body.id); if (!p) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', person: p })
    }
    if (path === '/api/accounting/pf/report' && req.method === 'POST') {
      const report = mod.generatePFReport(body.id)
      if (!report) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', report })
    }
    if (path === '/api/accounting/obrigacoes-pf' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', obrigacoes: mod.listObrigacoesPF() })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[accounting] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
