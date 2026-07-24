/**
 * server/service/notificationsService.mjs
 *
 * Notifications Service — envio de notificacoes via AuthKey (SMS/WhatsApp).
 */

/**
 * Cria plano de notificacao com envio opcional.
 * @param {string} goal
 * @param {string} phone
 * @param {string} message
 * @returns {Promise<Object>}
 */
export async function createNotificationsPlan(goal = '', phone = '', message = '') {
  const lower = goal.toLowerCase()
  const type = /pagamento|fatura|payment|invoice|cobran/.test(lower)
    ? 'Payment overdue'
    : /fornecedor|supplier|material|entrega/.test(lower)
      ? 'Supplier delay'
      : /seguran|safety|nr-/.test(lower)
        ? 'Safety risk'
        : /custo|cost|budget|orçamento/.test(lower)
          ? 'Cost deviation'
          : /cliente|follow/.test(lower)
            ? 'Client follow-up'
            : 'Deadline'
  const severity = /crítico|critical|urgente|alto risco/.test(lower) ? 'Critical' : 'High'

  const alert = {
    id: `alert-${Date.now()}`,
    type,
    title: goal || 'Apex alert',
    description: goal || 'Alert created from chat intent.',
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
    description: 'Suggested follow-up from notification plan.',
    severity: 'Medium',
    dueDate: '',
    assignedTo: 'Sales / Owner',
    status: 'Open',
    sourceModule: 'CRM',
    evidence: 'SYSTEM_SUGGESTED',
  }

  const deliveryResults = []
  const authKey = process.env.AUTHKEY_AUTHKEY
  const smsSender = process.env.AUTHKEY_SMS_SENDER
  const whatsappSid = process.env.AUTHKEY_WHATSAPP_SID

  if (phone && message && authKey) {
    // SMS
    try {
      const smsPayload = new URLSearchParams({ key: authKey, sender: smsSender || 'APEX', to: phone, message })
      const smsRes = await fetch('https://api.authkey.io/request', { method: 'POST', body: smsPayload })
      const smsData = await smsRes.text()
      deliveryResults.push({ channel: 'sms', to: phone, status: smsRes.ok ? 'sent' : 'failed', response: smsData.slice(0, 200) })
    } catch (smsErr) {
      deliveryResults.push({ channel: 'sms', to: phone, status: 'error', response: smsErr.message })
    }

    // WhatsApp
    if (whatsappSid) {
      try {
        const waPayload = new URLSearchParams({ key: authKey, sid: whatsappSid, to: phone, message })
        const waRes = await fetch('https://api.authkey.io/whatsapp/send', { method: 'POST', body: waPayload })
        const waData = await waRes.text()
        deliveryResults.push({ channel: 'whatsapp', to: phone, status: waRes.ok ? 'sent' : 'failed', response: waData.slice(0, 200) })
      } catch (waErr) {
        deliveryResults.push({ channel: 'whatsapp', to: phone, status: 'error', response: waErr.message })
      }
    }
  }

  return {
    providerStatus: 'connected',
    alerts: [alert],
    suggestedAlerts: [alert, followUp],
    deliveryResults,
    message: deliveryResults.length
      ? `Notification sent via ${deliveryResults.map(r => r.channel).join(' and ')}.`
      : 'Alert created locally. Provide phone + message to send via AuthKey.',
  }
}
