import path from 'node:path'
import { classifyOperatorIntent, inferConcreteShellCommand, isOperatorIntent, selectEvidenceCommands } from './planner.mjs'
import { buildPolicyDecision, isExplicitCommitApproval } from './policy.mjs'
import { classifyControlledExecutionRequest, runControlledExecutor } from './controlledExecutor.mjs'
import { runApprovedCommit, runCommands, runOwnerRawShell } from './executor.mjs'
import { buildOperatorMemory } from './memory.mjs'
import { classifyProductionConversationIntent, routeProductionConversation } from './productionConversationRouter.mjs'
import { collectProductionOperatorStatus, summarizeProductionOperatorStatus } from './productionStatus.mjs'
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

function commandLine(result) {
  const exit = typeof result.exitCode === 'number' ? `exit ${result.exitCode}` : 'sem exit'
  return `${result.command || result.commandId}: ${result.status}, ${exit}`
}

function buildCapabilityLine(policyDecision) {
  if (!policyDecision?.capability) return ''
  if (policyDecision.capabilityStatus === 'missing_connector') {
    return `YELLOW - capacidade ${policyDecision.capability}: preparada, mas conector/credencial nao configurado.`
  }
  if (policyDecision.capabilityStatus === 'requires_confirmation') {
    return `YELLOW - capacidade ${policyDecision.capability}: suportada, exige confirmacao natural e evidencia antes de alterar estado.`
  }
  if (policyDecision.capabilityStatus === 'blocked_destructive') {
    return `BLOCKED - capacidade ${policyDecision.capability}: destrutiva, exige preview forte e rollback.`
  }
  return `GREEN - capacidade ${policyDecision.capability}: suportada.`
}

function buildFinalReply({ intent, status, evidence, decision, policyDecision, executedActions = [] }) {
  if (intent === 'greeting_request') {
    return [
      'GREEN - Apex Operator Runtime ativo.',
      'Sou o operador da plataforma: classifico risco, executo validacoes seguras, preparo acoes locais e modelo push/deploy/Supabase com confirmacao e evidencia.',
      'Diga o objetivo operacional. Eu nao vou fingir execucao nem mexer em remoto sem confirmacao clara.',
    ].join('\n')
  }

  const lines = []
  lines.push(`${status || decision.status} - decisao operacional: ${decision.decision}`)
  const capabilityLine = buildCapabilityLine(policyDecision)
  if (capabilityLine) lines.push(capabilityLine)
  if (evidence.serverOk !== null) lines.push(`${evidence.serverOk ? 'GREEN' : 'BLOCKED'} - server.mjs ${evidence.serverOk ? 'esta valido' : 'falhou no syntax check'}.`)
  if (evidence.reasoningOk !== null) lines.push(`${evidence.reasoningOk ? 'GREEN' : 'BLOCKED'} - apexReasoningCore ${evidence.reasoningOk ? 'esta valido' : 'falhou no syntax check'}.`)
  if (Array.isArray(evidence.syntaxChecks) && evidence.syntaxChecks.length) {
    const failedSyntax = evidence.syntaxChecks.filter(check => !check.ok).map(check => check.commandId)
    lines.push(`${failedSyntax.length ? 'BLOCKED' : 'GREEN'} - checks do runtime operador ${failedSyntax.length ? `falharam: ${failedSyntax.join(', ')}` : 'passaram'}.`)
  }
  if (evidence.buildOk !== null) lines.push(`${evidence.buildOk ? 'GREEN' : 'BLOCKED'} - build ${evidence.buildOk ? 'passou' : 'falhou'}.`)
  lines.push(`${evidence.hasPendingChanges ? 'YELLOW' : 'GREEN'} - ${evidence.hasPendingChanges ? 'ha alteracoes pendentes' : 'git status esta limpo'}.`)
  if (Array.isArray(evidence.commandProof) && evidence.commandProof.length) {
    lines.push('Evidencia executada:')
    for (const result of evidence.commandProof) lines.push(`- ${commandLine(result)}`)
  }
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
  if (decision.requiresApproval && decision.recommendedAction.includes('comando concreto')) {
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

  const inferredRawCommand = permissions.rawCommand || inferConcreteShellCommand(userMessage)
  if (intent === 'raw_shell_request' && policyDecision.canRunRawShell && inferredRawCommand) {
    const shellResult = await runOwnerRawShell({
      repoPath: resolvedRepo,
      rawCommand: inferredRawCommand,
    })
    executedActions.push({ type: 'raw_shell', rawCommand: inferredRawCommand, ...shellResult })
  }

  const finalStatus = executedActions.some(action => action.type === 'commit' && action.ok) ? 'GREEN' : decision.status
  const finalReply = buildFinalReply({
    intent,
    status: finalStatus,
    evidence,
    decision: executedActions.some(action => action.type === 'commit' && action.ok)
      ? { ...decision, recommendedAction: 'Checkpoint fechado com commit local aprovado. Proximo passo: revisar status e decidir se prepara PR; sem push automatico.', requiresApproval: false }
      : decision,
    policyDecision,
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
    capability: {
      name: policyDecision.capability,
      status: policyDecision.capabilityStatus,
      risk: policyDecision.risk,
      nextSetupStep: policyDecision.nextSetupStep || '',
    },
    proposedExecution: decision.requiresApproval
      ? {
          type: intent === 'raw_shell_request' ? 'raw-shell-approval-required' : 'approval-required',
          instruction: intent === 'raw_shell_request'
            ? 'Informe um comando local concreto; o runtime mantem cwd travado no repositorio e reporta stdout/stderr.'
            : 'Use confirmacao natural clara; o runtime decide com seguranca pelo contexto.',
        }
      : { type: intent === 'raw_shell_request' ? 'owner-raw-shell' : 'local-allowlisted', commands: commandIds },
    executedActions,
    finalReply,
  }
}

function buildProductionSafeReply({ intent, policyDecision, productionStatus }) {
  const statusSummary = summarizeProductionOperatorStatus(productionStatus)

  if (intent === 'greeting_request') {
    return [
      'GREEN - Apex Copilot esta ativo em producao.',
      'Sou o operador da plataforma Apex: classifico risco, explico capacidades e preparo proximas acoes com evidencia.',
      'Neste ambiente web eu nao executo Git, build, shell local, deploy ou migration sem um executor/conector server-side configurado.',
      statusSummary,
    ].join('\n')
  }

  if (intent === 'deploy_request') {
    return [
      'YELLOW - capacidade vercel_deploy: preparada para producao, mas sem execucao automatica neste chat.',
      'Status: requer confirmacao natural, escopo, evidencia e conector Vercel configurado no backend.',
      'Nao executei deploy. Nao vou fingir publicacao.',
      statusSummary,
    ].join('\n')
  }

  if (intent === 'push_request') {
    return [
      'YELLOW - capacidade git_push: preparada, mas depende de conector GitHub/server-side configurado.',
      'Status: requer confirmacao natural, branch alvo, diff validado e credencial operacional.',
      'Nao executei push. Nao vou fingir alteracao remota.',
      statusSummary,
    ].join('\n')
  }

  if (intent === 'supabase_migration_request') {
    return [
      'YELLOW - capacidade supabase_migration: preparada, mas sem credencial/conector de migration neste runtime web.',
      'Status: requer confirmacao natural, SQL revisado, plano de rollback e credencial Supabase operacional.',
      'Nao apliquei migration. Nao vou fingir alteracao no banco.',
      statusSummary,
    ].join('\n')
  }

  if (intent === 'destructive_request') {
    return [
      'BLOCKED - pedido destrutivo ou sensivel.',
      'Para qualquer reset, delete, drop, force push ou operacao equivalente, preciso de preview, confirmacao forte e plano de rollback.',
      'Nada foi executado.',
    ].join('\n')
  }

  if (['natural_execution_request', 'validation_request', 'status_request', 'next_step_request', 'checkpoint_close_request'].includes(intent)) {
    return [
      'YELLOW - operador em modo producao seguro.',
      'O proximo passo e fechar a ponte serverless: chat em producao deve responder, classificar risco e preparar acoes sem depender do server.mjs local.',
      'Capacidades disponiveis agora: conversa operacional, classificacao de risco, status de capacidade para GitHub/Vercel/Supabase e orientacao de checkpoint.',
      'Capacidades que exigem executor separado: git status real, diff real, build local, shell, commit, push, deploy e migration.',
      statusSummary,
      'Minha decisao: nao executar localmente dentro da funcao Vercel. Preparar evidencia e acionar executor/conector dedicado quando aprovado.',
    ].join('\n')
  }

  if (intent === 'approved_commit_request') {
    return [
      'YELLOW - capacidade git_commit: reconhecida, mas indisponivel neste runtime web sem executor Git server-side.',
      'Status: commit local exige repositorio com working tree real, diff validado e autorizacao natural.',
      'Nao criei commit em producao. Posso orientar o checkpoint e aguardar o executor local/conector apropriado.',
      statusSummary,
    ].join('\n')
  }

  if (intent === 'raw_shell_request') {
    return [
      'YELLOW - capacidade local_shell: reconhecida, mas nao disponivel no runtime serverless de producao.',
      'Shell local precisa de executor dedicado, cwd controlado, stdout/stderr e aprovacao do Owner.',
      'Nada foi executado.',
      statusSummary,
    ].join('\n')
  }

  const capability = policyDecision?.capability || 'conversation'
  return [
    'GREEN - Apex Copilot em producao.',
    `Capacidade atual: ${capability}.`,
    'Posso responder como operador, classificar risco e preparar o proximo passo sem cair no fallback de erro generico.',
    'Para execucoes reais de Git, build, shell, deploy ou Supabase, preciso de um executor/conector server-side configurado e confirmacao clara.',
    statusSummary,
  ].join('\n')
}

export async function runApexOperatorProductionSafe({
  userMessage = '',
  identityContext = {},
  workspaceContext = {},
  repoPath,
  permissions = {},
  productionStatus,
  clientMemory = {},
  messages = [],
} = {}) {
  const resolvedRepo = path.resolve(repoPath || process.cwd())
  const intent = classifyOperatorIntent(userMessage)
  const memory = buildOperatorMemory({ identityContext, workspaceContext })
  const policyDecision = buildPolicyDecision({
    intent,
    userMessage,
    repoPath: resolvedRepo,
    permissions: {
      ...permissions,
      allowCommit: false,
      allowRawShell: false,
    },
  })
  const safeStatus = productionStatus || collectProductionOperatorStatus()
  const productionConversationIntent = classifyProductionConversationIntent(userMessage)
  const controlledTasks = classifyControlledExecutionRequest(userMessage, intent)
  const conversationalOnlyIntents = [
    'production_display_name_preference',
    'production_acknowledgement',
    'production_platform_position',
    'production_next_step',
    'production_execute_recommended',
    'production_greeting',
    'production_user_correction',
    'production_capability_listing',
    'production_github_connector_status',
    'production_vercel_connector_status',
    'production_connector_status',
    'production_vercel_deploy',
    'production_supabase',
  ]
  const shouldRunControlledExecution = controlledTasks.length > 0
    && !controlledTasks.includes('blocked_mutation')
    && !conversationalOnlyIntents.includes(productionConversationIntent)
    && !['greeting_request', 'push_request', 'approved_commit_request', 'raw_shell_request', 'destructive_request', 'natural_execution_request', 'checkpoint_close_request', 'code_implementation_request'].includes(intent)

  if (shouldRunControlledExecution) {
    const controlledExecution = await runControlledExecutor({
      userMessage,
      operatorIntent: intent,
      repoPath: resolvedRepo,
      productionStatus: safeStatus,
      clientMemory,
    })

    return {
      ok: controlledExecution.ok,
      status: controlledExecution.status,
      intent: 'controlled_execution',
      operatorIntent: intent,
      memory,
      evidence: {
        summary: {
          productionSafe: false,
          controlledExecution: true,
          localExecution: 'read_only_or_validation_only',
          productionStatus: safeStatus,
          tasks: controlledExecution.tasks,
          commandProof: controlledExecution.commands,
          connectors: controlledExecution.connectors,
        },
        commands: controlledExecution.commands,
      },
      decision: controlledExecution.policy.reason,
      recommendedAction: controlledExecution.ok
        ? 'Usar esta evidência para decidir o próximo passo; qualquer mutação futura continua exigindo confirmação e conector apropriado.'
        : 'Corrigir a validação bloqueada ou reformular o pedido dentro das tarefas não mutantes permitidas.',
      requiresApproval: Boolean(controlledExecution.policy.requiresConfirmation),
      capability: {
        name: 'controlled_server_side_executor',
        status: controlledExecution.ok ? 'supported' : 'blocked_or_unavailable',
        risk: 'low',
        nextSetupStep: '',
      },
      proposedExecution: {
        type: 'controlled-h4',
        tasks: controlledExecution.tasks,
        commands: controlledExecution.commands.map(command => command.commandId),
        note: 'H4 permite apenas leitura e validação. Mutações permanecem bloqueadas.',
      },
      executedActions: [],
      finalReply: controlledExecution.finalReply,
      memoryPatch: null,
    }
  }

  const conversation = routeProductionConversation({
    userMessage,
    operatorIntent: intent,
    policyDecision,
    productionStatus: safeStatus,
    clientMemory,
    identityContext,
    messages,
  })

  return {
    ok: true,
    status: conversation.status || policyDecision.status || 'YELLOW',
    intent: conversation.intent,
    operatorIntent: intent,
    memory,
    evidence: {
      summary: {
        productionSafe: true,
        localExecution: 'not_available_in_vercel_function',
        productionStatus: safeStatus,
        commandProof: [],
      },
      commands: [],
    },
    decision: policyDecision.reason || 'Modo produção seguro sem execução local.',
    recommendedAction: 'Responder por intenção conversacional e preparar executor/conector dedicado apenas quando houver ação real.',
    requiresApproval: Boolean(conversation.requiresApproval || policyDecision.requiresApproval),
    capability: {
      name: policyDecision.capability,
      status: policyDecision.capabilityStatus,
      risk: policyDecision.risk,
      nextSetupStep: policyDecision.nextSetupStep || '',
    },
    proposedExecution: {
      type: 'production-safe',
      commands: [],
      note: 'Vercel Function nao executa Git/build/shell local neste modo.',
    },
    executedActions: [],
    finalReply: conversation.finalReply,
    memoryPatch: conversation.memoryPatch,
    displayName: conversation.displayName,
  }
}
