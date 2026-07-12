// URL Context API — Aprende e analisa sites
// POST /api/copilot/learn-url — { url: string, question?: string }
// GET  /api/copilot/learn-url?url=...&question=...

import { analyzeUrl } from '../../server/service/urlContext.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  try {
    let url = ''
    let question = ''

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
      url = String(body.url || '').trim()
      question = String(body.question || '').trim()
    } else {
      const urlParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      url = urlParams.searchParams.get('url') || ''
      question = urlParams.searchParams.get('question') || ''
    }

    if (!url) return sendJson(res, 400, { ok: false, error: 'URL parameter is required.' })
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return sendJson(res, 400, { ok: false, error: 'URL must start with http:// or https://' })
    }

    const result = await analyzeUrl(url, question)
    return sendJson(res, result.ok ? 200 : 502, result)
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message })
  }
}
