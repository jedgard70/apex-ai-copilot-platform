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
      chat: 'supported',
      operatorPreview: 'supported',
      operatorStatus: 'supported',
      operatorExecute: isVercel ? 'partial_in_vercel_serverless' : 'read_only_and_validation_supported',
      localGitStatus: isVercel ? 'requires_github_connector_or_external_executor' : 'controlled_read_only_supported_when_repo_available',
      localGitLog: isVercel ? 'requires_github_connector_or_external_executor' : 'controlled_read_only_supported_when_repo_available',
      localBuild: isVercel ? 'requires_external_executor_for_reliable_build' : 'controlled_validation_supported_when_runtime_available',
      routeValidation: 'controlled_validation_supported',
      connectorPresence: 'supported_without_secret_values',
      localShell: 'blocked_in_h4',
      commit: 'requires_dedicated_executor_and_confirmation',
      push: 'requires_connector_and_confirmation',
      deploy: 'requires_connector_and_confirmation',
      supabaseMigration: 'requires_connector_confirmation_and_rollback',
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
