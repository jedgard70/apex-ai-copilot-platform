import fetch from 'node-fetch'
import 'dotenv/config'

async function setupWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('ERRO: TELEGRAM_BOT_TOKEN não encontrado no .env.local')
    process.exit(1)
  }

  // Se estiver testando localmente com ngrok, troque o dominio aqui.
  // Em produção, aponte para o domínio da Vercel.
  const domain = process.env.VITE_APP_DOMAIN || 'https://www.apexglobalai.com'
  const webhookUrl = `${domain}/api/webhook/telegram`

  console.log(`Configurando webhook do Telegram para: ${webhookUrl}...`)

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl })
  })

  const result = await response.json()
  if (result.ok) {
    console.log('✅ Webhook configurado com sucesso no Telegram!')
  } else {
    console.error('❌ Falha ao configurar webhook:', result.description)
  }
}

setupWebhook()
