/**
 * api/qualidade/index.mjs — Qualidade / NCIs API (ACIP)
 *
 * GET    /api/qualidade/ncis         → Lista NCIs
 * POST   /api/qualidade/ncis         → Criar NCI
 * GET    /api/qualidade/ncis/:id     → Detalhe NCI
 * PATCH  /api/qualidade/ncis/:id/status → Atualizar status NCI
 * GET    /api/qualidade/checklists   → Lista checklists
 * POST   /api/qualidade/checklists   → Criar checklist
 * GET    /api/qualidade/kpis         → KPIs
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = ['POST', 'PATCH'].includes(req.method) ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const url = new URL(req.url, 'http://localhost')
    const mod = await import('../../server/service/qualidadeNCIs.mjs')

    if (path === '/api/qualidade/kpis' && req.method === 'GET')
      return res.status(200).json({ providerStatus: 'connected', kpis: mod.getKPIs() })
    if (path === '/api/qualidade/ncis' && req.method === 'GET') {
      const severidade = url.searchParams.get('severidade')
      const categoria = url.searchParams.get('categoria')
      const status = url.searchParams.get('status')
      return res.status(200).json({ providerStatus: 'connected', ncis: mod.listNCIs(severidade, categoria, status) })
    }
    if (path === '/api/qualidade/ncis' && req.method === 'POST')
      return res.status(200).json({ providerStatus: 'connected', nci: mod.createNCI(body) })
    if (path?.startsWith('/api/qualidade/ncis/') && req.method === 'GET' && !path.includes('/status')) {
      const id = path.replace('/api/qualidade/ncis/', '')
      const nci = mod.getNCI(id)
      if (!nci) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ providerStatus: 'connected', nci })
    }
    if (path?.includes('/status') && req.method === 'PATCH') {
      const id = path.replace('/status', '').replace('/api/qualidade/ncis/', '')
      const nci = mod.updateNCIStatus(id, body.status, body.observacoes)
      if (!nci) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ providerStatus: 'connected', nci })
    }
    if (path === '/api/qualidade/checklists' && req.method === 'GET')
      return res.status(200).json({ providerStatus: 'connected', checklists: mod.listChecklists(url.searchParams.get('projeto'), url.searchParams.get('categoria')) })
    if (path === '/api/qualidade/checklists' && req.method === 'POST')
      return res.status(200).json({ providerStatus: 'connected', checklist: mod.createChecklist(body) })
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[qualidade] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
