// WhatsApp notification endpoint via AUTHKEY
// POST /api/notify/whatsapp
// Body: { to: string, message: string, source?: string }
// Returns: { success, provider, messageId? }

const AUTHKEY = process.env.AUTHKEY_AUTHKEY || ''
const WHATSAPP_SID = process.env.AUTHKEY_WHATSAPP_SID || ''
const AUTHKEY_API = 'https://api.authkey.io/request'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function isConfigured() {
  return Boolean(AUTHKEY && WHATSAPP_SID)
}

async function sendWhatsApp({ to, message }) {
  const payload = {
    authkey: AUTHKEY,
    type: 'whatsapp',
    sid: WHATSAPP_SID,
    to: String(to).replace(/\D/g, ''),
    message: String(message),
  }

  const response = await fetch(AUTHKEY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok || data.type === 'error') {
    throw new Error(data.message || data.error || `AUTHKEY error ${response.status}`)
  }

  return { messageId: data.request_id || data.id || null, raw: data }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { to, message, source = 'apex-copilot' } = body

  if (!to || !message) {
    return sendJson(res, 400, {
      error: 'Missing required fields: to, message',
      providerStatus: 'error',
    })
  }

  if (!isConfigured()) {
    // Graceful degradation — log and return local response
    console.warn('[notify/whatsapp] AUTHKEY not configured — local mode')
    return sendJson(res, 200, {
      success: false,
      provider: 'authkey-not-configured',
      message: 'WhatsApp not configured. Set AUTHKEY_AUTHKEY and AUTHKEY_WHATSAPP_SID.',
      source,
    })
  }

  try {
    const result = await sendWhatsApp({ to, message })
    console.log(`[notify/whatsapp] Sent to ${to} from ${source}`, result.messageId)
    return sendJson(res, 200, {
      success: true,
      provider: 'authkey',
      messageId: result.messageId,
      source,
    })
  } catch (err) {
    console.error('[notify/whatsapp] Error:', err.message)
    return sendJson(res, 500, {
      success: false,
      provider: 'authkey',
      error: err.message,
      source,
    })
  }
}
