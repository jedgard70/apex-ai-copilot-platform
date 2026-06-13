import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution } from '../../server/agent/toolExecutionRouter.mjs'

// H5.0D: action tools that must always bypass conversation/connector router
const H5_ACTION_TOOLS = new Set([
  'local_worker.status',
  'revit_mcp.status',
  'revit_model.status',
  'vercel.deploy',
  'supabase.migration',
])

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function normalizeIdentityContext(value = {}) {
  return {
    email: value.email || '',
    role: value.role || '',
    workspaceName: value.workspaceName || '',
    isOwnerAdmin: Boolean(value.isOwnerAdmin),
  }
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
      error: 'Method not allowed',
      finalReply: 'BLOCKED - esta rota aceita apenas POST JSON.',
      reply: 'BLOCKED - esta rota aceita apenas POST JSON.',
    })
  }

  try {
    const body = await readJsonBody(req)
    const userMessage = String(body.message || '').slice(0, 12000)
    const productionStatus = collectProductionOperatorStatus()

    // H5.0D: hard override — detect action tools before any conversation/connector router
    const h5ToolIds = classifyToolExecutionRequest(userMessage)
    if (h5ToolIds.length && h5ToolIds.some(id => H5_ACTION_TOOLS.has(id))) {
      const toolExecution = await routeToolExecution({ userMessage, requestedToolIds: h5ToolIds })
      return sendJson(res, 200, {
        finalReply: toolExecution.finalReply,
        reply: toolExecution.finalReply,
        memoryPatch: null,
        mode: 'apex-h5-tool-execution-direct',
        operator: { intent: 'tool_execution', toolExecution },
        productionStatus,
      })
    }

    const result = await runApexOperatorProductionSafe({
      userMessage,
      identityContext: normalizeIdentityContext(body.identityContext || {}),
      workspaceContext: body.workspaceContext || {},
      repoPath: process.cwd(),
      permissions: {},
      productionStatus,
      clientMemory: body.clientMemory || {},
      messages: Array.isArray(body.messages) ? body.messages : [],
    })

    return sendJson(res, 200, {
      finalReply: result.finalReply,
      reply: result.finalReply,
      memoryPatch: result.memoryPatch || null,
      mode: 'apex-operator-production-safe',
      operator: result,
      productionStatus,
    })
  } catch (error) {
    console.error('Apex production chat route failed safely:', error?.message || error)
    const finalReply = [
      'YELLOW - Apex Copilot esta em producao, mas a rota serverless encontrou uma falha segura.',
      'Nao executei acoes locais, deploy, push ou migration.',
      'O chat continua operacional em modo seguro; revisar logs da funcao Vercel para corrigir a causa.',
    ].join('\n')
    return sendJson(res, 200, {
      finalReply,
      reply: finalReply,
      mode: 'apex-operator-production-safe-error',
      error: 'production_safe_route_error',
    })
  }
}
