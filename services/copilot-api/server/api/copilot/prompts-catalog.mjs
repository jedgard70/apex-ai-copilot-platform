import { getCatalog } from '../../tools/promptScanner.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const catalog = await getCatalog()
    return sendJson(res, 200, catalog)
  } catch (error) {
    console.error('[PromptsCatalog API] Error:', error)
    return sendJson(res, 500, { error: 'Failed to retrieve catalog' })
  }
}
