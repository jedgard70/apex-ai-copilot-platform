/**
 * api/webhooks/whatsapp-bot.mjs
 *
 * Webhook do WhatsApp → Apex AI Bot
 *
 * FLUXO:
 *   1. AuthKey (ou Evolution API) recebe mensagem do WhatsApp
 *   2. Faz POST neste endpoint com o número e texto
 *   3. Este endpoint chama o chat da Apex AI
 *   4. Responde ao usuário via WhatsApp automaticamente
 *
 * CONFIGURAR na AuthKey/Evolution como webhook URL:
 *   https://www.apexglobalai.com/api/webhooks/whatsapp-bot
 *
 * ENV VARS necessárias (já devem existir no .env.local):
 *   AUTHKEY_AUTHKEY       — chave da AuthKey
 *   AUTHKEY_WHATSAPP_SID  — SID do template WhatsApp
 *   GEMINI_API_KEY        — para o chat funcionar
 *
 * SEGURANÇA: WHATSAPP_BOT_SECRET — token opcional para validar origem
 */

const AUTHKEY = process.env.AUTHKEY_AUTHKEY || ''
const WHATSAPP_SID = process.env.AUTHKEY_WHATSAPP_SID || ''
const BOT_SECRET = process.env.WHATSAPP_BOT_SECRET || ''
const CHAT_API_BASE = process.env.APEX_SELF_URL || 'https://www.apexglobalai.com'
const COUNTRY_CODE = process.env.AUTHKEY_DEFAULT_COUNTRY_CODE || '55'

// Evita responder à mesma mensagem duas vezes (deduplicação simples em memória)
const processedMessages = new Set()
const MAX_DEDUP_SIZE = 500

function sendJson(res, status, body) {
    if (res && typeof res.status === 'function') {
        res.status(status).json(body)
    }
}

/** Normaliza número de telefone para formato internacional */
function normalizePhone(phone) {
    return String(phone || '').replace(/[^0-9]/g, '')
}

/** Extrai mensagem e remetente de diferentes formatos de webhook (AuthKey / Evolution / Z-API) */
function parseIncomingWebhook(body) {
    // Formato AuthKey
    if (body.mobile && body.message) {
        return { phone: normalizePhone(body.mobile), text: body.message, msgId: body.msg_id || body.id }
    }
    // Formato Evolution API / Baileys
    if (body.data?.message?.conversation) {
        const key = body.data?.key || {}
        return {
            phone: normalizePhone(key.remoteJid?.replace('@s.whatsapp.net', '')),
            text: body.data.message.conversation,
            msgId: key.id,
        }
    }
    // Formato Z-API
    if (body.phone && (body.text?.message || body.body)) {
        return { phone: normalizePhone(body.phone), text: body.text?.message || body.body, msgId: body.messageId }
    }
    // Formato genérico
    if (body.from && body.content) {
        return { phone: normalizePhone(body.from), text: body.content, msgId: body.id }
    }
    return null
}

/** Envia resposta via AuthKey WhatsApp */
async function sendWhatsAppReply(phone, message) {
    if (!AUTHKEY || !WHATSAPP_SID) {
        console.warn('[whatsapp-bot] AuthKey não configurado — mensagem não enviada')
        return { ok: false, reason: 'AuthKey não configurado' }
    }
    try {
        const url = new URL('https://console.authkey.io/restapi/request.php')
        url.searchParams.set('authkey', AUTHKEY)
        url.searchParams.set('mobile', phone)
        url.searchParams.set('sid', WHATSAPP_SID)
        url.searchParams.set('country_code', COUNTRY_CODE)
        url.searchParams.set('sms', message.slice(0, 1000)) // WhatsApp aceita até 4096, mas resposta curta é melhor

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
        const data = await res.json().catch(() => ({}))
        console.log('[whatsapp-bot] Reply sent:', phone, data)
        return { ok: true, data }
    } catch (err) {
        console.error('[whatsapp-bot] Failed to send reply:', err?.message)
        return { ok: false, reason: err?.message }
    }
}

/** Chama a Apex AI como se fosse o chat do site */
async function askApexAI(userMessage, phone) {
    try {
        const chatUrl = `${CHAT_API_BASE}/api/copilot/chat`
        const payload = {
            message: userMessage,
            model: 'gemini|gemini-2.5-flash',
            locale: 'pt-BR',
            // Injeta contexto do WhatsApp no sistema
            messages: [
                {
                    role: 'system',
                    text: `Você está respondendo via WhatsApp ao número ${phone}. Seja direto, objetivo e use linguagem natural. Respostas curtas (máximo 2 parágrafos). Não use Markdown complexo — o WhatsApp não renderiza.`,
                },
            ],
        }
        const res = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(25000),
        })
        if (!res.ok) {
            const err = await res.text().catch(() => '')
            return `Erro interno (${res.status}). Tente novamente em alguns instantes.`
        }
        const data = await res.json()
        return data.finalReply || data.reply || 'Não consegui gerar uma resposta agora. Tente novamente.'
    } catch (err) {
        console.error('[whatsapp-bot] askApexAI error:', err?.message)
        return 'A Apex AI está temporariamente indisponível. Por favor, tente novamente em alguns segundos.'
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    if (req.method === 'OPTIONS') return res.status(200).end()

    // GET — ping de verificação de webhook (alguns provedores fazem GET para validar)
    if (req.method === 'GET') {
        const challenge = req.query?.hub_challenge || req.query?.challenge || 'ok'
        return res.status(200).send(String(challenge))
    }

    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' })
    }

    // Validação de segurança (opcional — se BOT_SECRET estiver configurado)
    if (BOT_SECRET) {
        const receivedSecret = req.headers['x-webhook-secret'] || req.headers['x-bot-secret'] || req.query?.secret || ''
        if (receivedSecret !== BOT_SECRET) {
            console.warn('[whatsapp-bot] Unauthorized webhook call — secret mismatch')
            return sendJson(res, 401, { error: 'Unauthorized' })
        }
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const parsed = parseIncomingWebhook(body)

    if (!parsed || !parsed.phone || !parsed.text) {
        // Retorna 200 para não causar retry loops nos provedores
        console.log('[whatsapp-bot] Evento ignorado (sem mensagem válida):', JSON.stringify(body).slice(0, 200))
        return sendJson(res, 200, { ok: true, note: 'ignored' })
    }

    const { phone, text, msgId } = parsed

    // Deduplicação por msgId
    if (msgId) {
        if (processedMessages.has(msgId)) {
            return sendJson(res, 200, { ok: true, note: 'duplicate' })
        }
        processedMessages.add(msgId)
        if (processedMessages.size > MAX_DEDUP_SIZE) {
            const first = processedMessages.values().next().value
            processedMessages.delete(first)
        }
    }

    console.log(`[whatsapp-bot] Mensagem de ${phone}: ${text.slice(0, 100)}`)

    // Responde 200 imediatamente para o webhook não dar timeout
    // O processamento continua em background
    res.status(200).json({ ok: true, status: 'processing' })

    // Processa assincronamente
    try {
        const aiReply = await askApexAI(text, phone)
        await sendWhatsAppReply(phone, aiReply)
        console.log(`[whatsapp-bot] Respondido para ${phone}`)
    } catch (err) {
        console.error('[whatsapp-bot] Processing error:', err?.message)
    }
}
