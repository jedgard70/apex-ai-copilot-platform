export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'Email missing' })

  // O fluxo final usaria a API People do Google:
  // const token = await getUserGoogleToken(email)
  // fetch('https://people.googleapis.com/v1/people/me/connections...', { headers: { Authorization: `Bearer ${token}` } })

  // Mock provisório enquanto as chaves não são configuradas no OAuth:
  return res.status(200).json({
    success: true,
    source: 'google-contacts-api-ready',
    contacts: [
      // Aqui os contatos reais aparecerão. A IA saberá que está lendo da API.
      { name: 'Manoel Silva', phone: '5511999999999', tags: ['obra', 'pedreiro'] },
      { name: 'Sr. Gilberto', phone: '5511888888888', tags: ['obra', 'lider'] }
    ]
  })
}
