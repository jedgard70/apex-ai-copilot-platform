import path from 'node:path'

export const OPERATOR_STATUS = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLOCKED: 'BLOCKED',
}

export const CAPABILITY_STATUS = {
  SUPPORTED: 'supported',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  MISSING_CONNECTOR: 'missing_connector',
  BLOCKED_DESTRUCTIVE: 'blocked_destructive',
}

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  DESTRUCTIVE: 'destructive',
}

const EXPLICIT_COMMIT_APPROVALS = [
  /aprovado,\s*commita/i,
  /sim,\s*pode\s+commitar/i,
  /commit\s+aprovado/i,
  /pode\s+fazer\s+o\s+commit/i,
  /pode\s+commitar/i,
  /\bcommita\b/i,
  /faz\s+o\s+commit/i,
  /fecha\s+com\s+commit/i,
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

function hasConnectorEnv(capability) {
  if (capability === 'deploy') return Boolean(process.env.VERCEL_TOKEN || process.env.VERCEL_ORG_ID || process.env.VERCEL_PROJECT_ID)
  if (capability === 'supabase') return Boolean(process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_DB_URL)
  if (capability === 'github') return Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN)
  return true
}

function classifyCapability(intent, userMessage = '') {
  if (intent === 'greeting_request') {
    return {
      capability: 'conversation',
      risk: RISK_LEVEL.LOW,
      capabilityStatus: CAPABILITY_STATUS.SUPPORTED,
      mutates: false,
    }
  }
  if (intent === 'destructive_request' || /\b(service[_-]?role|\.env|drop\s+(database|schema|table)|delete\s+from|rm\s+-rf)\b/i.test(userMessage)) {
    return {
      capability: 'destructive_operation',
      risk: RISK_LEVEL.DESTRUCTIVE,
      capabilityStatus: CAPABILITY_STATUS.BLOCKED_DESTRUCTIVE,
      mutates: true,
    }
  }
  if (intent === 'push_request') {
    return {
      capability: 'git_push',
      risk: RISK_LEVEL.HIGH,
      capabilityStatus: hasConnectorEnv('github') ? CAPABILITY_STATUS.REQUIRES_CONFIRMATION : CAPABILITY_STATUS.MISSING_CONNECTOR,
      mutates: true,
    }
  }
  if (intent === 'deploy_request') {
    return {
      capability: 'vercel_deploy',
      risk: RISK_LEVEL.HIGH,
      capabilityStatus: hasConnectorEnv('deploy') ? CAPABILITY_STATUS.REQUIRES_CONFIRMATION : CAPABILITY_STATUS.MISSING_CONNECTOR,
      mutates: true,
    }
  }
  if (intent === 'supabase_migration_request') {
    return {
      capability: 'supabase_migration',
      risk: RISK_LEVEL.HIGH,
      capabilityStatus: hasConnectorEnv('supabase') ? CAPABILITY_STATUS.REQUIRES_CONFIRMATION : CAPABILITY_STATUS.MISSING_CONNECTOR,
      mutates: true,
    }
  }
  if (intent === 'approved_commit_request') {
    return {
      capability: 'git_commit',
      risk: RISK_LEVEL.MEDIUM,
      capabilityStatus: CAPABILITY_STATUS.REQUIRES_CONFIRMATION,
      mutates: true,
    }
  }
  if (intent === 'code_implementation_request' || intent === 'checkpoint_close_request') {
    return {
      capability: intent === 'checkpoint_close_request' ? 'checkpoint_close' : 'file_edit',
      risk: RISK_LEVEL.MEDIUM,
      capabilityStatus: CAPABILITY_STATUS.REQUIRES_CONFIRMATION,
      mutates: true,
    }
  }
  if (intent === 'raw_shell_request') {
    return {
      capability: 'local_shell',
      risk: RISK_LEVEL.MEDIUM,
      capabilityStatus: CAPABILITY_STATUS.REQUIRES_CONFIRMATION,
      mutates: true,
    }
  }
  return {
    capability: 'local_validation',
    risk: RISK_LEVEL.LOW,
    capabilityStatus: CAPABILITY_STATUS.SUPPORTED,
    mutates: false,
  }
}

export function buildPolicyDecision({ intent, userMessage, repoPath, permissions = {} } = {}) {
  const capability = classifyCapability(intent, userMessage)
  const commitApproved = isExplicitCommitApproval(userMessage)
  const canCommit = permissions.allowCommit === true && commitApproved
  const canRunRawShell = permissions.allowRawShell === true && permissions.approvalText === 'JOSE_APPROVES_LOCAL_EXECUTION'

  if (capability.capabilityStatus === CAPABILITY_STATUS.BLOCKED_DESTRUCTIVE) {
    return {
      ok: false,
      status: OPERATOR_STATUS.BLOCKED,
      requiresApproval: true,
      reason: 'A acao e destrutiva ou sensivel. Precisa de preview, confirmacao forte e plano de rollback antes de qualquer execucao.',
      canCommit: false,
      canRunRawShell: false,
      repoPath,
      ...capability,
    }
  }

  if (['push_request', 'deploy_request', 'supabase_migration_request'].includes(intent)) {
    const connectorMissing = capability.capabilityStatus === CAPABILITY_STATUS.MISSING_CONNECTOR
    return {
      ok: true,
      status: OPERATOR_STATUS.YELLOW,
      requiresApproval: true,
      reason: connectorMissing
        ? 'Capacidade preparada, mas conector/credencial operacional nao esta configurado neste runtime.'
        : 'Capacidade suportada como acao remota de alto risco. Exige confirmacao natural explicita e evidencia antes de executar.',
      canCommit: false,
      canRunRawShell: false,
      repoPath,
      nextSetupStep: connectorMissing
        ? 'Configurar o conector/credencial apropriado e repetir com confirmacao explicita.'
        : 'Confirmar escopo, branch, evidencia e comando remoto exato antes da execucao.',
      ...capability,
    }
  }

  if (intent === 'raw_shell_request') {
    return {
      ok: true,
      status: canRunRawShell ? OPERATOR_STATUS.YELLOW : OPERATOR_STATUS.BLOCKED,
      requiresApproval: !canRunRawShell,
      reason: canRunRawShell
        ? 'Shell local aprovado pelo Owner pode executar comando concreto dentro do repositorio.'
        : 'Shell local existe como capacidade, mas precisa de comando concreto e confirmacao Jose antes de alterar o ambiente.',
      canCommit: false,
      canRunRawShell,
      repoPath,
      ...capability,
    }
  }

  return {
    ok: true,
    status: OPERATOR_STATUS.YELLOW,
    requiresApproval: intent === 'approved_commit_request' && !canCommit,
    reason: canCommit
      ? 'Confirmacao natural de commit detectada. Commit local pode rodar depois de evidencias e checagem de arquivos.'
      : 'Inspecao local segura permitida. Acoes que alteram estado continuam governadas por risco e confirmacao.',
    canCommit,
    repoPath,
    ...capability,
  }
}
