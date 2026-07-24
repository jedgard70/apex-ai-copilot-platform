// APS connector status endpoint
// GET /api/aps/status
// Verifies APS credentials by obtaining a real 2-legged token and reporting readiness

const APS_CLIENT_ID = process.env.APS_CLIENT_ID || ''
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET || ''
const APS_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  const hasClientId = Boolean(APS_CLIENT_ID)
  const hasClientSecret = Boolean(APS_CLIENT_SECRET)

  if (!hasClientId || !hasClientSecret) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      connector: 'autodesk-platform-services',
      configured: false,
      live: false,
      checks: { APS_CLIENT_ID: hasClientId, APS_CLIENT_SECRET: hasClientSecret },
      reason: 'Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables.',
    }))
  }

  // Attempt real 2-legged OAuth call to verify credentials are valid
  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'data:read',
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
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({
        connector: 'autodesk-platform-services',
        configured: true,
        live: false,
        checks: { APS_CLIENT_ID: hasClientId, APS_CLIENT_SECRET: hasClientSecret },
        reason: data.errorMessage || data.error_description || data.error || 'APS authentication failed.',
        aps_status: response.status,
      }))
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      connector: 'autodesk-platform-services',
      configured: true,
      live: true,
      token_type: data.token_type,
      expires_in: data.expires_in,
      checks: { APS_CLIENT_ID: hasClientId, APS_CLIENT_SECRET: hasClientSecret },
      reason: null,
    }))
  } catch (error) {
    console.error('[aps/status] Error:', error.message)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      connector: 'autodesk-platform-services',
      configured: true,
      live: false,
      checks: { APS_CLIENT_ID: hasClientId, APS_CLIENT_SECRET: hasClientSecret },
      reason: error.message || 'Network error reaching APS.',
    }))
  }
}
