import { loadAlerts, saveAlerts } from '../../server/service/notifications.mjs'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const alerts = await loadAlerts()
      return res.status(200).json({ providerStatus: 'connected', alerts })
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
      if (Array.isArray(body.alerts)) {
        await saveAlerts(body.alerts)
        return res.status(200).json({ providerStatus: 'connected', alerts: body.alerts })
      }
      return res.status(400).json({ error: 'Invalid alerts array' })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[notifications] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
