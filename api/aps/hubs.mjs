// APS Data Management — List Hubs
// GET /api/aps/hubs
// Lists ACC/BIM 360 hubs accessible to the configured credentials (3-legged requires user token;
// for 2-legged the list will be empty unless the app has hub access provisioned)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  // Obtain a 2-legged token via internal endpoint logic (inline to avoid circular import)
  const APS_CLIENT_ID = process.env.APS_CLIENT_ID || ''
  const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET || ''

  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'APS not configured.' }))
  }

  try {
    // Step 1: get token
    const tokenRes = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'data:read' }).toString(),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'APS token failed', detail: tokenData }))
    }

    // Step 2: list hubs
    const hubsRes = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const hubsData = await hubsRes.json()

    res.writeHead(hubsRes.ok ? 200 : hubsRes.status, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(hubsData))
  } catch (error) {
    console.error('[aps/hubs] Error:', error.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: error.message || 'APS hubs request failed.' }))
  }
}
