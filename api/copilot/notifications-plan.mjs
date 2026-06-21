const AUTHKEY = process.env.AUTHKEY_AUTHKEY || ''
const WHATSAPP_SID = process.env.AUTHKEY_WHATSAPP_SID || ''

function sendJson(res, status, body) {
  res.status(status).json(body)
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

function createNotificationsPlan(goal = '') {
  const lower = String(goal || '').toLowerCase()
  const type = /pagamento|fatura|payment|invoice|cobran/.test(lower)
    ? 'Payment overdue'
    : /fornecedor|supplier|material|entrega/.test(lower)
      ? 'Supplier delay'
      : /seguran|safety|nr-/.test(lower)
        ? 'Safety risk'
        : /custo|cost|budget|or[cç]amento/.test(lower)
          ? 'Cost deviation'
          : /cliente|follow/.test(lower)
            ? 'Client follow-up'
            : 'Deadline'
  const severity = /cr[ií]tico|critical|urgente|alto risco/.test(lower) ? 'Critical' : 'High'
  const alert = {
    id: `alert-${Date.now()}`,
    type,
    title: goal || 'Apex local alert',
    description: goal || 'Local reminder created from chat intent.',
    severity,
    dueDate: '',
    assignedTo: 'Owner/Admin',
    status: 'Open',
    sourceModule: 'Apex Copilot',
    evidence: 'USER_ENTERED',
  }
  const followUp = {
    id: `alert-followup-${Date.now()}`,
    type: 'Client follow-up',
    title: 'Follow up with client',
    description: 'Suggested local follow-up. No email/SMS/push connector is connected.',
    severity: 'Medium',
    dueDate: '',
    assignedTo: 'Sales / Owner',
    status: 'Open',
    sourceModule: 'CRM',
    evidence: 'SYSTEM_SUGGESTED',
  }
  return {
    providerStatus: (AUTHKEY && WHATSAPP_SID) ? 'authkey-whatsapp' : 'local-alerts-only',
    alerts: [alert],
    suggestedAlerts: [alert, followUp],
    message: (AUTHKEY && WHATSAPP_SID)
      ? 'WhatsApp alerts enabled via AUTHKEY.'
      : 'Local alert only — notification connector not connected yet.',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'local-alerts-only' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const plan = createNotificationsPlan(String(body.goal || ''))
    // Fire-and-forget WhatsApp alert if recipient phone provided
    if (body.phone && plan.alerts[0]) {
      sendWhatsAppAlert(body.phone, `[Apex Alert] ${plan.alerts[0].type}: ${plan.alerts[0].title}`)
        .then(id => id && console.log('[notifications-plan] WA sent:', id))
        .catch(() => {})
    }
    return sendJson(res, 200, { plan })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'notifications_plan_failed', providerStatus: 'local-alerts-only' })
  }
}
