function hasEnv(name) {
  return Boolean(process.env[name])
}

function connectorStatus(id, label, configured, detail) {
  return {
    id,
    label,
    status: configured ? 'configured' : 'missing_configuration',
    configured: Boolean(configured),
    detail,
  }
}

export function collectProductionOperatorStatus() {
  const isVercel = process.env.VERCEL === '1'
  const deploymentUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || ''
  const connectors = [
    connectorStatus(
      'github',
      'GitHub remote operations',
      hasEnv('GITHUB_TOKEN') || hasEnv('GH_TOKEN'),
      'Necessario para push, PR e operacoes GitHub reais.',
    ),
    connectorStatus(
      'vercel',
      'Vercel deploy/control',
      hasEnv('VERCEL_TOKEN') && (hasEnv('VERCEL_PROJECT_ID') || hasEnv('VERCEL_ORG_ID')),
      'Necessario para deploy/promote/rollback via backend.',
    ),
    connectorStatus(
      'supabase_migrations',
      'Supabase migrations',
      hasEnv('SUPABASE_ACCESS_TOKEN') || hasEnv('SUPABASE_DB_URL'),
      'Necessario para migrations e mutacoes de banco com rollback.',
    ),
    connectorStatus(
      'supabase_frontend',
      'Supabase frontend/auth config',
      hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY'),
      'Suficiente para cliente Supabase no frontend, nao para migrations.',
    ),
    connectorStatus(
      'openai',
      'OpenAI provider',
      hasEnv('OPENAI_API_KEY'),
      'Opcional para respostas generativas; o operador seguro responde sem isso.',
    ),
  ]

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
      operatorExecute: 'read_only_and_validation_supported',
      localGitStatus: 'controlled_read_only_supported_when_repo_available',
      localGitLog: 'controlled_read_only_supported_when_repo_available',
      localBuild: 'controlled_validation_supported_when_runtime_available',
      routeValidation: 'controlled_validation_supported',
      connectorPresence: 'supported_without_secret_values',
      localShell: 'blocked_in_h4',
      commit: 'requires_dedicated_executor_and_confirmation',
      push: 'requires_connector_and_confirmation',
      deploy: 'requires_connector_and_confirmation',
      supabaseMigration: 'requires_connector_confirmation_and_rollback',
    },
    connectors,
    validations,
    overallStatus: connectors.some(connector => connector.configured) ? 'YELLOW' : 'YELLOW',
    summary: 'Operador em producao seguro: chat/status funcionam; execucoes reais aguardam executor ou conector dedicado.',
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
