import { runControlledExecutor } from '../../server/agent/controlledExecutor.mjs'
import { classifyOperatorIntent } from '../../server/agent/planner.mjs'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, {
      ok: false,
      mode: 'operator-execute-controlled-h4',
      finalReply: 'BLOCKED - esta rota aceita apenas POST JSON.',
    })
  }

  try {
    const body = await readJsonBody(req)
    const userMessage = String(body.message || '').slice(0, 12000)
    const productionStatus = collectProductionOperatorStatus()
    const result = await runControlledExecutor({
      userMessage,
      operatorIntent: classifyOperatorIntent(userMessage),
      repoPath: process.cwd(),
      productionStatus,
    })

    return sendJson(res, 200, {
      ...result,
      mode: 'operator-execute-controlled-h4',
      productionStatus,
    })
  } catch (error) {
    console.error('Apex controlled executor route failed safely:', error?.message || error)
    return sendJson(res, 200, {
      ok: false,
      mode: 'operator-execute-controlled-h4-error',
      status: 'YELLOW',
      tasks: [],
      policy: {
        ok: false,
        status: 'YELLOW',
        reason: 'Falha segura na rota de execução controlada.',
        requiresConfirmation: false,
      },
      commands: [],
      connectors: [],
      finalReply: 'YELLOW - execução controlada falhou com segurança. Nenhuma mutação foi executada.',
      error: 'controlled_executor_route_error',
    })
  }
}
