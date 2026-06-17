import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { runControlledExecutor } from '../../server/agent/controlledExecutor.mjs'
import { classifyOperatorIntent } from '../../server/agent/planner.mjs'

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
  const urlObj = new URL(req.url || '', 'http://localhost')
  const action = req.query?.action || urlObj.searchParams.get('action') || ''

  if (action === 'status') {
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

  if (action === 'preview') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJson(res, 405, {
        ok: false,
        mode: 'operator-preview',
        finalReply: 'BLOCKED - esta rota aceita apenas POST JSON.',
      })
    }

    try {
      const body = await readJsonBody(req)
      const productionStatus = collectProductionOperatorStatus()
      const result = await runApexOperatorProductionSafe({
        userMessage: String(body.message || '').slice(0, 12000),
        identityContext: normalizeIdentityContext(body.identityContext || {}),
        workspaceContext: body.workspaceContext || {},
        repoPath: process.cwd(),
        permissions: {},
        productionStatus,
        clientMemory: body.clientMemory || {},
        messages: Array.isArray(body.messages) ? body.messages : [],
      })

      return sendJson(res, 200, {
        ...result,
        mode: 'operator-preview-production-safe',
        productionStatus,
      })
    } catch (error) {
      console.error('Apex production operator preview failed safely:', error?.message || error)
      return sendJson(res, 200, {
        ok: false,
        mode: 'operator-preview-production-safe-error',
        status: 'YELLOW',
        intent: 'operator-preview-error',
        evidence: { summary: { productionSafe: true }, commands: [] },
        decision: 'Falha segura na rota serverless de preview.',
        recommendedAction: 'Revisar logs da funcao Vercel.',
        requiresApproval: false,
        proposedExecution: null,
        executedActions: [],
        finalReply: 'YELLOW - preview do operador em producao falhou com seguranca. Nenhuma acao foi executada.',
        error: 'production_safe_preview_error',
      })
    }
  }

  if (action === 'execute') {
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

  return sendJson(res, 400, { error: `Invalid or missing action "${action}"` })
}
