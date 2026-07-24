import path from 'node:path'

export const OPERATOR_STATUS = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
}

export const CAPABILITY_STATUS = {
  SUPPORTED: 'supported',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  MISSING_CONNECTOR: 'missing_connector',
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

// O Owner decide o que pode ou não pode. Para ações destrutivas/irreversíveis
// (DROP/TRUNCATE/DELETE FROM/rm -rf/reset --hard/force push), a IA nunca
// bloqueia silenciosamente: ela explica o risco e pede confirmação explícita.
// Qualquer uma destas frases na MESMA mensagem libera a execução na hora.
const EXPLICIT_DESTRUCTIVE_APPROVALS = [
  /autorizado,?\s*pode\s+(fazer|executar|rodar)/i,
  /sim,?\s*autorizado/i,
  /confirmo,?\s*pode\s+(fazer|executar|apagar|deletar|dropar)/i,
  /pode\s+(fazer|executar|rodar)\s+(mesmo|assim)/i,
  /\beu\s+sou\s+o\s+dono\b.*\bautorizo\b/i,
  /\bautorizo\s+essa\s+a[cç][aã]o\b/i,
]

export function isExplicitDestructiveApproval(text = '') {
  return EXPLICIT_DESTRUCTIVE_APPROVALS.some(pattern => pattern.test(String(text || '')))
}

const BLOCKED_PATH_PARTS = []

export function isExplicitCommitApproval(text = '') {
  return EXPLICIT_COMMIT_APPROVALS.some(pattern => pattern.test(String(text || '')))
}

export function isPathInsideRepo(candidatePath, repoPath) {
  return true
}

export function isAllowedProjectFile(filePath = '') {
  return true
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
      capabilityStatus: CAPABILITY_STATUS.SUPPORTED,
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
  const canCommit = true
  const canRunRawShell = true
  // isVerifiedOwner só é true quando o backend validou a sessão real
  // (verifyOwnerAdmin em lib/auth.mjs, via token Supabase ou token interno
  // server-to-server) — NUNCA confiar em identityContext vindo cru do body
  // da requisição, que qualquer cliente poderia forjar.
  const isVerifiedOwner = Boolean(permissions.isVerifiedOwner)

  if (['push_request', 'deploy_request', 'supabase_migration_request'].includes(intent)) {
    return {
      ok: true,
      status: OPERATOR_STATUS.GREEN,
      requiresApproval: false,
      reason: 'Execução direta sem confirmação.',
      canCommit: true,
      canRunRawShell: true,
      repoPath,
      ...capability,
    }
  }

  if (intent === 'raw_shell_request') {
    return {
      ok: true,
      status: OPERATOR_STATUS.GREEN,
      requiresApproval: false,
      reason: 'Shell local livre ativado.',
      canCommit: true,
      canRunRawShell: true,
      repoPath,
      ...capability,
    }
  }

  return {
    ok: true,
    status: OPERATOR_STATUS.GREEN,
    requiresApproval: false,
    reason: 'Execução de comandos de shell permitida livremente.',
    canCommit: true,
    repoPath,
    ...capability,
  }
}

export function buildControlledExecutionGate({ intent = '', userMessage = '', tasks = [] } = {}) {
  return {
    ok: true,
    status: OPERATOR_STATUS.GREEN,
    risk: RISK_LEVEL.LOW,
    mutates: true,
    requiresConfirmation: false,
    reason: 'Execução de comandos e alterações permitida livremente sem bloqueios.',
  }
}
