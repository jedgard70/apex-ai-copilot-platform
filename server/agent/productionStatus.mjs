import { collectConnectorsStatus, connectorsAsProductionList } from './connectorsStatus.mjs'

export function collectProductionOperatorStatus() {
  const isVercel = process.env.VERCEL === '1'
  const deploymentUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || ''
  const connectorStatus = collectConnectorsStatus()
  const connectors = connectorsAsProductionList(connectorStatus)

  const validations = [
    {
      id: 'serverless_chat_route',
      status: 'GREEN',
      evidence: '/api/copilot/chat esta implementada como Vercel Function.',
    },
    {
      id: 'serverless_operator_preview_route',
      status: 'GREEN',
      evidence: '/api/copilot/operator-preview esta implementada como Vercel Function.',
    },
    {
      id: 'serverless_operator_status_route',
      status: 'GREEN',
      evidence: '/api/copilot/operator-status esta implementada como rota de status sem mutacao.',
    },
    {
      id: 'serverless_operator_execute_route',
      status: 'GREEN',
      evidence: '/api/copilot/operator-execute esta implementada para execucao controlada de leitura e validacao.',
    },
    {
      id: 'local_execution_boundary',
      status: 'YELLOW',
      evidence: 'H4 permite leitura e validacao controladas; commit/push/deploy/migration/shell livre continuam bloqueados.',
    },
  ]

  return {
    ok: true,
    mode: 'production-operator-status',
    checkedAt: new Date().toISOString(),
    runtime: {
      provider: isVercel ? 'vercel' : 'node-compatible-serverless',
      serverless: true,
      deploymentUrl,
      localPersistentServer: false,
    },
    capabilities: {
      // Core operator
      chat: 'supported',
      operatorPreview: 'supported',
      operatorStatus: 'supported',
      operatorExecute: isVercel ? 'partial_in_vercel_serverless' : 'read_only_and_validation_supported',
      localGitStatus: isVercel ? 'requires_github_connector_or_external_executor' : 'controlled_read_only_supported_when_repo_available',
      localGitLog: isVercel ? 'requires_github_connector_or_external_executor' : 'controlled_read_only_supported_when_repo_available',
      localBuild: isVercel ? 'requires_external_executor_for_reliable_build' : 'controlled_validation_supported_when_runtime_available',
      routeValidation: 'controlled_validation_supported',
      connectorPresence: 'supported_without_secret_values',
      // H6.0 — Risk-tiered execution policy
      executionPolicy: 'supported — READ/VALIDATE direto; WRITE/DEPLOY/DATABASE/DANGEROUS exigem confirmação; FORBIDDEN nunca executa',
      actionRiskClassification: 'supported — 70+ ações classificadas por risco',
      // H7 — Confirmation state machine
      confirmationStateMachine: 'supported — pendingH6Action persiste entre turnos; sim/não/ajustar',
      confirmationButtons: 'supported — frontend renderiza botões Sim/Não/Ajustar no bubble',
      // H8 — Vercel Deploy
      vercelDeploy: 'supported — POST /v13/deployments via VERCEL_TOKEN (exige confirmação)',
      // H9 — Supabase Migration
      supabaseMigration: 'supported — Supabase Management API via SUPABASE_ACCESS_TOKEN (exige confirmação + rollback)',
      // H10 — Pipelines
      pipelines: 'supported — add_commit_push, build_validate_deploy, validate_full, status_full',
      // H11 — Workspace Context
      workspaceContext: 'supported — Local Worker health + git status + último commit, cache 30s',
      // H12 — Multi-turn params
      paramExtraction: 'supported — message/branch/remote extraídos da mensagem do usuário',
      // H13 — Revit/BIM connector
      revitBimConnector: 'supported — knowledge_only; upgrade para live com AUTODESK_ACCESS_TOKEN',
      revitTopics: 'famílias, parâmetros, quantitativos, IFC, Dynamo, pyRevit, Revit API, BIM standards, GLB, templates, coordenação',
      // H14 — Image Generation
      imageGeneration: 'supported — prompt_only sem OPENAI_API_KEY; geração DALL-E 3 direta com OPENAI_API_KEY',
      imageRenderTypes: 'facade_render, interior_render, floor_plan_visual, aerial_masterplan, concept_moodboard, topo_hologram',
      // H15 — Markdown renderer
      markdownRenderer: 'supported — bold, inline code, fenced code blocks, bullet lists, inline images no chat bubble',
      // H16 — Domain knowledge connector
      domainKnowledge: 'supported — orçamento/SINAPI, proposta/contrato, obra/campo, cronograma, marketing/vendas',
      domainSubclassification: 'supported — SINAPI/BDI/EVM/CPM/RFI/NCR/look-ahead/funil e mais 40+ tópicos específicos',
      // Background Tasks & Multi-Agent Clash Detection
      backgroundMultiAgentTasks: 'supported — agendamento e simulação de tarefas em segundo plano com logs e relatórios estruturados',
      autoCorrectionReasoning: 'supported — raciocínio de colisão MEP vs Estrutura e geração automática de propostas de correção',
      // H18 — Self-Upgrade Planner
      selfUpgradePlanner: 'supported — tech radar curado; análise ao vivo com ANTHROPIC_API_KEY',
      // H19 — Codex/Claude Delegation Generator
      delegationGenerator: 'supported — gera prompt estruturado para Claude Code/Codex com contexto do repo e constraints de segurança',
      // H20 — Safe Code Change Executor
      safeCodeChangeExecutor: 'supported — Local Worker: git checkout -b, tsc --noEmit, lint, build, validate scripts',
      // H21 — Validation + Rollback Engine
      validationRollbackEngine: 'supported — plano de validação + rollback antes de commitar; gates: tsc, lint, build, validate_final',
      // H22 — Autonomous Upgrade Watcher
      upgradeWatcher: 'supported — verifica npm versions, modelos Anthropic, Vercel status; Cron Job diário 08:00 UTC',
      // Blocked
      localShell: 'blocked — sem shell livre, sem comando arbitrário',
      commit: 'requires_local_worker_and_confirmation',
      push: 'requires_local_worker_and_confirmation',
      deploy: 'requires_vercel_token_and_confirmation',
    },
    connectors,
    connectorStatus,
    executorStatus: connectorStatus.executor,
    validations,
    overallStatus: isVercel ? 'PARTIAL' : 'YELLOW',
    summary: isVercel
      ? 'Operador em producao: conversa/status funcionam; executor H4 e parcial no runtime Vercel e exige conector GitHub/Vercel ou worker externo para evidencia local.'
      : 'Operador em producao seguro: chat/status funcionam; execucoes reais aguardam executor ou conector dedicado.',
  }
}

export function summarizeProductionOperatorStatus(status = collectProductionOperatorStatus()) {
  const configured = (status.connectors || []).filter(connector => connector.configured).map(connector => connector.id)
  const missing = (status.connectors || []).filter(connector => !connector.configured).map(connector => connector.id)
  return [
    `Status server-side: ${status.summary}`,
    `Conectores configurados: ${configured.length ? configured.join(', ') : 'nenhum conector de execucao real detectado'}.`,
    `Conectores pendentes: ${missing.length ? missing.join(', ') : 'nenhum'}.`,
    'Validacao sem mutacao: rotas serverless ativas; limite local preservado.',
  ].join('\n')
}
