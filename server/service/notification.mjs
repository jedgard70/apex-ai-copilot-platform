/**
 * server/service/notification.mjs
 *
 * Notification service — WhatsApp, SMS, email.
 * Usa AuthKey connector para WhatsApp e SMS.
 * Chamado automaticamente pós-pagamento, pós-approvação e em alertas.
 */

import { sendAuthkeySms, getAuthkeyConnectorStatus } from '../agent/authkeyConnector.mjs'

// ─── Config ──────────────────────────────────────────────────────────────────

function isWhatsappConfigured() {
  return Boolean(
    process.env.AUTHKEY_AUTHKEY &&
    process.env.AUTHKEY_WHATSAPP_SID
  )
}

function isSmsConfigured() {
  return Boolean(
    process.env.AUTHKEY_AUTHKEY &&
    process.env.AUTHKEY_SMS_SENDER
  )
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Send WhatsApp message via AuthKey.
 * @param {string} mobile - Phone number with country code (e.g. 5511999999999)
 * @param {string} message - Message text
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function sendWhatsApp(mobile, message) {
  if (!isWhatsappConfigured()) {
    return { ok: false, reason: 'WhatsApp não configurado. Configure AUTHKEY_AUTHKEY e AUTHKEY_WHATSAPP_SID.' }
  }
  const phone = String(mobile).replace(/[^0-9]/g, '')
  if (!phone) return { ok: false, reason: 'Número de telefone inválido.' }
  if (!message?.trim()) return { ok: false, reason: 'Mensagem vazia.' }

  try {
    const authkey = String(process.env.AUTHKEY_AUTHKEY || '').trim()
    const sid = String(process.env.AUTHKEY_WHATSAPP_SID || '').trim()
    const countryCode = String(process.env.AUTHKEY_DEFAULT_COUNTRY_CODE || '55').trim()

    const url = new URL('https://console.authkey.io/restapi/request.php')
    url.searchParams.set('authkey', authkey)
    url.searchParams.set('mobile', phone)
    url.searchParams.set('sid', sid)
    url.searchParams.set('country_code', countryCode)
    url.searchParams.set('sms', message.slice(0, 4096))

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
    })
    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { data = text }

    return {
      ok: response.ok,
      status: response.status,
      data,
      type: 'whatsapp',
      secretsExposed: false,
    }
  } catch (err) {
    return { ok: false, reason: `WhatsApp error: ${err.message}`, type: 'whatsapp', secretsExposed: false }
  }
}

// ─── SMS ──────────────────────────────────────────────────────────────────────

/**
 * Send SMS via AuthKey.
 */
export async function sendSmsNotification(mobile, message) {
  const result = await sendAuthkeySms({
    mobile: String(mobile).replace(/[^0-9]/g, ''),
    message: message?.slice(0, 1000),
  })
  return { ...result, type: 'sms' }
}

// ─── Notificação automática pós-pagamento ────────────────────────────────────

/**
 * Notify client after payment is confirmed.
 * @param {Object} order - Service order object
 * @param {string} clientPhone - Client phone number
 */
export async function notifyPaymentConfirmation(order, clientPhone) {
  if (!clientPhone && !order?.clientEmail) {
    return { ok: false, reason: 'Nenhum contato do cliente disponível.' }
  }

  const message = [
    `✅ *Apex AI* — Pagamento confirmado!`,
    ``,
    `Pedido: ${order?.number || 'N/A'}`,
    `Serviço: ${order?.serviceName || 'N/A'}`,
    `Valor: ${order?.currency || 'USD'} ${Number(order?.amount || 0).toFixed(2)}`,
    `Status: Pago`,
    ``,
    `O serviço será iniciado em breve.`,
    `Acompanhe pelo dashboard: https://www.apexglobalai.com`,
  ].join('\n')

  if (clientPhone) {
    // Try WhatsApp first, fallback to SMS
    const wa = await sendWhatsApp(clientPhone, message)
    if (wa.ok) return { ...wa, channel: 'whatsapp' }
    const sms = await sendSmsNotification(clientPhone, message)
    return { ...sms, channel: 'sms' }
  }

  return { ok: false, reason: 'WhatsApp e SMS não disponíveis.' }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export function getNotificationConnectorStatus() {
  const authkey = getAuthkeyConnectorStatus()
  return {
    id: 'notifications',
    label: 'Notificações (WhatsApp/SMS)',
    status: authkey.configured ? 'configured' : 'missing_configuration',
    whatsappConfigured: isWhatsappConfigured(),
    smsConfigured: isSmsConfigured(),
    detail: authkey.configured
      ? `Authkey configurado. WhatsApp: ${isWhatsappConfigured() ? '✅' : '❌'} | SMS: ${isSmsConfigured() ? '✅' : '❌'}`
      : 'Configure AUTHKEY_AUTHKEY para ativar notificações.',
    secretsExposed: false,
  }
}
