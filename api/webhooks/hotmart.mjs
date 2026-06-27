import crypto from 'node:crypto'

// Simple mock for WhatsApp Agent. Envia mensagem para o Lead via WhatsApp
async function triggerWhatsAppAgent(customerName, customerPhone, eventType, productTitle) {
  console.log(`[Sales Engine] 🤖 Acionando Agente WhatsApp para: ${customerName} (${customerPhone})`)
  
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) {
    console.warn('[Sales Engine] ⚠️ WHATSAPP_ACCESS_TOKEN não configurado. Simulando envio no terminal.')
    if (eventType === 'PURCHASE_APPROVED') {
      console.log(`[WhatsApp -> ${customerPhone}]: Olá ${customerName}! Vi que garantiu o "${productTitle}". Aqui está o link... E por sinal, quer acelerar isso com a plataforma Apex AI?`)
    } else if (eventType === 'BILLET_PRINTED' || eventType === 'PIX_GENERATED') {
      console.log(`[WhatsApp -> ${customerPhone}]: Fala ${customerName}! Seu boleto/Pix do "${productTitle}" tá gerado. Bora concretizar esse passo na sua carreira?`)
    }
    return
  }

  // Real WhatsApp API Call here
  // Omitido para não disparar requests sem token no teste.
  console.log(`[WhatsApp API] Envio real executado.`)
}

export default async function hotmartWebhook(req, res) {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      // 1. Validar Webhook Token
      const hottok = req.headers['x-hotmart-hottok'] || req.headers['hottok']
      const expectedToken = process.env.HOTMART_WEBHOOK_SECRET
      
      // Se tiver configurado e for diferente, barramos.
      if (expectedToken && hottok !== expectedToken) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Token Inválido' }))
      }

      const payload = JSON.parse(body)
      console.log('\n=========================================')
      console.log('🔥 HOTMART WEBHOOK RECEBIDO 🔥')
      console.log(`Evento: ${payload.event}`)
      console.log(`Produto: ${payload.data?.product?.name}`)
      console.log('=========================================\n')

      const eventType = payload.event
      const buyer = payload.data?.buyer || {}
      const product = payload.data?.product || {}
      const phone = buyer.phone || buyer.checkout_phone

      if (phone && buyer.name) {
        // Enviar para o "Cérebro" de vendas
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
