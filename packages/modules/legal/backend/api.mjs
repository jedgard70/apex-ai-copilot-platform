/**
 * modules/legal/backend/api.mjs — Legal API (Geral, Contracts, Visas) Real via Supabase
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

    // ── Jurídico Geral ──
    if (path === '/api/legal/general/list' && req.method === 'GET') {
      const { data } = await mod.fetchGeneralCases()
      return res.status(200).json({ providerStatus: 'connected', cases: data })
    }
    if (path === '/api/legal/general/create' && req.method === 'POST') {
      const result = await mod.createGeneralCase(body)
      return res.status(200).json({ providerStatus: 'connected', case: result })
    }

    // ── Contratos e Permits (O frontend ainda usa /api/permits para compatibilidade) ──
    if (path === '/api/permits/list' || path === '/api/contracts/list') {
      const { data } = await mod.fetchContracts()
      return res.status(200).json({ providerStatus: 'connected', contracts: data })
    }
    if (path === '/api/permits/create' || path === '/api/contracts/create') {
      const result = await mod.createContract(body)
      return res.status(200).json({ providerStatus: 'connected', contract: result })
    }

    // ── Vistos e Cidadanias ──
    if (path === '/api/visas/list' && req.method === 'GET') {
      const { data } = await mod.fetchVisas()
      return res.status(200).json({ providerStatus: 'connected', visas: data })
    }
    if (path === '/api/visas/create' && req.method === 'POST') {
      const result = await mod.createVisa(body)
      return res.status(200).json({ providerStatus: 'connected', visa: result })
    }

    // Fallbacks from old endpoints for UI compat
    if (path === '/api/permits/types') {
      return res.status(200).json({ providerStatus: 'connected', types: ['NDA', 'Construction Permit', 'Employment'] })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[legal] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
