import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, {
      ok: false,
      error: 'Method not allowed',
      finalReply: 'BLOCKED - esta rota aceita apenas GET ou POST.',
    })
  }

  try {
    const status = collectProductionOperatorStatus()
    return sendJson(res, 200, {
      ...status,
      finalReply: [
        `${status.overallStatus} - status do operador em producao coletado sem mutacao.`,
        status.summary,
        'Nenhum segredo foi exposto. Nenhum Git/build/shell/deploy/migration foi executado.',
      ].join('\n'),
    })
  } catch (error) {
    console.error('Apex production operator status failed safely:', error?.message || error)
    return sendJson(res, 200, {
      ok: false,
      mode: 'production-operator-status-error',
      overallStatus: 'YELLOW',
      finalReply: 'YELLOW - status do operador falhou com seguranca. Nenhuma acao foi executada.',
      error: 'production_status_route_error',
    })
  }
}
