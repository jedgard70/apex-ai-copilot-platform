/**
 * api/social/index.mjs — Vercel serverless
 *
 * POST /api/social/campaign      → Criar nova campanha
 * GET  /api/social/campaigns     → Listar campanhas
 * GET  /api/social/campaign/:id  → Detalhes da campanha
 * POST /api/social/generate/:id  → Gerar conteudo (imagens, posts, ads)
 * DELETE /api/social/campaign/:id → Deletar campanha
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = req.method === 'POST' ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/socialMedia.mjs')
    const pipeline = await import('../../server/service/pipelineStatus.mjs')

    // POST /api/social/campaign
    if (path === '/api/social/campaign' && req.method === 'POST') {
      const campaign = mod.createCampaign(body)
      const plan = body.product ? mod.generateMarketingPlan(body.product, body.theme, body.description, body.targetAudience) : null
      if (plan) campaign.plan = plan
      return res.status(200).json({ providerStatus: 'connected', campaign })
    }

    // GET /api/social/campaigns
    if (path === '/api/social/campaigns' && req.method === 'GET') {
      const campaigns = mod.listCampaigns()
      return res.status(200).json({ providerStatus: 'connected', campaigns })
    }

    // GET /api/social/campaign/:id
    if (path?.startsWith('/api/social/campaign/') && req.method === 'GET') {
      const id = path.replace('/api/social/campaign/', '')
      const campaign = mod.getCampaign(id)
      if (!campaign) return res.status(404).json({ error: 'Campanha nao encontrada' })
      return res.status(200).json({ providerStatus: 'connected', campaign })
    }

    // POST /api/social/generate/:id
    if (path?.startsWith('/api/social/generate/') && req.method === 'POST') {
      const id = path.replace('/api/social/generate/', '')
      const campaign = mod.getCampaign(id)
      if (!campaign) return res.status(404).json({ error: 'Campanha nao encontrada' })

      // Criar pipeline task para tracking em tempo real
      const task = pipeline.createTask('generate-campaign', { campaignId: id, product: campaign.product }, `Gerando campanha: ${campaign.product}`)

      const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY
      if (!falKey) {
        pipeline.updateStep(task.id, 'FAL_KEY nao configurada, usando placeholders', 'running')
        await new Promise(r => setTimeout(r, 500))
        pipeline.completeTask(task.id, 'Placeholder gerado (sem FAL)')
        return res.status(200).json({
          providerStatus: 'connected',
          pipelineTaskId: task.id,
          message: 'FAL_KEY nao configurada. Gerando conteudo placeholder.',
          content: {
            images: [
              { url: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+1', slide: 1, type: 'carousel' },
              { url: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+2', slide: 2, type: 'carousel' },
              { url: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+3', slide: 3, type: 'carousel' },
            ],
            carousels: [{
              id: 'placeholder',
              platform: 'instagram-feed',
              title: `Carrossel: ${campaign.product}`,
              slides: [
                { imageUrl: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+1', caption: 'Capa' },
                { imageUrl: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+2', caption: 'Conteudo' },
                { imageUrl: 'https://placehold.co/600x600/1e293b/38bdf8?text=Slide+3', caption: 'CTA' },
              ],
            }],
            posts: [
              { platform: 'linkedin', title: `${campaign.product} - Inovacao`, body: `**${campaign.product}** - conteudo gerado pela Apex AI.` },
            ],
            ads: [
              { platform: 'google-ads', campaignName: `Campanha - ${campaign.product}`, status: 'draft' },
            ],
          },
        })
      }

      // Gerar com FAL
      try {
        pipeline.updateStep(task.id, 'Gerando imagens com FAL.ai...', 'running')
        const result = await mod.generateCampaignContent(id, falKey, task.id)
        return res.status(200).json({
          providerStatus: 'connected',
          pipelineTaskId: task.id,
          content: result,
        })
      } catch (genErr) {
        pipeline.failTask(task.id, genErr.message)
        return res.status(200).json({ providerStatus: 'error', pipelineTaskId: task.id, message: genErr.message })
      }
    }

    // DELETE /api/social/campaign/:id
    if (path?.startsWith('/api/social/campaign/') && req.method === 'DELETE') {
      const id = path.replace('/api/social/campaign/', '')
      const ok = mod.deleteCampaign(id)
      return res.status(200).json({ providerStatus: 'connected', deleted: ok })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[social] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
