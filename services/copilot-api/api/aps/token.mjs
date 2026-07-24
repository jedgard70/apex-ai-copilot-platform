// APS 2-legged OAuth token endpoint
// POST /api/aps/token
// Returns a bearer token for APS API calls (server-to-server, never exposes secret to client)

const APS_CLIENT_ID = process.env.APS_CLIENT_ID || ''
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET || ''
const APS_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      error: 'APS credentials not configured. Set APS_CLIENT_ID and APS_CLIENT_SECRET.',
    }))
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'data:read data:write data:create bucket:create bucket:read viewables:read',
    })

    const response = await fetch(APS_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      res.writeHead(response.status, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({
        error: data.errorMessage || data.error_description || data.error || 'APS token request failed.',
        aps_status: response.status,
      }))
    }

    // Return token details (access_token, expires_in, token_type)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    }))
  } catch (error) {
    console.error('[aps/token] Error:', error.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: error.message || 'APS token request failed.' }))
  }
}
