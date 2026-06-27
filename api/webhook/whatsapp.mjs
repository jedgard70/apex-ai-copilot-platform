import { createClient } from '@supabase/supabase-js'

async function sendWhatsAppMessage(toPhoneId, toPhoneNumber, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) return

  // toPhoneId is the Phone Number ID provided by Meta
  const url = `https://graph.facebook.com/v19.0/${toPhoneId}/messages`
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhoneNumber,
      text: { body: text }
    })
  })
}

export default async function handler(req, res) {
  // 1. WhatsApp Webhook Verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

    if (mode === 'subscribe' && token === verifyToken) {
      res.writeHead(200)
      res.end(challenge)
      return
    }
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  // 2. WhatsApp Message Receiving (POST)
  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  await new Promise(resolve => req.on('end', resolve))

  // Acknowledge immediately to prevent retries
  res.writeHead(200)
  res.end('EVENT_RECEIVED')

  let payload
  try {
    payload = JSON.parse(body)
  } catch (e) {
    return
  }

  // Verify structure (Meta sends batch format)
  if (payload.object !== 'whatsapp_business_account') return
  
  const entry = payload.entry?.[0]
  const changes = entry?.changes?.[0]
  const value = changes?.value
  const messages = value?.messages

  // If no message in payload, exit early
  if (!messages || messages.length === 0) return

  const message = messages[0]
  const fromPhoneNumber = message.from // User's phone number
  const text = message.text?.body
  const toPhoneId = value.metadata.phone_number_id

  if (!text) return

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Apex Agent] Supabase credentials missing.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Find user by whatsapp channel id
    const { data: channelData, error: channelError } = await supabase
      .from('user_channels')
      .select('user_id')
      .eq('channel_type', 'whatsapp')
      .eq('channel_id', fromPhoneNumber)
      .single()

    if (channelError || !channelData) {
      await sendWhatsAppMessage(toPhoneId, fromPhoneNumber, "Este número não está vinculado à plataforma Apex AI. Informe ao admin o seu número: " + fromPhoneNumber)
      return
    }

    const userId = channelData.user_id

    // Register Task
    const { data: taskData, error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        channel_type: 'whatsapp',
        channel_id: fromPhoneNumber,
        raw_message: text,
        status: 'processing'
      })
      .select()
      .single()

    if (taskError) {
      console.error('[Apex Agent] Error creating task:', taskError)
      return
    }

    // Process Task in background
    setTimeout(async () => {
      const replyText = `[Apex Agent]: Processando sua instrução via WhatsApp...\n\nSua mensagem: "${text}"`
      
      await supabase.from('agent_tasks').update({ 
        status: 'completed',
        response_text: replyText,
        completed_at: new Date().toISOString()
      }).eq('id', taskData.id)

      await sendWhatsAppMessage(toPhoneId, fromPhoneNumber, replyText)
    }, 1000)

  } catch (error) {
    console.error('[Apex Agent] WhatsApp Background error:', error)
  }
}
