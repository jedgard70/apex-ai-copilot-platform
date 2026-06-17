import path from 'node:path'
import { classifyOperatorIntent, inferConcreteShellCommand, isOperatorIntent, selectEvidenceCommands } from './planner.mjs'
import { buildPolicyDecision, isExplicitCommitApproval } from './policy.mjs'
import { classifyControlledExecutionRequest, runControlledExecutor } from './controlledExecutor.mjs'
import { runApprovedCommit, runCommands, runOwnerRawShell } from './executor.mjs'
import { buildOperatorMemory } from './memory.mjs'
import { classifyProductionConversationIntent, decomposeProductionConversationIntents, routeProductionConversation } from './productionConversationRouter.mjs'
import { collectProductionOperatorStatus, summarizeProductionOperatorStatus } from './productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution, routeH6ActionRequest } from './toolExecutionRouter.mjs'
import { extractParamsFromMessage } from './executionPolicy.mjs'
import {
  hasPendingAction, executeConfirmedAction, buildExecutionEvidenceReply,
  classifyPipelineRequest, buildPipelineConfirmationReply, executePipeline, buildPipelineEvidenceReply,
  PIPELINES,
} from './confirmationStateMachine.mjs'
import { buildDecision, summarizeEvidence } from './verifier.mjs'
import { classifyRevitBimQuery, getRevitBimHelp, buildRevitBimReply } from './revitBimConnector.mjs'
import { classifyImageGenRequest, buildImageGenPromptReply, generateImage, buildImageResultReply, buildImagePrompt } from './imageGenerationConnector.mjs'
import { buildDomainKnowledgeReply, DOMAIN_KNOWLEDGE_INTENTS } from './domainKnowledgeConnector.mjs'
import { runSelfUpgradePlanner, buildSelfUpgradePlannerReply, classifySelfUpgradeIntent } from './selfUpgradePlanner.mjs'
import { classifyDelegationTask, detectPromptTemplate, buildDelegationReply } from './delegationGenerator.mjs'
import { classifyValidationIntent, buildValidationPlanReply, runValidationSuite, buildValidationResultReply } from './codeChangeValidator.mjs'
import { runUpgradeWatcher, buildUpgradeWatcherReply, classifyUpgradeWatcherIntent } from './upgradeWatcher.mjs'

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
    const hasSupabaseCreds = Boolean(process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_PROJECT_REF)
    return [
      hasSupabaseCreds
        ? 'YELLOW - capacidade supabase_migration: credenciais configuradas. Envie o SQL da migration para revisao antes de aplicar.'
        : 'YELLOW - capacidade supabase_migration: preparada, mas sem credencial/conector de migration neste runtime web.',
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
  const decomposedProductionIntents = decomposeProductionConversationIntents(userMessage)
  const h4ConnectorOrExecutionIntents = new Set([
    'production_github_connector_status',
    'production_vercel_connector_status',
    'production_connector_status',
    'production_vercel_deploy',
    'production_supabase',
  ])
  const mixedNaturalConversation = decomposedProductionIntents.length > 1
    && decomposedProductionIntents.some(conversationIntent => !h4ConnectorOrExecutionIntents.has(conversationIntent))
  // H7.0 — Confirmation State Machine: "sim" with pending action → execute
  const productionConversationIntent = classifyProductionConversationIntent(userMessage)
  if (productionConversationIntent === 'production_h7_confirmation' && hasPendingAction(clientMemory)) {
    const pending = clientMemory.pendingH6Action
    // Pipeline confirmation
    if (pending.pipelineId) {
      const pipelineResult = await executePipeline(pending.pipelineId, pending.params || {})
      const evidenceReply = buildPipelineEvidenceReply(pipelineResult)
      return {
        ok: pipelineResult.ok,
        status: pipelineResult.ok ? 'GREEN' : 'YELLOW',
        intent: 'h7_pipeline_executed',
        operatorIntent: intent,
        memory,
        evidence: { summary: pipelineResult },
        decision: evidenceReply,
        requiresApproval: false,
        executedActions: pipelineResult.results || [],
        finalReply: evidenceReply,
        memoryPatch: { pendingH6Action: null },
        secretsExposed: false,
      }
    }
    // Single action confirmation
    const execResult = await executeConfirmedAction(pending)
    const evidenceReply = buildExecutionEvidenceReply(execResult, pending.actionId)
    return {
      ok: execResult.ok,
      status: execResult.ok ? 'GREEN' : 'YELLOW',
      intent: 'h7_action_executed',
      operatorIntent: intent,
      memory,
      evidence: { summary: execResult },
      decision: evidenceReply,
      requiresApproval: false,
      executedActions: [execResult],
      finalReply: evidenceReply,
      memoryPatch: { pendingH6Action: null },
      secretsExposed: false,
    }
  }

  // H10 — Pipeline detection: "add, commit e push" etc.
  const pipelineId = classifyPipelineRequest(userMessage)
  if (pipelineId) {
    const pipeline = PIPELINES[pipelineId]
    const confirmReply = buildPipelineConfirmationReply(pipelineId)
    return {
      ok: true,
      status: 'YELLOW',
      intent: 'h10_pipeline_request',
      operatorIntent: intent,
      memory,
      evidence: { summary: { pipeline: pipelineId, secretsExposed: false } },
      decision: confirmReply,
      requiresApproval: true,
      executedActions: [],
      finalReply: confirmReply,
      memoryPatch: { pendingH6Action: { pipelineId, params: {}, planText: confirmReply } },
      secretsExposed: false,
    }
  }

  // H6.0 — Risk-tiered action policy: check before H5 tool routing
  const h6Route = routeH6ActionRequest({ userMessage })
  if (h6Route) {
    const firstActionId = h6Route.requestedActionIds?.[0]
    const extractedParams = firstActionId ? extractParamsFromMessage(userMessage, firstActionId) : {}
    const pendingAction = h6Route.requestedActionIds?.length === 1
      ? { actionId: firstActionId, params: extractedParams, planText: h6Route.finalReply }
      : null
    return {
      ok: h6Route.ok,
      status: 'YELLOW',
      intent: 'h6_action_request',
      operatorIntent: intent,
      memory,
      evidence: { summary: { h6: true, secretsExposed: false } },
      decision: h6Route.finalReply,
      recommendedAction: h6Route.requiresApproval ? 'Aguardando confirmação do operador para executar.' : 'Executar diretamente.',
      requiresApproval: h6Route.requiresApproval ?? false,
      capability: { name: 'h6_execution_policy', status: 'supported', risk: 'classified' },
      proposedExecution: { type: 'h6-action-router', actionIds: h6Route.requestedActionIds },
      executedActions: [],
      finalReply: h6Route.finalReply,
      memoryPatch: h6Route.requiresApproval && pendingAction ? { pendingH6Action: pendingAction } : null,
      secretsExposed: false,
    }
  }

  const h5ToolIds = classifyToolExecutionRequest(userMessage)
  // H5.0C: action tools always win over conversation router;
  // status-only tools yield to conversation router when mixed natural intents are present.
  const H5_ACTION_TOOLS = new Set(['local_worker.status', 'revit_mcp.status', 'revit_model.status', 'vercel.deploy', 'supabase.migration'])
  const h5HasActionTools = h5ToolIds.some(id => H5_ACTION_TOOLS.has(id))
  if (h5ToolIds.length && (h5HasActionTools || !mixedNaturalConversation)) {
    const toolExecution = await routeToolExecution({ userMessage, requestedToolIds: h5ToolIds })

    return {
      ok: toolExecution.ok,
      status: toolExecution.tools.some(tool => tool.executionClass === 'blocked') ? 'BLOCKED' : 'YELLOW',
      intent: 'tool_execution',
      operatorIntent: intent,
      memory,
      evidence: {
        summary: {
          productionSafe: true,
          h5ToolExecution: true,
          localExecution: 'connector_or_capability_status_only',
          productionStatus: safeStatus,
          requestedToolIds: toolExecution.requestedToolIds,
          executions: toolExecution.executions,
        },
        commands: [],
      },
      decision: 'H5 tool execution router handled capability status and allowed read-only connector execution only.',
      recommendedAction: 'Configure the missing connector or provide explicit confirmation only through a dedicated mutation route when mutation is required.',
      requiresApproval: toolExecution.tools.some(tool => tool.executionClass === 'mutation_requires_confirmation'),
      capability: {
        name: 'h5_tool_execution_router',
        status: 'supported',
        risk: toolExecution.tools.some(tool => tool.mutates) ? 'high' : 'low',
        nextSetupStep: toolExecution.tools.flatMap(tool => tool.missing || []).join(', '),
      },
      proposedExecution: {
        type: 'h5-tool-router',
        tools: toolExecution.requestedToolIds,
        executionClasses: toolExecution.executionClasses,
        note: 'H5 executa apenas read-only/status neste checkpoint. Mutacoes e desktop exigem confirmação/conector dedicado.',
      },
      executedActions: [],
      toolExecution,
      finalReply: toolExecution.finalReply,
      memoryPatch: null,
    }
  }
  // H13 — Revit/BIM live connector
  if (productionConversationIntent === 'production_revit_bim_help') {
    const revitResult = await getRevitBimHelp(userMessage)
    const finalReply = buildRevitBimReply(revitResult)
    return {
      ok: true,
      status: 'GREEN',
      intent: 'h13_revit_bim_help',
      operatorIntent: intent,
      memory,
      evidence: { summary: { connector: 'revit_bim', queryType: revitResult.queryType, live: Boolean(revitResult.liveResults) } },
      decision: finalReply,
      requiresApproval: false,
      finalReply,
      memoryPatch: null,
      secretsExposed: false,
    }
  }

  // H14 — Image generation connector
  if (productionConversationIntent === 'production_archviz_help') {
    const imageType = classifyImageGenRequest(userMessage)
    if (imageType) {
      const promptReply = buildImageGenPromptReply(userMessage)
      const { prompt } = buildImagePrompt(userMessage, imageType)
      // If OpenAI is configured and user is asking to generate (not just a prompt), offer it
      const finalReply = promptReply
      return {
        ok: true,
        status: 'GREEN',
        intent: 'h14_image_gen',
        operatorIntent: intent,
        memory,
        evidence: { summary: { connector: 'image_generation', renderType: imageType } },
        decision: finalReply,
        requiresApproval: false,
        finalReply,
        memoryPatch: null,
        secretsExposed: false,
      }
    }
  }

  // H18 — Self-Upgrade Planner
  if (classifySelfUpgradeIntent(userMessage)) {
    const result = await runSelfUpgradePlanner(userMessage)
    const finalReply = buildSelfUpgradePlannerReply(result)
    return {
      ok: true, status: 'GREEN', intent: 'h18_self_upgrade_planner',
      operatorIntent: intent, memory,
      evidence: { summary: { connector: 'self_upgrade_planner', live: result.connectorConfigured } },
      decision: finalReply, requiresApproval: false, finalReply, memoryPatch: null, secretsExposed: false,
    }
  }

  // H19 — Codex/Claude Delegation Generator
  const delegationCheck = classifyDelegationTask(userMessage)
  if (delegationCheck.isDelegation) {
    const task = delegationCheck.extractedTask || userMessage
    const templateType = detectPromptTemplate(task)
    const finalReply = buildDelegationReply(task, templateType)
    return {
      ok: true, status: 'GREEN', intent: 'h19_delegation_generator',
      operatorIntent: intent, memory,
      evidence: { summary: { connector: 'delegation_generator', templateType } },
      decision: finalReply, requiresApproval: false, finalReply, memoryPatch: null, secretsExposed: false,
    }
  }

  // H21 — Validation + Rollback Engine
  if (classifyValidationIntent(userMessage)) {
    const finalReply = buildValidationPlanReply(userMessage)
    return {
      ok: true, status: 'GREEN', intent: 'h21_validation_engine',
      operatorIntent: intent, memory,
      evidence: { summary: { connector: 'code_change_validator' } },
      decision: finalReply, requiresApproval: false, finalReply, memoryPatch: null, secretsExposed: false,
    }
  }

  // H22 — Autonomous Upgrade Watcher (on-demand)
  if (classifyUpgradeWatcherIntent(userMessage)) {
    const report = await runUpgradeWatcher()
    const finalReply = buildUpgradeWatcherReply(report)
    return {
      ok: true, status: 'GREEN', intent: 'h22_upgrade_watcher',
      operatorIntent: intent, memory,
      evidence: { summary: { connector: 'upgrade_watcher', packages: report.packages?.length } },
      decision: finalReply, requiresApproval: false, finalReply, memoryPatch: null, secretsExposed: false,
    }
  }

  // H16 — Domain knowledge connector (orçamento, proposta, obra, cronograma, marketing)
  if (DOMAIN_KNOWLEDGE_INTENTS.has(productionConversationIntent)) {
    const finalReply = buildDomainKnowledgeReply(productionConversationIntent, userMessage)
    if (finalReply) {
      return {
        ok: true,
        status: 'GREEN',
        intent: 'h16_domain_knowledge',
        operatorIntent: intent,
        memory,
        evidence: { summary: { connector: 'domain_knowledge', domain: productionConversationIntent } },
        decision: finalReply,
        requiresApproval: false,
        finalReply,
        memoryPatch: null,
        secretsExposed: false,
      }
    }
  }

  const controlledTasks = classifyControlledExecutionRequest(userMessage, intent)
  const conversationalOnlyIntents = [
    'production_display_name_preference',
    'production_acknowledgement',
    'production_revit_bim_help',
    'production_user_confusion',
    'production_name_identity',
    'production_who_am_i',
    'production_computer_help',
    'production_multi_intent',
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
    // H5.1H — Capability brain + repair
    'production_capability_repair',
    'production_capability_continuation',
    // H5.1I — Domain intents
    'production_orcamento_sinapi_help',
    'production_proposta_contrato_help',
    'production_obra_campo_help',
    'production_cronograma_help',
    'production_archviz_help',
    'production_marketing_vendas_help',
    // H5.1I — Language detection
    'production_user_speaks_english',
    'production_language_preference',
    'production_affirmation',
    // H7.0 — Confirmation state machine
    'production_h7_confirmation',
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
