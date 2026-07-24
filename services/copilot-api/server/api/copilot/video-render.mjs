import { renderVideoPayload } from '../../videoRenderPipeline.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'error' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const result = await renderVideoPayload(body)
  if (result.providerStatus === 'error') return sendJson(res, 500, result)
  if (result.providerStatus === 'error') return sendJson(res, 400, result)
  return sendJson(res, 200, result)
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
}
