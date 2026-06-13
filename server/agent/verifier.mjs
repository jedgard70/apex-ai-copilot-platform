export function summarizeEvidence(results = []) {
  const byId = Object.fromEntries(results.map(result => [result.commandId, result]))
  const statusText = String(byId.git_status?.stdout || '').trim()
  const diffStat = String(byId.git_diff_stat?.stdout || '').trim()
  const changedNames = String(byId.git_diff_name_only?.stdout || '').trim()
  const logRecent = String(byId.git_log_recent?.stdout || '').trim()
  const serverOk = byId.check_server ? byId.check_server.status === 'completed' && byId.check_server.exitCode === 0 : null
  const reasoningOk = byId.check_reasoning_core ? byId.check_reasoning_core.status === 'completed' && byId.check_reasoning_core.exitCode === 0 : null
  const buildOk = byId.build ? byId.build.status === 'completed' && byId.build.exitCode === 0 : null
  const hasPendingChanges = Boolean(statusText)
  const failed = results.filter(result => !['completed', 'skipped'].includes(result.status) || (typeof result.exitCode === 'number' && result.exitCode !== 0))

  let status = 'GREEN'
  if (failed.length) status = 'BLOCKED'
  else if (hasPendingChanges || buildOk === null) status = 'YELLOW'

  return {
    status,
    hasPendingChanges,
    statusText,
    diffStat,
    changedNames,
    logRecent,
    serverOk,
    reasoningOk,
    buildOk,
    failedCommands: failed.map(result => result.commandId),
  }
}

export function buildDecision({ intent, evidence, policyDecision }) {
  if (intent === 'raw_shell_request') {
    return {
      status: policyDecision.canRunRawShell ? 'YELLOW' : 'BLOCKED',
      decision: policyDecision.reason,
      recommendedAction: policyDecision.canRunRawShell
        ? 'Execute the approved local raw shell command and report stdout/stderr.'
        : 'Ask the Owner for the exact command or infer a safe allowlisted diagnostic from context. Do not rely on button clicks or magic phrases.',
      requiresApproval: !policyDecision.canRunRawShell,
    }
  }

  if (!policyDecision.ok) {
    return {
      status: 'BLOCKED',
      decision: policyDecision.reason,
      recommendedAction: 'Stop. Prepare a safe scope and request explicit Owner approval for any blocked operation.',
      requiresApproval: true,
    }
  }

  if (evidence.failedCommands.length) {
    return {
      status: 'BLOCKED',
      decision: `Validation failed: ${evidence.failedCommands.join(', ')}.`,
      recommendedAction: 'Fix the failing validation before committing or moving forward.',
      requiresApproval: false,
    }
  }

  if (intent === 'approved_commit_request') {
    return {
      status: evidence.hasPendingChanges ? 'YELLOW' : 'GREEN',
      decision: evidence.hasPendingChanges ? 'Explicit commit approval detected and pending changes exist.' : 'Explicit commit approval detected, but no pending changes exist.',
      recommendedAction: evidence.hasPendingChanges ? 'Executar o commit local aprovado e reportar hash/status.' : 'Nao ha commit necessario. Avancar para o proximo checkpoint.',
      requiresApproval: false,
    }
  }

  if (evidence.hasPendingChanges) {
    return {
      status: 'YELLOW',
      decision: 'Repo has pending local changes.',
      recommendedAction: 'Revisar o diff, validar o build quando necessario e fechar o checkpoint quando voce autorizar claramente.',
      requiresApproval: true,
    }
  }

  return {
    status: evidence.buildOk === true ? 'GREEN' : 'YELLOW',
    decision: evidence.buildOk === true ? 'Repo is clean and requested validations passed.' : 'Repo is clean; build was not run for this intent.',
    recommendedAction: 'Continuar para o proximo checkpoint com o mesmo fluxo: evidencias, decisao, execucao segura e validacao.',
    requiresApproval: false,
  }
}
