export const APEX_REASONING_CORE_VERSION = 'CP15X-G1'

export function isApexReasoningCoreIntent(text = '') {
  const value = String(text || '').toLowerCase().trim()
  if (!value) return false

  return /\b(agora|pr[oó]ximo|proximo|passo|status|plataforma|checkpoint|continua|continuar|seguir|sugere|sugest[aã]o|o que fazer|o que fazemos|tudo certo|ficou certo|pode seguir|fa[cç]a|execute|executa|ok|valida|validar|fechar|finalizar|commitar|commit|revisar|aprovar|terminar)\b/i.test(value)
}

export function selectApexReasoningEvidenceCommands(userText = '') {
  const text = String(userText || '').toLowerCase()
  const commands = ['git_status', 'git_diff_stat', 'check_server']

  if (/\b(build|validar|valida|tudo certo|ficou certo|fechar|finalizar|checkpoint|pode seguir|execute|fa[cç]a|ok|pronto|seguro)\b/i.test(text)) {
    commands.push('build')
  }

  return [...new Set(commands)]
}

export function summarizeApexToolResult(result = {}) {
  return {
    commandId: result.commandId || '',
    label: result.label || result.commandId || '',
    providerStatus: result.providerStatus || '',
    status: result.status || '',
    exitCode: typeof result.exitCode === 'number' ? result.exitCode : result.exitCode ?? null,
    durationMs: typeof result.durationMs === 'number' ? result.durationMs : null,
    stdout: String(result.stdout || '').slice(0, 5000),
    stderr: String(result.stderr || '').slice(0, 5000),
    error: String(result.error || ''),
    reason: String(result.reason || ''),
  }
}

export function inferApexOperationalDecision(results = []) {
  const safeResults = Array.isArray(results) ? results : []
  const byId = Object.fromEntries(safeResults.map(result => [result.commandId, result]))

  const statusText = String(byId.git_status?.stdout || '').trim()
  const diffText = String(byId.git_diff_stat?.stdout || '').trim()
  const changedNamesText = String(byId.git_diff_name_only?.stdout || '').trim()
  const logText = String(byId.git_log_recent?.stdout || '').trim()

  const checkServer = byId.check_server
  const build = byId.build

  const treeClean = !statusText
  const hasPendingChanges = Boolean(statusText)

  const serverOk = checkServer
    ? checkServer.status === 'completed' && checkServer.exitCode === 0
    : null

  const buildOk = build
    ? build.status === 'completed' && build.exitCode === 0
    : null

  const pending = []
  if (serverOk === false) pending.push('server.mjs check failed or did not complete.')
  if (buildOk === false) pending.push('build failed or did not complete.')
  if (hasPendingChanges) pending.push('There are uncommitted local changes.')

  let overall = 'YELLOW'
  let recommendation = ''
  let nextSafeExecution = ''

  if (treeClean && (serverOk === true || serverOk === null) && (buildOk === true || buildOk === null)) {
    overall = 'GREEN'
    recommendation = 'The current checkpoint is clean. Recommend moving to the next planned checkpoint.'
    nextSafeExecution = 'Start the next implementation patch. Validate with git status, check_server and build before commit.'
  } else if (hasPendingChanges && (serverOk === true || serverOk === null) && (buildOk === true || buildOk === null)) {
    overall = 'YELLOW'
    recommendation = 'The implementation appears technically valid but has pending local changes. Recommend reviewing the diff and closing the checkpoint with an approved commit.'
    nextSafeExecution = 'Review diff stat and changed names. Commit directly or through an approved commit tool.'
  } else {
    overall = 'YELLOW'
    recommendation = 'Há validações falhando — revise antes de commitar.'
    nextSafeExecution = 'Inspect the failing command output and patch the smallest safe scope.'
  }

  return {
    version: APEX_REASONING_CORE_VERSION,
    overall,
    treeClean,
    hasPendingChanges,
    serverOk,
    buildOk,
    pending,
    recommendation,
    nextSafeExecution,
    statusText,
    diffText,
    changedNamesText,
    logText,
  }
}

export function buildApexReasoningFrame({
  userText = '',
  identityContext = {},
  toolResults = [],
} = {}) {
  if (!isApexReasoningCoreIntent(userText)) return ''

  const summarizedResults = toolResults.map(summarizeApexToolResult)
  const decision = inferApexOperationalDecision(summarizedResults)

  return [
    `APEX_REASONING_CORE_VERSION=${APEX_REASONING_CORE_VERSION}`,
    'This is the operational reasoning frame. Treat it as live project evidence when present.',
    `User text: ${String(userText || '').slice(0, 2000)}`,
    `Identity/context: ${JSON.stringify({
      email: identityContext.email || '',
      role: identityContext.role || '',
      workspaceName: identityContext.workspaceName || '',
      isOwnerAdmin: Boolean(identityContext.isOwnerAdmin),
    })}`,
    '',
    'Decision policy:',
    '- Answer as a senior Apex platform copilot, not as a generic chatbot.',
    '- Do not ask vague next-step questions when evidence supports a clear recommendation.',
    '- Use GREEN and YELLOW naturally.',
    '- Never claim commit, push, deploy, migration, file edit, install or production change unless a tool result proves that exact action.',
    '- Current live validation tools can inspect repo/build/server evidence. They cannot commit or push unless an approved commit tool exists.',
    '- If commit is recommended, state it is recommended and needs explicit approval or an approved commit tool.',
    '- Every operational answer should include: what is proven, what is pending, recommendation and next safe execution.',
    '',
    'Evidence results:',
    JSON.stringify(summarizedResults, null, 2),
    '',
    'Operational decision:',
    JSON.stringify(decision, null, 2),
  ].join('\n')
}

export function buildApexReasoningSystemPrompt() {
  return [
    'Apex Reasoning Core is enabled.',
    'Before giving operational next steps, use the reasoning frame when available.',
    'Do not behave like a generic assistant asking what the user wants to do next.',
    'Diagnose, decide, recommend and propose the next safe execution.',
    'Be truthful: never claim execution that is not proven by a tool result.',
  ].join(' ')
}
