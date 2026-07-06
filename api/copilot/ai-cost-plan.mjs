import { getAiCostDashboard, saveRecords } from '../../server/service/aiCost.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.writeHead(200).end()

  try {
    if (req.method === 'POST' && req.body && req.body.records) {
      await saveRecords(req.body.records)
      return sendJson(res, 200, { success: true })
    }

    const plan = await getAiCostDashboard()
    return sendJson(res, 200, { plan })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'ai_cost_plan_failed', providerStatus: 'local-json' })
  }
}

