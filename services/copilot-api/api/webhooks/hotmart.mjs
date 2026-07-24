import { sendWhatsApp } from '../../server/service/notification.mjs'

async function triggerWhatsAppAgent(customerName, customerPhone, eventType, productTitle) {
  console.log(`[Sales Engine] 🤖 Acionando Agente WhatsApp (AuthKey) para: ${customerName} (${customerPhone})`)
  
  let message = ''
  if (eventType === 'PURCHASE_APPROVED') {
    message = `Olá ${customerName}! Vi que garantiu o "${productTitle}". Excelente escolha! 🚀 Quer acelerar sua jornada com a plataforma Apex AI completa? Acesse seu painel agora mesmo!`
  } else if (eventType === 'BILLET_PRINTED' || eventType === 'PIX_GENERATED') {
    message = `Fala ${customerName}! Seu boleto/Pix do "${productTitle}" foi gerado, mas ainda não compensou. Bora concretizar esse passo na sua carreira? 🏗️ Qualquer dúvida, estou aqui.`
  } else if (eventType === 'PURCHASE_CANCELED' || eventType === 'PURCHASE_REFUNDED') {
    message = `Oi ${customerName}. Vi que houve um problema com a compra do "${productTitle}". Posso te ajudar a resolver o parcelamento ou limite do cartão? Temos outras opções na Apex.`
  } else if (eventType === 'ABANDONED_CART') {
    message = `Oi ${customerName}! Vi que você parou na página de pagamento do "${productTitle}". Faltou alguma coisa? Se precisar de ajuda, estou aqui!`
  }

  if (message) {
    const result = await sendWhatsApp(customerPhone, message)
    if (!result.ok) {
      console.warn(`[Sales Engine] ⚠️ Falha ao enviar WhatsApp via AuthKey para ${customerPhone}: ${result.reason}`)
    } else {
      console.log(`[Sales Engine] ✅ WhatsApp enviado com sucesso para ${customerPhone}`)
    }
  }
}

export default async function hotmartWebhook(req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const hottok = req.headers['x-hotmart-hottok'] || req.headers['hottok']
      const expectedToken = process.env.HOTMART_WEBHOOK_SECRET
      
      if (expectedToken && hottok !== expectedToken) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Token Inválido' }))
      }

      const payload = JSON.parse(body)
      console.log('\n=========================================')
      console.log('🔥 HOTMART WEBHOOK RECEBIDO 🔥')
      console.log(`Evento: ${payload.event}`)
      console.log('=========================================\n')

      const eventType = payload.event
      const buyer = payload.data?.buyer || {}
      const product = payload.data?.product || {}
      // Tratando DDI (código de país) e telefone
      const ddi = buyer.checkout_country?.dial_code || '55'
      const rawPhone = buyer.phone || buyer.checkout_phone
      const phone = rawPhone ? `${ddi}${rawPhone.replace(/\D/g, '')}` : null

      if (phone && buyer.name) {
        await triggerWhatsAppAgent(buyer.name, phone, eventType, product.name)
      } else {
        console.warn('[Sales Engine] ⚠️ Lead sem telefone ou nome.')
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true }))
    } catch (e) {
      console.error('[Hotmart Webhook Error]', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal Server Error' }))
    }
  })
}
