const AUTHKEY_GET_URL = 'https://api.authkey.io/request'
const AUTHKEY_2FA_URL = 'https://console.authkey.io/restapi/request.php'
const AUTHKEY_VERIFY_URL = 'https://console.authkey.io/api/2fa_verify.php'
const AUTHKEY_TIMEOUT_MS = 30000

function env(name) {
  return String(process.env[name] || '').trim()
}

function configured() {
  return Boolean(env('AUTHKEY_AUTHKEY'))
}

function normalizeMobile(value = '') {
  return String(value || '').replace(/[^0-9]/g, '')
}

function requiredConfigForSms() {
  const missing = []
  if (!env('AUTHKEY_AUTHKEY')) missing.push('AUTHKEY_AUTHKEY')
  if (!env('AUTHKEY_SMS_SENDER')) missing.push('AUTHKEY_SMS_SENDER')
  return missing
}

function authkeyUrl(params = {}) {
  const url = new URL(AUTHKEY_GET_URL)
  url.searchParams.set('authkey', env('AUTHKEY_AUTHKEY'))
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function fetchAuthkey(params) {
  if (!globalThis.fetch) return { ok: false, reason: 'fetch não disponível no ambiente.', secretsExposed: false }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AUTHKEY_TIMEOUT_MS)
  try {
    const response = await fetch(authkeyUrl(params), { method: 'GET', signal: controller.signal })
    const text = await response.text().catch(() => '')
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
      reason: response.ok ? '' : `Authkey HTTP ${response.status}`,
      secretsExposed: false,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      reason: err?.name === 'AbortError' ? 'Timeout ao chamar Authkey.' : `Authkey: ${err?.message || err}`,
      secretsExposed: false,
    }
  } finally {
    clearTimeout(timer)
  }
}

export function getAuthkeyConnectorStatus() {
  const hasKey = configured()
  const hasSmsSender = Boolean(env('AUTHKEY_SMS_SENDER'))
  const hasOtpSid = Boolean(env('AUTHKEY_OTP_SID'))
  return {
    id: 'authkey',
    label: 'Authkey communication connector',
    status: hasKey ? 'configured' : 'missing_configuration',
    configured: hasKey,
    smsConfigured: hasKey && hasSmsSender,
    otpConfigured: hasKey && hasOtpSid,
    whatsappConfigured: hasKey && Boolean(env('AUTHKEY_WHATSAPP_SID')),
    detail: hasKey
      ? 'Authkey conectado para SMS/OTP via API. WhatsApp depende de template/SID aprovado no painel.'
      : 'Configure AUTHKEY_AUTHKEY para ativar SMS/OTP/WhatsApp via Authkey.',
    secretsExposed: false,
  }
}

export async function sendAuthkeySms({ mobile, message, countryCode, sender, peId, templateId, unicode = false } = {}) {
  const missing = requiredConfigForSms()
  if (missing.length) {
    return { ok: false, reason: `Configuração Authkey ausente: ${missing.join(', ')}`, requiresConfig: true, secretsExposed: false }
  }

  const phone = normalizeMobile(mobile)
  const body = String(message || '').trim()
  if (!phone) return { ok: false, reason: 'Telefone/mobile obrigatório.', secretsExposed: false }
  if (!body) return { ok: false, reason: 'Mensagem SMS obrigatória.', secretsExposed: false }

  return await fetchAuthkey({
    mobile: phone,
    country_code: countryCode || env('AUTHKEY_DEFAULT_COUNTRY_CODE') || '55',
    sms: body.slice(0, 1000),
    sender: sender || env('AUTHKEY_SMS_SENDER'),
    pe_id: peId || env('AUTHKEY_SMS_PE_ID'),
    template_id: templateId || env('AUTHKEY_SMS_TEMPLATE_ID'),
    is_unicode: unicode ? '1' : '',
  })
}

export async function sendAuthkeyOtp({ mobile, countryCode, sid, channel = 'SMS', values = {} } = {}) {
  if (!configured()) {
    return { ok: false, reason: 'Configuração Authkey ausente: AUTHKEY_AUTHKEY', requiresConfig: true, secretsExposed: false }
  }

  const phone = normalizeMobile(mobile)
  const templateSid = String(sid || env('AUTHKEY_OTP_SID') || '').trim()
  if (!phone) return { ok: false, reason: 'Telefone/mobile obrigatório.', secretsExposed: false }
  if (!templateSid) return { ok: false, reason: 'AUTHKEY_OTP_SID ou sid obrigatório para OTP.', requiresConfig: true, secretsExposed: false }

  return await fetchAuthkey({
    mobile: phone,
    country_code: countryCode || env('AUTHKEY_DEFAULT_COUNTRY_CODE') || '55',
    sid: templateSid,
    channel: String(channel || 'SMS').toUpperCase(),
    ...Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [key, String(value || '').slice(0, 120)])),
  })
}

export async function sendAuthkey2faOtp({ mobile, countryCode, sid } = {}) {
  if (!configured()) {
    return { ok: false, reason: 'Configuração Authkey ausente: AUTHKEY_AUTHKEY', requiresConfig: true, secretsExposed: false }
  }

  const phone = normalizeMobile(mobile)
  const templateSid = String(sid || env('AUTHKEY_OTP_SID') || '').trim()
  if (!phone) return { ok: false, reason: 'Telefone/mobile obrigatório.', secretsExposed: false }
  if (!templateSid) return { ok: false, reason: 'AUTHKEY_OTP_SID ou sid obrigatório para 2FA OTP.', requiresConfig: true, secretsExposed: false }

  const url = new URL(AUTHKEY_2FA_URL)
  url.searchParams.set('authkey', env('AUTHKEY_AUTHKEY'))
  url.searchParams.set('mobile', phone)
  url.searchParams.set('country_code', countryCode || env('AUTHKEY_DEFAULT_COUNTRY_CODE') || '55')
  url.searchParams.set('sid', templateSid)

  const result = await fetchAuthkeyFromUrl(url.toString())
  return result
}

export async function verifyAuthkeyOtp({ otp, logid, channel = 'SMS' } = {}) {
  if (!configured()) {
    return { ok: false, reason: 'Configuração Authkey ausente: AUTHKEY_AUTHKEY', requiresConfig: true, secretsExposed: false }
  }

  const otpValue = String(otp || '').trim()
  const logIdValue = String(logid || '').trim()
  if (!otpValue) return { ok: false, reason: 'OTP obrigatório.', secretsExposed: false }
  if (!logIdValue) return { ok: false, reason: 'logid obrigatório (retornado ao enviar OTP).', secretsExposed: false }

  const url = new URL(AUTHKEY_VERIFY_URL)
  url.searchParams.set('authkey', env('AUTHKEY_AUTHKEY'))
  url.searchParams.set('channel', String(channel || 'SMS').toUpperCase())
  url.searchParams.set('otp', otpValue)
  url.searchParams.set('logid', logIdValue)

  const result = await fetchAuthkeyFromUrl(url.toString())
  if (result.ok && result.data) {
    const valid = result.data?.status === true || String(result.data?.message || '').toLowerCase() === 'valid otp'
    return {
      ...result,
      verified: valid,
      reason: valid ? 'OTP válido.' : 'OTP inválido ou expirado.',
    }
  }
  return { ...result, verified: false }
}

async function fetchAuthkeyFromUrl(urlString) {
  if (!globalThis.fetch) return { ok: false, reason: 'fetch não disponível no ambiente.', secretsExposed: false }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AUTHKEY_TIMEOUT_MS)
  try {
    const response = await fetch(urlString, { method: 'GET', signal: controller.signal })
    const text = await response.text().catch(() => '')
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
      reason: response.ok ? '' : `Authkey HTTP ${response.status}`,
      secretsExposed: false,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      reason: err?.name === 'AbortError' ? 'Timeout ao chamar Authkey.' : `Authkey: ${err?.message || err}`,
      secretsExposed: false,
    }
  } finally {
    clearTimeout(timer)
  }
}

export function buildAuthkeyResultReply(result, action = 'mensagem') {
  if (!result.ok) {
    return [
      `Não foi possível enviar ${action} via Authkey: ${result.reason || 'falha desconhecida'}.`,
      result.requiresConfig ? 'Configure as variáveis Authkey no backend/Vercel e no pacote desktop.' : '',
    ].filter(Boolean).join('\n')
  }

  return [
    `Envio Authkey concluído para ${action}.`,
    `Status HTTP: ${result.status}.`,
    'Nenhum segredo foi exposto.',
  ].join('\n')
}
