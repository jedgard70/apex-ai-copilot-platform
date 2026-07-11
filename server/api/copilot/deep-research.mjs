// Deep Research Agent API — pesquisa web assincrona via Gemini Interactions
// POST /api/copilot/deep-research — { query: string, agent?: string, wait?: boolean }
// GET  /api/copilot/deep-research?id=<interactionId> — verificar resultado

import { startDeepResearch, checkDeepResearch } from '../../agent/geminiAgentsConnector.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  try {
    // GET — check research result
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      const interactionId = url.searchParams.get('id')
      if (!interactionId) return sendJson(res, 400, { ok: false, error: 'id parameter required' })
      const result = await checkDeepResearch(interactionId)
      return sendJson(res, result.ok ? 200 : 202, result)
    }

    // POST — start research
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
    const query = String(body.query || '').trim()
    if (!query) return sendJson(res, 400, { ok: false, error: 'query is required' })

    const agent = String(body.agent || 'deep-research-preview-04-2026').trim()
    const wait = body.wait === true

    const result = await startDeepResearch(query, { agent, wait })
    return sendJson(res, result.ok ? 200 : 502, result)
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message })
  }
}
