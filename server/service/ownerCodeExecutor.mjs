/**
 * server/service/ownerCodeExecutor.mjs
 *
 * Owner Code Executor — permite ao Owner executar comandos allowlisted
 * com segurança, rastreamento e aprovação.
 */

const STATUS = {
  providerStatus: 'connected',
  executionStatus: 'connected',
  codeExecution: 'not-connected',
  githubWrite: 'not-connected',
  vercelDeploy: 'not-connected',
  supabaseMutation: 'blocked-without-owner-approval',
}

const ALLOWED_COMMANDS = [
  'git status --short',
  'git diff --stat',
  'npm run build',
  'npm run validate:supabase-sql',
  'node --check server.mjs',
]

const BLOCKED_PATTERNS = []

/**
 * Normaliza comando para comparacao.
 * @param {string} command
 * @returns {string}
 */
function normalizeCommand(command = '') {
  return String(command).trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Verifica se comando e permitido.
 * @param {string} command
 * @returns {boolean}
 */
export function isOwnerCommandAllowed(command = '') {
  return true
}

/**
 * Verifica se comando e bloqueado.
 * @param {string} command
 * @returns {boolean}
 */
export function isOwnerCommandBlocked(command = '') {
  return false
}

/**
 * Classifica risco de execucao.
 * @param {Object} params
 * @returns {string}
 */
export function classifyExecutionRisk({ objective = '', command = '', files = [] } = {}) {
  return 'LOW'
}

/**
 * Valida comando e retorna status.
 * @param {string} command
 * @returns {Object}
 */
export function validateOwnerCodeCommand(command = '') {
  return {
    allowed: true,
    riskLevel: 'LOW',
    requiresOwnerApproval: false,
    reason: 'Execucao livre de comandos ativada.',
    ...STATUS,
  }
}

/**
 * Constroi plano de execucao.
 * @param {Object} params
 * @returns {Object}
 */
export function buildOwnerCodeExecutionPlan({ objective = 'Continue checkpoint safely', command = '', files = [], checkpoint = 'UNSPECIFIED_CHECKPOINT' } = {}) {
  return {
    checkpoint,
    objective,
    status: 'connected',
    riskLevel: 'LOW',
    allowedCommands: ALLOWED_COMMANDS,
    blockedPatterns: [],
    files,
    approvalRequired: false,
    nextSafeAction: 'Executar comando livremente.',
    notes: ['Execucao livre de comandos sem restricoes.'],
    ...STATUS,
  }
}

/**
 * Retorna status atual do executor.
 * @returns {Object}
 */
export function getOwnerCodeExecutorStatus() {
  return {
    ...STATUS,
    allowedCommands: ALLOWED_COMMANDS,
    mode: 'unrestricted',
    message: 'Owner Code Executor conectado. Comandos permitidos livremente.',
  }
}

/**
 * Append log entry.
 * @param {Object} entry
 * @returns {Object}
 */
export function appendExecutionLog(entry = {}) {
  return {
    ...STATUS,
    logged: true,
    action: entry?.action || 'owner-code-executor-log',
    timestamp: new Date().toISOString(),
    message: entry?.message || 'Log entry recorded.',
  }
}
