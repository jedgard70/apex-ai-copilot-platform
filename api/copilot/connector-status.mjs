import { buildConnectorsStatusReply, collectConnectorsStatusReadOnly } from '../../server/agent/connectorsStatus.mjs'
import { requireOwnerAdmin } from '../../../lib/auth.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, {
      ok: false,
      mode: 'connector-status',
      finalReply: 'BLOCKED - esta rota aceita apenas GET ou POST.',
    })
  }

  try {
    const status = await collectConnectorsStatusReadOnly()
    return sendJson(res, 200, {
      ok: status.ok,
      secretsExposed: false,
      checkedAt: status.checkedAt,
      authenticatedAs: req.auth.email || req.auth.userId || 'internal',
      github: {
        configured: status.github.configured,
        reachable: status.github.reachable,
        status: status.github.status,
        repository: status.github.repository,
        branch: status.github.branch,
        defaultBranch: status.github.defaultBranch || '',
        latestCommit: status.github.latestCommit || null,
        openPRs: status.github.openPRs || [],
        latestWorkflowRun: status.github.latestWorkflowRun || null,
      },
      vercel: {
        configured: status.vercel.configured,
        reachable: status.vercel.reachable,
        status: status.vercel.status,
        projectId: status.vercel.projectId,
        projectName: status.vercel.projectName || '',
        productionDomain: status.vercel.productionDomain,
        latestProductionDeployment: status.vercel.latestProductionDeployment || null,
        latestDeployments: (status.vercel.latestDeployments || []).slice(0, 3),
      },
      supabase: {
        configured: status.supabase.configured,
        reachable: status.supabase.reachable,
        status: status.supabase.status,
        projectRef: status.supabase.projectRef || '',
        healthCheck: status.supabase.healthCheck || '',
      },
      stripe: {
        configured: status.stripe.configured,
        reachable: status.stripe.reachable,
        status: status.stripe.status,
        balanceAvailable: status.stripe.balanceAvailable || false,
      },
      openai: {
        configured: status.openai.configured,
        reachable: status.openai.reachable,
        status: status.openai.status,
        modelsAvailable: status.openai.modelsAvailable || false,
      },
      tavily: {
        configured: status.tavily.configured,
        reachable: status.tavily.reachable,
        status: status.tavily.status,
      },
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

export default requireOwnerAdmin(handler)
