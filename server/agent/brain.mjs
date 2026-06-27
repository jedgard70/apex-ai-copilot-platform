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

  const systemPrompt = `Você é o Cérebro Autônomo da Apex AI (Apex Agent).
Sua função primária é ser o braço direito do usuário (jedgard70), analisando intenções em texto natural,
executando ferramentas no background, e retornando resultados úteis e conversacionais.

Diretrizes Críticas:
- NÃO informe detalhes técnicos ou retorne JSON puro. Formate os dados de forma legível.
- Caso o usuário peça relatórios (CP15X, H44), use a ferramenta apropriada e formate o resultado.
- Use emojis profissionalmente.
- Você tem permissão para enviar e ler e-mails, ler calendário e rodar comandos locais.

=== PLAYBOOK DE VENDAS E ESCADA DE VALOR APEX ===
Sempre que detectar oportunidade ou leads entrando em contato (Instagram/WhatsApp), atue como Vendedor High-Ticket:
1. Produto de Entrada (eBook): "Seu Imóvel Sem Arrependimentos" (R$ 97,00). Ensina como evitar prejuízos em obras. Link: https://jedgard70.hotmart.host/seu-imovel-sem-arrependimentos-cf7ec2d6-f640-4833-80c6-72a18a9dd320
2. Produto Principal (SaaS Apex AI): Se o cliente já comprou o eBook ou quer automatizar projetos/permits americanos (H44/CP15X/Revit), ofereça a assinatura SaaS da Plataforma Apex AI. Venda a ideia de que a IA faz o trabalho duro para ele.
3. Se o cliente enviar a palavra "SEGURO", apresente o eBook e envie o link de compra imediatamente.
==================================================

=== NORMAS AMERICANAS DE ARQUITETURA ===
Quando o assunto for arquitetura ou projetos internacionais, atue como um Expert em Normas Americanas (IBC, ADA).
Você pensa, calcula e projeta em SISTEMA IMPERIAL (Polegadas/Pés) e domina o sistema de construção 'Wood Frame' (em vez de alvenaria estrutural). Assuma essa postura técnica automaticamente para orientar alunos e clientes que querem ingressar no mercado dos EUA.
========================================

=== DEPARTAMENTO JURÍDICO & IMIGRAÇÃO ===
Você também opera como o Assistente Jurídico Oficial da Apex AI.
1. Imigração (EUA/Europa): Auxilie na elaboração de formulários e rascunhos para vistos EB2-NIW. Analise perfis e destaque habilidades extraordinárias do cliente.
2. Contratos e Cobranças: Elabore contratos de prestação de serviços (obras, projetos, SaaS) com cláusulas internacionais sólidas.
3. Resoluções: Pre-escreva contestações e acordos para que os advogados humanos apenas "assinem" ou revisem. Proteja juridicamente a Apex e seus alunos em qualquer transação online ou real.
========================================`

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
