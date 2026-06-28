import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method Not Allowed')
    return
  }

  // Hotmart sends an event like "PURCHASE_APPROVED" or "CART_ABANDONED"
  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  await new Promise(resolve => req.on('end', resolve))

  // Acknowledge quickly to avoid Hotmart retrying
  res.writeHead(200)
  res.end('OK')

  let payload
  try {
    payload = JSON.parse(body)
  } catch (e) {
    return
  }

  // Example Hotmart Webhook Payload format
  const event = payload.event
  const buyerEmail = payload.data?.buyer?.email
  const buyerName = payload.data?.buyer?.name
  const buyerPhone = payload.data?.buyer?.phone // E.g., "5511999999999"

  if (!event || !buyerPhone) return

  // Depending on event, we trigger a task for the Agent to process
  let promptContext = ''

  if (event === 'PURCHASE_APPROVED') {
    promptContext = `O aluno ${buyerName} acabou de comprar o curso PSAA. Mande uma mensagem de boas-vindas épica no WhatsApp perguntando quais são os maiores desafios dele com as Normas Americanas.`
  } else if (event === 'CART_ABANDONED') {
    promptContext = `O lead ${buyerName} abandonou o carrinho do curso PSAA. Mande uma mensagem amigável no WhatsApp perguntando se ocorreu algum problema com o pagamento e ofereça tirar dúvidas.`
  } else {
    // Ignore other events for now
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) return

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Register Proactive Task for WhatsApp
    const { data: taskData, error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: 'HOTMART_SYSTEM', // System user identifier or lead
        channel_type: 'whatsapp',
        channel_id: buyerPhone,
        raw_message: promptContext,
        status: 'processing'
      })
      .select()
      .single()

    if (taskError) {
      console.error('[Hotmart Webhook] Error creating task:', taskError)
      return
    }

    // Call the brain to process this proactive message
    setTimeout(async () => {
      const { processTask } = await import('../../server/agent/brain.mjs')
      await processTask(taskData.id)
    }, 100)

  } catch (error) {
    console.error('[Hotmart Webhook] Error:', error)
  }
}
