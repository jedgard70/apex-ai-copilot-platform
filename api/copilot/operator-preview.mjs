import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'

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
