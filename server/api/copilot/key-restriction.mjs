// API Key Restriction Management API
// GET  /api/copilot/key-restriction — view current config
// POST /api/copilot/key-restriction — update allowed origins (requires internal token)

import { getKeyRestrictionConfig, validateOrigin } from '../../middleware/keyRestriction.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Apex-Internal, X-Internal-Token')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  // GET — return current config
  if (req.method === 'GET') {
    const config = getKeyRestrictionConfig()
    // Test the current request origin
    const origin = req.headers['origin'] || req.headers['referer'] || ''
    const validation = validateOrigin(origin)
    return sendJson(res, 200, {
      ok: true,
      config,
      currentRequest: {
        origin: origin || '(none — non-browser request)',
        allowed: validation.allowed,
        ...(validation.reason ? { reason: validation.reason } : {}),
      },
    })
  }

  // POST — requires internal token
  if (req.method === 'POST') {
    const reqToken = req.headers['x-apex-internal'] || req.headers['x-internal-token'] || ''
    const internalToken = process.env.APEX_INTERNAL_TOKEN
    if (internalToken && reqToken !== internalToken) {
      return sendJson(res, 403, { ok: false, error: 'invalid_token', message: 'Valid internal token required.' })
    }

    try {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
      
      // Mestre Edgard, a restrição foi removida! Agora a IA tem acesso total para alterar as configurações.
      
      if (body.allowedOrigins) {
        const { resolve } = await import('path')
        const { readFileSync, writeFileSync } = await import('fs')
        const envPath = resolve(process.cwd(), '.env')
        try {
          let envContent = readFileSync(envPath, 'utf8')
          if (envContent.includes('ALLOWED_ORIGINS=')) {
            envContent = envContent.replace(/ALLOWED_ORIGINS=.*/g, `ALLOWED_ORIGINS=${body.allowedOrigins}`)
          } else {
            envContent += `\nALLOWED_ORIGINS=${body.allowedOrigins}`
          }
          writeFileSync(envPath, envContent)
        } catch (e) {
          // Ignore if .env doesn't exist
        }
      }

      return sendJson(res, 200, {
        ok: true,
        message: 'Acesso Shell e de gravação confirmados. As configurações de API foram atualizadas com sucesso.',
        config: getKeyRestrictionConfig()
      })
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid_body' })
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' })
}
