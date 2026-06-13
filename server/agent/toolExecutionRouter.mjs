import { collectConnectorsStatusReadOnly } from './connectorsStatus.mjs'
import { EXECUTION_CLASSES, getExecutionCapabilityMatrix, getToolDefinition, getToolRegistry } from './toolRegistry.mjs'

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
  if (/\b(verifique|verificar|analise|analisar|cheque|validar|valide).*\b(modelo revit|revit|modelo bim|bim)\b/.test(text)) {
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
      reachable: Boolean(status.github.reachable),
      status: status.github.status,
      latestCommit: status.github.latestCommit
        ? {
            shortSha: status.github.latestCommit.shortSha,
            message: status.github.latestCommit.message,
            author: status.github.latestCommit.author,
            date: status.github.latestCommit.date,
          }
        : null,
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
  return {
    executed: false,
    executionMode: 'not_supported',
    result: null,
  }
}

function buildCapabilityLine(item) {
  if (item.executionClass === EXECUTION_CLASSES.BLOCKED) {
    return `- ${item.label}: BLOCKED. Motivo: ação destrutiva ou sem ferramenta segura.`
  }
  if (item.executionClass === EXECUTION_CLASSES.MUTATION_REQUIRES_CONFIRMATION) {
    return `- ${item.label}: ${item.configured ? 'available' : 'unavailable'} para preparar. Classe: ${item.executionClass}. Mutação exige confirmação explícita, evidência, rollback e rota dedicada. Faltando: ${item.missing.length ? item.missing.join(', ') : 'nenhum conector básico'}.`
  }
  if (item.executionClass === EXECUTION_CLASSES.EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER) {
    return `- ${item.label}: ${item.configured ? 'available' : 'unavailable'}. Classe: ${item.executionClass}. Faltando: ${item.missing.length ? item.missing.join(', ') : 'nenhum conector básico'}.`
  }
  return `- ${item.label}: ${item.configured ? 'available' : 'unavailable'}. Classe: ${item.executionClass}. Faltando: ${item.missing.length ? item.missing.join(', ') : 'nenhum'}.`
}

function buildToolExecutionReply({ requestTools = [], executions = [] } = {}) {
  const lines = ['Status de execução por ferramentas Apex:']
  if (!requestTools.length) {
    lines.push('- Nenhuma ferramenta H5 conhecida foi identificada nesse pedido.')
  }
  for (const item of requestTools) lines.push(buildCapabilityLine(item))
  const executed = executions.filter(execution => execution.executed)
  if (executed.length) {
    lines.push('')
    lines.push('Execução read-only realizada:')
    for (const execution of executed) {
      lines.push(`- ${execution.toolId}: ${execution.executionMode}.`)
      if (execution.result?.status) lines.push(`  Status: ${redact(execution.result.status)}.`)
      if (execution.result?.repository) lines.push(`  Repositório: ${redact(execution.result.repository)}.`)
      if (execution.result?.branch) lines.push(`  Branch: ${redact(execution.result.branch)}.`)
      if (execution.result?.projectId) lines.push(`  Projeto: ${redact(execution.result.projectId)}.`)
      if (execution.result?.productionDomain) lines.push(`  Domínio: ${redact(execution.result.productionDomain)}.`)
      if (execution.result?.latestCommit?.shortSha) lines.push(`  Último commit: ${redact(execution.result.latestCommit.shortSha)}.`)
      if (execution.result?.latestProductionDeployment?.state) lines.push(`  Último deploy produção: ${redact(execution.result.latestProductionDeployment.state)}.`)
    }
  }
  lines.push('')
  lines.push('Nenhum segredo foi exibido. Nenhum deploy, migration, push, commit, comando local, ação desktop ou mutação foi executado.')
  return lines.join('\n')
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
