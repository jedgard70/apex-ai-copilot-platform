/**
 * api/agents/index.mjs — Agentes Cognitivos API (ACIP)
 *
 * GET    /api/agents              → Lista todos agentes
 * GET    /api/agents/:id          → Detalhes do agente
 * GET    /api/agents/role/:role   → Agentes por role
 * POST   /api/agents/:id/execute  → Executa tarefa em um agente
 * POST   /api/agents/coordinate   → Coordena múltiplos agentes
 * GET    /api/agents/log          → Log de execução
 * GET    /api/agents/status       → Status da plataforma de agentes
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = req.method === 'POST' ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/cognitiveAgents.mjs')

    // GET /api/agents
    if (path === '/api/agents' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', agents: mod.listAgents() })
    }

    // GET /api/agents/log
    if (path === '/api/agents/log' && req.method === 'GET') {
      const limit = parseInt(new URL(req.url, 'http://localhost').searchParams.get('limit') || '50')
      return res.status(200).json({ providerStatus: 'connected', log: mod.getExecutionLog(limit) })
    }

    // GET /api/agents/status
    if (path === '/api/agents/status' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', ...mod.getPlatformStatus() })
    }

    // GET /api/agents/models
    if (path === '/api/agents/models' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', models: mod.getCoordinationModels() })
    }

    // GET /api/agents/role/:role
    if (path?.startsWith('/api/agents/role/') && req.method === 'GET') {
      const role = path.replace('/api/agents/role/', '')
      return res.status(200).json({ providerStatus: 'connected', agents: mod.getAgentsByRole(role) })
    }

    // GET /api/agents/:id
    if (path?.startsWith('/api/agents/') && req.method === 'GET' && !path.includes('/role/') && !path.includes('/log') && !path.includes('/status') && !path.includes('/models') && !path.includes('/coordinate')) {
      const id = path.replace('/api/agents/', '')
      const agent = mod.getAgent(id)
      if (!agent) return res.status(404).json({ error: 'Agent not found' })
      return res.status(200).json({ providerStatus: 'connected', agent })
    }

    // POST /api/agents/:id/execute
    if (path?.includes('/execute') && req.method === 'POST') {
      const id = path.replace('/execute', '').replace('/api/agents/', '')
      const result = await mod.executeAgent(id, body.task || '', body.context || {})
      if (result.error) return res.status(404).json({ error: result.error })
      return res.status(200).json({ providerStatus: 'connected', result })
    }

    // POST /api/agents/coordinate
    if (path === '/api/agents/coordinate' && req.method === 'POST') {
      const result = await mod.coordinateAgents(body.modelId, body.objective, body.agentIds)
      if (result.error) return res.status(400).json({ error: result.error })
      return res.status(200).json({ providerStatus: 'connected', coordination: result })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[agents] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
