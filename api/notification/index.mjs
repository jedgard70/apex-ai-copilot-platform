/**
 * api/notification/index.mjs — Vercel serverless endpoint
 *
 * POST /api/notification/send       → Enviar WhatsApp/SMS
 * GET  /api/notification/status      → Status do conector
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/notification.mjs')

    if (path === '/api/notification/send' && req.method === 'POST') {
      const { mobile, message, channel } = body
      if (!mobile || !message) return res.status(400).json({ error: 'mobile and message required' })
      
      let result
      if (channel === 'sms') {
        result = await mod.sendSmsNotification(mobile, message)
      } else {
        result = await mod.sendWhatsApp(mobile, message)
      }
      return res.status(200).json({ providerStatus: 'connected', ...result })
    }

    if (path === '/api/notification/status' && req.method === 'GET') {
      const status = mod.getNotificationConnectorStatus()
      return res.status(200).json({ providerStatus: 'connected', ...status })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[notification] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
