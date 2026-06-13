import path from 'node:path'

export const OPERATOR_STATUS = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLOCKED: 'BLOCKED',
}

const BLOCKED_TEXT_PATTERNS = [
  /push/i,
  /deploy/i,
  /vercel\s+--prod/i,
  /supabase\s+db\s+(push|reset)/i,
  /migration/i,
  /migrate/i,
  /service[_-]?role/i,
  /\.env/i,
  /raw\s*shell/i,
  /rm\s+-rf/i,
  /delete\s+from/i,
  /drop\s+(database|schema|table)/i,
]

const EXPLICIT_COMMIT_APPROVALS = [
  /aprovado,\s*commita/i,
  /sim,\s*pode\s+commitar/i,
  /commit\s+aprovado/i,
  /pode\s+fazer\s+o\s+commit/i,
  /\b(fecha|fechar|finaliza|finalizar).*\bcheckpoint\b/i,
]

const BLOCKED_PATH_PARTS = [
  '.env',
  'node_modules',
  'dist',
  'supabase/.temp',
  '.vercel',
]

export function isExplicitCommitApproval(text = '') {
  return EXPLICIT_COMMIT_APPROVALS.some(pattern => pattern.test(String(text || '')))
}

export function isBlockedOperationalText(text = '') {
  return BLOCKED_TEXT_PATTERNS.some(pattern => pattern.test(String(text || '')))
}

export function isPathInsideRepo(candidatePath, repoPath) {
  const resolvedRepo = path.resolve(repoPath)
  const resolvedCandidate = path.resolve(candidatePath || resolvedRepo)
  const relative = path.relative(resolvedRepo, resolvedCandidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

export function isAllowedProjectFile(filePath = '') {
  const normalized = String(filePath || '').replace(/\\/g, '/').toLowerCase()
  if (!normalized || normalized.startsWith('?? ')) return false
  return !BLOCKED_PATH_PARTS.some(part => normalized.includes(part))
}

export function buildPolicyDecision({ intent, userMessage, repoPath, permissions = {} } = {}) {
  const blockedByText = isBlockedOperationalText(userMessage)
  const commitApproved = isExplicitCommitApproval(userMessage)
  const canCommit = permissions.allowCommit === true && commitApproved
  const canRunRawShell = permissions.allowRawShell === true && permissions.approvalText === 'JOSE_APPROVES_LOCAL_EXECUTION'

  if (intent === 'raw_shell_request') {
    return {
      ok: true,
      status: canRunRawShell ? OPERATOR_STATUS.YELLOW : OPERATOR_STATUS.BLOCKED,
      requiresApproval: !canRunRawShell,
      reason: canRunRawShell
        ? 'Owner-approved raw shell is allowed for this local request.'
        : 'Shell livre is available as Owner-approved local raw_shell, but the runtime needs a concrete command to execute safely.',
      canCommit: false,
      canRunRawShell,
      repoPath,
    }
  }

  if (blockedByText && !commitApproved) {
    return {
      ok: false,
      status: OPERATOR_STATUS.BLOCKED,
      requiresApproval: true,
      reason: 'Request mentions a blocked production/destructive/sensitive action. No deploy, push, migration, raw shell or secret access is allowed.',
      canCommit: false,
    }
  }

  return {
    ok: true,
    status: OPERATOR_STATUS.YELLOW,
    requiresApproval: intent === 'approved_commit_request' && !canCommit,
    reason: canCommit
      ? 'Explicit commit approval detected. Local commit tool may run after evidence and changed-file checks.'
      : 'Safe local inspection is allowed. Mutating actions remain gated.',
    canCommit,
    repoPath,
  }
}
