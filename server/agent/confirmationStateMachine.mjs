/**
 * Apex AI Copilot — H7 Confirmation State Machine
 * Closes the loop: pending action → user says "sim" → execute → evidence.
 * State is carried in clientMemory.pendingH6Action between turns.
 */

import { runLocalWorkerAction } from './localWorkerClient.mjs'
import { buildConfirmationPlan, getActionById, ACTION_CATALOG, RISK } from './executionPolicy.mjs'

function normalize(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Confirmation signal detection ────────────────────────────────────────────

const CONFIRM_PATTERNS = [
  /^\s*(sim|s|yes|y|ok|okay|confirmo|confirmado|pode|pode sim|vai|vamos|executa|execute|faz|faca|faz sim|pode executar|confirma|confirmado|certo|beleza|tudo bem|pode ser|vai la|manda|manda ver)\s*[.!]?\s*$/i,
  /\b(sim,? (pode|execute|faz|va|vai|confirmo)|confirmado|pode executar|executa isso|faz isso|vai la|manda brasa)\b/i,
]

const CANCEL_PATTERNS = [
  /^\s*(nao|n|no|cancela|cancelar|cancelado|para|stop|abort|aborta|desiste|nao quero|nao precisa|nao faz|esquece|ignora)\s*[.!]?\s*$/i,
  /\b(nao (faz|execute|vai|precisa|quero)|cancela isso|desiste|esquece isso)\b/i,
]

const ADJUST_PATTERNS = [
  /\b(ajusta|ajustar|muda|mudar|alterar|altera|modifica|modificar|edita|outra mensagem|outro branch|outra branch|usa o branch|com mensagem|mensagem diferente)\b/i,
]

export function isConfirmationSignal(userMessage = '') {
  const n = normalize(userMessage)
  return CONFIRM_PATTERNS.some(p => p.test(n))
}

export function isCancelSignal(userMessage = '') {
  const n = normalize(userMessage)
  return CANCEL_PATTERNS.some(p => p.test(n))
}

export function isAdjustSignal(userMessage = '') {
  const n = normalize(userMessage)
  return ADJUST_PATTERNS.some(p => p.test(n))
}

export function hasPendingAction(clientMemory = {}) {
  const p = clientMemory?.pendingH6Action
  return Boolean(p?.actionId || p?.pipelineId)
}

// ─── Pending action builder ────────────────────────────────────────────────────

export function buildPendingAction(actionId, params = {}, planText = '') {
  return {
    actionId,
    params,
    planText,
    createdAt: Date.now(),
  }
}

// ─── Execution via Local Worker ────────────────────────────────────────────────

const LOCAL_WORKER_ACTION_MAP = {
  'git.status':          'project.git_status',
  'git.log':             'project.git_log',
  'git.log10':           'project.git_log10',
  'git.diff':            'project.git_diff',
  'git.diff_stat':       'project.git_diff_stat',
  'git.branch':          'project.git_branch',
  'git.remote':          'project.git_remote',
  'git.add':             'project.git_add',
  'git.add_files':       'project.git_add',
  'git.commit':          'project.git_commit',
  'git.push':            'project.git_push',
  'git.push_u':          'project.git_push_u',
  'git.fetch':           'project.git_fetch',
  'git.rebase':          'project.git_rebase',
  'git.stash':           'project.git_stash',
  'git.stash_pop':       'project.git_stash_pop',
  'git.push_force':      'project.git_push_force',
  'npm.build':           'project.build_check',
  'npm.test':            'npm.test',
  'npm.lint':            'npm.lint',
  'npm.install':         'npm.install',
  'npm.list':            'npm.list',
  'npm.outdated':        'npm.outdated',
  'npm.audit':           'npm.audit',
  'validate.h44':        'project.validate_h44',
  'validate.h5':         'project.validate_h5',
  'validate.h6':         'project.validate_h6',
  'system.info':         'system.info',
  'node.version':        'node.version',
  'npm.version':         'npm.version',
  'git.version':         'git.version',
}

function workerActionId(h6ActionId) {
  return LOCAL_WORKER_ACTION_MAP[h6ActionId] || null
}

// ─── Execute confirmed action ──────────────────────────────────────────────────

export async function executeConfirmedAction(pending = {}) {
  const { actionId, params = {} } = pending
  const action = getActionById(actionId)
  if (!action) {
    return {
      ok: false,
      actionId,
      reason: `Ação não encontrada no catálogo: ${actionId}`,
      secretsExposed: false,
    }
  }

  // FORBIDDEN — never executes
  if (action.risk === RISK.FORBIDDEN) {
    return {
      ok: false,
      actionId,
      blocked: true,
      reason: 'Ação permanentemente bloqueada por política de segurança.',
      secretsExposed: false,
    }
  }

  const workerAction = workerActionId(actionId)

  // Vercel deploy — H8 path
  if (actionId === 'vercel.deploy_prod' || actionId === 'vercel.deploy_preview') {
    return executeVercelDeploy(actionId, params)
  }

  // Supabase migration — H9 path
  if (actionId === 'supabase.db_push' || actionId === 'supabase.db_reset') {
    return executeSupabaseMigration(actionId, params)
  }

  // Local Worker path — git/npm operations
  if (workerAction) {
    const workerUrl = process.env.LOCAL_WORKER_URL
    const workerToken = process.env.LOCAL_WORKER_TOKEN
    if (!workerUrl || !workerToken) {
      return {
        ok: false,
        actionId,
        reason: 'Local Worker não configurado (LOCAL_WORKER_URL + LOCAL_WORKER_TOKEN necessários). Configure o worker no seu PC e adicione as variáveis ao Vercel.',
        requiresLocalWorker: true,
        secretsExposed: false,
      }
    }
    const result = await runLocalWorkerAction(workerAction, {
      confirmed: true,
      rollbackAcknowledged: action.risk === RISK.DANGEROUS,
      params,
    })
    return {
      ...result,
      actionId,
      workerActionId: workerAction,
      executedVia: 'local_worker',
    }
  }

  return {
    ok: false,
    actionId,
    reason: `Executor não implementado para: ${actionId}`,
    secretsExposed: false,
  }
}

// ─── H8 Vercel Deploy Executor ────────────────────────────────────────────────

async function executeVercelDeploy(actionId, params = {}) {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.APEX_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    return {
      ok: false,
      actionId,
      reason: 'VERCEL_TOKEN e APEX_VERCEL_PROJECT_ID necessários para executar deploy. Configure no Vercel dashboard.',
      secretsExposed: false,
    }
  }

  if (!globalThis.fetch) {
    return { ok: false, actionId, reason: 'fetch não disponível neste ambiente.', secretsExposed: false }
  }

  try {
    const isProd = actionId === 'vercel.deploy_prod'
    const url = `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''}`

    const body = {
      name: projectId,
      target: isProd ? 'production' : 'preview',
      source: 'api',
      gitSource: params.ref ? { ref: params.ref, type: 'github' } : undefined,
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        ok: false,
        actionId,
        reason: `Vercel API retornou HTTP ${response.status}: ${data?.error?.message || 'erro desconhecido'}`,
        secretsExposed: false,
      }
    }

    return {
      ok: true,
      actionId,
      executedVia: 'vercel_api',
      deploymentId: data.id,
      deploymentUrl: data.url ? `https://${data.url}` : null,
      inspectorUrl: data.inspectorUrl || null,
      target: isProd ? 'production' : 'preview',
      status: data.readyState || 'QUEUED',
      secretsExposed: false,
    }
  } catch (err) {
    return {
      ok: false,
      actionId,
      reason: `Erro ao chamar Vercel API: ${err?.name === 'AbortError' ? 'timeout após 15s' : (err?.message || 'erro de rede')}`,
      secretsExposed: false,
    }
  }
}

// ─── H9 Supabase Migration Executor ──────────────────────────────────────────

async function executeSupabaseMigration(actionId, params = {}) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF

  if (!accessToken || !projectRef) {
    return {
      ok: false,
      actionId,
      reason: 'SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF necessários para executar migration. Configure no Vercel dashboard.',
      secretsExposed: false,
    }
  }

  // db_reset is too dangerous to run from production backend — require local worker
  if (actionId === 'supabase.db_reset') {
    return {
      ok: false,
      actionId,
      reason: 'supabase db reset é irreversível e deve ser executado via Local Worker com confirmação manual no PC. Nunca executamos db reset da Vercel.',
      secretsExposed: false,
    }
  }

  if (!globalThis.fetch) {
    return { ok: false, actionId, reason: 'fetch não disponível.', secretsExposed: false }
  }

  // Run migration via Supabase Management API
  try {
    const sql = params.sql || ''
    if (!sql) {
      return {
        ok: false,
        actionId,
        reason: 'Migration SQL não fornecido em params.sql. Use params.sql com o conteúdo da migration.',
        secretsExposed: false,
      }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)

    const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        ok: false,
        actionId,
        reason: `Supabase API retornou HTTP ${response.status}: ${data?.message || data?.error || 'erro desconhecido'}`,
        secretsExposed: false,
      }
    }

    return {
      ok: true,
      actionId,
      executedVia: 'supabase_api',
      projectRef,
      rowCount: data?.length ?? null,
      secretsExposed: false,
    }
  } catch (err) {
    return {
      ok: false,
      actionId,
      reason: `Erro ao chamar Supabase API: ${err?.name === 'AbortError' ? 'timeout após 30s' : (err?.message || 'erro de rede')}`,
      secretsExposed: false,
    }
  }
}

// ─── H10 Pipeline executor ─────────────────────────────────────────────────────

export const PIPELINES = {
  'add_commit_push': {
    label: 'Add → Commit → Push',
    steps: ['git.add', 'git.commit', 'git.push'],
    description: 'Stage all changes, commit, and push to remote.',
    risk: RISK.WRITE,
  },
  'build_validate_deploy': {
    label: 'Build → Validate → Deploy',
    steps: ['npm.build', 'validate.h6', 'vercel.deploy_prod'],
    description: 'Run build, validate H6, then deploy to production.',
    risk: RISK.DEPLOY,
  },
  'validate_full': {
    label: 'Validate H4.4 + H5 + H6',
    steps: ['validate.h44', 'validate.h5', 'validate.h6'],
    description: 'Run all checkpoint validations.',
    risk: RISK.VALIDATE,
  },
  'status_full': {
    label: 'Full status (git + npm)',
    steps: ['git.status', 'git.log', 'git.diff_stat', 'npm.audit'],
    description: 'Complete project status snapshot.',
    risk: RISK.READ,
  },
}

const PIPELINE_PATTERNS = [
  { pattern: /\b(add.*commit.*push|add,\s*commit.*push|stage.*commit.*push)\b/, id: 'add_commit_push' },
  { pattern: /\b(build.*valida.*deploy|valida.*e\s+faz\s+deploy)\b/, id: 'build_validate_deploy' },
  { pattern: /\b(valida\s+tudo|todos\s+os\s+validates?|valida h4.*h5.*h6)\b/, id: 'validate_full' },
  { pattern: /\b(status\s+completo|status\s+geral|visao\s+geral\s+do\s+projeto)\b/, id: 'status_full' },
]

export function classifyPipelineRequest(message = '') {
  const n = normalize(message)
  for (const { pattern, id } of PIPELINE_PATTERNS) {
    if (pattern.test(n)) return id
  }
  return null
}

export function buildPipelineConfirmationReply(pipelineId) {
  const pipeline = PIPELINES[pipelineId]
  if (!pipeline) return null
  const lines = [
    `Posso executar pipeline: **${pipeline.label}**`,
    `Risco: ${pipeline.risk.toUpperCase()}`,
    '',
    'Etapas:',
    ...pipeline.steps.map((s, i) => {
      const a = getActionById(s)
      return `  ${i + 1}. ${a?.label || s}`
    }),
    '',
    'Executo em sequência, parando se qualquer etapa falhar.',
    '',
    '**Confirma? (sim / não)**',
    '',
    'Nenhuma ação executada até confirmação.',
  ]
  return lines.join('\n')
}

export async function executePipeline(pipelineId, params = {}) {
  const pipeline = PIPELINES[pipelineId]
  if (!pipeline) return { ok: false, reason: `Pipeline não encontrado: ${pipelineId}` }

  const results = []
  for (const stepId of pipeline.steps) {
    const result = await executeConfirmedAction({ actionId: stepId, params })
    results.push({ stepId, ...result })
    if (!result.ok) {
      return {
        ok: false,
        pipelineId,
        label: pipeline.label,
        stoppedAt: stepId,
        reason: result.reason || `Etapa ${stepId} falhou.`,
        results,
        secretsExposed: false,
      }
    }
  }

  return {
    ok: true,
    pipelineId,
    label: pipeline.label,
    steps: pipeline.steps.length,
    results,
    secretsExposed: false,
  }
}

// ─── Build execution evidence reply ───────────────────────────────────────────

export function buildExecutionEvidenceReply(result, actionId) {
  const action = getActionById(actionId)
  const label = action?.label || actionId
  const lines = []

  if (result.ok) {
    lines.push(`Apex AI Copilot [H7.0] — Executado: **${label}**`)
    lines.push(`Status: SUCESSO`)
  } else {
    lines.push(`Apex AI Copilot [H7.0] — Falha: **${label}**`)
    lines.push(`Status: FALHOU`)
    if (result.reason) lines.push(`Motivo: ${result.reason}`)
  }

  // Local worker result
  if (result.stdout && String(result.stdout).trim()) {
    lines.push('')
    lines.push('Saída:')
    lines.push('```')
    lines.push(String(result.stdout).slice(0, 3000).trim())
    lines.push('```')
  }
  if (result.stderr && String(result.stderr).trim() && !result.ok) {
    lines.push('')
    lines.push('Stderr:')
    lines.push('```')
    lines.push(String(result.stderr).slice(0, 500).trim())
    lines.push('```')
  }
  if (typeof result.exitCode === 'number') {
    lines.push(`Exit code: ${result.exitCode}`)
  }
  if (result.durationMs) {
    lines.push(`Duração: ${result.durationMs}ms`)
  }

  // Vercel deploy result
  if (result.deploymentUrl) {
    lines.push(`Deploy URL: ${result.deploymentUrl}`)
  }
  if (result.inspectorUrl) {
    lines.push(`Inspector: ${result.inspectorUrl}`)
  }
  if (result.target) {
    lines.push(`Target: ${result.target}`)
  }

  // Requires local worker
  if (result.requiresLocalWorker) {
    lines.push('')
    lines.push('Para executar esta ação, o Apex Local Worker precisa estar rodando no seu PC.')
    lines.push('Configure LOCAL_WORKER_URL e LOCAL_WORKER_TOKEN no Vercel e inicie o worker com: node local-worker/server.mjs')
  }

  lines.push('')
  lines.push('Nenhum segredo foi exibido.')
  return lines.join('\n')
}

export function buildPipelineEvidenceReply(result) {
  const lines = [`Apex AI Copilot [H7.0] — Pipeline: **${result.label || result.pipelineId}**`]
  if (result.ok) {
    lines.push(`Status: COMPLETO (${result.steps} etapas)`)
  } else {
    lines.push(`Status: FALHOU na etapa: ${result.stoppedAt}`)
    if (result.reason) lines.push(`Motivo: ${result.reason}`)
  }
  lines.push('')
  for (const step of result.results || []) {
    const a = getActionById(step.stepId)
    const icon = step.ok ? '✓' : '✗'
    lines.push(`${icon} ${a?.label || step.stepId}`)
    if (step.stdout && String(step.stdout).trim()) {
      lines.push('  ' + String(step.stdout).split('\n').slice(0, 3).join('\n  '))
    }
  }
  lines.push('')
  lines.push('Nenhum segredo foi exibido.')
  return lines.join('\n')
}
