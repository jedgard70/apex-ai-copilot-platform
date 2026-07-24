/**
 * api/campaign/index.mjs — Marketing & Social Media API
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/socialMedia.mjs')
    const pipeline = await import('../../server/service/pipelineStatus.mjs')

    if (path === '/api/campaign/create' && req.method === 'POST') {
      const c = mod.createCampaign(body)
      c.plan = mod.generateMarketingPlan(c.product, c.theme, c.description, c.targetAudience)
      return res.status(200).json({ providerStatus: 'connected', campaign: c })
    }
    if (path === '/api/campaign/list' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', campaigns: mod.listCampaigns() })
    }
    if (path === '/api/campaign/get' && req.method === 'POST') {
      const c = mod.getCampaign(body.id); if (!c) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ providerStatus: 'connected', campaign: c })
    }
    if (path === '/api/campaign/generate' && req.method === 'POST') {
      const task = pipeline.createTask('generate-campaign', { campaignId: body.id }, 'Gerando campanha...')
      const result = await mod.generateCampaignContent(body.id, process.env.FAL_KEY || process.env.FAL_API_KEY, task.id)
      if (result?.error) {
        pipeline.failTask(task.id, result.error)
        return res.status(200).json({ providerStatus: 'planning-only', pipelineTaskId: task.id, error: result.error })
      }
      return res.status(200).json({ providerStatus: 'connected', pipelineTaskId: task.id, content: result })
    }
    if (path === '/api/campaign/delete' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', deleted: mod.deleteCampaign(body.id) })
    }
    if (path === '/api/campaign/reel-script' && req.method === 'POST') {
      return res.status(200).json({ providerStatus: 'connected', script: mod.generateReelScript(body.product || '') })
    }
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[campaign] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
