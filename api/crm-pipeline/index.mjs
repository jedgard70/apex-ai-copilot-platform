/**
 * api/crm-pipeline/index.mjs — CRM Pipeline API (ACIP)
 *
 * GET    /api/crm-pipeline/stages     → Estágios do pipeline
 * GET    /api/crm-pipeline/leads      → Lista leads (opcional ?stage=)
 * GET    /api/crm-pipeline/leads/:id  → Detalhe do lead
 * POST   /api/crm-pipeline/leads      → Criar lead
 * PATCH  /api/crm-pipeline/leads/:id  → Atualizar lead
 * PATCH  /api/crm-pipeline/leads/:id/stage → Avançar estágio
 * DELETE /api/crm-pipeline/leads/:id  → Remover lead
 * GET    /api/crm-pipeline/kpis       → KPIs do pipeline
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = ['POST', 'PATCH'].includes(req.method) ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const url = new URL(req.url, 'http://localhost')
    const mod = await import('../../server/service/crmPipeline.mjs')

    // GET /api/crm-pipeline/kpis
    if (path === '/api/crm-pipeline/kpis' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', kpis: mod.getPipelineKPIs() })
    }

    // GET /api/crm-pipeline/stages
    if (path === '/api/crm-pipeline/stages' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', stages: mod.getStages() })
    }

    // GET /api/crm-pipeline/leads
    if (path === '/api/crm-pipeline/leads' && req.method === 'GET') {
      const stage = url.searchParams.get('stage')
      return res.status(200).json({ providerStatus: 'connected', leads: mod.getLeads(stage) })
    }

    // GET /api/crm-pipeline/leads/:id
    if (path?.startsWith('/api/crm-pipeline/leads/') && req.method === 'GET' && !path.includes('/stage')) {
      const id = path.replace('/api/crm-pipeline/leads/', '')
      const lead = mod.getLead(id)
      if (!lead) return res.status(404).json({ error: 'Lead not found' })
      return res.status(200).json({ providerStatus: 'connected', lead })
    }

    // POST /api/crm-pipeline/leads
    if (path === '/api/crm-pipeline/leads' && req.method === 'POST') {
      const lead = mod.createLead(body)
      return res.status(200).json({ providerStatus: 'connected', lead })
    }

    // PATCH /api/crm-pipeline/leads/:id
    if (path?.startsWith('/api/crm-pipeline/leads/') && req.method === 'PATCH' && !path.includes('/stage')) {
      const id = path.replace('/api/crm-pipeline/leads/', '')
      const lead = mod.updateLead(id, body)
      if (!lead) return res.status(404).json({ error: 'Lead not found' })
      return res.status(200).json({ providerStatus: 'connected', lead })
    }

    // PATCH /api/crm-pipeline/leads/:id/stage
    if (path?.includes('/stage') && req.method === 'PATCH') {
      const id = path.replace('/stage', '').replace('/api/crm-pipeline/leads/', '')
      const lead = mod.updateLeadStage(id, body.stage, body.observacoes)
      if (!lead) return res.status(404).json({ error: 'Lead not found or invalid stage' })
      return res.status(200).json({ providerStatus: 'connected', lead })
    }

    // DELETE /api/crm-pipeline/leads/:id
    if (path?.startsWith('/api/crm-pipeline/leads/') && req.method === 'DELETE') {
      const id = path.replace('/api/crm-pipeline/leads/', '')
      const ok = mod.deleteLead(id)
      if (!ok) return res.status(404).json({ error: 'Lead not found' })
      return res.status(200).json({ providerStatus: 'connected', deleted: true })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[crm-pipeline] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
