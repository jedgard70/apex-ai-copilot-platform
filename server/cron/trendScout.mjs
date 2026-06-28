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

// Simple WhatsApp API sender
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
  
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) {
    console.error('[Trend Scout] TAVILY_API_KEY não configurada.')
    return
  }

  // Define the topics based on user request
  const query = 'latest AI innovations architecture, generative AI video audio, Magnific AI, Veo AI Studio, ArchPrompts, infoproduct automation trends'

  try {
    // 1. Search the web using Tavily
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        search_depth: 'advanced',
        include_answer: true,
        days: 7 // past week
      })
    })

    const searchData = await searchResponse.json()
    const context = searchData.results?.map(r => `[${r.title}](${r.url}): ${r.content}`).join('\n\n') || searchData.answer

    // 2. Analyze with Gemini
    const google = createGoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    const prompt = `Você é o Agente de Radar (Trend Scout) da Apex AI.
Analise os resultados de busca da internet das últimas semanas sobre IAs Generativas, Arquitetura, Vídeo/Áudio e plataformas como Magnific e Veo AI.
Sua missão é gerar um relatório direto e acionável para o CEO da Apex AI.

Destaque:
1. Uma novidade de mercado (ferramenta ou IA recém lançada).
2. Como isso poderia ser integrado na plataforma Apex AI Copilot para o mercado de Arquitetura e Infoprodutos.

Resultados da pesquisa:
${context}

Crie a mensagem no formato de WhatsApp, com emojis e linguagem corporativa, mas ágil.`

    const { text: report } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt
    })

    // 3. Send to Owner
    // Tenta mandar pro WhatsApp do dono, senão Telegram.
    const ownerWa = process.env.OWNER_WHATSAPP_ID
    const ownerTg = process.env.OWNER_TELEGRAM_ID

    if (ownerWa) {
      await sendWhatsAppMessage(ownerWa, `📡 *Relatório de Radar Apex AI*\n\n${report}`)
      console.log('[Trend Scout] Relatório enviado via WhatsApp.')
    } else if (ownerTg) {
      await sendTelegramMessage(ownerTg, `📡 *Relatório de Radar Apex AI*\n\n${report}`)
      console.log('[Trend Scout] Relatório enviado via Telegram.')
    } else {
      console.log('[Trend Scout] Nenhum OWNER configurado no .env.local para envio.')
      console.log('Relatório Gerado:\n', report)
    }

  } catch (err) {
    console.error('[Trend Scout] Erro na varredura:', err)
  }
}
