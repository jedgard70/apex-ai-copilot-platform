export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const workerUrl = process.env.LOCAL_WORKER_URL
  const workerToken = process.env.LOCAL_WORKER_TOKEN

  if (!workerUrl || !workerToken) {
    return res.status(500).json({ 
      error: 'LOCAL_WORKER_URL or LOCAL_WORKER_TOKEN not configured' 
    })
  }

  try {
    const { command, args = [], cwd, timeout = 30000 } = req.body || {}

    if (!command) {
      return res.status(400).json({ error: 'Command is required' })
    }

    // Forward command to local worker
    const response = await fetch(`${workerUrl}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command,
        args,
        cwd,
        timeout,
      }),
      signal: AbortSignal.timeout(timeout + 5000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ 
        error: 'Local worker execution failed', 
        details: errorText 
      })
    }

    const result = await response.json()

    return res.status(200).json({
      success: true,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration,
    })

  } catch (error) {
    console.error('Local worker error:', error)
    return res.status(500).json({ 
      error: 'Local worker execution failed', 
      message: error.message 
    })
  }
}
