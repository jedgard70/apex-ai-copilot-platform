import { buildConnectorsStatusReply, collectConnectorsStatus } from '../../server/agent/connectorsStatus.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, {
      ok: false,
      mode: 'connector-status',
      finalReply: 'BLOCKED - esta rota aceita apenas GET ou POST.',
    })
  }

  try {
    const status = collectConnectorsStatus()
    return sendJson(res, 200, {
      ...status,
      mode: 'connector-status',
      finalReply: buildConnectorsStatusReply(status),
    })
  } catch (error) {
    console.error('Apex connector status failed safely:', error?.message || error)
    return sendJson(res, 200, {
      ok: false,
      mode: 'connector-status-error',
      finalReply: 'YELLOW - status de conectores falhou com segurança. Nenhum segredo foi exposto e nenhuma ação remota foi executada.',
      error: 'connector_status_error',
    })
  }
}
