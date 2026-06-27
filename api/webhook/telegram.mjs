import { createClient } from '@supabase/supabase-js'

// Simple helper to send message back to telegram
async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}

export default async function handler(req, res) {
  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  await new Promise(resolve => req.on('end', resolve))

  let payload
  try {
    payload = JSON.parse(body)
  } catch (e) {
    res.writeHead(400)
    res.end('Invalid JSON')
    return
  }

  // Acknowledge Telegram immediately to prevent retries
  res.writeHead(200)
  res.end('OK')

  const message = payload.message
  if (!message || !message.text) return

  const chatId = message.chat.id.toString()
  const text = message.text

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Apex Agent] Supabase credentials missing.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Find user by telegram channel id
    const { data: channelData, error: channelError } = await supabase
      .from('user_channels')
      .select('user_id')
      .eq('channel_type', 'telegram')
      .eq('channel_id', chatId)
      .single()

    if (channelError || !channelData) {
      // User not linked
      await sendTelegramMessage(chatId, "Seu Telegram não está vinculado à plataforma Apex AI. Informe este ID de canal ao admin: " + chatId)
      return
    }

    const userId = channelData.user_id

    // 2. Register Task
    const { data: taskData, error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        channel_type: 'telegram',
        channel_id: chatId,
        raw_message: text,
        status: 'processing'
      })
      .select()
      .single()

    if (taskError) {
      console.error('[Apex Agent] Error creating task:', taskError)
      return
    }

    // 3. Process Task in background (Simulating Apex Agent / Copilot AI)
    // Here we could call our internal chat endpoint or Gemini directly.
    // For the initial PoC, we will just echo back via Telegram and update task.
    
    // TODO: In the next iteration, we will plug this into our actual api/copilot/chat.mjs
    // logic so the agent has access to all the tools.
    
    setTimeout(async () => {
      const replyText = `[Apex Agent]: Recebi sua instrução e estou processando em background...\n\nSua mensagem: "${text}"`
      
      // Update task to completed
      await supabase.from('agent_tasks').update({ 
        status: 'completed',
        response_text: replyText,
        completed_at: new Date().toISOString()
      }).eq('id', taskData.id)

      // Send to Telegram
      await sendTelegramMessage(chatId, replyText)
      
    }, 1000)

  } catch (error) {
    console.error('[Apex Agent] Background error:', error)
  }
}
