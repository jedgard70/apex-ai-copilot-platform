/**
 * api/accounting/index.mjs — Contabilidade API (PJ + PF) Real via Supabase
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('./service.mjs')

    // ── Autenticação ──
    if (path === '/api/accounting/auth' && req.method === 'POST') {
      const auth = await mod.authenticateUser(body.email, body.password)
      if (!auth) return res.status(401).json({ error: 'Credenciais inválidas' })
      return res.status(200).json({ providerStatus: 'connected', ...auth })
    }

    // ── PJ ──
    if (path === '/api/accounting/create' && req.method === 'POST') {
      const company = await mod.createCompany(body)
      return res.status(200).json({ providerStatus: 'connected', company })
    }
    if (path === '/api/accounting/list' && req.method === 'GET') {
      const companies = await mod.listCompanies()
      return res.status(200).json({ providerStatus: 'connected', companies })
    }
    if (path === '/api/accounting/get' && req.method === 'POST') {
      const c = await mod.getCompany(body.id)
      if (!c) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', company: c })
    }
    if (path === '/api/accounting/report' && req.method === 'POST') {
      const report = await mod.generateFiscalReport(body.id, body.period)
      if (!report) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', report })
    }
    if (path === '/api/accounting/obrigacoes-pj' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', obrigacoes: mod.listObrigacoesPJ() })
    }

    // ── PF ──
    if (path === '/api/accounting/pf/create' && req.method === 'POST') {
      const person = await mod.createPerson(body)
      return res.status(200).json({ providerStatus: 'connected', person })
    }
    if (path === '/api/accounting/pf/list' && req.method === 'GET') {
      const persons = await mod.listPersons()
      return res.status(200).json({ providerStatus: 'connected', persons })
    }
    if (path === '/api/accounting/pf/get' && req.method === 'POST') {
      const p = await mod.getPerson(body.id)
      if (!p) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', person: p })
    }
    if (path === '/api/accounting/pf/report' && req.method === 'POST') {
      const report = await mod.generatePFReport(body.id)
      if (!report) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', report })
    }
    if (path === '/api/accounting/obrigacoes-pf' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', obrigacoes: mod.listObrigacoesPF() })
    }
    if (path === '/api/accounting/automation-data' && req.method === 'GET') {
      return res.status(200).json(mod.getAutomationData())
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[accounting] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
