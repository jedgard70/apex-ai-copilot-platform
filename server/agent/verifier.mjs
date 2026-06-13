export function summarizeEvidence(results = []) {
  const byId = Object.fromEntries(results.map(result => [result.commandId, result]))
  const statusText = String(byId.git_status?.stdout || '').trim()
  const diffStat = String(byId.git_diff_stat?.stdout || '').trim()
  const changedNames = String(byId.git_diff_name_only?.stdout || '').trim()
  const logRecent = String(byId.git_log_recent?.stdout || '').trim()
  const serverOk = byId.check_server ? byId.check_server.status === 'completed' && byId.check_server.exitCode === 0 : null
  const reasoningOk = byId.check_reasoning_core ? byId.check_reasoning_core.status === 'completed' && byId.check_reasoning_core.exitCode === 0 : null
  const syntaxCommandIds = [
    'check_operator_runtime',
    'check_executor',
    'check_memory',
    'check_planner',
    'check_policy',
    'check_verifier',
    'check_build_tools',
    'check_file_tools',
    'check_git_tools',
  ]
  const syntaxChecks = syntaxCommandIds
    .filter(commandId => byId[commandId])
    .map(commandId => ({
      commandId,
      ok: byId[commandId].status === 'completed' && byId[commandId].exitCode === 0,
      status: byId[commandId].status,
      exitCode: byId[commandId].exitCode,
    }))
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
    syntaxChecks,
    buildOk,
    failedCommands: failed.map(result => result.commandId),
    commandProof: results.map(result => ({
      commandId: result.commandId,
      command: result.command,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdout: String(result.stdout || '').trim().slice(0, 1000),
      stderr: String(result.stderr || '').trim().slice(0, 1000),
    })),
  }
}

export function buildDecision({ intent, evidence, policyDecision }) {
  if (intent === 'greeting_request') {
    return {
      status: 'GREEN',
      decision: 'Saudacao recebida. O operador esta pronto para trabalhar com evidencias e politica de risco.',
      recommendedAction: 'Diga o objetivo operacional; eu classifico risco, executo o que for seguro e peço confirmacao quando alterar estado.',
      requiresApproval: false,
    }
  }

  if (intent === 'raw_shell_request') {
    return {
      status: policyDecision.canRunRawShell ? 'YELLOW' : 'BLOCKED',
      decision: policyDecision.reason,
      recommendedAction: policyDecision.canRunRawShell
        ? 'Executar o comando local aprovado e reportar stdout/stderr.'
        : 'Pedir comando concreto ou mapear para diagnostico seguro permitido. Sem botao obrigatorio e sem frase magica.',
      requiresApproval: !policyDecision.canRunRawShell,
    }
  }

  if (!policyDecision.ok) {
    return {
      status: 'BLOCKED',
      decision: policyDecision.reason,
      recommendedAction: 'Parar. Preparar escopo, preview e rollback antes de qualquer operacao destrutiva.',
      requiresApproval: true,
    }
  }

  if (['push_request', 'deploy_request', 'supabase_migration_request'].includes(intent)) {
    return {
      status: 'YELLOW',
      decision: policyDecision.reason,
      recommendedAction: policyDecision.nextSetupStep || 'Preparar evidencia e confirmacao explicita antes de executar acao remota.',
      requiresApproval: true,
    }
  }

  if (evidence.failedCommands.length) {
    return {
      status: 'BLOCKED',
      decision: `Validation failed: ${evidence.failedCommands.join(', ')}.`,
      recommendedAction: 'Corrigir a validacao que falhou antes de commit ou proximo passo.',
      requiresApproval: false,
    }
  }

  if (intent === 'approved_commit_request') {
    return {
      status: evidence.hasPendingChanges ? 'YELLOW' : 'GREEN',
      decision: evidence.hasPendingChanges ? 'Confirmacao natural de commit detectada e ha alteracoes pendentes.' : 'Confirmacao natural de commit detectada, mas nao ha alteracoes pendentes.',
      recommendedAction: evidence.hasPendingChanges ? 'Executar o commit local aprovado e reportar hash/status.' : 'Nao ha commit necessario. Avancar para o proximo checkpoint.',
      requiresApproval: false,
    }
  }

  if (evidence.hasPendingChanges) {
    return {
      status: 'YELLOW',
      decision: 'Repositorio tem alteracoes locais pendentes.',
      recommendedAction: 'Revisar o diff, validar o build quando necessario e fechar o checkpoint quando voce autorizar claramente.',
      requiresApproval: true,
    }
  }

  return {
    status: evidence.buildOk === true ? 'GREEN' : 'YELLOW',
    decision: evidence.buildOk === true ? 'Repositorio limpo e validacoes solicitadas passaram.' : 'Repositorio limpo; build nao foi necessario para este pedido.',
    recommendedAction: 'Continuar para o proximo checkpoint com o mesmo fluxo: evidencias, decisao, execucao segura e validacao.',
    requiresApproval: false,
  }
}
