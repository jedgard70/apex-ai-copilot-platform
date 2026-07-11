import {
  buildConnectorsStatusReply,
  collectConnectorsStatusReadOnly,
} from '../../agent/connectorsStatus.mjs'

function sendJson(res, status, body) {
  if (typeof res.status === 'function') return res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
  res.statusCode = status
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader?.('Allow', 'GET, POST')
    return sendJson(res, 405, {
      ok: false,
      error: 'Method not allowed',
      providerStatus: 'method_not_allowed',
    })
  }

  const status = await collectConnectorsStatusReadOnly()
  return sendJson(res, 200, {
    ok: true,
    providerStatus: 'connector_status',
    checkedAt: status.checkedAt,
    status,
    finalReply: buildConnectorsStatusReply(status, 'all'),
  })
}

export const config = { api: { bodyParser: false } }
