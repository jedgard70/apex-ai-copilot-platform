import { generateText } from 'ai'
import { createGoogleGenAI } from '@ai-sdk/google'

// Simple Telegram API sender (Fallback)
async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}

// Simple WhatsApp API sender (Meta Graph API)
async function sendWhatsAppMessage(toPhoneNumber, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhoneNumber, text: { body: text } })
  })
}

export async function runTrendScout() {
  console.log('[Trend Scout] Iniciando varredura semanal...')
  
  const braveKey = process.env.BRAVE_SEARCH_API_KEY
  if (!braveKey) {
    console.error('[Trend Scout] BRAVE_SEARCH_API_KEY não configurada.')
    return
  }

  // Define the topics based on user request (Marketing, 3D/BIM Engineering, Platform Updates across all departments)
  const query = 'latest AI innovations architecture, generative AI video audio, 3D modeling BIM engineering software updates, SaaS platform operational improvements, infoproduct automation trends'

  try {
    // 1. Search the web using Brave Search API
    const searchResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=7&freshness=pw`, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }
    })

    const searchData = await searchResponse.json()
    const context = (searchData.web?.results || []).map(r => `[${r.title}](${r.url}): ${r.description}`).join('\n\n')

    // 2. Analyze with Gemini
    const google = createGoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    const prompt = `Você é o Agente de Radar (Trend Scout) da Apex AI.
Analise os resultados de busca da internet das últimas semanas sobre IAs Generativas, Arquitetura, Vídeo/Áudio, Engenharias BIM 3D, e inovações operacionais de software para empresas.
Sua missão é gerar um relatório direto e acionável para o CEO da Apex AI.

Destaque:
1. Uma novidade de mercado em IA ou Marketing.
2. Inovações em Modelagem 3D, renderização ou BIM para engenharia/arquitetura.
3. Como as descobertas podem ser traduzidas em melhorias para os departamentos da plataforma Apex AI Copilot.

Resultados da pesquisa:
${context}

Crie a mensagem no formato de WhatsApp, com emojis e linguagem corporativa, mas ágil.`

    const { text: report } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt
    })

    // 3. Send to Owner & Company
    // Tenta mandar pro WhatsApp do dono, senão Telegram.
    const ownerWa = process.env.OWNER_WHATSAPP_ID || "16994667667"
    const companyWa = process.env.APEX_COMPANY_PHONE || "14991487668"
    const ownerTg = process.env.OWNER_TELEGRAM_ID

    if (process.env.WHATSAPP_ACCESS_TOKEN) {
      await sendWhatsAppMessage(ownerWa, `📡 *Relatório de Radar Apex AI (CEO)*\n\n${report}`)
      await sendWhatsAppMessage(companyWa, `📡 *Relatório de Radar Apex AI (Equipe)*\n\n${report}`)
      console.log('[Trend Scout] Relatório enviado via WhatsApp.')
    } else if (ownerTg) {
      await sendTelegramMessage(ownerTg, `📡 *Relatório de Radar Apex AI*\n\n${report}`)
      console.log('[Trend Scout] Relatório enviado via Telegram.')
    } else {
      console.log('[Trend Scout] Token do WhatsApp ou Telegram ausentes no .env.local para disparo real. Mostrando apenas o Log:')
      console.log('Relatório Gerado:\n', report)
    }

  } catch (err) {
    console.error('[Trend Scout] Erro na varredura:', err)
  }
}
