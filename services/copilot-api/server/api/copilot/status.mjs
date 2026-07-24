// Lightweight status check — env-only, no external API calls
// Fast fallback for Dashboard when provider-status is slow

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const list = {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    fal: Boolean(process.env.FAL_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    firebase: Boolean(process.env.VITE_FIREBASE_API_KEY),
  }
  const active = Object.values(list).filter(Boolean).length

  return sendJson(res, 200, {
    ok: true,
    git: { sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'live', branch: 'main' },
    providers: { total: 4, active, list },
    modelRuntime: {},
    timestamp: new Date().toISOString(),
  })
}
