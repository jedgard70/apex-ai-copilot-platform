import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createGoogleGenAI } from '@ai-sdk/google'
import { getProjectStatus } from './tools/projectStatus.mjs'
import { executeServerCommand } from './tools/serverCommand.mjs'
import { readRecentEmails, sendEmail } from './tools/email.mjs'
import { getUpcomingEvents, scheduleMeeting } from './tools/calendar.mjs'

// Simple HTTP client for WhatsApp
async function sendWhatsAppMessage(toPhoneId, toPhoneNumber, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) return
  await fetch(`https://graph.facebook.com/v19.0/${toPhoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhoneNumber, text: { body: text } })
  })
}

// Simple HTTP client for Telegram
async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}

export async function processTask(taskId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Retrieve task
  const { data: task, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    console.error('[Apex Agent Brain] Task not found:', taskId)
    return
  }

  // Setup Gemini SDK
  const google = createGoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const systemPrompt = `Você é o Apex Agent, um assistente corporativo de IA da plataforma Apex AI.
Sua missão é responder perguntas curtas e diretas via WhatsApp e Telegram do seu Owner (Dr. Edgard) e outros usuários autorizados.
Seja objetivo, use bullet points e evite jargões excessivos.`

  try {
    const response = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: task.raw_message,
      tools: {
        get_project_status: {
          description: 'Obtém o status de um projeto ou obra (ex: H44, CP15X)',
          parameters: {
            type: 'object',
            properties: {
              projectName: { type: 'string', description: 'Nome do projeto (ex: CP15X)' }
            },
            required: ['projectName']
          },
          execute: async ({ projectName }) => {
            return await getProjectStatus(projectName)
          }
        },
        execute_server_command: {
          description: 'Executa comandos locais no servidor (ex: npm run dev:full, build)',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'O comando a ser executado' }
            },
            required: ['command']
          },
          execute: async ({ command }) => {
            return await executeServerCommand(command)
          }
        },
        read_recent_emails: {
          description: 'Lê os últimos 5 e-mails não lidos da caixa de entrada do Gmail do usuário',
          parameters: { type: 'object', properties: {} },
          execute: async () => {
            return await readRecentEmails()
          }
        },
        send_email: {
          description: 'Envia um e-mail a partir do Gmail do usuário',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Endereço de destino' },
              subject: { type: 'string', description: 'Assunto do e-mail' },
              body: { type: 'string', description: 'Corpo do e-mail' }
            },
            required: ['to', 'subject', 'body']
          },
          execute: async ({ to, subject, body }) => {
            return await sendEmail(to, subject, body)
          }
        },
        get_upcoming_events: {
          description: 'Obtém os próximos 5 compromissos do calendário (Google Calendar)',
          parameters: { type: 'object', properties: {} },
          execute: async () => {
            return await getUpcomingEvents()
          }
        },
        schedule_meeting: {
          description: 'Agenda uma nova reunião ou compromisso no Google Calendar',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Título da reunião' },
              startTimeISO: { type: 'string', description: 'Data e hora de início no formato ISO (ex: 2026-06-27T14:00:00-03:00)' },
              durationMinutes: { type: 'number', description: 'Duração em minutos (opcional, padrão 60)' }
            },
            required: ['summary', 'startTimeISO']
          },
          execute: async ({ summary, startTimeISO, durationMinutes }) => {
            return await scheduleMeeting(summary, startTimeISO, durationMinutes)
          }
        }
      },
      maxSteps: 3
    })

    const finalAnswer = response.text

    // Atualiza a tabela
    await supabase.from('agent_tasks').update({
      status: 'completed',
      response_text: finalAnswer,
      completed_at: new Date().toISOString()
    }).eq('id', taskId)

    // Envia resposta
    if (task.channel_type === 'whatsapp') {
      const toPhoneId = task.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_ID
      if (toPhoneId) {
        await sendWhatsAppMessage(toPhoneId, task.channel_id, finalAnswer)
      } else {
        console.warn('[Apex Agent Brain] WHATSAPP_PHONE_ID missing to reply.')
      }
    } else if (task.channel_type === 'telegram') {
      await sendTelegramMessage(task.channel_id, finalAnswer)
    }

  } catch (err) {
    console.error('[Apex Agent Brain] Error generating response:', err)
    await supabase.from('agent_tasks').update({
      status: 'failed',
      response_text: 'Erro interno ao processar a instrução.',
      completed_at: new Date().toISOString()
    }).eq('id', taskId)
  }
}
