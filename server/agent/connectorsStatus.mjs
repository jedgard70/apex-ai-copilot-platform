const DEFAULT_GITHUB_REPOSITORY = 'jedgard70/apex-ai-copilot-platform'
const DEFAULT_GITHUB_BRANCH = 'feature/image-generation-connector'
const DEFAULT_VERCEL_PROJECT_ID = 'prj_uVRjNyFprz8NyzVcb8NTdnALr1Xm'
const DEFAULT_VERCEL_PRODUCTION_DOMAIN = 'www.apexglobalai.com'

function hasEnv(name) {
  return Boolean(process.env[name])
}

function firstEnv(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name]
  }
  return ''
}

function boolStatus(configured) {
  return configured ? 'configured' : 'unavailable'
}

export function classifyConnectorStatusIntent(message = '') {
  const text = String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  const asksStatus = /\b(verifique|verificar|verifica|checar|cheque|validar|valide|status|conector|conectores)\b/.test(text)
  if (!asksStatus) return ''
  if (/\bgithub\b/.test(text)) return 'github_connector_status'
  if (/\bvercel\b/.test(text)) return 'vercel_connector_status'
  if (/\bconector|conectores\b/.test(text)) return 'connector_status'
  return ''
}

export function collectConnectorsStatus() {
  const githubTokenPresent = hasEnv('GITHUB_TOKEN') || hasEnv('GH_TOKEN')
  const githubRepository = firstEnv(['APEX_GITHUB_REPOSITORY', 'GITHUB_REPOSITORY']) || DEFAULT_GITHUB_REPOSITORY
  const githubBranch = firstEnv(['APEX_GITHUB_BRANCH', 'VERCEL_GIT_COMMIT_REF']) || DEFAULT_GITHUB_BRANCH
  const githubKnownCommit = firstEnv(['APEX_GITHUB_COMMIT_SHA', 'VERCEL_GIT_COMMIT_SHA', 'GITHUB_SHA'])
  const githubConfigured = githubTokenPresent && Boolean(githubRepository)

  const vercelTokenPresent = hasEnv('VERCEL_TOKEN')
  const vercelProjectId = firstEnv(['APEX_VERCEL_PROJECT_ID', 'VERCEL_PROJECT_ID']) || DEFAULT_VERCEL_PROJECT_ID
  const vercelOrgPresent = hasEnv('VERCEL_ORG_ID') || hasEnv('APEX_VERCEL_ORG_ID')
  const vercelProductionDomain = firstEnv(['APEX_PRODUCTION_DOMAIN', 'VERCEL_PROJECT_PRODUCTION_URL']) || DEFAULT_VERCEL_PRODUCTION_DOMAIN
  const vercelConfigured = vercelTokenPresent && Boolean(vercelProjectId)

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    secretsExposed: false,
    github: {
      id: 'github',
      label: 'GitHub connector',
      status: boolStatus(githubConfigured),
      configured: githubConfigured,
      tokenPresent: githubTokenPresent,
      repository: githubRepository,
      branch: githubBranch,
      currentKnownProductionCommit: githubKnownCommit || '',
      capability: githubConfigured ? 'remote_repository_status_available' : 'requires_github_token',
      unavailableReason: githubConfigured ? '' : 'GitHub token/env ausente.',
      nextRequired: githubConfigured ? '' : 'Configurar GITHUB_TOKEN ou GH_TOKEN no backend.',
    },
    vercel: {
      id: 'vercel',
      label: 'Vercel connector',
      status: boolStatus(vercelConfigured),
      configured: vercelConfigured,
      tokenPresent: vercelTokenPresent,
      orgPresent: vercelOrgPresent,
      projectId: vercelProjectId,
      productionDomain: vercelProductionDomain,
      capability: vercelConfigured ? 'deployment_status_available' : 'requires_vercel_token',
      unavailableReason: vercelConfigured ? '' : 'Vercel token/env ausente.',
      nextRequired: vercelConfigured ? '' : 'Configurar VERCEL_TOKEN e VERCEL_PROJECT_ID no backend.',
    },
    executor: {
      localExecutor: process.env.VERCEL === '1' ? 'unavailable_in_vercel' : 'available_when_git_and_repo_exist',
      connectorExecutor: githubConfigured || vercelConfigured ? 'configured' : 'pending',
    },
  }
}

export function connectorsAsProductionList(status = collectConnectorsStatus()) {
  return [
    {
      id: 'github',
      label: 'GitHub remote operations',
      status: status.github.configured ? 'configured' : 'missing_configuration',
      configured: status.github.configured,
      detail: status.github.configured
        ? `Repositorio ${status.github.repository}, branch ${status.github.branch}.`
        : 'Necessario para status remoto, PR, push e operacoes GitHub reais.',
    },
    {
      id: 'vercel',
      label: 'Vercel deploy/control',
      status: status.vercel.configured ? 'configured' : 'missing_configuration',
      configured: status.vercel.configured,
      detail: status.vercel.configured
        ? `Projeto ${status.vercel.projectId}, dominio ${status.vercel.productionDomain}.`
        : 'Necessario para status de deploy, promote e rollback via backend.',
    },
    {
      id: 'supabase_migrations',
      label: 'Supabase migrations',
      status: hasEnv('SUPABASE_ACCESS_TOKEN') || hasEnv('SUPABASE_DB_URL') ? 'configured' : 'missing_configuration',
      configured: hasEnv('SUPABASE_ACCESS_TOKEN') || hasEnv('SUPABASE_DB_URL'),
      detail: 'Necessario para migrations e mutacoes de banco com rollback.',
    },
    {
      id: 'supabase_frontend',
      label: 'Supabase frontend/auth config',
      status: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY') ? 'configured' : 'missing_configuration',
      configured: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY'),
      detail: 'Suficiente para cliente Supabase no frontend, nao para migrations.',
    },
    {
      id: 'openai',
      label: 'OpenAI provider',
      status: hasEnv('OPENAI_API_KEY') ? 'configured' : 'missing_configuration',
      configured: hasEnv('OPENAI_API_KEY'),
      detail: 'Opcional para respostas generativas; o operador seguro responde sem isso.',
    },
  ]
}

export function buildConnectorsStatusReply(status = collectConnectorsStatus(), focus = 'all') {
  const lines = ['Status de conectores Apex:']

  if (focus === 'all' || focus === 'github') {
    lines.push(`- GitHub connector: ${status.github.configured ? 'configured' : 'unavailable'}.`)
    lines.push(`  Repositório: ${status.github.repository}.`)
    lines.push(`  Branch: ${status.github.branch}.`)
    lines.push(`  Token presente: ${status.github.tokenPresent ? 'sim' : 'não'}.`)
    if (status.github.currentKnownProductionCommit) lines.push(`  Commit conhecido: ${status.github.currentKnownProductionCommit}.`)
    if (!status.github.configured) lines.push(`  Próximo: ${status.github.nextRequired}`)
  }

  if (focus === 'all' || focus === 'vercel') {
    lines.push(`- Vercel connector: ${status.vercel.configured ? 'configured' : 'unavailable'}.`)
    lines.push(`  Projeto: ${status.vercel.projectId}.`)
    lines.push(`  Domínio de produção: ${status.vercel.productionDomain}.`)
    lines.push(`  Token presente: ${status.vercel.tokenPresent ? 'sim' : 'não'}.`)
    if (!status.vercel.configured) lines.push(`  Próximo: ${status.vercel.nextRequired}`)
  }

  lines.push(`- Executor local: ${status.executor.localExecutor}.`)
  lines.push(`- Executor por conector: ${status.executor.connectorExecutor}.`)
  lines.push('Nenhum segredo foi exibido. Nenhuma ação remota foi executada.')
  return lines.join('\n')
}
