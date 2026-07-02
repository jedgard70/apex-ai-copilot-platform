import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { collectProductionOperatorStatus } from './productionStatus.mjs'
import { redactOutput } from './executor.mjs'
import { buildControlledExecutionGate, isPathInsideRepo } from './policy.mjs'
import { buildConnectorsStatusReply, classifyConnectorStatusIntent, collectConnectorsStatusReadOnly } from './connectorsStatus.mjs'

const MAX_OUTPUT = 60000

const MUTATION_PATTERNS = [
  /\b(commit|push|deploy|publish|publicar|publica|migration|migracao|migra[cç][aã]o)\b/i,
  /\b(delete|deletar|remover|remove|rm\s+-rf|rmdir|del\s+\/s|truncate|drop\s+(database|schema|table))\b/i,
  /\b(write|escrever|alterar|editar|criar arquivo|salvar|apply|aplicar)\b/i,
  /\b(service[_-]?role|secret|segredo|token|password|senha|\.env)\b/i,
]

const CONTROLLED_COMMANDS = {
  repository_status: {
    executable: 'git',
    args: ['status', '--short'],
    timeoutMs: 15000,
    label: 'status do repositório',
  },
  git_log: {
    executable: 'git',
    args: ['log', '--oneline', '-5'],
    timeoutMs: 15000,
    label: 'histórico recente do Git',
  },
  check_server: {
    executable: 'node',
    args: ['--check', 'server.mjs'],
    timeoutMs: 30000,
    label: 'validação de server.mjs',
  },
  check_operator_runtime: {
    executable: 'node',
    args: ['--check', 'server/agent/apexOperatorRuntime.mjs'],
    timeoutMs: 30000,
    optionalFile: 'server/agent/apexOperatorRuntime.mjs',
    label: 'validação do runtime do operador',
  },
  check_production_status: {
    executable: 'node',
    args: ['--check', 'server/agent/productionStatus.mjs'],
    timeoutMs: 30000,
    optionalFile: 'server/agent/productionStatus.mjs',
    label: 'validação do status de produção',
  },
  check_production_router: {
    executable: 'node',
    args: ['--check', 'server/agent/productionConversationRouter.mjs'],
    timeoutMs: 30000,
    optionalFile: 'server/agent/productionConversationRouter.mjs',
    label: 'validação do roteador de conversa',
  },
  check_controlled_executor: {
    executable: 'node',
    args: ['--check', 'server/agent/controlledExecutor.mjs'],
    timeoutMs: 30000,
    optionalFile: 'server/agent/controlledExecutor.mjs',
    label: 'validação do executor controlado',
  },
  check_chat_route: {
    executable: 'node',
    args: ['--check', 'api/copilot/chat.mjs'],
    timeoutMs: 30000,
    optionalFile: 'api/copilot/chat.mjs',
    label: 'validação da rota de conversa',
  },
  check_operator_unified_route: {
    executable: 'node',
    args: ['--check', 'api/copilot/operator.mjs'],
    timeoutMs: 30000,
    optionalFile: 'api/copilot/operator.mjs',
    label: 'validação da rota unificada do operador',
  },
  check_execution_unified_route: {
    executable: 'node',
    args: ['--check', 'api/copilot/execution.mjs'],
    timeoutMs: 30000,
    optionalFile: 'api/copilot/execution.mjs',
    label: 'validação da rota unificada de execução',
  },
  check_connector_status_route: {
    executable: 'node',
    args: ['--check', 'api/copilot/connector-status.mjs'],
    timeoutMs: 30000,
    optionalFile: 'api/copilot/connector-status.mjs',
    label: 'validação da rota de conectores',
  },
  build_validation: {
    executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'build'],
    timeoutMs: 120000,
    label: 'validação de compilação',
  },
}

const TASK_COMMANDS = {
  repository_status: ['repository_status', 'git_log'],
  git_log: ['git_log'],
  route_validation: ['check_chat_route', 'check_operator_unified_route', 'check_execution_unified_route', 'check_connector_status_route'],
  validation: ['check_server', 'check_operator_runtime', 'check_production_status', 'check_production_router', 'check_controlled_executor', 'check_chat_route', 'check_operator_unified_route', 'check_execution_unified_route', 'check_connector_status_route'],
  build_validation: ['check_server', 'check_operator_runtime', 'check_controlled_executor', 'build_validation'],
}

function normalizeMessage(message = '') {
  return String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function appendLimited(current, chunk) {
  const next = current + chunk
  if (Buffer.byteLength(next, 'utf8') <= MAX_OUTPUT) return next
  return next.slice(0, MAX_OUTPUT) + '\n[saída truncada]'
}

function resolveExecutable(executable) {
  if (executable !== 'git') return executable
  const githubDesktopGit = 'C:\\Users\\apexg\\AppData\\Local\\GitHubDesktop\\app-3.5.12\\resources\\app\\git\\cmd\\git.exe'
  return fs.existsSync(githubDesktopGit) ? githubDesktopGit : executable
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || process.env.APEX_SIMULATE_VERCEL_GIT_UNAVAILABLE === '1'
}

function hasLocalGitRepository(repoPath) {
  return fs.existsSync(path.join(repoPath, '.git'))
}

function hasGitExecutable() {
  const resolved = resolveExecutable('git')
  if (resolved !== 'git') return fs.existsSync(resolved)
  const pathEntries = String(process.env.PATH || '').split(path.delimiter).filter(Boolean)
  const executableNames = process.platform === 'win32' ? ['git.exe', 'git.cmd', 'git.bat'] : ['git']
  return pathEntries.some(entry => executableNames.some(name => fs.existsSync(path.join(entry, name))))
}

export function inspectControlledRuntime(repoPath = process.cwd(), productionStatus = collectProductionOperatorStatus()) {
  const githubConnector = (productionStatus.connectors || []).find(connector => connector.id === 'github')
  const localRepoAvailable = hasLocalGitRepository(repoPath)
  const gitExecutableAvailable = hasGitExecutable()
  const vercelRuntime = isVercelRuntime()

  return {
    vercelRuntime,
    localRepoAvailable,
    gitExecutableAvailable,
    localGitAvailable: !vercelRuntime && localRepoAvailable && gitExecutableAvailable,
    githubConnectorConfigured: Boolean(githubConnector?.configured),
  }
}

function prepareCommand(command) {
  if (command.executable !== 'npm.cmd' && command.executable !== 'npm') {
    return {
      executable: resolveExecutable(command.executable),
      args: command.args,
      display: [command.executable, ...command.args].join(' '),
    }
  }

  const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  const resolvedNpmCli = path.resolve(npmCli)
  if (fs.existsSync(resolvedNpmCli)) {
    return {
      executable: process.execPath,
      args: [resolvedNpmCli, ...command.args],
      display: [command.executable, ...command.args].join(' '),
    }
  }

  return {
    executable: command.executable,
    args: command.args,
    display: [command.executable, ...command.args].join(' '),
  }
}

export function classifyControlledExecutionRequest(message = '', operatorIntent = '') {
  const text = normalizeMessage(message)
  const connectorIntent = classifyConnectorStatusIntent(message)

  if (connectorIntent) return [connectorIntent]

  if (MUTATION_PATTERNS.some(pattern => pattern.test(text))) return ['validation']
  if (/\b(status do repositorio|status do repo|git status|repositorio|reposit[oó]rio)\b/i.test(message)) return ['repository_status']
  if (/\b(git log|historico|hist[oó]rico|ultimos commits|últimos commits)\b/i.test(message)) return ['git_log']
  if (/\b(build|compilacao|compila[cç][aã]o)\b/i.test(message)) return ['build_validation']
  if (/\b(rota|rotas|route|handler|api)\b/i.test(message)) return ['route_validation']
  if (/\b(github)\b/i.test(message)) return ['github_connector_status']
  if (/\b(vercel)\b/i.test(message)) return ['vercel_connector_status']
  if (/\b(conector|conectores|ambiente|variaveis|variáveis|vercel|supabase)\b/i.test(message)) return ['connector_status']
  if (/\b(valida|validar|validacao|valida[cç][aã]o|verifica|verificar|teste|testar)\b/i.test(message)) return ['validation', 'connector_status']
  if (operatorIntent === 'status_request') return ['repository_status', 'connector_status']
  if (operatorIntent === 'validation_request') return ['validation', 'connector_status']
  return []
}

export function buildControlledExecutionPolicy({ tasks = [], operatorIntent = '', userMessage = '' } = {}) {
  const gate = buildControlledExecutionGate({ intent: operatorIntent, userMessage, tasks })

  if (!tasks.length) {
    return {
      ok: false,
      status: 'YELLOW',
      reason: 'Nenhuma tarefa controlada de leitura ou validação foi identificada.',
      requiresConfirmation: false,
      allowedTasks: [],
    }
  }

  if (!gate.ok) {
    return {
      ok: false,
      status: gate.status,
      reason: `${gate.reason} Nenhuma ação foi executada.`,
      requiresConfirmation: gate.requiresConfirmation,
      risk: gate.risk,
      mutates: gate.mutates,
      allowedTasks: [],
    }
  }

  return {
    ok: true,
    status: 'YELLOW',
    reason: gate.reason,
    requiresConfirmation: false,
    risk: gate.risk,
    mutates: gate.mutates,
    allowedTasks: tasks.filter(task => task !== 'connector_status'),
  }
}

function connectorPresence(productionStatus = collectProductionOperatorStatus()) {
  return (productionStatus.connectors || []).map(connector => ({
    id: connector.id,
    label: connector.label,
    configured: Boolean(connector.configured),
    status: connector.status,
    detail: connector.detail,
  }))
}

function buildUnavailableGitResult(commandId, repoPath, productionStatus) {
  const command = CONTROLLED_COMMANDS[commandId]
  const runtime = inspectControlledRuntime(repoPath, productionStatus)
  const reason = runtime.vercelRuntime
    ? 'executor local indisponível no runtime Vercel'
    : !runtime.localRepoAvailable
      ? 'repositório Git local indisponível neste runtime'
      : 'binário Git indisponível neste runtime'
  const next = runtime.githubConnectorConfigured
    ? 'usar conector GitHub para consultar estado remoto ou acionar worker executor externo/local'
    : 'ação requer executor externo/local ou GitHub connector'

  return {
    commandId,
    command: command ? [command.executable, ...command.args].join(' ') : commandId,
    label: command?.label || 'Git local',
    status: 'unavailable',
    exitCode: null,
    durationMs: 0,
    stdout: '',
    stderr: `${reason}; ${next}.`,
    unavailableReason: reason,
    nextRequired: next,
  }
}

function runControlledCommand(commandId, repoPath, productionStatus) {
  const command = CONTROLLED_COMMANDS[commandId]
  if (!command) {
    return Promise.resolve({ commandId, status: 'blocked', exitCode: null, stdout: '', stderr: 'Tarefa desconhecida.' })
  }

  if (command.executable === 'git') {
    const runtime = inspectControlledRuntime(repoPath, productionStatus)
    if (!runtime.localGitAvailable) {
      return Promise.resolve(buildUnavailableGitResult(commandId, repoPath, productionStatus))
    }
  }

  if (command.optionalFile && !fs.existsSync(path.join(repoPath, command.optionalFile))) {
    return Promise.resolve({
      commandId,
      command: [command.executable, ...command.args].join(' '),
      label: command.label,
      status: 'skipped',
      exitCode: 0,
      durationMs: 0,
      stdout: '',
      stderr: `${command.optionalFile} não existe neste pacote.`,
    })
  }

  return new Promise(resolve => {
    const startedAt = Date.now()
    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false
    const prepared = prepareCommand(command)
    const child = spawn(prepared.executable, prepared.args, {
      cwd: repoPath,
      shell: false,
      windowsHide: true,
      env: { ...process.env, APEX_CONTROLLED_EXECUTOR: '1' },
    })

    const finish = (status, exitCode = null) => {
      if (settled) return
      settled = true
      resolve({
        commandId,
        command: prepared.display,
        label: command.label,
        status,
        exitCode,
        durationMs: Date.now() - startedAt,
        stdout: redactOutput(stdout),
        stderr: redactOutput(stderr),
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      stderr = appendLimited(stderr, `\nTempo limite atingido depois de ${command.timeoutMs}ms.`)
      child.kill('SIGTERM')
    }, command.timeoutMs)

    child.stdout.on('data', chunk => { stdout = appendLimited(stdout, chunk.toString('utf8')) })
    child.stderr.on('data', chunk => { stderr = appendLimited(stderr, chunk.toString('utf8')) })
    child.on('error', error => {
      clearTimeout(timer)
      stderr = appendLimited(stderr, error.message || String(error))
      finish('failed', null)
    })
    child.on('close', code => {
      clearTimeout(timer)
      finish(timedOut ? 'timeout' : code === 0 ? 'completed' : 'failed', code)
    })
  })
}

function summarizeCommands(results = []) {
  const unavailable = results.filter(result => result.status === 'unavailable')
  const failed = results.filter(result => !['completed', 'skipped', 'unavailable'].includes(result.status) || (typeof result.exitCode === 'number' && result.exitCode !== 0))
  let status = 'GREEN'
  if (failed.length) status = 'BLOCKED'
  else if (unavailable.length && unavailable.length === results.length) status = 'UNAVAILABLE'
  else if (unavailable.length) status = 'PARTIAL'
  return {
    status,
    failedCommandIds: failed.map(result => result.commandId),
    unavailableCommandIds: unavailable.map(result => result.commandId),
    commandProof: results.map(result => ({
      commandId: result.commandId,
      command: result.command,
      label: result.label,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdout: String(result.stdout || '').trim().slice(0, 1500),
      stderr: String(result.stderr || '').trim().slice(0, 1500),
      unavailableReason: result.unavailableReason || '',
      nextRequired: result.nextRequired || '',
    })),
  }
}

function buildControlledFinalReply({ tasks, policy, summary, connectors }) {
  if (!policy.ok) {
    return [
      `${policy.status} - execução controlada bloqueada.`,
      policy.reason,
      'H4 permite apenas leitura e validação: status do repositório, histórico Git, validação de rotas, validação de compilação e presença de conectores sem segredos.',
    ].join('\n')
  }

  const lines = []
  lines.push(summary.status === 'UNAVAILABLE'
    ? 'UNAVAILABLE - verificação local indisponível neste runtime; posso explicar o motivo e usar conectores remotos quando configurados.'
    : `${summary.status} - verificação controlada concluída.`)
  lines.push(`Tarefas: ${tasks.join(', ')}.`)

  if (summary.commandProof.length) {
    lines.push('Evidência:')
    for (const proof of summary.commandProof) {
      lines.push(`- ${proof.label}: ${proof.status}, saída ${proof.exitCode === null ? 'sem código' : proof.exitCode}.`)
      if (proof.stdout) lines.push(`  ${proof.stdout.split(/\r?\n/).slice(0, 3).join(' | ')}`)
      if (proof.status === 'unavailable') lines.push(`  ${proof.stderr}`)
      else if (proof.stderr && proof.status !== 'completed') lines.push(`  Erro: ${proof.stderr.split(/\r?\n/).slice(0, 4).join(' | ')}`)
    }
  }

  if (connectors.length) {
    const configured = connectors.filter(connector => connector.configured).map(connector => connector.id)
    const missing = connectors.filter(connector => !connector.configured).map(connector => connector.id)
    lines.push(`Conectores presentes: ${configured.length ? configured.join(', ') : 'nenhum conector operacional detectado'}.`)
    lines.push(`Conectores pendentes: ${missing.length ? missing.join(', ') : 'nenhum'}.`)
  }

  lines.push('Nenhum deploy, migração, commit, push, escrita, remoção ou comando livre foi executado nesta verificação.')
  return lines.join('\n')
}

export async function runControlledExecutor({
  userMessage = '',
  operatorIntent = '',
  repoPath = process.cwd(),
  productionStatus,
} = {}) {
  const resolvedRepo = path.resolve(repoPath || process.cwd())
  const tasks = [...new Set(classifyControlledExecutionRequest(userMessage, operatorIntent))]
  const policy = buildControlledExecutionPolicy({ tasks, operatorIntent, userMessage })
  const safeStatus = productionStatus || collectProductionOperatorStatus()

  if (!isPathInsideRepo(resolvedRepo, resolvedRepo)) {
    return {
      ok: false,
      status: 'BLOCKED',
      tasks,
      policy: { ...policy, ok: false, status: 'BLOCKED', reason: 'Repositório fora do escopo autorizado.' },
      commands: [],
      connectors: [],
      finalReply: 'BLOCKED - repositório fora do escopo autorizado. Nenhuma ação foi executada.',
    }
  }

  if (!policy.ok) {
    const blockedReply = buildControlledFinalReply({ tasks, policy, summary: { status: policy.status, commandProof: [] }, connectors: [] })
    return {
      ok: false,
      status: policy.status,
      tasks,
      policy,
      commands: [],
      connectors: [],
      finalReply: blockedReply,
    }
  }

  const commandIds = tasks
    .flatMap(task => TASK_COMMANDS[task] || [])
    .filter(Boolean)
  const uniqueCommandIds = [...new Set(commandIds)]
  const results = []
  for (const commandId of uniqueCommandIds) {
    results.push(await runControlledCommand(commandId, resolvedRepo, safeStatus))
  }

  const connectorStatus = await collectConnectorsStatusReadOnly()
  const connectors = tasks.some(task => ['connector_status', 'github_connector_status', 'vercel_connector_status'].includes(task))
    ? connectorPresence(safeStatus)
    : []
  const summary = summarizeCommands(results)
  const connectorOnly = tasks.length > 0 && tasks.every(task => ['connector_status', 'github_connector_status', 'vercel_connector_status'].includes(task))
  const connectorFocus = tasks.includes('github_connector_status')
    ? 'github'
    : tasks.includes('vercel_connector_status')
      ? 'vercel'
      : 'all'
  const finalReply = connectorOnly
    ? buildConnectorsStatusReply(connectorStatus, connectorFocus)
    : buildControlledFinalReply({ tasks, policy, summary, connectors })

  return {
    ok: connectorOnly || !['BLOCKED', 'UNAVAILABLE'].includes(summary.status),
    status: connectorOnly ? 'GREEN' : summary.status,
    tasks,
    policy,
    commands: summary.commandProof,
    connectors,
    connectorStatus,
    finalReply,
  }
}
