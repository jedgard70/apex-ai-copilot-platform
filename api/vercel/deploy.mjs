import { requireOwnerAdmin } from '../../../lib/auth.mjs'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    return res.status(500).json({ 
      error: 'VERCEL_TOKEN or VERCEL_PROJECT_ID not configured' 
    })
  }

  try {
    const { branch = 'main', target = 'production' } = req.body || {}

    // Build query params for team if available
    const teamParam = teamId ? `?teamId=${teamId}` : ''

    // Trigger deployment via Vercel API
    const deployResponse = await fetch(`https://api.vercel.com/v13/deployments${teamParam}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'apex-ai-copilot-platform',
        project: projectId,
        target,
        ref: branch,
        gitSource: {
          type: 'github',
          ref: branch,
          repo: 'jedgard70/apex-ai-copilot-platform',
        },
      }),
    })

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text()
      return res.status(deployResponse.status).json({ 
        error: 'Vercel deploy failed', 
        details: errorText 
      })
    }

    const deployment = await deployResponse.json()

    return res.status(200).json({
      success: true,
      deploymentId: deployment.id,
      url: deployment.url,
      status: deployment.readyState,
      createdAt: deployment.createdAt,
      target: deployment.target,
      teamId: teamId || null,
      authenticatedAs: req.auth.email || req.auth.userId || 'internal',
    })

  } catch (error) {
    console.error('Vercel deploy error:', error)
    return res.status(500).json({ 
      error: 'Deploy failed', 
      message: error.message 
    })
  }
}

export default requireOwnerAdmin(handler)
