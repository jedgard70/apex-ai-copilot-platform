import { collectConnectorsStatusReadOnly } from './connectorsStatus.mjs'
import { EXECUTION_CLASSES, getExecutionCapabilityMatrix, getToolDefinition, getToolRegistry } from './toolRegistry.mjs'
import { classifyH6ActionRequest, buildConfirmationReply, ACTION_CATALOG } from './executionPolicy.mjs'

function normalizeMessage(message = '') {
  return String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function redact(value = '') {
  return String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/(token|secret|password|senha)\s*[:=]\s*[^,\s]+/gi, '$1=[redacted]')
}

export function classifyToolExecutionRequest(message = '') {
  const text = normalizeMessage(message)
  if (!text) return []

  if (/\b(drop database|drop table|truncate|delete from|rm -rf|git reset --hard|push --force|force push)\b/.test(text)) {
    return ['dangerous.unclassified']
  }

  const tools = []
  const asksComputerCapability = /\b(consegue|pode)\b.*\b(arrumar|consertar|corrigir|diagnosticar)\b.*\b(computador|pc|notebook)\b/.test(text)
  if (!asksComputerCapability && (/\b(arrume|arrumar|conserte|consertar|corrija|corrigir|diagnostique|diagnosticar).*\b(computador|pc|notebook)\b/.test(text) ||
    /\b(computador|pc|notebook).*\b(erro|lento|travando|nao funciona|não funciona|problema)\b/.test(text) ||
    /\binternet (nao|não) funciona\b/.test(text))) {
    tools.push('local_worker.status')
  }
  if (/\babra o revit\b/.test(text)) tools.push('revit_mcp.status')
  if (/\b(verifique|verificar|analise|analisar|cheque|validar|valide).*\b(modelo revit|modelo bim)\b/.test(text)) {
    tools.push('revit_model.status')
  } else if (/\b(verifique|verificar|analise|analisar|cheque|validar|valide).*\b(revit|bim)\b/.test(text)) {
    tools.push('revit_mcp.status')
  }
  if (/\b(verifique|verificar|cheque|status|conector).*\bgithub\b|\bgithub\b.*\b(status|conector)\b/.test(text)) {
    tools.push('github.status')
  }
  if (/\b(verifique|verificar|cheque|status|conector).*\bvercel\b|\bvercel\b.*\b(status|conector)\b/.test(text)) {
    tools.push('vercel.status')
  }
  if (/\b(verifique|verificar|cheque|status|conector).*\bsupabase\b|\bsupabase\b.*\b(status|conector)\b/.test(text)) {
    tools.push('supabase.status')
  }
  if (/\b(faz deploy|fazer deploy|deploy|publica|publicar|subir para vercel)\b/.test(text)) {
    tools.push('vercel.deploy')
  }
  if (/\b(aplique|aplicar|aplica|rodar|roda|executar|executa).*\b(migration|migracao|migracao|supabase)\b|\bsupabase db (push|reset)\b/.test(text)) {
    tools.push('supabase.migration')
  }

  // H5.0C — bare keyword fallbacks: any isolated mention routes to H5 status check
  if (!tools.includes('local_worker.status') && !asksComputerCapability &&
      /\b(computador|pc|notebook)\b/.test(text)) {
    tools.push('local_worker.status')
  }
  const asksRevitHelp = /\b(o que|como|consegue|pode|ajudar|duvida|sobre|bim help)\b.*\brevit\b|\brevit\b.*\b(ajudar|duvida|sobre)\b/.test(text) ||
    /\brevit\b.*\b(travando|trava|lento|nao abre|nao funciona|erro|falha|crash|problema)\b|\b(travando|trava|lento|crash|problema).{0,40}\brevit\b/.test(text)
  if (!asksRevitHelp && !tools.includes('revit_mcp.status') && !tools.includes('revit_model.status') &&
      /\brevit\b/.test(text)) {
    tools.push('revit_mcp.status')
  }
  if (!tools.includes('github.status') && /\bgithub\b/.test(text)) {
    tools.push('github.status')
  }
  if (!tools.includes('vercel.status') && !tools.includes('vercel.deploy') &&
      /\bvercel\b/.test(text)) {
    tools.push('vercel.status')
  }
  if (!tools.includes('supabase.status') && !tools.includes('supabase.migration') &&
      /\bsupabase\b/.test(text)) {
    tools.push('supabase.status')
  }
  if (!tools.includes('supabase.migration') && /\b(migration|migracao)\b/.test(text)) {
    tools.push('supabase.migration')
  }

  return [...new Set(tools)]
}

function capabilityStatus(tool) {
  const configured = tool.isConfigured()
  if (tool.executionClass === EXECUTION_CLASSES.BLOCKED) {
    return {
      available: false,
      status: 'blocked',
      missing: tool.missing(),
    }
  }
  return {
    available: configured && tool.executionClass === EXECUTION_CLASSES.READ_ONLY,
    status: configured ? 'available' : 'unavailable',
    missing: tool.missing(),
  }
}

function connectorSummaryFromStatus(status, toolId) {
  if (toolId === 'github.status') {
    return {
      repository: status.github.repository,
      branch: status.github.branch,
      defaultBranch: status.github.defaultBranch || '',
      branchExists: Boolean(status.github.branchExists),
      reachable: Boolean(status.github.reachable),
      status: status.github.status,
      latestCommit: status.github.latestCommit
        ? {
            shortSha: status.github.latestCommit.shortSha,
            sha: status.github.latestCommit.sha,
            message: status.github.latestCommit.message,
            author: status.github.latestCommit.author,
            date: status.github.latestCommit.date,
            url: status.github.latestCommit.url || '',
          }
        : null,
      openPRs: status.github.openPRs || [],
      latestWorkflowRun: status.github.latestWorkflowRun || null,
      nextRequired: status.github.nextRequired || '',
    }
  }
  if (toolId === 'vercel.status') {
    return {
      projectId: status.vercel.projectId,
      projectName: status.vercel.projectName || '',
      productionDomain: status.vercel.productionDomain,
      reachable: Boolean(status.vercel.reachable),
      status: status.vercel.status,
      latestProductionDeployment: status.vercel.latestProductionDeployment,
      latestDeployments: (status.vercel.latestDeployments || []).slice(0, 3),
      nextRequired: status.vercel.nextRequired || '',
    }
  }
  if (toolId === 'supabase.status') {
    return {
      accessTokenPresent: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
      dbUrlPresent: Boolean(process.env.SUPABASE_DB_URL),
      frontendUrlPresent: Boolean(process.env.VITE_SUPABASE_URL),
      frontendAnonKeyPresent: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
      status: process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_URL ? 'configured' : 'unavailable',
      nextRequired: process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_URL
        ? ''
        : 'Configurar SUPABASE_ACCESS_TOKEN, SUPABASE_DB_URL ou VITE_SUPABASE_URL no backend.',
    }
  }
  return {}
}

async function executeReadOnlyTool(toolId) {
  if (toolId === 'github.status' || toolId === 'vercel.status') {
    const status = await collectConnectorsStatusReadOnly()
    return {
      executed: true,
      executionMode: 'read_only_connector',
      result: connectorSummaryFromStatus(status, toolId),
    }
  }
  if (toolId === 'supabase.status') {
    return {
      executed: true,
      executionMode: 'read_only_env_presence',
      result: connectorSummaryFromStatus(null, toolId),
    }
  }
  if (toolId === 'local_worker.status') {
    return executeLocalWorkerHealth()
  }
  return {
    executed: false,
    executionMode: 'not_supported',
    result: null,
  }
}

async function executeLocalWorkerHealth() {
  const workerUrl = process.env.LOCAL_WORKER_URL
  const workerToken = process.env.LOCAL_WORKER_TOKEN
  if (!workerUrl || !workerToken) {
    return {
      executed: true,
      executionMode: 'read_only_env_presence',
      result: {
        status: 'unavailable',
        reachable: false,
        configured: false,
        allowedActions: [],
        nextRequired: 'Configurar LOCAL_WORKER_URL e LOCAL_WORKER_TOKEN no backend.',
      },
    }
  }

  if (!globalThis.fetch) {
    return {
      executed: true,
      executionMode: 'read_only_env_presence',
      result: {
        status: 'unavailable',
        reachable: false,
        configured: true,
        allowedActions: [],
        nextRequired: 'fetch não disponível neste ambiente.',
      },
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`${workerUrl}/health`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${workerToken}` },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        executed: true,
        executionMode: 'read_only_connector',
        result: {
          status: 'available',
          reachable: true,
          configured: true,
          projectPath: data.projectPath || '',
          allowedActions: Array.isArray(data.allowedActions) ? data.allowedActions : [],
          checkpoint: data.checkpoint || 'H5.2A',
          secretsExposed: false,
        },
      }
    }

    return {
      executed: true,
      executionMode: 'read_only_connector',
      result: {
        status: 'partial',
        reachable: true,
        configured: true,
        allowedActions: [],
        nextRequired: `Worker respondeu HTTP ${response.status} — verificar token e configuração.`,
      },
    }
  } catch (err) {
    return {
      executed: true,
      executionMode: 'read_only_connector',
      result: {
        status: 'unavailable',
        reachable: false,
        configured: true,
        allowedActions: [],
        nextRequired: `Worker não acessível em ${workerUrl} — verificar se está rodando.`,
      },
    }
  }
}

function buildCapabilityDetail(item) {
  if (item.executionClass === EXECUTION_CLASSES.BLOCKED) {
    return `   BLOQUEADO. Ação destrutiva ou sem ferramenta segura.`
  }
  const missing = item.missing.length ? item.missing.join(', ') : 'nenhum'
  if (item.executionClass === EXECUTION_CLASSES.MUTATION_REQUIRES_CONFIRMATION) {
    return `   Classe: ${item.executionClass}. Status: ${item.configured ? 'available' : 'unavailable'} para preparar. Mutação exige confirmação explícita, evidência, rollback e rota dedicada. Faltando: ${missing}.`
  }
  if (item.executionClass === EXECUTION_CLASSES.EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER) {
    return `   Classe: ${item.executionClass}. Status: ${item.configured ? 'available' : 'unavailable'}. Faltando: ${missing}.`
  }
  return `   Classe: ${item.executionClass}. Status: ${item.configured ? 'available' : 'unavailable'}. Faltando: ${missing}.`
}

function buildGithubDetail(result) {
  const lines = []
  lines.push(`   Status: ${redact(result.status || 'unavailable')}.`)
  if (result.repository) lines.push(`   Repositório: ${redact(result.repository)}.`)
  if (result.branch) lines.push(`   Branch: ${redact(result.branch)}.`)
  if (result.defaultBranch && result.defaultBranch !== result.branch) lines.push(`   Branch padrão: ${redact(result.defaultBranch)}.`)
  if (result.reachable) lines.push('   Repositório acessível: sim.')
  if (result.latestCommit) {
    const c = result.latestCommit
    lines.push(`   Último commit: ${redact(c.shortSha)} — ${redact(c.message)}.`)
    if (c.author || c.date) lines.push(`   Autor/data: ${redact(c.author || '—')} | ${redact(c.date || '—')}.`)
  }
  const prs = result.openPRs || []
  if (prs.length) {
    lines.push(`   PRs abertos (${prs.length}):`)
    for (const pr of prs) lines.push(`     #${pr.number} ${redact(pr.title)} [${redact(pr.branch)}]`)
  }
  const wf = result.latestWorkflowRun
  if (wf) {
    const wfStatus = [wf.status, wf.conclusion].filter(Boolean).join('/')
    lines.push(`   Último workflow: ${redact(wf.name)} — ${redact(wfStatus)}.`)
  }
  if (result.nextRequired) lines.push(`   Próximo: ${result.nextRequired}`)
  return lines
}

function buildVercelDetail(result) {
  const lines = []
  lines.push(`   Status: ${redact(result.status || 'unavailable')}.`)
  if (result.projectId) lines.push(`   Projeto: ${redact(result.projectId)}.`)
  if (result.projectName) lines.push(`   Nome: ${redact(result.projectName)}.`)
  if (result.productionDomain) lines.push(`   Domínio de produção: ${redact(result.productionDomain)}.`)
  if (result.reachable) lines.push('   Projeto acessível: sim.')
  const prod = result.latestProductionDeployment
  if (prod) {
    lines.push(`   Último deploy produção: ${redact(prod.state || 'status indisponível')}.`)
    if (prod.url) lines.push(`   URL do deploy: ${redact(prod.url)}.`)
    if (prod.createdAt) lines.push(`   Criado em: ${redact(prod.createdAt)}.`)
    if (prod.commitMessage) lines.push(`   Commit: ${redact(prod.commitSha || '')} — ${redact(prod.commitMessage)}.`)
    if (prod.creator) lines.push(`   Criador: ${redact(prod.creator)}.`)
  } else {
    const deploys = result.latestDeployments || []
    if (deploys.length) {
      const d = deploys[0]
      lines.push(`   Último deployment: ${redact(d.state || 'status indisponível')}.`)
      if (d.url) lines.push(`   URL: ${redact(d.url)}.`)
    }
  }
  if (result.nextRequired) lines.push(`   Próximo: ${result.nextRequired}`)
  return lines
}

function buildToolExecutionReply({ requestTools = [], executions = [] } = {}) {
  if (!requestTools.length) {
    return [
      'Status de execução por ferramentas Apex:',
      '- Nenhuma ferramenta H5 conhecida foi identificada nesse pedido.',
      '',
      'Nenhum segredo foi exibido. Nenhum deploy, migration, push, commit, comando local, ação desktop ou mutação foi executado.',
    ].join('\n')
  }

  const count = requestTools.length
  const header = count > 1
    ? `Apex AI Copilot [H5.1B] — análise multi-ferramenta (${count} intenções detectadas):`
    : `Apex AI Copilot [H5.1B] — análise de ferramenta H5:`

  const lines = [header]

  for (let i = 0; i < requestTools.length; i++) {
    const item = requestTools[i]
    lines.push('')
    lines.push(`${i + 1}. ${item.label}`)
    lines.push(buildCapabilityDetail(item))

    const exec = executions.find(e => e.toolId === item.id)
    if (exec?.executed && exec.result) {
      if (item.id === 'github.status') {
        lines.push(...buildGithubDetail(exec.result))
      } else if (item.id === 'vercel.status') {
        lines.push(...buildVercelDetail(exec.result))
      } else if (item.id === 'local_worker.status') {
        const r = exec.result
        if (r?.status) lines.push(`   Status: ${redact(r.status)}.`)
        if (r?.reachable) lines.push('   Worker acessível: sim.')
        if (r?.projectPath) lines.push(`   Projeto: ${redact(r.projectPath)}.`)
        if (Array.isArray(r?.allowedActions) && r.allowedActions.length) {
          lines.push(`   Ações permitidas (${r.allowedActions.length}): ${r.allowedActions.slice(0, 5).join(', ')}${r.allowedActions.length > 5 ? '...' : ''}.`)
        }
        if (r?.nextRequired) lines.push(`   Próximo: ${r.nextRequired}`)
      } else {
        if (exec.result?.status) lines.push(`   Status conector: ${redact(exec.result.status)}.`)
        if (exec.result?.projectId) lines.push(`   Projeto: ${redact(exec.result.projectId)}.`)
        if (exec.result?.productionDomain) lines.push(`   Domínio: ${redact(exec.result.productionDomain)}.`)
      }
    } else if (!exec?.executed && item.executionClass === 'mutation_requires_confirmation') {
      lines.push(`   Ação: nenhum deploy, migration, push ou mutação foi executado. Confirmação explícita, evidência e rollback exigidos.`)
    }
  }

  lines.push('')
  lines.push('Nenhum segredo foi exibido. Nenhum deploy, migration, push, commit, comando local, ação desktop ou mutação foi executado.')
  return lines.join('\n')
}

// ─── H6.0 Execution Policy Router ────────────────────────────────────────────

// H6 only handles actions not already covered by H5 tool registry (git/npm local ops)
const H6_EXCLUSIVE_ACTIONS = new Set([
  'git.status', 'git.log', 'git.diff', 'git.diff_stat', 'git.branch', 'git.remote', 'git.stash_list',
  'git.add', 'git.add_files', 'git.commit', 'git.push', 'git.push_u', 'git.checkout_b',
  'git.fetch', 'git.rebase', 'git.merge', 'git.stash', 'git.stash_pop',
  'git.push_force', 'git.reset_hard', 'git.clean',
  'node.version', 'npm.version', 'git.version',
  'npm.build', 'npm.test', 'npm.lint', 'npm.list', 'npm.outdated', 'npm.audit',
  'npm.install', 'npm.install_pkg', 'npm.uninstall_pkg',
  'validate.h44', 'validate.h5', 'validate.h6',
])

export function routeH6ActionRequest({ userMessage = '' } = {}) {
  const actionIds = classifyH6ActionRequest(userMessage).filter(id => H6_EXCLUSIVE_ACTIONS.has(id))
  if (!actionIds.length) return null

  const actions = actionIds.map(id => ACTION_CATALOG.find(a => a.id === id)).filter(Boolean)
  if (!actions.length) return null

  const needsConfirmation = actions.filter(a => a.requiresConfirmation)
  const directActions    = actions.filter(a => !a.requiresConfirmation)

  if (needsConfirmation.length === 1 && directActions.length === 0) {
    return {
      ok: true,
      mode: 'h6-action-confirmation-required',
      intent: 'h6_action_request',
      requestedActionIds: actionIds,
      requiresApproval: true,
      finalReply: buildConfirmationReply(needsConfirmation[0].id),
      secretsExposed: false,
    }
  }

  if (needsConfirmation.length > 0) {
    const plans = needsConfirmation.map(a => buildConfirmationReply(a.id)).join('\n\n---\n\n')
    return {
      ok: true,
      mode: 'h6-multi-action-confirmation-required',
      intent: 'h6_action_request',
      requestedActionIds: actionIds,
      requiresApproval: true,
      finalReply: [
        `Apex AI Copilot [H6.0] — ${needsConfirmation.length} ação(ões) exigem confirmação:\n`,
        plans,
        '\nNenhum segredo exibido. Nenhuma ação executada até confirmação.',
      ].join('\n'),
      secretsExposed: false,
    }
  }

  return null
}

export async function routeToolExecution({
  userMessage = '',
  requestedToolIds = [],
  allowMutations = false,
} = {}) {
  const classifiedToolIds = requestedToolIds.length ? requestedToolIds : classifyToolExecutionRequest(userMessage)
  const requestTools = classifiedToolIds
    .map(toolId => getToolDefinition(toolId))
    .filter(Boolean)
    .map(tool => ({
      id: tool.id,
      label: tool.label,
      provider: tool.provider,
      executionClass: tool.executionClass,
      capability: tool.capability,
      configured: tool.isConfigured(),
      missing: tool.missing(),
      mutates: tool.mutates,
      ...capabilityStatus(tool),
    }))

  const executions = []
  for (const item of requestTools) {
    if (item.executionClass === EXECUTION_CLASSES.READ_ONLY && item.configured) {
      executions.push({ toolId: item.id, ...(await executeReadOnlyTool(item.id)) })
      continue
    }
    executions.push({
      toolId: item.id,
      executed: false,
      executionMode: item.executionClass,
      blockedReason: item.executionClass === EXECUTION_CLASSES.MUTATION_REQUIRES_CONFIRMATION && !allowMutations
        ? 'mutation_requires_explicit_confirmation'
        : item.configured ? '' : `missing: ${item.missing.join(', ')}`,
      result: null,
    })
  }

  return {
    ok: true,
    mode: 'tool-execution-router-h5',
    intent: requestTools.length ? 'tool_execution_capability' : 'tool_execution_unmatched',
    requestedToolIds: requestTools.map(tool => tool.id),
    executionClasses: [...new Set(requestTools.map(tool => tool.executionClass))],
    tools: requestTools,
    executions,
    capabilityMatrix: getExecutionCapabilityMatrix(),
    registry: getToolRegistry(),
    finalReply: buildToolExecutionReply({ requestTools, executions }),
  }
}
