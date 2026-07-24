import { generateAlertFromGoal, addAlert } from '../../service/notifications.mjs'

const AUTHKEY = process.env.AUTHKEY_AUTHKEY || ''
const WHATSAPP_SID = process.env.AUTHKEY_WHATSAPP_SID || ''

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

async function sendWhatsAppAlert(to, message) {
  if (!AUTHKEY || !WHATSAPP_SID || !to) return null
  try {
    const r = await fetch('https://api.authkey.io/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authkey: AUTHKEY, type: 'whatsapp', sid: WHATSAPP_SID, to: String(to).replace(/\D/g, ''), message }),
    })
    const data = await r.json()
    return data.request_id || data.id || true
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'local-alerts-only' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const newAlert = generateAlertFromGoal(String(body.goal || ''))
    
    // Fire-and-forget WhatsApp alert if recipient phone provided
    if (body.phone) {
      sendWhatsAppAlert(body.phone, `[Apex Alert] ${newAlert.type}: ${newAlert.title}`)
        .then(id => id && console.log('[notifications-plan] WA sent:', id))
        .catch(() => {})
    }
    
    // Save to global alerts
    await addAlert(newAlert)
    
    const plan = {
      providerStatus: (AUTHKEY && WHATSAPP_SID) ? 'authkey-whatsapp' : 'connected',
      alerts: [newAlert],
      suggestedAlerts: [],
      message: (AUTHKEY && WHATSAPP_SID)
        ? 'WhatsApp alerts enabled via AUTHKEY.'
        : 'Alert added successfully.',
    }
    return sendJson(res, 200, { plan })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'notifications_plan_failed', providerStatus: 'local-alerts-only' })
  }
}
