import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution } from '../../server/agent/toolExecutionRouter.mjs'
import { isConfirmationSignal, isCancelSignal, hasPendingAction } from '../../server/agent/confirmationStateMachine.mjs'

// PDF summary pattern — triggers local extraction-based summary
const PDF_SUMMARY_PATTERN = /\b(resuma|analise|analisa|resume|sumari[sz]|principais?|pontos?|extraia|extrair|o que (fala|diz|trata)|me (conta|diga|fale)|sobre o que|resumo|síntese|sinopse)\b/i

function buildLocalPdfSummary(file) {
  const text = String(file.extractedText || '').trim()
  if (text.length < 20) return null
  const preview = text.slice(0, 1600).replace(/\s+/g, ' ').trim()
  const pageInfo = file.pageCount ? ` (${file.pageCount} páginas)` : ''
  return [
    `**Resumo do PDF: ${file.name}**${pageInfo}`,
    '',
    'Com base no conteúdo extraído:',
    '',
    preview,
    text.length > 1600 ? '\n\n_[Conteúdo truncado — o documento é longo. Faça perguntas específicas para mais detalhes.]_' : '',
  ].filter(l => l !== undefined).join('\n').trim()
}

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

// Build confirmation UI metadata for frontend buttons
function buildConfirmationUi(result) {
  if (!result.requiresApproval) return null
  return {
    show: true,
    intent: result.intent,
    pendingAction: result.memoryPatch?.pendingH6Action || null,
    buttons: [
      { id: 'confirm', label: 'Sim, executar', variant: 'primary', message: 'sim' },
      { id: 'cancel',  label: 'Não, cancelar', variant: 'secondary', message: 'não' },
      { id: 'adjust',  label: 'Ajustar',        variant: 'ghost',     message: null },
    ],
  }
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
    const clientMemory = body.clientMemory || {}
    const productionStatus = collectProductionOperatorStatus()
    const fileCandidate = body.file || null
    const hasReadyPdfText = Boolean(
      fileCandidate &&
      fileCandidate.kind === 'pdf' &&
      fileCandidate.extractionStatus === 'ready' &&
      String(fileCandidate.extractedText || '').trim().length >= 20
    )
    const looksLikePdfSummary = hasReadyPdfText && PDF_SUMMARY_PATTERN.test(userMessage || '')

    // Fast-path: greeting in Portuguese — no file context needed
    if (/^\s*(ol[aá]|oi|ola)\s*$/i.test(userMessage)) {
      const name = clientMemory.displayName ? `, ${clientMemory.displayName}` : ''
      const greeting = `Olá${name}. Como posso ajudar agora?`
      return sendJson(res, 200, {
        finalReply: greeting,
        reply: greeting,
        memoryPatch: null,
        mode: 'apex-greeting-pt',
        operator: { intent: 'production_affirmation' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: PDF summary when text is ready — use local extraction, bypass operator
    if (looksLikePdfSummary) {
      const summary = buildLocalPdfSummary(fileCandidate)
      if (summary) {
        return sendJson(res, 200, {
          finalReply: summary,
          reply: summary,
          memoryPatch: null,
          mode: 'apex-pdf-summary-local',
          operator: { intent: 'production_pdf_summary' },
          confirmation: null,
          productionStatus,
        })
      }
    }

    // H7: if user says "sim" and there's a pending action, skip H5 bypass and go straight to runtime
    const hasPending = hasPendingAction(clientMemory)
    const isConfirm = isConfirmationSignal(userMessage)
    const isCancel = isCancelSignal(userMessage)

    if (isCancel && hasPending) {
      const cancelReply = 'Ação cancelada. Nenhuma execução realizada. O que mais posso fazer?'
      return sendJson(res, 200, {
        finalReply: cancelReply,
        reply: cancelReply,
        memoryPatch: { pendingH6Action: null },
        mode: 'apex-h7-cancelled',
        operator: { intent: 'h7_cancelled' },
        confirmation: null,
        productionStatus,
      })
    }

    // H5.0D: hard override — but skip if user is confirming a pending H7 action
    if (!(isConfirm && hasPending)) {
      const h5ToolIds = classifyToolExecutionRequest(userMessage)
      if (h5ToolIds.length && h5ToolIds.some(id => H5_ACTION_TOOLS.has(id))) {
        const toolExecution = await routeToolExecution({ userMessage, requestedToolIds: h5ToolIds })
        return sendJson(res, 200, {
          finalReply: toolExecution.finalReply,
          reply: toolExecution.finalReply,
          memoryPatch: null,
          mode: 'apex-h5-tool-execution-direct',
          operator: { intent: 'tool_execution', toolExecution },
          confirmation: null,
          productionStatus,
        })
      }
    }

    const result = await runApexOperatorProductionSafe({
      userMessage,
      identityContext: normalizeIdentityContext(body.identityContext || {}),
      workspaceContext: body.workspaceContext || {},
      repoPath: process.cwd(),
      permissions: {},
      productionStatus,
      clientMemory,
      messages: Array.isArray(body.messages) ? body.messages : [],
    })

    return sendJson(res, 200, {
      finalReply: result.finalReply,
      reply: result.finalReply,
      memoryPatch: result.memoryPatch || null,
      mode: 'apex-operator-production-safe',
      operator: result,
      confirmation: buildConfirmationUi(result),
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
      confirmation: null,
    })
  }
}
