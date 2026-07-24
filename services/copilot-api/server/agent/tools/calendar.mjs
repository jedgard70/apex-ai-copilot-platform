import { google } from 'googleapis'

function getOAuth2Client() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // Requires the user to have authenticated and stored their refresh token
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (refreshToken) {
    oAuth2Client.setCredentials({ refresh_token: refreshToken })
  }
  return oAuth2Client
}

export async function getUpcomingEvents() {
  try {
    const auth = getOAuth2Client()
    if (!auth.credentials.refresh_token) {
      return "OAuth2 não configurado. Por favor, adicione GOOGLE_REFRESH_TOKEN no painel."
    }

    const calendar = google.calendar({ version: 'v3', auth })
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = res.data.items
    if (!events || events.length === 0) {
      return 'Nenhum compromisso futuro encontrado na agenda.'
    }
    
    return events.map((event, i) => {
      const start = event.start.dateTime || event.start.date
      return `${i + 1}. ${event.summary} (${new Date(start).toLocaleString()})`
    }).join('\n')
  } catch (err) {
    console.error('Calendar error:', err)
    return "Erro ao acessar o Google Calendar."
  }
}

export async function scheduleMeeting(summary, startTimeISO, durationMinutes = 60) {
  try {
    const auth = getOAuth2Client()
    if (!auth.credentials.refresh_token) {
      return "OAuth2 não configurado."
    }

    const calendar = google.calendar({ version: 'v3', auth })
    
    const startTime = new Date(startTimeISO)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    const event = {
      summary: summary,
      start: { dateTime: startTime.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
    }

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    })

    return `Reunião '${summary}' agendada com sucesso para ${startTime.toLocaleString()}. Link: ${res.data.htmlLink}`
  } catch (err) {
    console.error('Calendar error:', err)
    return "Erro ao criar compromisso no Google Calendar."
  }
}
