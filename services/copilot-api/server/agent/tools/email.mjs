import { google } from 'googleapis'

function getOAuth2Client() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (refreshToken) {
    oAuth2Client.setCredentials({ refresh_token: refreshToken })
  }
  return oAuth2Client
}

export async function readRecentEmails() {
  try {
    const auth = getOAuth2Client()
    if (!auth.credentials.refresh_token) {
      return "OAuth2 não configurado."
    }

    const gmail = google.gmail({ version: 'v1', auth })
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
      q: 'is:unread'
    })

    const messages = res.data.messages
    if (!messages || messages.length === 0) {
      return 'Nenhum e-mail não lido encontrado.'
    }

    let report = 'Últimos 5 e-mails não lidos:\n'
    for (const msg of messages) {
      const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id })
      const headers = msgData.data.payload.headers
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sem Assunto'
      const from = headers.find(h => h.name === 'From')?.value || 'Desconhecido'
      report += `- De: ${from} | Assunto: ${subject}\n`
    }
    return report
  } catch (err) {
    console.error('Gmail error:', err)
    return "Erro ao acessar o Gmail."
  }
}

export async function sendEmail(to, subject, bodyText) {
  try {
    const auth = getOAuth2Client()
    if (!auth.credentials.refresh_token) {
      return "OAuth2 não configurado."
    }

    const gmail = google.gmail({ version: 'v1', auth })
    
    // Create RFC 2822 formatted and base64url encoded email
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      '',
      bodyText,
    ]
    const message = messageParts.join('\n')
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    return `E-mail enviado com sucesso para ${to}.`
  } catch (err) {
    console.error('Gmail error:', err)
    return "Erro ao enviar e-mail."
  }
}
