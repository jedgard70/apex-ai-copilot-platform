import path from 'node:path'
import { classifyOperatorIntent, isOperatorIntent, selectEvidenceCommands } from './planner.mjs'
import { buildPolicyDecision, isExplicitCommitApproval } from './policy.mjs'
import { runApprovedCommit, runCommands, runOwnerRawShell } from './executor.mjs'
import { buildOperatorMemory } from './memory.mjs'
import { buildDecision, summarizeEvidence } from './verifier.mjs'

export { isOperatorIntent }

function compactResult(result) {
  return {
    commandId: result.commandId,
    command: result.command,
    status: result.status,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    stdout: String(result.stdout || '').slice(0, 3000),
    stderr: String(result.stderr || '').slice(0, 3000),
  }
}

function buildFinalReply({ status, evidence, decision, executedActions = [] }) {
  const lines = []
  if (evidence.serverOk !== null) lines.push(`${evidence.serverOk ? 'GREEN' : 'BLOCKED'} - server.mjs ${evidence.serverOk ? 'esta valido' : 'falhou no syntax check'}.`)
  if (evidence.reasoningOk !== null) lines.push(`${evidence.reasoningOk ? 'GREEN' : 'BLOCKED'} - apexReasoningCore ${evidence.reasoningOk ? 'esta valido' : 'falhou no syntax check'}.`)
  if (evidence.buildOk !== null) lines.push(`${evidence.buildOk ? 'GREEN' : 'BLOCKED'} - build ${evidence.buildOk ? 'passou' : 'falhou'}.`)
  lines.push(`${evidence.hasPendingChanges ? 'YELLOW' : 'GREEN'} - ${evidence.hasPendingChanges ? 'ha alteracoes pendentes' : 'git status esta limpo'}.`)
  if (executedActions.length) {
    for (const action of executedActions) {
      if (action.type === 'commit' && action.ok) lines.push(`GREEN - commit criado: ${action.commitHash}.`)
      if (action.type === 'commit' && !action.ok) lines.push(`${action.status || 'BLOCKED'} - commit nao executado: ${action.message}`)
      if (action.type === 'raw_shell' && action.ok) {
        lines.push(`GREEN - shell livre executado com exit ${action.exitCode}.`)
        if (action.stdout) lines.push(`STDOUT:\n${String(action.stdout).slice(0, 2500)}`)
        if (action.stderr) lines.push(`STDERR:\n${String(action.stderr).slice(0, 2500)}`)
      }
      if (action.type === 'raw_shell' && !action.ok) {
        lines.push(`${action.status || 'BLOCKED'} - shell livre nao executado: ${action.message || action.stderr || 'falha desconhecida'}`)
      }
    }
  }
  lines.push(`Minha recomendacao: ${decision.recommendedAction}`)
  if (decision.requiresApproval) lines.push('Preciso de uma autorizacao natural e clara para qualquer acao que altere arquivos; nao vou depender de botao nem executar no escuro.')
  if (decision.requiresApproval && decision.recommendedAction.includes('exact command')) {
    lines.pop()
    lines.push('Me diga o comando exato ou peça a ação em linguagem natural; eu vou mapear para uma execução segura quando possível.')
  }
  const rawShellExecuted = executedActions.some(action => action.type === 'raw_shell' && action.ok)
  lines.push(rawShellExecuted
    ? 'Nao executei push, deploy ou migration automaticamente. Executei apenas o raw shell aprovado pelo Owner.'
    : 'Nao executei push, deploy, migration, raw shell ou acao destrutiva.')
  return lines.join('\n')
}

export async function runApexOperator({
  userMessage = '',
  identityContext = {},
  workspaceContext = {},
  repoPath,
  permissions = {},
} = {}) {
  const resolvedRepo = path.resolve(repoPath || process.cwd())
  const intent = classifyOperatorIntent(userMessage)
  const memory = buildOperatorMemory({ identityContext, workspaceContext })
  const policyDecision = buildPolicyDecision({ intent, userMessage, repoPath: resolvedRepo, permissions })
  const commandIds = selectEvidenceCommands(intent)
  const rawResults = await runCommands(commandIds, resolvedRepo)
  const evidence = summarizeEvidence(rawResults)
  const decision = buildDecision({ intent, evidence, policyDecision })
  const executedActions = []

  if (intent === 'approved_commit_request' && policyDecision.canCommit && evidence.hasPendingChanges && !evidence.failedCommands.length) {
    const commit = await runApprovedCommit({
      repoPath: resolvedRepo,
      message: permissions.commitMessage || 'chore: apex operator approved commit',
    })
    executedActions.push({ type: 'commit', ...commit })
  }

  if (intent === 'raw_shell_request' && policyDecision.canRunRawShell && permissions.rawCommand) {
    const shellResult = await runOwnerRawShell({
      repoPath: resolvedRepo,
      rawCommand: permissions.rawCommand,
    })
    executedActions.push({ type: 'raw_shell', rawCommand: permissions.rawCommand, ...shellResult })
  }

  const finalStatus = executedActions.some(action => action.type === 'commit' && action.ok) ? 'GREEN' : decision.status
  const finalReply = buildFinalReply({
    status: finalStatus,
    evidence,
    decision: executedActions.some(action => action.type === 'commit' && action.ok)
      ? { ...decision, recommendedAction: 'Checkpoint fechado com commit local aprovado. Proximo passo: revisar status e decidir se prepara PR; sem push automatico.', requiresApproval: false }
      : decision,
    executedActions,
  })

  return {
    ok: true,
    status: finalStatus,
    intent,
    memory,
    evidence: {
      summary: evidence,
      commands: rawResults.map(compactResult),
    },
    decision: decision.decision,
    recommendedAction: decision.recommendedAction,
    requiresApproval: decision.requiresApproval && !isExplicitCommitApproval(userMessage),
    proposedExecution: decision.requiresApproval
      ? {
          type: intent === 'raw_shell_request' ? 'raw-shell-approval-required' : 'approval-required',
          instruction: intent === 'raw_shell_request'
            ? 'Provide or infer a concrete local command; the runtime keeps cwd locked to the repo and reports stdout/stderr.'
            : 'Use a natural clear approval such as closing the checkpoint; the runtime decides safely from context.',
        }
      : { type: intent === 'raw_shell_request' ? 'owner-raw-shell' : 'local-allowlisted', commands: commandIds },
    executedActions,
    finalReply,
  }
}
