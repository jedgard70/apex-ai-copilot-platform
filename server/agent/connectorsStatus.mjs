import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getFirebaseMessagingStatus } from './firebaseConnector.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../../')

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const DEFAULT_GITHUB_OWNER = 'jedgard70'
const DEFAULT_GITHUB_REPOSITORY = 'jedgard70/apex-ai-copilot-platform'
const DEFAULT_GITHUB_BRANCH = 'feature/image-generation-connector'
const DEFAULT_VERCEL_PROJECT_ID = 'prj_uVRjNyFprz8NyzVcb8NTdnALr1Xm'
const DEFAULT_VERCEL_PRODUCTION_DOMAIN = 'www.apexglobalai.com'
const CONNECTOR_TIMEOUT_MS = 7000

const ENV_ALIASES = {
  LOCAL_WORKER_URL: ['Local_Worker_URL'],
  LOCAL_WORKER_TOKEN: ['Local_Worker_TOKEN'],
  AUTODESK_CLIENT_ID: ['APS_CLIENT_ID'],
  AUTODESK_CLIENT_SECRET: ['APS_CLIENT_SECRET'],
  AUTODESK_ACCESS_TOKEN: ['APS_ACCESS_TOKEN'],
  REVIT_MCP_URL: ['APEX_REVIT_MCP_URL'],
  REVIT_MCP_TOKEN: ['APEX_REVIT_MCP_TOKEN'],
}

function hasEnv(name) {
  if (process.env[name]) return true
  const aliases = ENV_ALIASES[name] || []
  return aliases.some(alias => Boolean(process.env[alias]))
}

function firstEnv(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name]
    const aliases = ENV_ALIASES[name] || []
    for (const alias of aliases) {
      if (process.env[alias]) return process.env[alias]
    }
  }
  return ''
}

function boolStatus(configured) {
  return configured ? 'configured' : 'unavailable'
}

function shortSha(value = '') {
  return String(value || '').slice(0, 7)
}

function cleanText(value = '', maxLength = 180) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanUrl(value = '') {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.startsWith('http') ? text : `https://${text}`
}

function hasGeminiStack() {
  return hasEnv('GEMINI_API_KEY') || hasEnv('GOOGLE_API_KEY')
}

function hasApexLocalStack() {
  return hasEnv('LOCAL_WORKER_URL') || hasEnv('APEX_OWN_ENGINE_URL') || hasEnv('APEX_API_URL') || hasEnv('APEX_RUNTIME_ENABLED')
}

function hasAutodeskStack() {
  return hasEnv('AUTODESK_ACCESS_TOKEN')
    || (hasEnv('AUTODESK_CLIENT_ID') && hasEnv('AUTODESK_CLIENT_SECRET'))
}

function hasRevitMcpStack() {
  return hasEnv('REVIT_MCP_URL') && hasEnv('REVIT_MCP_TOKEN')
}

function hasImageStack() {
  return hasEnv('FAL_KEY') || hasEnv('FAL_API_KEY') || hasGeminiStack() || hasEnv('AI_GATEWAY_API_KEY') || hasEnv('OPENAI_API_KEY')
}

function safeIsoDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? cleanText(value, 80) : date.toISOString()
}

function safeFailure(kind) {
  return {
    ok: false,
    status: 'unavailable',
    reason: kind === 'timeout'
      ? 'Tempo limite da API atingido.'
      : 'Consulta read-only falhou ou não foi autorizada.',
  }
}

async function fetchJsonReadOnly(url, { token, provider, timeoutMs = CONNECTOR_TIMEOUT_MS } = {}) {
  if (!globalThis.fetch) return { ok: false, status: 0, data: null, failure: safeFailure('fetch_unavailable') }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers = provider === 'github'
      ? {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'apex-copilot-readonly',
        }
      : {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal })
    const data = await response.json().catch(() => null)
    if (!response.ok) return { ok: false, status: response.status, data: null, failure: safeFailure('api') }
    return { ok: true, status: response.status, data, failure: null }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      failure: safeFailure(error?.name === 'AbortError' ? 'timeout' : 'api'),
    }
  } finally {
    clearTimeout(timer)
  }
}

function githubApiUrl(pathname) {
  return `https://api.github.com${pathname}`
}

function vercelApiUrl(pathname, params = {}) {
  const url = new URL(`https://api.vercel.com${pathname}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim()) url.searchParams.set(key, String(value))
  }
  return url.toString()
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
  const githubToken = firstEnv(['GITHUB_TOKEN', 'GH_TOKEN'])
  const githubTokenPresent = Boolean(githubToken)
  const githubOwner = firstEnv(['APEX_GITHUB_OWNER']) || DEFAULT_GITHUB_OWNER
  const githubRepository = firstEnv(['APEX_GITHUB_REPOSITORY', 'GITHUB_REPOSITORY']) || DEFAULT_GITHUB_REPOSITORY
  const githubBranch = firstEnv(['APEX_GITHUB_BRANCH', 'VERCEL_GIT_COMMIT_REF']) || DEFAULT_GITHUB_BRANCH
  const githubKnownCommit = firstEnv(['APEX_GITHUB_COMMIT_SHA', 'VERCEL_GIT_COMMIT_SHA', 'GITHUB_SHA'])
  const githubConfigured = githubTokenPresent && Boolean(githubRepository)

  const vercelToken = firstEnv(['VERCEL_TOKEN'])
  const vercelTokenPresent = Boolean(vercelToken)
  const vercelProjectId = firstEnv(['APEX_VERCEL_PROJECT_ID', 'VERCEL_PROJECT_ID']) || DEFAULT_VERCEL_PROJECT_ID
  const vercelTeamId = firstEnv(['VERCEL_TEAM_ID', 'VERCEL_ORG_ID', 'APEX_VERCEL_TEAM_ID', 'APEX_VERCEL_ORG_ID'])
  const vercelOrgPresent = Boolean(vercelTeamId)
  const vercelProductionDomain = firstEnv(['APEX_PRODUCTION_DOMAIN', 'VERCEL_PROJECT_PRODUCTION_URL']) || DEFAULT_VERCEL_PRODUCTION_DOMAIN
  const vercelConfigured = vercelTokenPresent && Boolean(vercelProjectId)
  const authkeyPresent = hasEnv('AUTHKEY_AUTHKEY')
  const authkeySmsConfigured = authkeyPresent && hasEnv('AUTHKEY_SMS_SENDER')
  const authkeyOtpConfigured = authkeyPresent && hasEnv('AUTHKEY_OTP_SID')
  const firebaseMessaging = getFirebaseMessagingStatus()

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
      owner: githubOwner,
      reachable: false,
      repository: githubRepository,
      branch: githubBranch,
      defaultBranch: '',
      branchExists: false,
      latestCommit: null,
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
      teamIdPresent: Boolean(vercelTeamId),
      reachable: false,
      projectId: vercelProjectId,
      productionDomain: vercelProductionDomain,
      projectName: '',
      latestDeployments: [],
      latestProductionDeployment: null,
      capability: vercelConfigured ? 'deployment_status_available' : 'requires_vercel_token',
      unavailableReason: vercelConfigured ? '' : 'Vercel token/env ausente.',
      nextRequired: vercelConfigured ? '' : 'Configurar VERCEL_TOKEN e VERCEL_PROJECT_ID no backend.',
    },
    authkey: {
      id: 'authkey',
      label: 'Authkey communication connector',
      status: boolStatus(authkeyPresent),
      configured: authkeyPresent,
      tokenPresent: authkeyPresent,
      smsConfigured: authkeySmsConfigured,
      otpConfigured: authkeyOtpConfigured,
      whatsappConfigured: authkeyPresent && hasEnv('AUTHKEY_WHATSAPP_SID'),
      capability: authkeyPresent ? 'sms_otp_whatsapp_communication_available' : 'requires_authkey_authkey',
      unavailableReason: authkeyPresent ? '' : 'Authkey auth key/env ausente.',
      nextRequired: authkeyPresent ? '' : 'Configurar AUTHKEY_AUTHKEY no backend.',
    },
    firebaseMessaging,
    saas_crm_finance: {
      id: 'saas_crm_finance',
      label: 'SaaS / CRM / Finance',
      status: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY') ? 'configured' : 'local_demo',
      configured: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY'),
      databaseConnected: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY'),
      detail: hasEnv('VITE_SUPABASE_URL') && hasEnv('VITE_SUPABASE_ANON_KEY')
        ? 'Supabase configurado. SaaS/CRM/Finance operacional com persistência.'
        : 'Modo demonstração local — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar.',
    },
    executor: {
      localExecutor: process.env.VERCEL === '1' ? 'unavailable_in_vercel' : 'available_when_git_and_repo_exist',
      connectorExecutor: githubConfigured || vercelConfigured ? 'configured' : 'pending',
    },
  }
}

async function collectGithubReadOnly(base) {
  if (!base.github.tokenPresent) return base.github

  const [owner, repo] = String(base.github.repository || '').split('/')
  if (!owner || !repo) {
    return {
      ...base.github,
      status: 'unavailable',
      configured: false,
      unavailableReason: 'Repositório GitHub inválido.',
      nextRequired: 'Configurar APEX_GITHUB_REPOSITORY no formato owner/repo.',
    }
  }

  const token = firstEnv(['GITHUB_TOKEN', 'GH_TOKEN'])
  const repoResult = await fetchJsonReadOnly(githubApiUrl(`/repos/${owner}/${repo}`), { token, provider: 'github' })
  if (!repoResult.ok) {
    return {
      ...base.github,
      status: 'unavailable',
      reachable: false,
      configured: false,
      unavailableReason: repoResult.failure.reason,
      nextRequired: 'Validar token GitHub e permissão read-only para o repositório.',
    }
  }

  const defaultBranch = cleanText(repoResult.data?.default_branch || '', 80)
  const branch = base.github.branch || defaultBranch
  const branchResult = await fetchJsonReadOnly(githubApiUrl(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`), { token, provider: 'github' })
  if (!branchResult.ok) {
    return {
      ...base.github,
      status: 'partial',
      reachable: true,
      configured: true,
      defaultBranch,
      branchExists: false,
      unavailableReason: 'Repositório acessível, mas branch configurada não foi encontrada ou não foi autorizada.',
      nextRequired: 'Validar APEX_GITHUB_BRANCH ou permissão de leitura da branch.',
    }
  }

  const commitSha = cleanText(branchResult.data?.commit?.sha || '', 80)
  const [commitResult, prsResult, workflowResult] = await Promise.all([
    commitSha
      ? fetchJsonReadOnly(githubApiUrl(`/repos/${owner}/${repo}/commits/${commitSha}`), { token, provider: 'github' })
      : Promise.resolve({ ok: false, data: null, failure: safeFailure('api') }),
    fetchJsonReadOnly(githubApiUrl(`/repos/${owner}/${repo}/pulls?state=open&per_page=3`), { token, provider: 'github' }),
    fetchJsonReadOnly(githubApiUrl(`/repos/${owner}/${repo}/actions/runs?per_page=1`), { token, provider: 'github' }),
  ])
  const commit = commitResult.ok ? commitResult.data : null
  const latestCommit = commitSha
    ? {
        sha: commitSha,
        shortSha: shortSha(commitSha),
        message: cleanText(commit?.commit?.message || '', 240),
        author: cleanText(commit?.commit?.author?.name || commit?.author?.login || '', 120),
        date: cleanText(commit?.commit?.author?.date || commit?.commit?.committer?.date || '', 80),
        url: cleanUrl(commit?.html_url || ''),
      }
    : null

  const openPRs = prsResult.ok && Array.isArray(prsResult.data)
    ? prsResult.data.slice(0, 3).map(pr => ({
        number: pr.number,
        title: cleanText(pr.title || '', 120),
        branch: cleanText(pr.head?.ref || '', 80),
        state: cleanText(pr.state || '', 40),
        url: cleanUrl(pr.html_url || ''),
      }))
    : []

  const workflowRuns = workflowResult.ok && Array.isArray(workflowResult.data?.workflow_runs)
    ? workflowResult.data.workflow_runs
    : []
  const latestWorkflowRun = workflowRuns.length
    ? {
        name: cleanText(workflowRuns[0].name || '', 120),
        status: cleanText(workflowRuns[0].status || '', 40),
        conclusion: cleanText(workflowRuns[0].conclusion || '', 40),
        url: cleanUrl(workflowRuns[0].html_url || ''),
        createdAt: safeIsoDate(workflowRuns[0].created_at),
      }
    : null

  return {
    ...base.github,
    status: latestCommit ? 'configured' : 'partial',
    configured: true,
    reachable: true,
    defaultBranch,
    branch,
    branchExists: true,
    latestCommit,
    openPRs,
    latestWorkflowRun,
    currentKnownProductionCommit: latestCommit?.shortSha || base.github.currentKnownProductionCommit,
    unavailableReason: latestCommit ? '' : 'Branch encontrada, mas detalhe do commit não foi retornado.',
    nextRequired: latestCommit ? '' : 'Tentar novamente ou validar permissão de leitura de commits.',
  }
}

async function collectVercelReadOnly(base) {
  if (!base.vercel.tokenPresent) return base.vercel

  const token = firstEnv(['VERCEL_TOKEN'])
  const teamId = firstEnv(['VERCEL_TEAM_ID', 'VERCEL_ORG_ID', 'APEX_VERCEL_TEAM_ID', 'APEX_VERCEL_ORG_ID'])
  const projectResult = await fetchJsonReadOnly(
    vercelApiUrl(`/v9/projects/${encodeURIComponent(base.vercel.projectId)}`, { teamId }),
    { token, provider: 'vercel' },
  )
  if (!projectResult.ok) {
    return {
      ...base.vercel,
      status: 'unavailable',
      reachable: false,
      configured: false,
      unavailableReason: projectResult.failure.reason,
      nextRequired: 'Validar VERCEL_TOKEN, VERCEL_PROJECT_ID e VERCEL_TEAM_ID se o projeto for de time.',
    }
  }

  // Try v6 first (most compatible), fall back to v13 if needed
  let deploymentsResult = await fetchJsonReadOnly(
    vercelApiUrl('/v6/deployments', { projectId: base.vercel.projectId, limit: 5, teamId }),
    { token, provider: 'vercel' },
  )
  if (!deploymentsResult.ok) {
    deploymentsResult = await fetchJsonReadOnly(
      vercelApiUrl('/v13/deployments', { projectId: base.vercel.projectId, limit: 5, teamId }),
      { token, provider: 'vercel' },
    )
  }
  const deploymentsRaw = deploymentsResult.ok && Array.isArray(deploymentsResult.data?.deployments)
    ? deploymentsResult.data.deployments
    : deploymentsResult.ok && Array.isArray(deploymentsResult.data)
      ? deploymentsResult.data
      : []
  const latestDeployments = deploymentsRaw.slice(0, 5).map(deployment => ({
    id: cleanText(deployment.uid || deployment.id || '', 80),
    state: cleanText(deployment.state || deployment.readyState || deployment.status || '', 80),
    target: cleanText(deployment.target || deployment.environment || '', 80),
    url: cleanUrl(deployment.url || ''),
    createdAt: safeIsoDate(deployment.createdAt || deployment.created),
    commitSha: shortSha(deployment.meta?.githubCommitSha || deployment.gitSource?.sha || ''),
    commitMessage: cleanText(deployment.meta?.githubCommitMessage || deployment.gitSource?.message || '', 120),
    creator: cleanText(deployment.creator?.username || deployment.meta?.githubCommitAuthorName || '', 80),
  }))
  const latestProductionDeployment = latestDeployments.find(deployment => deployment.target === 'production')
    || latestDeployments.find(deployment => deployment.url.includes(base.vercel.productionDomain))
    || null

  return {
    ...base.vercel,
    status: deploymentsResult.ok ? 'configured' : 'partial',
    configured: true,
    reachable: true,
    projectName: cleanText(projectResult.data?.name || projectResult.data?.id || '', 120),
    latestDeployments,
    latestProductionDeployment,
    unavailableReason: deploymentsResult.ok ? '' : `Projeto acessível, mas deployments retornaram HTTP ${deploymentsResult.status || '?'} — verifique escopo do token (deployments:read).`,
    nextRequired: deploymentsResult.ok ? '' : 'Garantir que VERCEL_TOKEN tenha escopo deployments:read e que VERCEL_PROJECT_ID/VERCEL_TEAM_ID estejam corretos.',
  }
}

export async function collectConnectorsStatusReadOnly() {
  const base = collectConnectorsStatus()
  const [github, vercel] = await Promise.all([
    collectGithubReadOnly(base),
    collectVercelReadOnly(base),
  ])
  const connectorExecutor = github.configured || vercel.configured ? 'configured' : 'pending'
  const ok = [github.status, vercel.status].some(status => ['configured', 'partial'].includes(status))
    || (!github.tokenPresent && !vercel.tokenPresent)

  return {
    ...base,
    ok,
    checkedAt: new Date().toISOString(),
    secretsExposed: false,
    github,
    vercel,
    executor: {
      ...base.executor,
      connectorExecutor,
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
      id: 'authkey',
      label: 'Authkey SMS/OTP/WhatsApp',
      status: status.authkey?.configured ? 'configured' : 'missing_configuration',
      configured: Boolean(status.authkey?.configured),
      detail: status.authkey?.configured
        ? `SMS ${status.authkey.smsConfigured ? 'configurado' : 'pendente'}, OTP ${status.authkey.otpConfigured ? 'configurado' : 'pendente'}, WhatsApp ${status.authkey.whatsappConfigured ? 'configurado' : 'depende de SID/template aprovado'}.`
        : 'Necessario para SMS, OTP, WhatsApp e fallback multicanal via Authkey.',
    },
    {
      id: 'saas_crm_finance',
      label: 'SaaS / CRM / Finance',
      status: status.saas_crm_finance?.configured ? 'configured' : 'local_demo',
      configured: Boolean(status.saas_crm_finance?.configured),
      detail: status.saas_crm_finance?.configured
        ? 'Supabase configurado — CRM, leads, propostas, financeiro e planos SaaS operacionais com persistência.'
        : 'Modo demonstração local — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar.',
    },
    {
      id: 'firebase_messaging',
      label: 'Firebase Cloud Messaging app push',
      status: status.firebaseMessaging?.status || 'missing_configuration',
      configured: Boolean(status.firebaseMessaging?.configured),
      detail: status.firebaseMessaging?.configured
        ? 'FCM configurado para push notification de app.'
        : 'Conector FCM implementado; configure Firebase client, VAPID e service account env vars para envio real.',
    },
    {
      id: 'gemini_gemma_apex_ai',
      label: 'Gemini / Gemma / Apex AI 2.0 provider',
      status: hasGeminiStack() || hasApexLocalStack() ? 'configured' : 'missing_configuration',
      configured: hasGeminiStack() || hasApexLocalStack(),
      detail: hasGeminiStack() || hasApexLocalStack()
        ? 'Stack principal configurado para Gemini/Gemma/Apex AI. OpenAI não é requisito para o chat principal.'
        : 'Configure GEMINI_API_KEY ou o runtime local Apex para ativar o provedor principal.',
    },
    {
      id: 'image_generation',
      label: 'Image generation (Gemini / FAL / prompt mode)',
      status: hasImageStack() ? 'configured' : 'prompt_only',
      configured: hasImageStack(),
      detail: hasEnv('FAL_KEY')
        ? 'FAL configurado para geração visual. Gemini permanece como provedor principal de chat/multimodal.'
        : hasGeminiStack()
          ? 'Gemini configurado para multimodal/prompt visual. OpenAI não é requisito.'
          : 'Modo prompt: gera prompts seguros para Gemini/FAL/SD sem exigir OpenAI.',
    },
    {
      id: 'revit_bim_mcp',
      label: 'Revit/BIM MCP connector',
      status: hasRevitMcpStack() || hasAutodeskStack() ? 'configured' : 'knowledge_only',
      configured: hasRevitMcpStack() || hasAutodeskStack(),
      detail: hasRevitMcpStack()
        ? 'Revit MCP configurado para ponte local/desktop. APS também será usado quando APS_CLIENT_ID/SECRET ou AUTODESK_* estiverem presentes.'
        : hasAutodeskStack()
          ? 'Autodesk Platform Services configurado. Revit/BIM opera com APS e base curada; MCP desktop fica disponível quando REVIT_MCP_URL/TOKEN estiverem presentes.'
          : 'Operando em modo conhecimento/planejamento BIM sem Autodesk/MCP ao vivo. Configure APS_CLIENT_ID/APS_CLIENT_SECRET ou REVIT_MCP_URL/REVIT_MCP_TOKEN para execução conectada.',
    },
    {
      id: 'background_tasks',
      label: 'Background Multi-Agent Tasks',
      status: 'configured',
      configured: true,
      detail: 'Agenciamento e simulação de tarefas overnight de detecção de conflitos ativada.',
    },
  ]
}

export function buildConnectorsStatusReply(status = collectConnectorsStatus(), focus = 'all') {
  const lines = ['Status de conectores Apex:']

  if (focus === 'all' || focus === 'github') {
    lines.push(`- GitHub connector: ${status.github.status || (status.github.configured ? 'configured' : 'unavailable')}.`)
    lines.push(`  Repositório: ${status.github.repository}.`)
    if (status.github.reachable) lines.push('  Repositório acessível: sim.')
    else lines.push('  Repositório acessível: não confirmado.')
    if (status.github.defaultBranch) lines.push(`  Branch padrão: ${status.github.defaultBranch}.`)
    lines.push(`  Branch: ${status.github.branch}.`)
    if (status.github.tokenPresent) lines.push(`  Branch configurada existe: ${status.github.branchExists ? 'sim' : 'não confirmado'}.`)
    lines.push(`  Token presente: ${status.github.tokenPresent ? 'sim' : 'não'}.`)
    if (status.github.latestCommit) {
      const c = status.github.latestCommit
      lines.push(`  Último commit: ${c.shortSha} — ${c.message}.`)
      if (c.author || c.date) lines.push(`  Autor/data: ${c.author || '—'} | ${c.date || '—'}.`)
    } else if (status.github.currentKnownProductionCommit) {
      lines.push(`  Commit conhecido: ${status.github.currentKnownProductionCommit}.`)
    }
    const prs = status.github.openPRs || []
    if (prs.length) {
      lines.push(`  PRs abertos (${prs.length}):`)
      for (const pr of prs) lines.push(`    #${pr.number} ${pr.title} [${pr.branch}]`)
    }
    const wf = status.github.latestWorkflowRun
    if (wf) {
      const wfStatus = [wf.status, wf.conclusion].filter(Boolean).join('/')
      lines.push(`  Último workflow: ${wf.name} — ${wfStatus}.`)
    }
    if (!status.github.configured) lines.push(`  Próximo: ${status.github.nextRequired}`)
    else if (status.github.unavailableReason) lines.push(`  Observação: ${status.github.unavailableReason}`)
  }

  if (focus === 'all' || focus === 'vercel') {
    lines.push(`- Vercel connector: ${status.vercel.status || (status.vercel.configured ? 'configured' : 'unavailable')}.`)
    lines.push(`  Projeto: ${status.vercel.projectId}.`)
    if (status.vercel.projectName) lines.push(`  Nome do projeto: ${status.vercel.projectName}.`)
    lines.push(`  Domínio de produção: ${status.vercel.productionDomain}.`)
    if (status.vercel.reachable) lines.push('  Projeto acessível: sim.')
    else lines.push('  Projeto acessível: não confirmado.')
    lines.push(`  Token presente: ${status.vercel.tokenPresent ? 'sim' : 'não'}.`)
    lines.push(`  Team ID presente: ${status.vercel.teamIdPresent ? 'sim' : 'não'}.`)
    if (status.vercel.latestProductionDeployment) {
      const prod = status.vercel.latestProductionDeployment
      lines.push(`  Último deploy de produção: ${prod.state || 'status indisponível'}.`)
      if (prod.url) lines.push(`  URL do deploy: ${prod.url}.`)
      if (prod.createdAt) lines.push(`  Criado em: ${prod.createdAt}.`)
      if (prod.commitMessage) lines.push(`  Commit: ${prod.commitSha || ''} — ${prod.commitMessage}.`)
      if (prod.creator) lines.push(`  Criador: ${prod.creator}.`)
    } else if (Array.isArray(status.vercel.latestDeployments) && status.vercel.latestDeployments.length) {
      const latest = status.vercel.latestDeployments[0]
      lines.push(`  Último deployment listado: ${latest.state || 'status indisponível'}.`)
      if (latest.url) lines.push(`  URL do deployment: ${latest.url}.`)
      if (latest.commitMessage) lines.push(`  Commit: ${latest.commitSha || ''} — ${latest.commitMessage}.`)
    }
    if (!status.vercel.configured) lines.push(`  Próximo: ${status.vercel.nextRequired}`)
    else if (status.vercel.unavailableReason) lines.push(`  Observação: ${status.vercel.unavailableReason}`)
  }

  if (focus === 'all') {
    const authkey = status.authkey || {}
    lines.push(`- Authkey communication connector: ${authkey.status || (authkey.configured ? 'configured' : 'unavailable')}.`)
    lines.push(`  Auth key presente: ${authkey.tokenPresent ? 'sim' : 'não'}.`)
    lines.push(`  SMS: ${authkey.smsConfigured ? 'configurado' : 'pendente'}.`)
    lines.push(`  OTP: ${authkey.otpConfigured ? 'configurado' : 'pendente'}.`)
    lines.push(`  WhatsApp: ${authkey.whatsappConfigured ? 'configurado' : 'depende de SID/template aprovado'}.`)
    if (!authkey.configured) lines.push(`  Próximo: ${authkey.nextRequired || 'Configurar AUTHKEY_AUTHKEY no backend.'}`)

    const fcm = status.firebaseMessaging || {}
    lines.push(`- Firebase Cloud Messaging: ${fcm.status || (fcm.configured ? 'configured' : 'missing_configuration')}.`)
    lines.push(`  Client config: ${fcm.clientConfigured ? 'configurado' : 'pendente'}.`)
    lines.push(`  VAPID: ${fcm.vapidConfigured ? 'configurado' : 'pendente'}.`)
    lines.push(`  Service account: ${fcm.serverConfigured ? 'configurado' : 'pendente'}.`)
    if (!fcm.configured) lines.push(`  Próximo: ${fcm.nextRequired || 'Configurar Firebase client, VAPID e service account env vars.'}`)
  }

  lines.push(`- Executor local: ${status.executor.localExecutor}.`)
  lines.push(`- Executor por conector: ${status.executor.connectorExecutor}.`)
  lines.push('Nenhum segredo foi exibido. Nenhuma ação remota, deploy, push ou mutação foi executada.')
  return lines.join('\n')
}
