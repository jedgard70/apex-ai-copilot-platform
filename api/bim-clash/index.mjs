/**
 * api/bim-clash/index.mjs — BIM Clash Detection API (ACIP)
 *
 * GET    /api/bim-clash/clashes     → Lista conflitos (opcional ?disciplina=&severidade=&status=)
 * GET    /api/bim-clash/clashes/:id → Detalhe do conflito
 * POST   /api/bim-clash/clashes     → Criar conflito
 * PATCH  /api/bim-clash/clashes/:id/status → Atualizar status
 * DELETE /api/bim-clash/clashes/:id → Remover
 * GET    /api/bim-clash/kpis        → KPIs
 * GET    /api/bim-clash/referencias → Ferramentas BIM
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = ['POST', 'PATCH'].includes(req.method) ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const url = new URL(req.url, 'http://localhost')
    const mod = await import('../../server/service/bimClash.mjs')

    if (path === '/api/bim-clash/kpis' && req.method === 'GET')
      return res.status(200).json({ providerStatus: 'connected', kpis: mod.getKPIs() })
    if (path === '/api/bim-clash/referencias' && req.method === 'GET')
      return res.status(200).json({ providerStatus: 'connected', referencias: mod.getReferencias() })
    if (path === '/api/bim-clash/clashes' && req.method === 'GET') {
      const disciplina = url.searchParams.get('disciplina')
      const severidade = url.searchParams.get('severidade')
      const status = url.searchParams.get('status')
      return res.status(200).json({ providerStatus: 'connected', clashes: mod.listClashes(disciplina, severidade, status) })
    }
    if (path === '/api/bim-clash/clashes' && req.method === 'POST')
      return res.status(200).json({ providerStatus: 'connected', clash: mod.createClash(body) })
    if (path?.startsWith('/api/bim-clash/clashes/') && req.method === 'GET') {
      const id = path.replace('/api/bim-clash/clashes/', '')
      const clash = mod.getClash(id)
      if (!clash) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ providerStatus: 'connected', clash })
    }
    if (path?.includes('/status') && req.method === 'PATCH') {
      const id = path.replace('/status', '').replace('/api/bim-clash/clashes/', '')
      const clash = mod.updateClashStatus(id, body.status, body.observacoes)
      if (!clash) return res.status(404).json({ error: 'Not found or invalid status' })
      return res.status(200).json({ providerStatus: 'connected', clash })
    }
    if (path?.startsWith('/api/bim-clash/clashes/') && req.method === 'DELETE') {
      const id = path.replace('/api/bim-clash/clashes/', '')
      if (!mod.deleteClash(id)) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ providerStatus: 'connected', deleted: true })
    }
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[bim-clash] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
