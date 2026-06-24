/**
 * api/trip/index.mjs — Vercel serverless
 *
 * POST /api/trip/create      → Criar viagem
 * GET  /api/trip/list         → Listar viagens
 * POST /api/trip/get          → Buscar viagem por ID
 * POST /api/trip/update       → Atualizar viagem
 * POST /api/trip/delete       → Deletar viagem
 * GET  /api/trip/destinations → Sugestões de destinos
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/tripPlanner.mjs')

    if (path === '/api/trip/create' && req.method === 'POST') {
      const trip = mod.createTrip(body)
      return res.status(200).json({ providerStatus: 'connected', trip })
    }

    if (path === '/api/trip/list' && req.method === 'GET') {
      const trips = mod.listTrips()
      return res.status(200).json({ providerStatus: 'connected', trips })
    }

    if (path === '/api/trip/get' && req.method === 'POST') {
      const trip = mod.getTrip(body.id)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      return res.status(200).json({ providerStatus: 'connected', trip, budget: mod.calculateBudgetSummary(trip) })
    }

    if (path === '/api/trip/update' && req.method === 'POST') {
      const trip = mod.updateTrip(body.id, body)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      return res.status(200).json({ providerStatus: 'connected', trip })
    }

    if (path === '/api/trip/delete' && req.method === 'POST') {
      const ok = mod.deleteTrip(body.id)
      return res.status(200).json({ providerStatus: 'connected', deleted: ok })
    }

    if (path === '/api/trip/destinations' && req.method === 'GET') {
      const destinations = mod.suggestDestinations()
      return res.status(200).json({ providerStatus: 'connected', destinations })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[trip] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
