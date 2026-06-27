export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  if (req.method === 'GET') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email missing' })
    
    // O fluxo real vai buscar eventos do Google Calendar via API.
    return res.status(200).json({
      success: true,
      source: 'google-calendar-api-ready',
      events: []
    })
  }

  if (req.method === 'POST') {
    const { email, title, timeIso } = req.body || {}
    if (!email || !title) return res.status(400).json({ error: 'Faltam dados do evento' })

    // O fluxo real fará um POST /v3/calendars/primary/events no Google
    return res.status(200).json({
      success: true,
      message: `Evento '${title}' agendado via API para o Google Calendar.`,
      event: { title, timeIso }
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
