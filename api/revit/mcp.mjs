export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const revitUrl = process.env.REVIT_MCP_URL
  const revitToken = process.env.REVIT_MCP_TOKEN

  if (!revitUrl || !revitToken) {
    return res.status(500).json({ 
      error: 'REVIT_MCP_URL or REVIT_MCP_TOKEN not configured' 
    })
  }

  try {
    const { action, params = {} } = req.body || {}

    if (!action) {
      return res.status(400).json({ error: 'Action is required' })
    }

    // Forward request to Revit MCP server
    const response = await fetch(`${revitUrl}/api/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${revitToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ 
        error: 'Revit MCP action failed', 
        details: errorText 
      })
    }

    const result = await response.json()

    return res.status(200).json({
      success: true,
      action,
      result,
    })

  } catch (error) {
    console.error('Revit MCP error:', error)
    return res.status(500).json({ 
      error: 'Revit MCP action failed', 
      message: error.message 
    })
  }
}
