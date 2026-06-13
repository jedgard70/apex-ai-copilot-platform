import { routeToolExecution } from '../../server/agent/toolExecutionRouter.mjs'

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
      mode: 'tool-execution-router-h5',
      finalReply: 'BLOCKED - esta rota aceita apenas POST JSON.',
    })
  }

  try {
    const body = await readJsonBody(req)
    const result = await routeToolExecution({
      userMessage: String(body.message || '').slice(0, 12000),
      requestedToolIds: Array.isArray(body.toolIds) ? body.toolIds.map(String) : [],
      allowMutations: body.allowMutations === true,
    })

    return sendJson(res, 200, result)
  } catch (error) {
    console.error('Apex H5 tool execution route failed safely:', error?.message || error)
    return sendJson(res, 200, {
      ok: false,
      mode: 'tool-execution-router-h5-error',
      intent: 'tool_execution_error',
      requestedToolIds: [],
      executionClasses: [],
      tools: [],
      executions: [],
      finalReply: 'YELLOW - camada H5 de execução por ferramentas falhou com segurança. Nenhuma mutação foi executada e nenhum segredo foi exposto.',
      error: 'tool_execution_route_error',
    })
  }
}
