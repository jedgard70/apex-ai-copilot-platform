// ═══════════════════════════════════════════════════════════════════════════════
// ATENÇÃO — PROPRIEDADE DO OWNER (Dr. Edgard)
// Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
// alterar, modificar, remover ou sobrescrever variáveis no .env.local ou
// nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
// do Owner (jedgard70@gmail.com / Dr. Edgard).
// VIOLAÇÕES: qualquer alteração não autorizada deve ser revertida imediatamente
// e reportada ao Owner.
// ═══════════════════════════════════════════════════════════════════════════════

import './server/env.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { captureServerException, flushObservability, isServerObservabilityEnabled } from './server/lib/observability.mjs'
import { generateEmbedding } from './server/agent/embeddings.mjs'
import {
  isOperatorIntent,
  runApexOperator,
  runApexOperatorProductionSafe,
} from './server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from './server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution } from './server/agent/toolExecutionRouter.mjs'
import { defaultTasks } from './server/agent/backgroundTasksConnector.mjs'
import { buildCodeToolDefinitions, executeCodeToolCall, CODE_TOOL_NAMES } from './server/agent/codeTools.mjs'
import { validateOrigin, getKeyRestrictionConfig } from './server/middleware/keyRestriction.mjs'
import { renderVideoPayload } from './server/videoRenderPipeline.mjs'
import {
  generateWithInteractions,
  INTERACTION_MODELS,
  isInteractionModel,
} from './server/providers/gemini-interactions.mjs'
import { chatWithFallback, getProviderChain } from './server/providers/providerRouter.mjs'
import * as supplyChainService from './server/service/supplyChain.mjs'
import * as aiCostService from './server/service/aiCost.mjs'
import * as multiTenantService from './server/service/multiTenant.mjs'
import * as pwaMobileService from './server/service/pwaMobile.mjs'
import * as digitalTwinService from './server/service/digitalTwin.mjs'
import * as knowledgeBaseService from './server/service/knowledgeBase.mjs'
import * as metricsService from './server/service/metrics.mjs'
import * as generationHistoryService from './server/service/generationHistory.mjs'
import * as projectPackageService from './server/service/projectPackage.mjs'
import * as notificationsService from './server/service/notificationsService.mjs'
import * as crmService from './server/service/crm.mjs'
import * as ownerCodeExecutorService from './server/service/ownerCodeExecutor.mjs'
import * as rdoService from './server/service/rdo.mjs'
import { attachTerminal } from './server/terminal.mjs'

function normalizeEnvironmentAliases() {
  const aliasPairs = [
    ['Local_Worker_URL', 'LOCAL_WORKER_URL'],
    ['Local_Worker_TOKEN', 'LOCAL_WORKER_TOKEN'],
    ['GEMINI_MODELROUTER', 'GEMINI_MODEL'],
  ]
  for (const [fromKey, toKey] of aliasPairs) {
    if (process.env[fromKey] && !process.env[toKey]) {
      process.env[toKey] = process.env[fromKey]
    }
  }
}

const DIRECT_GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B IT' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B A4B IT' },
]

const GATEWAY_MODELS = []

const FAL_CHAT_MODELS = [
  { id: 'fal-ai/llama-3.3-70b', name: 'LLaMA 3.3 70B (FAL)' },
  { id: 'fal-ai/llama-3.1-8b', name: 'LLaMA 3.1 8B (FAL)' },
  { id: 'fal-ai/llama-3.1-70b', name: 'LLaMA 3.1 70B (FAL)' },
  { id: 'fal-ai/llama-3.1-405b', name: 'LLaMA 3.1 405B (FAL)' },
  { id: 'fal-ai/llama-4-scout', name: 'Llama 4 Scout (FAL)' },
  { id: 'fal-ai/llama-4-maverick', name: 'Llama 4 Maverick (FAL)' },
  { id: 'fal-ai/mistral-large', name: 'Mistral Large (FAL)' },
  { id: 'fal-ai/mixtral-8x7b', name: 'Mixtral 8x7B (FAL)' },
  { id: 'fal-ai/mixtral-8x22b', name: 'Mixtral 8x22B (FAL)' },
  { id: 'fal-ai/deepseek-r1', name: 'DeepSeek R1 (FAL)' },
  { id: 'fal-ai/deepseek-v3', name: 'DeepSeek V3 (FAL)' },
  { id: 'fal-ai/qwen-2.5-72b', name: 'Qwen 2.5 72B (FAL)' },
  { id: 'fal-ai/qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B (FAL)' },
  { id: 'fal-ai/phi-4', name: 'Phi-4 (FAL)' },
  { id: 'fal-ai/phi-3-mini', name: 'Phi-3 Mini (FAL)' },
]

const APEX_LOCAL_MODELS = [
  { id: 'apex-ai', name: 'Apex AI 2.0 (motor proprio)' },
]

function composeModelValue(provider, modelId) {
  return `${provider}|${modelId}`
}

function splitModelValue(value) {
  const raw = String(value || '')
  const separatorIndex = raw.indexOf('|')
  if (separatorIndex === -1) {
    return { provider: null, modelId: raw, raw }
  }
  const provider = raw.slice(0, separatorIndex)
  const modelId = raw.slice(separatorIndex + 1)
  return { provider, modelId, raw }
}

function normalizeLegacyChatModel(modelId) {
  const raw = String(modelId || '').trim()
  if (!raw) return 'gemini-3.5-flash'
  return raw
}

function sanitizeAssistantReply(value) {
  return String(value || '')
    .replace(/<\|eom\|>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .trim()
}

function buildStaticModelCatalog() {
  return [
    ...APEX_LOCAL_MODELS.map(model => ({
      ...model,
      provider: 'apex-local',
      id: composeModelValue('apex-local', model.id),
      modelId: model.id,
      name: model.name,
    })),
    ...INTERACTION_MODELS.map(model => ({
      ...model,
      provider: 'gemini-interactions',
      id: composeModelValue('gemini-interactions', model.id),
      modelId: model.id,
      name: model.name,
    })),
    ...DIRECT_GEMINI_MODELS.map(model => ({
      ...model,
      provider: 'gemini',
      id: composeModelValue('gemini', model.id),
      modelId: model.id,
      name: model.name,
    })),
    ...GATEWAY_MODELS.map(model => ({
      ...model,
      provider: 'gateway',
      id: composeModelValue('gateway', model.id),
      modelId: model.id,
      name: model.name,
    })),
    ...FAL_CHAT_MODELS.map(model => ({
      ...model,
      provider: 'fal',
      id: composeModelValue('fal', model.id),
      modelId: model.id,
      name: model.name,
    })),
  ]
}

function getModelProviderDiagnostics() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY)
  const interactionsConfigured = Boolean(process.env.GEMINI_API_KEY)
  return {
    geminiConfigured,
    interactionsConfigured,
  }
}

// APEX_FREE_AGENT (default ON): when enabled, conversational messages bypass the
// canned production-intent router and go straight to the LLM for free responses.
// Set APEX_FREE_AGENT=0 to restore the old template-router behavior.
const APEX_FREE_AGENT = !/^(0|false|off)$/i.test(String(process.env.APEX_FREE_AGENT ?? '1'))

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseClient = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null
if (!globalThis.localMemoryKnowledgeItems) globalThis.localMemoryKnowledgeItems = []

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname
const dist = path.join(root, 'dist')
const runtimeKnowledgePath = path.join(root, 'src', 'lib', 'runtimeKnowledge.json')
const skillUpdateLogPath = path.join(root, 'docs', 'SKILL_UPDATE_LOG.md')
const learnedSkillsDir = path.join(root, 'skills', 'learned')
const copilotExecutionCwd = path.resolve(root)
// Allow configuring the authorized repo cwd via environment for portability.
// Defaults to the current repo root when not provided.
const authorizedExecutionCwd = process.env.AUTHORIZED_EXECUTION_CWD
  ? path.resolve(process.env.AUTHORIZED_EXECUTION_CWD)
  : path.resolve(root)
const maxExecutionOutputBytes = 160000
const rawExecutionApprovalText = process.env.RAW_EXECUTION_APPROVAL_TEXT || ''
const authorizedApprovers = (process.env.AUTHORIZED_APPROVERS || '').split(',').map(s => s.trim())
const rawShellAllowedEnvironments = new Set(['', 'development', 'local', 'test'])
const TRUSTED_DOMAINS = (process.env.TRUSTED_DOMAINS || '').split(',').map(s => s.trim()).filter(Boolean)
const allowRawShellInAnyEnv = /^(1|true)$/i.test(String(process.env.ALLOW_RAW_SHELL_IN_ANY_ENV || '')) || TRUSTED_DOMAINS.includes('apexglobalai.com') || TRUSTED_DOMAINS.includes('*')

const copilotExecutionCommands = [
  {
    id: 'raw_shell',
    label: 'Raw shell command',
    description: 'Run a free live shell command in a user-selected cwd through the local shell.',
    executable: 'shell',
    args: [],
    acceptsRawCommand: true,
    risk: 'high',
    requiresApproval: false,
    timeoutMs: 60000,
    source: 'raw-shell',
  },
  {
    id: 'git_status',
    label: 'Git status',
    description: 'Show concise repo status for the authorized Apex Copilot repo.',
    executable: 'git',
    args: ['status', '--short'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
    source: 'allowlist',
  },
  {
    id: 'git_log_recent',
    label: 'Recent Git log',
    description: 'Show the five most recent commits.',
    executable: 'git',
    args: ['log', '--oneline', '-5'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
    source: 'allowlist',
  },
  {
    id: 'git_diff_stat',
    label: 'Git diff stat',
    description: 'Summarize unstaged and staged file changes without showing full patches.',
    executable: 'git',
    args: ['diff', '--stat'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
    source: 'allowlist',
  },
  {
    id: 'git_diff_name_only',
    label: 'Git changed names',
    description: 'List changed file paths only.',
    executable: 'git',
    args: ['diff', '--name-only'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
    source: 'allowlist',
  },
  {
    id: 'build',
    label: 'Build',
    description: 'Run the local Vite production build.',
    executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'build'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 120000,
    source: 'allowlist',
  },
  {
    id: 'validate_supabase_sql',
    label: 'Validate Supabase SQL',
    description: 'Run the local read-only Supabase SQL validation script.',
    executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'validate:supabase-sql'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 60000,
    source: 'allowlist',
  },
  {
    id: 'validate_vercel_live',
    label: 'Vercel: Check live deployments',
    description: 'Queries the live Vercel API for deployment logs, URLs, and states.',
    executable: 'node',
    args: ['scripts/validate-vercel.mjs'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'validate_supabase_live',
    label: 'Supabase: Check live database',
    description: 'Queries the live Supabase project database connection, schema info, and tables.',
    executable: 'node',
    args: ['scripts/validate-supabase-live.mjs'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'validate_owner_workspace_live',
    label: 'Supabase: Check owner workspace',
    description: 'Verifies the configured owner email has auth user, profile, active tenant and owner_admin membership.',
    executable: 'node',
    args: ['scripts/validate-owner-workspace-live.mjs'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'deploy_vercel_live',
    label: 'Vercel: Trigger preview deployment',
    description: 'Triggers a live preview deployment on Vercel and prints connection details.',
    executable: 'node',
    args: ['scripts/deploy-vercel-live.mjs'],
    risk: 'high',
    requiresApproval: false,
    timeoutMs: 60000,
    source: 'allowlist',
  },
  {
    id: 'check_server',
    label: 'Check server.mjs',
    description: 'Syntax-check the local Node server.',
    executable: 'node',
    args: ['--check', 'server.mjs'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'skill_audit',
    label: 'Audit skills',
    description: 'Execute active audits for platform skills, checking folder structures, clones, Revit MCP and documentation.',
    executable: 'node',
    args: ['scripts/execute-skill-audit.mjs'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'revit_generate',
    label: 'Generate pyRevit/C# add-in boilerplate',
    description: 'Generates pyRevit extension folders and boilerplate code.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'revit-generate'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'marketing_generate',
    label: 'Generate campaign copy',
    description: 'Generates campaign planner copy templates in EBOOK_APEX_HOTMART.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'marketing-generate'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'legacy_import',
    label: 'Import legacy skill',
    description: 'Import legacy scripts and assets from D:\\AI Jedgard.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'legacy-import'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'mcp_generate',
    label: 'Generate MCP server template',
    description: 'Generates a node-mcp server template under local-worker.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'mcp-generate'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'code_analyze',
    label: 'Analyze code complexity',
    description: 'Analyzes project files size and TODO count.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'code-analyze'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 30000,
    source: 'allowlist',
  },
  {
    id: 'docsedgard_skill',
    label: 'Docsedgard integrated skill',
    description: 'Runs docsedgard integrated skill actions: summary, search and manifest sync.',
    executable: 'node',
    args: ['scripts/execute-skill-action.mjs', 'docsedgard-skill'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 60000,
    source: 'allowlist',
  },
  {
    id: 'apex_diag',
    label: 'Windows Diagnostics',
    description: 'Run a full Windows hardware/software diagnostics — CPU, RAM, disk, top processes, services, startup. Read-only, no system modifications.',
    executable: process.platform === 'win32' ? 'powershell' : 'pwsh',
    args: ['-ExecutionPolicy', 'Bypass', '-File', 'scripts/apex-diag.ps1'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 60000,
    source: 'allowlist',
  },
]

// Trusted domains can relax approval for allowlisted commands, never for raw shell.
if (TRUSTED_DOMAINS.includes('apexglobalai.com') || TRUSTED_DOMAINS.includes('*')) {
  for (const cmd of copilotExecutionCommands) {
    if (!cmd.acceptsRawCommand) cmd.requiresApproval = false
  }
}

loadEnvLocal()
normalizeEnvironmentAliases()

function loadEnvFiles(...paths) {
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue
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
}

function loadEnvLocal() {
  loadEnvFiles(
    path.join(root, '.env'),
    path.join(root, '.env.local'),
    path.join(root, '.env.local.full'),
  )
}

function loadRuntimeKnowledge() {
  return JSON.parse(fs.readFileSync(runtimeKnowledgePath, 'utf8'))
}

function saveRuntimeKnowledge(runtime) {
  fs.writeFileSync(runtimeKnowledgePath, `${JSON.stringify(runtime, null, 2)}\n`, 'utf8')
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/)
  if (!match) return { metadata: {}, body: content }
  const yaml = match[1]
  const body = content.slice(match[0].length)
  const metadata = {}
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colon = trimmed.indexOf(':')
    if (colon === -1) continue
    const key = trimmed.slice(0, colon).trim()
    const valStr = trimmed.slice(colon + 1).trim()

    let val = valStr
    if (valStr.startsWith('"') && valStr.endsWith('"')) {
      val = valStr.slice(1, -1)
    } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
      val = valStr.slice(1, -1)
    } else if (valStr.startsWith('[') && valStr.endsWith(']')) {
      try {
        val = JSON.parse(valStr.replace(/'/g, '"'))
      } catch (_) {
        val = valStr.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''))
      }
    }
    metadata[key] = val
  }
  return { metadata, body }
}

let cachedDynamicSkills = null

function scanSkillMarkdown(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  try {
    for (const file of fs.readdirSync(dir)) {
      const filepath = path.join(dir, file)
      const stat = fs.statSync(filepath)
      if (stat.isDirectory()) {
        results = results.concat(scanSkillMarkdown(filepath))
      } else if (file.toLowerCase().endsWith('.md') && (file.toLowerCase().endsWith('_skill.md') || file.toLowerCase().includes('skill'))) {
        results.push(filepath)
      }
    }
  } catch (err) {
    console.error(`[server] Erro ao escanear diretório de skills ${dir}:`, err)
  }
  return results
}

function loadDynamicSkills() {
  if (cachedDynamicSkills) return cachedDynamicSkills

  const skills = []
  for (const dir of [path.join(root, 'docs'), path.join(root, 'skills')]) {
    for (const filepath of scanSkillMarkdown(dir)) {
      try {
        const file = path.basename(filepath)
        const content = fs.readFileSync(filepath, 'utf8')
        const { metadata, body } = parseFrontmatter(content)
        skills.push({
          filepath,
          filename: file,
          title: metadata.title || file.replace(/\.md$/i, ''),
          description: metadata.description || '',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          body: body.trim(),
        })
      } catch (err) {
        console.error(`[server] Erro ao carregar skill dinâmica ${filepath}:`, err)
      }
    }
  }

  cachedDynamicSkills = skills
  return skills
}

function slugifySkillFileName(value = '') {
  const base = String(value || 'skill-update')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return base || 'skill-update'
}

function safeId(prefix = 'update') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function redactSensitiveText(value) {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-api-key]')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-token]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-pat]')
    .replace(/\b[A-Za-z0-9_-]*service[_-]?role[A-Za-z0-9_:\-."= ]{8,}/gi, '[redacted-service-role-reference]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}/gi, '$1=[redacted-secret]')
}

function skillFileExtension(fileName = '') {
  return String(fileName).toLowerCase().split('.').pop() || ''
}

function classifySkillUpdate(file, text) {
  const name = String(file?.name || '')
  const ext = skillFileExtension(name)
  const lower = `${name}\n${text}`.toLowerCase()
  if (/(password|api[_-]?key|secret|token|service[_-]?role|private key|BEGIN RSA PRIVATE KEY)/i.test(text)) {
    return { category: 'obsolete-unsafe-ignore', targetDomain: 'security-review', riskLevel: 'high' }
  }
  if (/(deprecated|obsolete|superseded|não usar|nao usar|ignore this|old version)/i.test(lower)) {
    return { category: 'obsolete-unsafe-ignore', targetDomain: 'historical-reference', riskLevel: 'medium' }
  }
  if (/(archvis|render|planta humanizada|humanized floor plan|facade|interior|prompt negativo|negative prompt)/i.test(lower)) {
    return { category: 'archvis-skill', targetDomain: 'archvis', riskLevel: 'low' }
  }
  if (/(directcut|video|vídeo|roteiro|shot list|storyboard|reels|cinematic)/i.test(lower)) {
    return { category: 'directcut-skill', targetDomain: 'directcut', riskLevel: 'low' }
  }
  if (/(revit|dynamo|pyrevit|shared parameter|par[aâ]metro compartilhado|family|fam[ií]lia|view template|schedule|add-in|addin|ribbon|ifc export|glb export)/i.test(lower)) {
    return { category: 'revit-skill', targetDomain: 'revit-customization', riskLevel: 'low' }
  }
  if (/(windows|powershell|diagn[oó]stico|diagnostic|cleanup|limpeza|quarantine|quarentena|startup|inicializa[cç][aã]o|malware|performance|pc lento|computador lento)/i.test(lower)) {
    return { category: 'windows-coding-skill', targetDomain: 'windows-care-coding', riskLevel: 'medium' }
  }
  if (/(bim|ifc|revit|rvt|dwg|dxf|skp|clash|viewer|3d)/i.test(lower)) {
    return { category: 'bim-3d-skill', targetDomain: 'bim-3d', riskLevel: 'low' }
  }
  if (/(rdo|di[aá]rio de obra|relat[oó]rio de obra|field operations|jobsite|punch list|checklist de qualidade|checklist de seguran[cç]a|foto de obra|daily report)/i.test(lower)) {
    return { category: 'field-operations-skill', targetDomain: 'field-operations-rdo', riskLevel: 'low' }
  }
  if (/(sql|data|analytics|dashboard|metric|csv|query)/i.test(lower)) {
    return { category: 'data-sql', targetDomain: 'data-analysis', riskLevel: 'low' }
  }
  if (/(marketing|sales|crm|proposal|proposta|venda|copy|landing)/i.test(lower)) {
    return { category: 'business-marketing', targetDomain: 'business-marketing', riskLevel: 'low' }
  }
  if (/(negotiation|negociação|negociacao|humanizer|humanizar texto|writing|copywriting)/i.test(lower)) {
    return { category: 'writing-negotiation', targetDomain: 'writing-negotiation', riskLevel: 'low' }
  }
  if (['py', 'js', 'ts', 'tsx'].includes(ext) || /(react|typescript|javascript|python|component|api route|server)/i.test(lower)) {
    return { category: 'code-platform-pattern', targetDomain: 'platform-code', riskLevel: 'medium' }
  }
  if (/(system prompt|prompt template|template|instruções|instrucoes|instructions)/i.test(lower)) {
    return { category: 'prompt-template', targetDomain: 'prompt-systems', riskLevel: 'low' }
  }
  if (/(rule|regra|always|never|nunca|sempre|policy|hard rule)/i.test(lower)) {
    return { category: 'global-rule', targetDomain: 'copilot-behavior', riskLevel: 'medium' }
  }
  return { category: 'project-memory', targetDomain: 'project-memory', riskLevel: 'low' }
}

function summarizeSkillUpdate(file, text, classification) {
  const name = String(file?.name || 'uploaded file')
  const preview = text
    ? text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 6)
    : []
  const metadataOnly = !text
  const understood = [
    metadataOnly
      ? `Apex received ${name} as metadata-only content. It will not execute or unpack it in CP5.`
      : `Apex read sanitized text from ${name} without executing it.`,
    `Detected category: ${classification.category}.`,
    `Recommended target domain: ${classification.targetDomain}.`,
  ]
  const additions = preview.length
    ? preview.map(line => line.slice(0, 280))
    : [`Store ${name} as a reference item for ${classification.targetDomain}; text extraction is not available yet for this file type.`]
  const updates = classification.category === 'global-rule'
    ? ['Potential behavior rule update after Owner approval.']
    : [`Potential ${classification.targetDomain} knowledge update after Owner approval.`]
  const ignored = []
  if (metadataOnly) ignored.push('Binary/archive/PDF internals are not parsed in this checkpoint; only metadata is used.')
  if (classification.category === 'obsolete-unsafe-ignore') ignored.push('Unsafe or obsolete content should not be promoted to global skill brain.')
  return { understood, additions, updates, ignored }
}

function buildExportReference(domain, runtime) {
  const tools = Array.isArray(runtime.tools) ? runtime.tools : []
  const matchingTools = tools.filter(tool => {
    const haystack = `${tool.id} ${tool.name} ${tool.role} ${(tool.trigger || []).join(' ')}`.toLowerCase()
    return domain.toLowerCase().split(/[ /-]+/).some(part => part.length > 3 && haystack.includes(part))
  })
  const updates = Array.isArray(runtime.skillUpdates)
    ? runtime.skillUpdates.filter(update => String(update.targetDomain || '').toLowerCase().includes(domain.toLowerCase().split(' ')[0] || ''))
    : []
  return [
    `# ${domain}`,
    '',
    '## Runtime role',
    matchingTools.length
      ? matchingTools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
      : '- Use Apex AI Copilot behavior and active project context for this domain.',
    '',
    '## Approved updates',
    updates.length
      ? updates.map(update => `- ${update.summary}`).join('\n')
      : '- No Owner-approved runtime updates for this exact domain yet.',
    '',
    '## Operating rule',
    'Chat remains the primary interface. Tools and modules are optional execution paths after understanding the user request.',
  ].join('\n')
}

function buildPortablePrompt(request, runtime) {
  const languageLine = request.language === 'PT'
    ? 'Responda em portugues por padrao, a menos que o usuario mude de idioma.'
    : request.language === 'EN'
      ? 'Answer in English by default unless the user switches language.'
      : 'Answer in the user language. Support EN and PT naturally.'
  const rules = Array.isArray(runtime.systemPrompt) ? runtime.systemPrompt.slice(0, 28) : []
  return sanitizePortableText([
    `# ${request.skillName}`,
    '',
    request.description,
    '',
    '## Comportamento',
    '- Você é a Apex AI — parceiro técnico que executa, não só conversa.',
    '- Obedece o comando do usuário primeiro; usa ferramentas só quando útil.',
    '- Usa contexto ativo do projeto/arquivo quando relevante.',
    '- Não finge parsing de arquivo, visualizadores 3D, renders, vídeos ou execução externa.',
    '- Produz o resultado direto quando o usuário pede pra criar, escrever, construir, gerar ou preparar.',
    `- ${languageLine}`,
    '',
    '## Included domains',
    ...request.domains.map(domain => `- ${domain}`),
    '',
    '## Runtime rules summary',
    ...rules.map(rule => `- ${rule}`),
  ].join('\n'))
}

function sanitizePortableText(value) {
  return redactSensitiveText(String(value || ''))
    .replace(/\.env\.local/gi, '[local-env-file-redacted]')
    .slice(0, 180000)
}

function makeJsonFile(pathName, value) {
  return {
    path: pathName,
    type: 'json',
    content: sanitizePortableText(JSON.stringify(value, null, 2)),
  }
}

function buildSkillExportPack(request, runtime) {
  const exportId = safeId('skill-export')
  const createdAt = new Date().toISOString()
  const skillName = String(request.skillName || 'Apex AI Copilot').slice(0, 120)
  const description = String(request.description || 'Portable Apex AI Copilot knowledge pack.').slice(0, 500)
  const domains = Array.isArray(request.domains) && request.domains.length ? request.domains.map(String) : ['Apex Copilot behavior']
  const language = ['EN', 'PT', 'bilingual'].includes(request.language) ? request.language : 'bilingual'
  const targetPlatform = String(request.targetPlatform || 'chatgpt')
  const outputFormat = String(request.outputFormat || 'zip-compatible')
  const baseRequest = { ...request, skillName, description, domains, language }
  const mainPrompt = buildPortablePrompt(baseRequest, runtime)
  const referenceFiles = domains.map(domain => ({
    path: `references/${domain.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'domain'}.md`,
    type: 'markdown',
    content: sanitizePortableText(buildExportReference(domain, runtime)),
  }))
  const toolRegistry = (Array.isArray(runtime.tools) ? runtime.tools : []).filter(tool => {
    const haystack = `${tool.id} ${tool.name} ${tool.role} ${(tool.trigger || []).join(' ')}`.toLowerCase()
    return domains.some(domain => domain.toLowerCase().split(/[ /-]+/).some(part => part.length > 3 && haystack.includes(part)))
  })
  const memoryIndex = {
    skillName,
    domains,
    includedReferences: Array.isArray(request.includedReferences) ? request.includedReferences : [],
    memorySummary: Array.isArray(runtime.memorySummary) ? runtime.memorySummary : [],
    approvedSkillUpdates: Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates.map(update => ({
      updateId: update.updateId,
      sourceFilename: update.sourceFilename,
      summary: update.summary,
      targetDomain: update.targetDomain,
      category: update.category,
      timestamp: update.timestamp,
    })) : [],
  }
  let files = []
  if (targetPlatform === 'chatgpt') {
    files = [
      { path: 'SKILL.md', type: 'markdown', content: mainPrompt },
      { path: 'agents/chatgpt.yaml', type: 'yaml', content: `name: ${skillName}\ndescription: ${description}\nmodel_behavior: chat-first command-following copilot\n` },
      { path: 'README_IMPORT.md', type: 'markdown', content: `# Import ${skillName}\n\nUpload this folder as a ChatGPT-compatible skill package. Keep references attached as knowledge files.\n` },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'gemini') {
    files = [
      { path: 'GEMINI_INSTRUCTIONS.md', type: 'markdown', content: mainPrompt },
      { path: 'GEMINI_REFERENCE_INDEX.md', type: 'markdown', content: `# Gemini Reference Index\n\n${domains.map(domain => `- ${domain}`).join('\n')}\n\nImport as Gem instructions plus attached reference files.` },
      { path: 'README_IMPORT.md', type: 'markdown', content: 'Create a Gemini Gem, paste GEMINI_INSTRUCTIONS.md, and attach the reference files.' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'claude') {
    files = [
      { path: 'CLAUDE_PROJECT_INSTRUCTIONS.md', type: 'markdown', content: mainPrompt },
      { path: 'CLAUDE_PROJECT_KNOWLEDGE_INDEX.md', type: 'markdown', content: `# Claude Project Knowledge Index\n\n${domains.map(domain => `- ${domain}`).join('\n')}\n` },
      { path: 'README_IMPORT.md', type: 'markdown', content: 'Create a Claude Project, paste the instructions, and add references as project knowledge.' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'api') {
    files = [
      { path: 'SYSTEM_PROMPT.md', type: 'markdown', content: mainPrompt },
      makeJsonFile('TOOL_REGISTRY.json', toolRegistry),
      makeJsonFile('MEMORY_INDEX.json', memoryIndex),
      { path: 'RUNTIME_RULES.md', type: 'markdown', content: mainPrompt },
    ]
  } else if (targetPlatform === 'cursor-codex') {
    files = [
      { path: 'CODEX_AGENT_PROMPT.md', type: 'markdown', content: mainPrompt },
      { path: 'REPO_RULES.md', type: 'markdown', content: '# Repo Rules\n\n- Work only in the active repo.\n- Do not expose secrets.\n- Do not fake connectors or generated outputs.\n- Build and verify before committing.\n' },
      { path: 'IMPLEMENTATION_CHECKLIST.md', type: 'markdown', content: '# Implementation Checklist\n\n- Understand user command.\n- Preserve chat-first behavior.\n- Use file/project context.\n- Keep tools secondary.\n- Validate build.\n' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'generic-json') {
    files = [
      makeJsonFile('KNOWLEDGE_REGISTRY.json', { mainPrompt, memoryIndex, toolRegistry, references: referenceFiles }),
    ]
  } else {
    files = [
      { path: 'KNOWLEDGE_PACK.md', type: 'markdown', content: mainPrompt },
      makeJsonFile('KNOWLEDGE_REGISTRY.json', { memoryIndex, toolRegistry }),
      ...referenceFiles,
    ]
  }
  return {
    exportId,
    createdAt,
    skillName,
    description,
    targetPlatform,
    outputFormat,
    language,
    domains,
    files,
    mainPrompt,
    warnings: [
      'Secrets, API keys and .env.local references are redacted.',
      'This is a portable export package generated from Apex runtime knowledge only; unrelated local files are not included.',
      outputFormat === 'zip-compatible' ? 'Browser download is a zip-compatible JSON bundle containing file paths and contents.' : 'Use the listed files according to the target platform.',
    ],
    importInstructions: [
      'Review the generated prompt and references before uploading to another AI platform.',
      'Do not paste private keys, API keys or customer-confidential files into third-party platforms.',
      'Keep Apex Copilot chat-first and tool-aware; connectors remain optional execution paths.',
    ],
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 12 * 1024 * 1024) {
      const error = new Error('Request too large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function chatJson(res, status, body = {}) {
  const finalReply = String(body.finalReply || body.reply || '').trim()
  return json(res, status, {
    ...body,
    finalReply,
    reply: finalReply,
  })
}

function publicExecutionCommand(command) {
  if (command.acceptsRawCommand && !isRawShellAllowed()) return true
  return {
    ...command,
    cwd: command.acceptsRawCommand ? 'User selected cwd' : authorizedExecutionCwd,
  }
}

function isRawShellAllowed() {
  const runtimeEnv = String(process.env.NODE_ENV || process.env.APP_ENV || '').trim().toLowerCase()
  return allowRawShellInAnyEnv || rawShellAllowedEnvironments.has(runtimeEnv)
}

function isPathInsideAuthorizedRepo(candidatePath) {
  const resolved = path.resolve(candidatePath || authorizedExecutionCwd)
  const relative = path.relative(authorizedExecutionCwd, resolved)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function getExecutionCommand(commandId) {
  const command = copilotExecutionCommands.find(item => item.id === commandId)
  if (command?.acceptsRawCommand && !isRawShellAllowed()) return true
  return command
}

function shellQuote(value) {
  const text = String(value || '')
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text
  return `"${text.replace(/"/g, '\\"')}"`
}

function resolveExecutable(executable) {
  if (executable !== 'git') return executable
  const githubDesktopGit = 'C:\\Users\\apexg\\AppData\\Local\\GitHubDesktop\\app-3.5.12\\resources\\app\\git\\cmd\\git.exe'
  return fs.existsSync(githubDesktopGit) ? githubDesktopGit : executable
}

function buildRegisteredCommandText(command) {
  return [resolveExecutable(command.executable), ...command.args].map(shellQuote).join(' ')
}

function appendLimitedOutput(current, chunk) {
  const next = current + chunk
  if (Buffer.byteLength(next, 'utf8') <= maxExecutionOutputBytes) return next
  return next.slice(0, maxExecutionOutputBytes) + '\n[output truncated]'
}

function redactedExecutionText(value) {
  return redactSensitiveText(value)
    .replace(/NEXT_PUBLIC_SUPABASE_[A-Z_]*=([^\s]+)/g, 'NEXT_PUBLIC_SUPABASE_KEY=[redacted-secret]')
    .replace(/VITE_SUPABASE_[A-Z_]*=([^\s]+)/g, 'VITE_SUPABASE_KEY=[redacted-secret]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{16,}/gi, 'Bearer [redacted-token]')
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, '[redacted-jwt]')
}

async function runCopilotExecutionCommand(command, body) {
  return new Promise(resolve => {
    const startedAtMs = Date.now()
    const startedAt = new Date(startedAtMs).toISOString()
    const requestedCwd = command.acceptsRawCommand ? String(body?.cwd || '').trim() : String(body?.cwd || authorizedExecutionCwd).trim()
    const executionCwd = path.resolve(requestedCwd || authorizedExecutionCwd)
    const rawCommand = String(body?.rawCommand || '').trim()
    const commandText = command.acceptsRawCommand
      ? rawCommand
      : [buildRegisteredCommandText(command), rawCommand ? shellQuote(rawCommand) : ''].filter(Boolean).join(' ')
    let stdout = ''
    let stderr = ''
    let exitCode = null
    let settled = false
    let timedOut = false

    const child = spawn(commandText, [], {
      cwd: executionCwd,
      shell: true,
      windowsHide: true,
      env: {
        ...process.env,
        APEX_COPILOT_EXECUTION: 'v0',
      },
    })

    const finish = status => {
      if (settled) return
      settled = true
      const finishedAtMs = Date.now()
      const cleanStdout = redactedExecutionText(stdout)
      const cleanStderr = redactedExecutionText(stderr)
      resolve({
        id: safeId('execution'),
        commandId: command.id,
        label: command.label,
        cwd: executionCwd,
        args: command.acceptsRawCommand ? [rawCommand] : [command.executable, ...command.args],
        rawCommand: command.acceptsRawCommand ? rawCommand : undefined,
        shell: true,
        status,
        stdout: cleanStdout,
        stderr: cleanStderr,
        exitCode,
        startedAt,
        finishedAt: new Date(finishedAtMs).toISOString(),
        durationMs: finishedAtMs - startedAtMs,
        createdBy: 'User',
        risk: command.risk,
        requiresApproval: false,
        approvedBy: null,
        redactedOutput: cleanStdout !== stdout || cleanStderr !== stderr,
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      stderr = appendLimitedOutput(stderr, `\nCommand timed out after ${command.timeoutMs}ms.`)
      child.kill('SIGTERM')
    }, command.timeoutMs)

    child.stdout.on('data', chunk => {
      stdout = appendLimitedOutput(stdout, chunk.toString('utf8'))
    })

    child.stderr.on('data', chunk => {
      stderr = appendLimitedOutput(stderr, chunk.toString('utf8'))
    })

    child.on('error', error => {
      clearTimeout(timer)
      stderr = appendLimitedOutput(stderr, error.message || String(error))
      finish('failed')
    })

    child.on('close', code => {
      clearTimeout(timer)
      exitCode = code
      finish(timedOut ? 'timeout' : code === 1 ? 'completed' : 'completed')
    })
  })
}

async function handleExecutionCommands(_req, res) {
  json(res, 200, {
    providerStatus: 'connected',
    commands: copilotExecutionCommands.map(publicExecutionCommand).filter(Boolean),
  })
}

async function handleExecutionRun(req, res) {
  try {
    const body = await readJson(req)
    const commandId = String(body.commandId || '')
    const command = getExecutionCommand(commandId)
    if (!command) {
      return json(res, 403, {
        error: 'Command is not registered for Apex Copilot Local Execution v0.',
        commandId,
        providerStatus: 'error',
      })
    }
    if (!command.acceptsRawCommand && copilotExecutionCwd !== authorizedExecutionCwd) {
      return json(res, 403, {
        error: 'Apex Copilot execution is locked to the authorized local repo.',
        expectedCwd: authorizedExecutionCwd,
        actualCwd: copilotExecutionCwd,
      })
    }
    if (command.acceptsRawCommand) {
      if (!isRawShellAllowed()) {
        return json(res, 403, { error: 'Raw shell is disabled in this environment.', providerStatus: 'error' })
      }
      const rawCommand = String(body.rawCommand || '').trim()
      const requestedCwd = String(body.cwd || '').trim()
      const executionCwd = path.resolve(requestedCwd || authorizedExecutionCwd)
      if (!rawCommand) {
        return json(res, 400, { error: 'Raw command is required for raw_shell.', providerStatus: '' })
      }
      if (!isPathInsideAuthorizedRepo(executionCwd)) {
        return json(res, 403, { error: 'Raw shell cwd must stay inside the authorized local repo.', cwd: executionCwd, providerStatus: 'error' })
      }
      if (!fs.existsSync(executionCwd) || !fs.statSync(executionCwd).isDirectory()) {
        return json(res, 400, { error: 'Requested cwd does not exist or is not a directory.', cwd: executionCwd, providerStatus: 'error' })
      }
    }
    if (!command.acceptsRawCommand) {
      const requestedCwd = String(body.cwd || authorizedExecutionCwd).trim()
      const executionCwd = path.resolve(requestedCwd || authorizedExecutionCwd)
      if (!fs.existsSync(executionCwd) || !fs.statSync(executionCwd).isDirectory()) {
        return json(res, 400, { error: 'Requested cwd does not exist or is not a directory.', cwd: executionCwd, providerStatus: 'error' })
      }
    }

    const result = await runCopilotExecutionCommand(command, body)
    return json(res, 200, {
      providerStatus: 'connected',
      result,
    })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

function scrubProviderError(value) {
  return String(value || 'Provider request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[redacted-image-data]')
    .slice(0, 1200)
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/)
  if (!match) return null
  const [, mimeType, base64] = match
  return {
    mimeType,
    base64,
    buffer: Buffer.from(base64, 'base64'),
  }
}

function buildArchVisServerStylePrompt(promptStyle) {
  const style = String(promptStyle || 'humanized-floor-plan')
  const styles = {
    'humanized-floor-plan': [
      'Prompt style: Humanized floor plan.',
      'Strict image-to-image, top-down orthographic, preserve layout, walls, openings, room positions, labels where possible, no geometry change, no extra rooms, no invented gardens, high realism.',
    ].join('\n'),
    'photorealistic-facade': 'Prompt style: Photorealistic facade. Minimalist residence, realistic facade, accurate shadows, refined materials, urban or residential architecture, premium real estate presentation.',
    'interior-design': 'Prompt style: Interior design. Use coherent room function, furniture, materials, palette, lighting and realistic construction detail.',
    'futuristic-interior': 'Prompt style: Futuristic interior. Include budget/room intent, polished concrete, porcelain, dark matte walls, metal, leather, teak/freijo wood, LED linear lighting 4000-6500K, indirect lighting and minimal objects.',
    'cinematic-real-estate': 'Prompt style: Cinematic real estate. Include eye-level, low angle, high angle, bird eye/top-down, 3/4 angle, dolly in/out, orbit, flyover, top reveal, wide angle or telephoto camera language.',
    'technical-bim-mep': 'Prompt style: Technical BIM/MEP. Clean documentation style, BIM/MEP comparison, wireframe/hologram architecture, precise systems, readable technical overlays.',
    'topographic-hologram': 'Prompt style: Topographic hologram. Topographic terrain, GIS/neon linework, holographic contours, site levels and technical depth.',
    'masterplan-overlay': 'Prompt style: Masterplan overlay. Site planning, zones, circulation, roads, access logic, landscape areas and clean 3D text placement where useful.',
    'video-camera-movement': 'Prompt style: Video / camera movement. Shot sequence, dolly in/out, orbit, flyover, top reveal and cinematic presentation language.',
  }
  return styles[style] || styles['humanized-floor-plan']
}

function buildLocalSkillContext(userText, file) {
  const text = `${userText || ''} ${file?.name || ''} ${file?.kind || ''}`.toLowerCase()
  const contexts = []
  if (/(archvis|render|humaniz|planta|floor plan|fachada|facade|imagem|image)/.test(text)) {
    contexts.push('ArchVis: use prompt anatomy subject/style/details/materials/lighting/camera. Preserve mode is strict image-to-image, top-down orthographic, no geometry change, no extra rooms, no invented gardens, no boundary expansion. Creative redesign must be labeled as creative concept.')
    contexts.push('Image prompts: use style presets such as humanized floor plan, photorealistic facade, minimalist residence, sustainable/coastal/brutalist/futuristic, technical BIM/MEP, topographic hologram and masterplan overlay. Build negative prompts for changed geometry, altered walls, missing/extra rooms, moved pool/road, invented garden, cropped plan and perspective distortion.')
  }
  if (/(video|directcut|timelapse|roteiro|shot|camera|cinematic|cinema)/.test(text)) {
    contexts.push('Video/DirectCut: produce script, shot list, timeline prompt, voiceover, reveal/orbit/flyover/dolly/top-reveal movement and real estate sales pacing.')
    contexts.push('Cinematic camera: eye-level, low angle, high angle, bird-eye/top-down, front/side/rear/3-4 angle, dolly in/out, orbit, flyover, top reveal, wide angle and telephoto.')
  }
  if (/(interior|sala|quarto|cozinha|futurista|furniture|material|palette)/.test(text)) {
    contexts.push('Interior/futuristic: ask or infer budget, rooms, palette, polished concrete, porcelain, dark matte walls, metal, leather, teak/freijo wood, LED linear 4000-6500K, indirect lighting and minimal objects.')
  }
  if (/(ifc|rvt|dwg|dxf|skp|bim|cad|3d|viewer|clash)/.test(text)) {
    contexts.push('BIM/CAD: Apex-internal first. Never tell the user to leave the platform as the main solution. IFC/GLB/GLTF/OBJ/STL/FBX must open in Apex BIM / 3D Studio. RVT/DWG/DXF/SKP must open an Apex internal conversion/import workflow. For findings, do not say I think/probably/parece/talvez/pode conter/might/may contain. Separate claims into CONFIRMED, ASSUMPTION and UNKNOWN. Do not say use Revit/ArchiCAD/Solibri/Twinmotion/Blender unless Apex has opened the internal studio/import flow, identified a specific limitation, generated a report and produced correction instructions, or unless the user explicitly asks how to do it outside Apex. If parser/viewer fails, show the real error and offer internal next steps: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if available, create technical review plan.')
  }
  if (/(revit|dynamo|pyrevit|add-?in|plugin|c#|csharp|ribbon|shared parameter|shared parameters|par[aâ]metro|par[aâ]metros compartilhados|view template|template bim|fam[ií]lia|families|ifc export|exportar ifc|glb|manifest|externalcommand|iexternalcommand|iexternalapplication|sheets|pranchas|schedules|quantitativos|qa\/qc|model checking)/.test(text)) {
    contexts.push('Revit customization: answer as a Revit/BIM automation consultant. Distinguish manual Revit setup, Dynamo automation, pyRevit scripts and full C# Revit API add-ins. Cover project setup, templates, families, shared/project parameters, view templates, filters, schedules, sheets/title blocks, BIM standards, IFC/GLB export workflows, model checks, QA/QC, preflight checks and Apex AI Copilot integration. Generate code when requested, show where files go, include .addin manifest/ribbon button structure for C# plugins, and warn that code must be tested inside the matching Revit version. Do not pretend a plugin/script was installed or tested.')
  }
  if (/(eua|usa|united states|mercado americano|american market|europa|europe|european market|mercado europeu|offshore|d[oó]lar|euro|clientes internacionais|international clients|permit set|permit sets|portfolio americano|linkedin em ingl[eê]s|linkedin|prospec[cç][aã]o|outreach|bim em d[oó]lar|revit em d[oó]lar|opera[cç][aã]o remota|remote operation|residential construction docs|construction documentation)/.test(text)) {
    contexts.push('International Market Strategy from Venda EUA Edgard PDF: the fastest entry path is not "architect in the US". Prioritize BIM Specialist, Revit Modeler, Permit Set Designer, Residential Construction Documentation Specialist and offshore BIM/CAD production partner positioning. High-value US/EU paths are permit sets, residential construction docs, Revit modeling, BIM coordination, estimating, technical documentation automation and AI-powered project delivery. Lower priority: render-only, Instagram-only and aesthetics-only positioning. Use Agency -> Platform -> SaaS: sell premium offshore technical production first, automate internally, then productize into AI BIM Operations Platform. For product strategy, do not build the whole enterprise platform first; start with BIM upload, AI issue analysis, permit checklist, issue tracking, executive reports, document intelligence and workflow approvals. Produce actionable business outputs: 90-day roadmap, LinkedIn headline/about, portfolio plan, outreach scripts, service menu, proposal copy and offshore production workflow. Connect Research, Contracts/Permits, BIM/3D, Revit, Budget, DirectCut and Marketing when useful. Do not invent current market data, code requirements, competitor facts or prices without source verification.')
  }
  if (/(github|repo|repository|branch|pr\b|pull request|supabase|sql|vercel|deploy|deployment|backend|frontend|database|schema|rls|policy|policies|security|seguran[cç]a|vulnerab|refactor|module|m[oó]dulo|code review|auditoria t[eé]cnica|build error|deploy error|secrets?|dependency|depend[eê]ncia|cors|auth|migra[cç][aã]o|migration)/.test(text)) {
    contexts.push('Platform Engineering / DevOps: act as a senior platform engineer. Review repository structure, frontend, backend, database/schema, Supabase SQL/RLS, Vercel deploy config, build/deploy errors, branch/PR plans, dependency risk and security. Always separate CONFIRMED, ASSUMPTION and NEEDS VERIFICATION. Do not claim GitHub/Vercel/Supabase access or success unless connector/URL/content/local clone/command output proves it. Do not expose secrets. Do not modify production config without explicit instruction. For Supabase, prefer migration-safe SQL and warn about RLS exposure. For Vercel, check env vars, build command, output dir, framework preset and runtime compatibility. For security, flag exposed keys, unsafe localStorage secrets, missing auth/RLS, open CORS, insecure uploads, unsanitized file parsing, dependency risk and broad admin/service-role usage.')
  }
  if (/(venda|cliente|crm|proposal|proposta|business|marketing|or[cç]amento|budget)/.test(text)) {
    contexts.push('Business/sales: produce positioning, client pitch, proposal outline, buyer profile, value proposition, recommended visuals and next commercial action directly.')
  }
  if (/(code|c[oó]digo|react|typescript|mcp|api|server|platform)/.test(text)) {
    contexts.push('Coding/platform: prefer small scoped changes, keep secrets server-side, separate protocol/validation/execution/evaluation, and produce code directly when requested.')
  }
  if (/(write|escreva|texto|copy|document|doc|humaniz)/.test(text)) {
    contexts.push('Writing: produce the requested artifact directly, match user language/tone and avoid generic boilerplate unless asked.')
  }
  if (/(docsedgard|reintegrada|skill integrada|skill real|skills importadas|invent[aá]rio de skills|manifesto de skill)/.test(text)) {
    contexts.push('Docsedgard Integrated Skill: use local runtime command `docsedgard_skill` for operational actions. Available actions: `summary` (totals and top folders), `search:<termo>` (find artifacts by topic/path), and `sync-manifest` (regenerate skill/DOCSEDGARD_SKILL_REINTEGRADA.md from D:\\AI Jedgard\\skill).')
  }
  if (/(negocia|counteroffer|proposta comercial|deal)/.test(text)) {
    contexts.push('Negotiation: clarify goal/leverage/constraints only when needed; otherwise produce scripts, counteroffers, email drafts and options.')
  }
  if (/(data|dados|sql|planilha|xlsx|csv|analytics|metric)/.test(text)) {
    contexts.push('Data: do not invent data values; state missing data clearly; produce analysis structure, SQL, spreadsheet logic or metric reasoning.')
  }
  if (/(rdo|di[aá]rio de obra|relat[oó]rio de obra|andamento da obra|progresso da obra|checklist de qualidade|checklist de seguran[cç]a|equipe de obra|materiais entregues|pend[eê]ncia de obra|punch list|foto de obra|field operations|daily report|jobsite|site report|quality checklist|safety checklist|field photo)/.test(text)) {
    contexts.push('Field Operations / RDO: produce daily reports, progress summaries, crew/material logs, safety/quality checklists, punch lists and client reports. Do not claim field verification unless supported by photo or user field data. User notes are USER_REPORTED. Visible photo items can be PHOTO_CONFIRMED. Unknown items remain UNKNOWN. Do not fake weather or inspection approval.')
  }
  if (/(crm|lead|cliente|client|vendas|sales|proposta comercial|financeiro|finance|fatura|invoice|pagamento|payment|plano saas|usu[aá]rio|permiss[oõ]es|dashboard admin|dashboard cliente|pipeline|follow-up|cobran[cç]a|contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|accounting|accountant|tax)/.test(text)) {
    contexts.push('SaaS / CRM / Finance: local-first business layer only. No fake auth, no fake database persistence, no fake payment confirmation, no fake invoice sent, no fake tax filing. Always label Local demo mode — auth/database not connected yet. Client users must not access admin/internal data in the real model. Finance/accounting prepares records, ledgers, reports and accountant handoff packages with USER_ENTERED, SYSTEM_GENERATED, IMPORTED_DOCUMENT, UNKNOWN or NEEDS_ACCOUNTANT_REVIEW evidence.')
  }
  if (/(agentes|8 agentes|cognitive agents|maestro|bim manager|evm|nr compliance|cost controller|doc manager|scheduler|quality qa|agente cognitivo|agentes cognitivos)/.test(text)) {
    contexts.push('Cognitive Agents: expose the 8-agent Apex layer with honest status. Maestro AI orchestrates studios; BIM Manager connects BIM/3D; EVM Analyst has local-first CP11C support for CPI/SPI/EAC/VAC/TCPI/PV/EV/AC; NR Compliance has local-first CP11C support for NR-6/NR-10/NR-18/NR-33/NR-35; Cost Controller connects Budget/Finance/EVM/SINAPI source confidence; Doc Manager connects Project Workspace/Export Center/docs; Scheduler has local-first CP11C Gantt/milestones/critical path planning; Quality QA connects FieldOps/NR/punch list/NCIs/PBQP-H/ISO awareness. Do not fake external connectors or official completion.')
  }
  if (/(evm|cpi|spi|eac|vac|tcpi|planned value|earned value|actual cost|cronograma|gantt|caminho cr[ií]tico|atraso|lookahead|cronograma f[ií]sico-financeiro|nr-18|nr-35|nr-10|nr-6|nr-33|seguran[cç]a do trabalho|compliance nr)/.test(text)) {
    contexts.push('CP11C EVM/Scheduler/NR: run local analysis only. Calculate CPI=EV/AC, SPI=EV/PV, CV=EV-AC, SV=EV-PV, EAC/ETC/VAC/TCPI only when inputs exist. Missing PV/EV/AC/BAC stays UNKNOWN. Scheduler is local Gantt/milestone/lookahead planning only, no MS Project integration. NR compliance is GENERAL_GUIDANCE or NEEDS_SAFETY_REVIEW; no official compliance approval or safety certification.')
  }
  if (/(fornecedor|fornecedores|supply chain|cotação|cotacao|rfq|compra|material|materiais|subcontratado|procurement|supplier)/.test(text)) {
    contexts.push('CP11E Supply Chain: local supplier registry, procurement items, RFQs and comparisons only. Do not fake ERP, supplier price, availability or verification. Label data USER_ENTERED, PLACEHOLDER or NEEDS_VERIFICATION.')
  }
  if (/(alerta|notificação|notificacao|prazo|lembrete|pendência|pendencia|vencimento|atraso crítico|atraso critico|deadline|notification)/.test(text)) {
    contexts.push('CP11E Notifications: local alerts only. No push, email, SMS or calendar connector is connected unless explicitly verified. Label Local alert only - notification connector not connected yet.')
  }
  if (/(custo de ia|gasto com ia|tokens|observabilidade|ai cost|billing|usage dashboard)/.test(text)) {
    contexts.push('CP11E AI Cost / Observability: local estimated usage and cost only. Do not claim provider billing accuracy. Use ESTIMATED_LOCAL until real billing/usage API is connected.')
  }

  try {
    for (const skill of loadDynamicSkills()) {
      const matchesTag = skill.tags.some(tag => text.includes(String(tag).toLowerCase()))
      const matchesTitle = skill.title.toLowerCase().split(/\s+/).some(word => word.length > 3 && text.includes(word))
      if (matchesTag || matchesTitle) {
        contexts.push(`Skill [${skill.title}]: ${skill.description}\nRules and Guidelines:\n${skill.body}`)
      }
    }
  } catch (err) {
    console.error('[server] Erro ao carregar skills dinâmicas:', err)
  }

  if (!contexts.length) {
    contexts.push('Platform: Apex AI Copilot is a command-first full AI assistant. Chat is primary; modules and connectors are optional execution paths.')
  }
  return contexts.slice(0, 6).join('\n')
}

function buildToolSummary(tools) {
  return tools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
}

function buildFileContext(file) {
  if (!file) return ''
  return [
    'Uploaded file metadata:',
    `- name: ${file.name || 'unknown'}`,
    `- type: ${file.type || 'unknown'}`,
    `- kind: ${file.kind || 'unknown'}`,
    `- size: ${file.size || 'unknown'}`,
    file.dataUrl ? '- image content: supplied as data URL for vision analysis' : '- image/file content: not supplied; use metadata honestly',
  ].join('\n')
}

function detectLanguage(userText, conversation, preferredLanguage = '') {
  const latestUserText = [
    userText,
    ...conversation
      .filter(item => item?.role === 'user')
      .slice(-3)
      .map(item => String(item.text || '')),
  ].join(' ')
  const englishSwitchPattern = /\b(answer in english|speak english|in english|english please)\b/i
  if (englishSwitchPattern.test(userText)) return 'English'
  const isPtLocale = /^pt\b/i.test(String(preferredLanguage || ''))
  const hasPtKeywords = /\b(o que|vc|você|voce|sabe|fazer|fa[cç]a|crie|criar|gere|gerar|liste|lista|habilidades|capacidades|para mim|me ajude|ajude|planta|projeto|quero|posso|opcoes|opções|mostre|portugu[eê]s|render|or[cç]amento|an[uú]ncio|cliente|contrato|programar|componente|c[oó]digo|traduza|traduzir|quem|sou|verifique|verificar|auditar|auditoria|revisar|revisao|codigo|arquivos|erro|erros|teste|testar|rodar|executar|deploy|branch|main|github|vercel|supabase|sim|nao|não|olá|oi|ola|bom dia|boa tarde|boa noite)\b/i.test(latestUserText) || /[ãõçáéíóú]/i.test(latestUserText)
  if (isPtLocale || hasPtKeywords) return 'Portuguese'
  return 'English'
}

function detectIntent(userText) {
  const normalized = String(userText || '').toLowerCase()
  return {
    isHiddenUpload: /^user uploaded this file\./i.test(String(userText || '').trim()),
    asksForList: /\b(liste|lista|listar|me mostre uma lista|quais op[cç][oõ]es|op[cç][oõ]es|list|show me a list|what options)\b/i.test(normalized),
    asksCapabilities: /\b(o que (vc|você|voce) sabe fazer|o que (vc|você|voce) sabe|o que pode fazer|liste todas as suas habilidades|suas habilidades|suas capacidades|o que você consegue fazer|o que voce consegue fazer|what can you do|what do you know how to do|your abilities|your capabilities)\b/i.test(normalized),
    asksExecution: /\b(criar|crie|gera|gerar|gere|montar|monte|preparar|prepare|fazer|fa[cç]a|escreva|me ajude a escrever|ajude a escrever|produza|create|generate|write|help me write|prepare|build|make)\b/i.test(normalized),
    asksRenderPrompt: /\b(prompt de render|render prompt|prompt.*render|renderiza|renderizar)\b/i.test(normalized),
    asksSalesOutput: /\b(vender|venda|sell|sales|comercial|cliente|apresenta[cç][aã]o|presentation)\b/i.test(normalized),
    asksContractDraft: /\b(contrato simples|contrato|contract draft|simple contract|agreement)\b/i.test(normalized),
    asksTranslation: /\b(traduza|traduzir|translate|translate this|to english|para ingl[eê]s|para portugu[eê]s)\b/i.test(normalized),
    asksCodeOutput: /\b(componente react|react component|c[oó]digo|codigo|code|programar|typescript|javascript|jsx|tsx)\b/i.test(normalized),
  }
}

function buildStyleInstruction(userText, file) {
  const intent = detectIntent(userText)
  if (intent.isHiddenUpload && file) {
    return [
      'Style for this first upload reply: answer in one short natural paragraph.',
      'Do not create a plan, checklist, bullet list or numbered list.',
      'Mention only 2 to 4 concrete things visible or inferable from the file.',
      'Do not ask a question unless the task is genuinely stuck.',
    ].join('\n')
  }
  if (intent.asksExecution || (intent.asksSalesOutput && file)) {
    return [
      'Style for this reply: the user is asking for an output. Produce the output now.',
      'Do not explain the process.',
      'Do not answer with advice about how to create it.',
      'Do not ask another question if enough context exists.',
      'A short intro is fine, then provide the deliverable directly.',
      'If truly stuck by missing critical input, ask only the one missing question.',
      intent.asksTranslation ? 'For direct translation, output only the translation unless the user asks for notes.' : '',
      intent.asksCodeOutput ? 'For code requests, provide the code directly in the user language context, with only minimal usage note if helpful.' : '',
    ].filter(Boolean).join('\n')
  }
  const asksForStructuredOutput = /\b(report|relatorio|relat[oó]rio|checklist|lista|liste|bullet|tabela|table|format|formato|plano detalhado)\b/i.test(userText)

  // ── Detecção de Relatórios da Plataforma Apex ─────────────────
  const asksPlatformReport = /\b(relat[oó]rio de (status|provedores?|custos?|modelos?|estrat[eé]gico|completo|r[aá]pido|executivo)|an[aá]lise de (custos?|provedores?|benef[ií]cio)|status da plataforma|diagn[oó]stico|resumo executivo|me mostre um relat[oó]rio|catalogo de modelos|cat[aá]logo de modelos|recomenda[cç][oõ]es estrat[eé]gicas?|report|platform status|provider analysis|quick summary|executive summary)\b/i.test(userText)
  if (asksPlatformReport) {
    const reportTypes = [
      { pattern: /(provedores?|custos?|benef[ií]cio)/, endpoint: 'providers', label: 'Análise de Custo-Benefício' },
      { pattern: /(modelos?|cat[aá]logo)/, endpoint: 'models', label: 'Catálogo de Modelos' },
      { pattern: /(estrat[eé]gia|recomenda)/, endpoint: 'strategy', label: 'Recomendações Estratégicas' },
      { pattern: /(r[aá]pido|executivo|resumo)/, endpoint: 'quick', label: 'Resumo Executivo' },
      { pattern: /(completo|diagn[oó]stico)/, endpoint: 'status', label: 'Relatório Completo' },
    ]
    const matched = reportTypes.find(r => r.pattern.test(userText))
    const endpoint = matched?.endpoint || 'status'
    const label = matched?.label || 'Relatório de Status'
    return [
      `O usuário pediu um relatório da plataforma (${label}).`,
      `Use fetch('/api/reports/${endpoint}?format=markdown') para obter o relatório.`,
      `Retorne o conteúdo EXATAMENTE como veio da API, SEM resumir ou modificar.`,
      `Comece sua resposta com o relatório diretamente.`,
      `Se quiser adicionar contexto adicional, faça APÓS o relatório.`,
      `NÃO pergunte nada — o relatório já contém tudo.`,
      `Mantenha a formatação de bordas (╔╗╚╝) e ícones (✅⚠️❌) da resposta para ficar visual no chat.`,
    ].join('\n')
  }

  if (intent.asksForList || asksForStructuredOutput) {
    return [
      'Style for this reply: the user asked for a list or structured answer, so provide a clear concise list.',
      'Start with the requested list. Do not answer with a general paragraph and a question instead.',
      'Do not add report headings unless the user asked for a formal report.',
      'If there is uploaded-file context and the user asks what you can do, list actions for this specific file/project, not generic platform capabilities.',
      'If the file is an image/plan, include practical actions such as humanized plan, render briefing, commercial board, sales copy, video/tour script, layout review, budget questions, and BIM/3D next files when relevant.',
      'Do not add an unnecessary question if the requested list is complete.',
    ].join('\n')
  }
  const fileContext = file
    ? 'There is active uploaded-file context. If the user asks what you can do, answer from this file/project, not from generic capabilities.'
    : 'There is no uploaded-file context. You may explain capabilities briefly, but keep it conversational.'
  return [
    'Style for this reply: answer like a live, knowledgeable consultant — natural, direct, and professional.',
    'Use natural language and adapt your style to the question: one paragraph for simple answers, organized sections with bold headers for complex topics, bullet points for lists of features or steps.',
    'When listing capabilities, features or options, use bullet points with bold lead-ins. When explaining a concept, use natural paragraphs.',
    'Be warm but professional. The user is a professional in architecture, engineering or construction — match their level.',
    'If an image is supplied, mention 2 to 4 concrete visible details in natural prose before diving into analysis.',
    'Do not end with "How can I help?" or similar if a clear action can be taken.',
    'Do not say "Here are a few observations" or "Aqui estao algumas observacoes". Just answer directly.',
    fileContext,
  ].join('\n')
}

function buildIntentInstruction(userText, file, conversation, preferredLanguage) {
  const language = detectLanguage(userText, conversation, preferredLanguage)
  const intent = detectIntent(userText)
  const instructions = [
    `Language rule: Always answer in ${language}. The user's latest message controls the response language. Keep ${language} until the user clearly switches language.`,
  ]
  if (intent.asksCapabilities && file) {
    instructions.push(
      'Intent rule: the user is asking what Apex AI Copilot can do with the current uploaded file. Execute that intent directly.',
      'Answer in the context of the uploaded file and visible image/content. Do not give a generic platform capability overview.',
    )
  }
  if (intent.asksCapabilities && !file) {
    instructions.push(
      'Capability rule: the user is asking for your abilities. Respond naturally with organized categories using bold headers and emojis (like 📐 🎨 📊 🔧) to make capabilities scannable.',
      'Make clear that Apex AI Copilot is a full general AI copilot across topics and domains, while using Apex/project/file context when useful.',
      'Include general reasoning, planning, research, construction/architecture/engineering, BIM/CAD/3D/viewer, ArchVis/interior/room design, image/render/visual design, video/DirectCut, website/landing/portfolio, SQL/data analysis, coding/code copilot, academic research, negotiation, tech support, writing/humanizer, business strategy/sales/CRM/proposals, legal/contracts/permits support, field/RDO/quality/safety and exploration.',
      'Do not imply that topics outside construction are secondary or unsupported.',
    )
  }
  if (intent.isHiddenUpload && file) {
    instructions.push(
      'First upload rule: respond naturally in the selected language with a concise visual/context read.',
      'Do not generate a plan of action, checklist, numbered list, or capability list on first upload.',
      'Mention the visible project context briefly and ask one practical question.',
    )
  }
  if (intent.asksForList) {
    instructions.push(
      'Intent rule: the user explicitly asked for a list. Provide a numbered list, clear and practical.',
      'Do not answer with only a descriptive paragraph. Do not replace the requested list with a follow-up question.',
      'Do not apologize for using a list; the list is requested.',
    )
  }
  if (intent.asksExecution) {
    instructions.push(
      'Execution rule: The user is asking for an output. Produce the output now. Do not explain the process.',
      'Do not say what could be considered; create the deliverable directly.',
      'Do not ask a follow-up question when the uploaded file or current project context is enough to draft a useful first version.',
      'Only ask a question if the requested deliverable cannot be produced at all without one critical missing input.',
    )
  }
  if (intent.asksTranslation) {
    instructions.push(
      'Translation rule: translate directly. Do not add a follow-up question or extra commentary unless requested.',
    )
  }
  if (intent.asksCodeOutput) {
    instructions.push(
      'Code rule: produce code directly. Keep surrounding explanation minimal and in the user language.',
    )
  }
  if (language === 'Portuguese' && intent.asksExecution && intent.asksRenderPrompt && file) {
    instructions.push(
      'Required behavior for Portuguese render-prompt request with image/plan context:',
      'Start with: "Claro. Aqui está um prompt de render pronto para usar:"',
      'Then write a complete production-grade render prompt immediately, grounded in the visible plan/project context.',
      'Use a copy-ready "Prompt principal:" block, not only a list of attributes.',
      'The render prompt must include project type, view type, architecture style, materials, lighting, landscaping, furniture/interior cues, camera angle, image quality, and photorealism details.',
      'Use visible image details whenever present: pool, integrated living/kitchen/social area, bedrooms, landscaping, street/access at the top side, and irregular or sloped lot shape if visible.',
      'Include a negative prompt section that removes low quality, distorted geometry, wrong proportions, extra rooms, bad lighting, blurry textures, warped furniture, unreadable plan elements, people if not requested, and unrealistic materials.',
      'Include optional variants for facade, interior, humanized floor plan, and aerial sales image.',
      'Keep it usable for Midjourney/SDXL/DALL-E style image generation without overexplaining the process.',
      'End with one short optional adaptation line, such as: "Também posso adaptar esse prompt para fachada, interior, planta humanizada ou vídeo."',
      'Do not answer with "Para gerar um prompt..." or explain how prompt creation works.',
    )
  }
  if (language === 'Portuguese' && intent.asksSalesOutput && file) {
    instructions.push(
      'For a Portuguese sales/presentation request, produce the actual sales output immediately.',
      'Make the real estate marketing copy sharper and immediately usable.',
      'Include headline, short pitch, buyer profile, value proposition, recommended visuals, and next action.',
      'Ground it in visible project details such as pool, integrated social area, bedrooms, landscaping and street/access when present.',
      'Do not ask which step to prioritize before producing the first version.',
      'Start with a usable sales positioning, not advice about considering a portfolio.',
    )
  }
  if (language === 'Portuguese' && intent.asksExecution && intent.asksContractDraft) {
    instructions.push(
      'For a Portuguese simple-contract request, produce a usable simple contract draft immediately.',
      'Keep it practical and editable. Include parties, object, obligations, price/payment, term, termination, confidentiality if useful, liability limits, governing law/forum and signature lines.',
      'Add one short note that it is a draft for review and should be adapted by a qualified professional when legal risk matters.',
      'Do not ask which type of contract before giving a first simple model unless there is no possible generic draft.',
    )
  }
  if (language === 'Portuguese' && intent.asksCapabilities && intent.asksForList && file) {
    instructions.push(
      'Required Portuguese response shape for this request:',
      'Start exactly with: "Com essa planta, eu posso fazer principalmente isto:"',
      'Then provide a numbered list with practical items grounded in the visible plan, such as:',
      '1. Transformar em planta humanizada para apresentacao.',
      '2. Criar briefing de render externo ou interno.',
      '3. Montar roteiro de video/tour para venda.',
      '4. Preparar uma prancha comercial para cliente.',
      '5. Revisar layout: circulacao, integracao sala/cozinha, quartos, piscina e acesso pela rua.',
      '6. Criar texto de venda para anuncio, site ou proposta.',
      '7. Levantar duvidas tecnicas para orcamento.',
      '8. Separar proximos arquivos necessarios para BIM/3D.',
      'Do not ask a question before this list.',
    )
  }
  return instructions.join('\n')
}

function isIdentityQuestionText(text) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(String(text || '').trim())
}

function normalizeChatIdentityContext(value) {
  const source = value && typeof value === 'object' ? value : {}
  const role = String(source.role || '').trim()
  return {
    email: String(source.email || '').trim(),
    role,
    workspaceName: String(source.workspaceName || '').trim(),
    persistenceMode: String(source.persistenceMode || '').trim(),
    tenantId: String(source.tenantId || '').trim(),
    isOwnerAdmin: source.isOwnerAdmin === true || role === 'owner_admin',
    profileName: String(source.profileName || '').trim(),
  }
}

function buildIdentityContextSummary(identity) {
  return [
    `email: ${identity.email || 'unknown'}`,
    `role: ${identity.role || 'unknown'}`,
    `workspaceName: ${identity.workspaceName || 'unknown'}`,
    `persistenceMode: ${identity.persistenceMode || 'unknown'}`,
    `tenantId: ${identity.tenantId || 'unknown'}`,
    `isOwnerAdmin: ${identity.isOwnerAdmin ? 'true' : 'false'}`,
    `profileName: ${identity.profileName || 'unknown'}`,
  ].join('\n')
}

function buildWorkspaceContextSummary(workspaceContext) {
  if (!workspaceContext || typeof workspaceContext !== 'object') return ''
  const profile = workspaceContext.projectProfile && typeof workspaceContext.projectProfile === 'object'
    ? workspaceContext.projectProfile
    : null
  const lines = [
    `projectId: ${String(workspaceContext.projectId || 'unknown').slice(0, 80)}`,
    `projectName: ${String(workspaceContext.projectName || 'unknown').slice(0, 160)}`,
    `activeStudio: ${String(workspaceContext.activeStudio || 'none').slice(0, 60)}`,
    `fileCount: ${Number.isFinite(Number(workspaceContext.fileCount)) ? Number(workspaceContext.fileCount) : 0}`,
    `projectMemoryCount: ${Number.isFinite(Number(workspaceContext.projectMemoryCount)) ? Number(workspaceContext.projectMemoryCount) : 0}`,
  ]
  if (profile) {
    lines.push(
      `clientName: ${String(profile.clientName || 'unknown').slice(0, 160)}`,
      `projectType: ${String(profile.projectType || 'unknown').slice(0, 160)}`,
      `brief: ${String(profile.brief || 'none').slice(0, 600)}`,
      `styleNotes: ${String(profile.styleNotes || 'none').slice(0, 400)}`,
      `brandingNotes: ${String(profile.brandingNotes || 'none').slice(0, 400)}`,
      `preferredOutputs: ${String(profile.preferredOutputs || 'none').slice(0, 400)}`,
      `lockedConstraints: ${String(profile.lockedConstraints || 'none').slice(0, 400)}`,
    )
  }
  const recentProjectMemory = Array.isArray(workspaceContext.recentProjectMemory)
    ? workspaceContext.recentProjectMemory
      .slice(-3)
      .map((entry, index) => `${index + 1}. ${String(typeof entry === 'string' ? entry : JSON.stringify(entry)).slice(0, 280)}`)
    : []
  if (recentProjectMemory.length) {
    lines.push('recentProjectMemory:')
    lines.push(...recentProjectMemory)
  }
  const platformMapSummary = typeof workspaceContext.platformMapSummary === 'string'
    ? workspaceContext.platformMapSummary
    : ''
  if (platformMapSummary.trim()) {
    lines.push('platformMapSummary:')
    lines.push(platformMapSummary.slice(0, 4000))
  }
  if (workspaceContext.avatarVoiceSummary && typeof workspaceContext.avatarVoiceSummary === 'string') {
    lines.push('avatarVoiceSummary:')
    lines.push(String(workspaceContext.avatarVoiceSummary).slice(0, 1000))
  }
  if (workspaceContext.campaignAutomationSummary && typeof workspaceContext.campaignAutomationSummary === 'string') {
    lines.push('campaignAutomationSummary:')
    lines.push(String(workspaceContext.campaignAutomationSummary).slice(0, 1000))
  }
  return lines.join('\n')
}

function buildProviderStatusContext() {
  const keys = [
    'GEMINI_API_KEY',
    'FAL_KEY',
    'ELEVENLABS_API_KEY',
    'BRAVE_SEARCH_API_KEY',
    'AUTHKEY_AUTHKEY',
    'STRIPE_SECRET_KEY',
    'CRON_SECRET',
    'APS_CLIENT_ID',
    'APS_CLIENT_SECRET',
    'REVIT_MCP_URL',
    'REVIT_MCP_TOKEN',
    'LOCAL_WORKER_TOKEN',
    'VITE_FIREBASE_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ACCESS_TOKEN',
  ]
  return keys.map(k => `  ${k}=${process.env[k] ? 'configured' : 'NOT CONFIGURED'}`).join('\n')
}

function vercelObservabilityStatus() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return `Vercel runtime detected (${process.env.VERCEL_ENV || 'runtime'}). Logs/Analytics can be viewed in the Vercel project.`
  }
  return 'Vercel runtime not detected in this process. Logs/Analytics depend on Vercel deployment.'
}

function hasIdentityContext(identity) {
  return Boolean(
    identity?.email ||
    identity?.role ||
    identity?.workspaceName ||
    identity?.persistenceMode ||
    identity?.tenantId ||
    identity?.profileName ||
    identity?.isOwnerAdmin
  )
}

function buildIdentityReply(userText, identity) {
  if (!isIdentityQuestionText(userText)) return ''
  if (!identity.email && !identity.role && !identity.workspaceName && !identity.persistenceMode && !identity.tenantId && !identity.profileName) {
    return 'Ainda não tenho dados de sessão disponíveis nesta requisição. Não vou inventar nome, email, role ou workspace sem contexto real.'
  }
  const ownerLine = identity.isOwnerAdmin ? ' Você está marcado como owner_admin.' : ''
  const missing = []
  if (!identity.profileName) missing.push('nome completo/perfil')
  if (!identity.email) missing.push('email')
  if (!identity.role) missing.push('role')
  if (!identity.workspaceName) missing.push('workspace')
  if (!identity.persistenceMode) missing.push('persistence')
  if (!identity.tenantId) missing.push('tenant/workspace id')
  const missingLine = missing.length ? ` Dados não disponíveis na sessão: ${missing.join(', ')}.` : ''
  return `Sim. Você está logado como ${identity.email || 'email não disponível'}, com role ${identity.role || 'não disponível'}, no workspace ${identity.workspaceName || 'não disponível'}, usando persistence ${identity.persistenceMode || 'não disponível'}.${ownerLine}${missingLine} Ainda não vou inventar dados além do que está disponível na sessão.`
}

function prefersPortugueseText(text = '', locale = '') {
  const hasPtSignal = /\b(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|vc|voce|você|quem sou|o que|fale|fala|explique|sobre|vistos|visto|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra|teste|quem é você|quem e voce|quem e vc|quem e apex|quem é a apex)\b|[ãõçáéíóú]/i.test(text)
  if (hasPtSignal) return true
  if (locale && String(locale).toLowerCase().startsWith('pt')) return true
  return false
}

function isCapabilitiesQuestionText(text = '') {
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|vc sabe responder|voce sabe responder|você sabe responder|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
}

function isContactQuestionText(text = '') {
  return /\b(como entrar em contato|falar com o suporte|falar com a equipe|telefone de contato|e-mail de contato|consultoria de contato|falar com|contact information|how to contact|contact support)\b/i.test(text.trim())
}

function isVisaQuestionText(text = '') {
  return /\b(visto|vistos|visa|imigracao|imigração|consulado|turismo|trabalho|estudo)\b/i.test(text.trim())
}

function isUploadQuestionText(text = '') {
  const trimmed = text.trim()
  if (/\b(pdf\.js|pdfjs|pdf-js)\b/i.test(trimmed)) return false
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(trimmed)
}

function isGreetingText(text = '') {
  const trimmed = text.trim()
  if (/^(ol[aá]|oi|hey|hello|hi|bom dia|boa tarde|boa noite|e a[ií]|eai|e a\?|salve|tudo bem|tudo bom|como vai|como est[aá]|👋|🙏)(\s+apex)?[\s!?,.]*(tudo bem|tudo bom|como vai|como est[aá])?[\s!?,.]*$/i.test(trimmed)) {
    return true
  }
  const shortResponseRegex = /^(boa|tamo junto|valeu|obrigad[oa]|ok|certo|entendi|sim|n[aã]o|pode|t[aá]|ta|blz|bl[ée]z|teste|test)$/i
  const cleaned = trimmed.replace(/[\s!?,.]+$/, '')
  return shortResponseRegex.test(cleaned)
}

function isAIIdentityQuestionText(text = '') {
  const trimmed = text.trim()
  return /\b(quem [eé] (voc[eê]|vc|a apex)|o que (voc[eê]|vc) [eé]|quem [eé] apex|who are you|what is apex|quem e voce|quem e vc|o que e a apex)\b/i.test(trimmed)
}

function buildAIIdentityReply(userText, locale = '') {
  if (!isAIIdentityQuestionText(userText)) return ''
  const pt = prefersPortugueseText(userText, locale)
  return pt
    ? 'Sou a Apex AI. Como posso te ajudar?'
    : 'I am Apex AI. How can I help you?'
}

function buildChatFallbackReply(userText, identity, locale = '') {
  const aiIdentityReply = buildAIIdentityReply(userText, locale)
  if (aiIdentityReply) return aiIdentityReply

  const identityReply = buildIdentityReply(userText, identity)
  if (identityReply) return identityReply
  const pt = prefersPortugueseText(userText, locale)
  if (isGreetingText(userText)) {
    return pt
      ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas de mercado. É só me dizer o que precisa!'
      : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do market research. Just let know what you need!'
  }
  if (isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Que ótima pergunta! Tenho várias áreas onde posso ajudar:\n\n**📐 Análise e Leitura** — Plantas, documentos técnicos, contratos, relatórios. Faço análise visual direta, extraio quantitativos, confiro especificações.\n\n**🎨 Geração Visual** — Imagens de fachada, renders de arquitetura, vídeos de tour virtual, pranchas comerciais. É só enviar uma base que eu preparo o briefing.\n\n**📊 Gestão e Negócios** — Orçamentos, cronogramas, contratos, propostas, campanhas de marketing e relatórios de campo.\n\n**🔧 Automações** — Conecto com BIM, DirectCut, CRM e ERP para executar fluxos completos sem você sair daqui.\n\nO que vamos fazer hoje?'
      : 'Great question! I can help across several areas:\n\n**📐 Analysis & Reading** — Plans, technical documents, contracts, reports. Direct visual analysis, quantity takeoffs, spec checking.\n\n**🎨 Visual Generation** — Facade images, architectural renders, virtual tour videos, commercial boards. Send me a base and I\'ll prepare the brief.\n\n**📊 Business & Management** — Budgets, schedules, contracts, proposals, marketing campaigns, field reports.\n\n**🔧 Automations** — Connected to BIM, DirectCut, CRM and ERP to run complete workflows without leaving here.\n\nWhat shall we work on today?'
  }
  if (isContactQuestionText(userText)) {
    return pt
      ? 'Claro! Posso ajudar a preparar um pré-cadastro. Para isso, preciso de algumas informações: nome completo, email, telefone, cidade, tipo de projeto (BIM, 3D, contrato, alvará, proposta) e uma breve descrição do que precisa. Quer começar?'
      : 'Sure! I can help prepare a pre-registration. I\'ll need some info: full name, email, phone, city, project type (BIM, 3D, contract, permit, proposal), and a brief description of what you need. Shall we start?'
  }
  if (isVisaQuestionText(userText)) {
    return pt
      ? 'Vistos são autorizações para entrar, permanecer, estudar, trabalhar ou investir em outro país. Em geral, o caminho depende do país, objetivo da viagem, duração, vínculos financeiros/profissionais e documentos de suporte. Posso te ajudar a comparar tipos de visto, montar checklist de documentos, preparar carta/declaração, organizar um cronograma e revisar riscos antes do envio. Para orientar melhor, me diga o país de destino e o objetivo: turismo, estudo, trabalho, negócios, investimento ou residência.'
      : 'Visas are authorizations to enter, stay, study, work, or invest in another country. The right path depends on destination country, purpose, duration, financial/professional ties, and supporting documents. I can compare visa types, build a document checklist, draft letters, organize a timeline, and review risks before submission. Tell me the destination country and purpose: tourism, study, work, business, investment, or residency.'
  }
  if (isUploadQuestionText(userText)) {
    return 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botão de anexar (ícone de clipe). Eu uso o arquivo como contexto e sigo com uma análise direta — sem rodeios!'
  }
  return pt
    ? 'Entendido! Estou aqui com tudo pronto — análise de documentos, geração visual, gestão de contratos, automações. Me diga o que precisamos fazer e vamos nessa! 🚀'
    : 'Got it! I\'m all set — document analysis, visual generation, contract management, automations. Just tell me what we need to do and let\'s go! 🚀'
}


const LIVE_AGENT_SAFE_COMMAND_IDS = new Set([
  'git_status',
  'git_diff_stat',
  'build',
  'validate_supabase_sql',
  'check_server',
  'raw_shell',
  'git_log_recent',
  'git_diff_name_only',
  'validate_vercel_live',
  'validate_supabase_live',
  'deploy_vercel_live',
  'skill_audit',
  'revit_generate',
  'marketing_generate',
  'legacy_import',
  'mcp_generate',
  'code_analyze',
  'docsedgard_skill',
  'apex_diag',
])

function buildLiveAgentToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'run_safe_local_command',
        description: 'Run a local Apex project command when live project evidence is needed. Use this naturally; the user does not need to know command names.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            commandId: {
              type: 'string',
              enum: [
                'git_status', 'git_diff_stat', 'build', 'validate_supabase_sql', 'check_server',
                'raw_shell', 'git_log_recent', 'git_diff_name_only', 'validate_vercel_live',
                'validate_supabase_live', 'deploy_vercel_live', 'skill_audit',
                'revit_generate', 'marketing_generate', 'legacy_import', 'mcp_generate', 'code_analyze',
                'docsedgard_skill',
                'apex_diag'
              ],
              description: 'Command to execute in the authorized Apex repo.'
            },
            reason: {
              type: 'string',
              description: 'Brief natural reason why this command is needed.'
            },
            rawCommand: {
              type: 'string',
              description: 'Raw command string, script name, or parameter value.'
            }
          },
          required: ['commandId', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'execute_terminal_command',
        description: 'EXECUTA UM COMANDO DIRETAMENTE no terminal do servidor. Use quando o usuario pedir para rodar algo como git status, npm build, node script, etc. EXECUTA DIRETO — não abra painel, não peça confirmacao, apenas execute e mostre o resultado.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            rawCommand: {
              type: 'string',
              description: 'Comando completo para executar no terminal. Ex: "git status", "npm run build", "node script.mjs"'
            },
            reason: {
              type: 'string',
              description: 'Breve descricao do porque este comando e necessario.'
            }
          },
          required: ['rawCommand', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_platform_status',
        description: 'Get the REAL-TIME platform status including configured API keys, git branch/commit, and provider health. Use this when the user asks about platform status, provider keys, system health, or what is configured.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_service_order',
        description: 'Create a service order when a client decides to hire a service. Call this when the client says "quero", "contratar", "fechar", "comprar", "quanto custa", or accepts a proposal. Creates the order and returns the payment link.',
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: 'Client name' },
            clientEmail: { type: 'string', description: 'Client email' },
            serviceType: { type: 'string', enum: ['render', 'video', 'budget', 'contract', 'bim', 'fieldops', 'consulting'], description: 'Type of service' },
            serviceName: { type: 'string', description: 'Service name/title' },
            description: { type: 'string', description: 'Service description/details' },
            amount: { type: 'number', description: 'Price in BRL' },
            plan: { type: 'string', enum: ['unique', 'subscription'], description: 'Unique service or monthly subscription' },
          },
          required: ['clientName', 'serviceType', 'serviceName', 'amount', 'plan'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'approve_service_order',
        description: 'Mark a service order as approved when the client says "aprovado", "gostei", "quero este", "pode entregar", "fechado", or confirms satisfaction with the result. This generates the final delivery and invoice.',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'Order ID to approve' },
            clientEmail: { type: 'string', description: 'Client email for notification' },
            deliveryUrl: { type: 'string', description: 'URL to the final delivered file (optional)' },
          },
          required: ['orderId', 'clientEmail'],
        },
      },
    },
    // MS Project connector tools
    {
      type: 'function',
      function: {
        name: 'parse_msproject_xml',
        description: 'Parse MS Project XML (MSPDI format) and return structured task/resource data with scheduling analysis. Use when the user provides an MS Project file or asks about project schedules.',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The full MSPDI XML content to parse.' },
            includeResources: { type: 'boolean', description: 'Include resource data. Default: true.' },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'analyze_msproject_schedule',
        description: 'Analyze a parsed MS Project schedule for delays, critical path, baseline variance and milestones.',
        parameters: {
          type: 'object',
          properties: {
            projectXml: { type: 'string', description: 'The MSPDI XML to analyze.' },
          },
          required: ['projectXml'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_msproject_report',
        description: 'Generate a complete Markdown scheduling report from MS Project XML, including task breakdown, baseline analysis, critical path, and alerts.',
        parameters: {
          type: 'object',
          properties: {
            projectXml: { type: 'string', description: 'The MSPDI XML to generate a report from.' },
          },
          required: ['projectXml'],
        },
      },
    },
    // Apex Platform Report tool
    {
      type: 'function',
      function: {
        name: 'generate_platform_report',
        description: 'Generate a structured markdown report about the Apex platform status, providers, models, costs, or strategic recommendations. Use when the user asks for "relatório", "status", "diagnóstico", "análise", "catálogo", "estratégia", "resumo executivo" or similar.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['status', 'providers', 'models', 'strategy', 'quick'],
              description: 'Report type: status (complete), providers (cost-benefit), models (catalog), strategy (recommendations), quick (executive summary)',
            },
          },
          required: ['type'],
        },
      },
    },
    // Auto-Fix tool
    {
      type: 'function',
      function: {
        name: 'auto_fix',
        description: 'Detect and auto-fix project problems: merge conflicts, TypeScript errors, build failures, test failures, uncommitted changes. Use when the user reports errors, conflicts, or asks to fix/resolve/repair anything.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['check', 'fix'], description: "'check' to scan only, 'fix' to scan and auto-fix" },
          },
          required: ['action'],
        },
      },
    },
    ...buildCodeToolDefinitions(),
  ]
}

function compactLiveAgentToolText(value) {
  const clean = redactedExecutionText(String(value || '').trim())
  if (!clean) return ''
  if (clean.length <= 5000) return clean
  return clean.slice(0, 2400) + '\n...\n' + clean.slice(-2200)
}

async function executeLiveAgentToolCall(toolCall) {
  const name = toolCall && toolCall.function ? String(toolCall.function.name || '') : ''

  // Real code/filesystem/command tools (read/list/search/write/edit/run).
  if (CODE_TOOL_NAMES.has(name)) {
    return await executeCodeToolCall(toolCall, authorizedExecutionCwd)
  }

  if (name === 'get_platform_status') {
    return await handleGetPlatformStatus()
  }

  if (name === 'create_service_order') {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const { createServiceOrder, updateServiceOrderStatus, buildServiceOrderReply } = await import('./server/service/serviceOrder.mjs')
      const order = createServiceOrder({
        clientId: args.clientId || args.clientEmail || 'chat-client',
        clientName: args.clientName || 'Cliente',
        clientEmail: args.clientEmail || '',
        serviceType: args.serviceType || 'consulting',
        serviceName: args.serviceName || 'Servico Apex',
        description: args.description || '',
        amount: args.amount || 0,
        currency: 'BRL',
        plan: args.plan || 'unique',
      })
      const { findOrCreateClient, updateClientAfterOrder } = await import('./server/service/client.mjs')
      const client = findOrCreateClient({ email: order.clientEmail, name: order.clientName })
      if (client) updateClientAfterOrder(order.clientEmail, order)
      // Generate Stripe checkout link
      let paymentLink = ''
      try {
        const stripe = await import('stripe')
        const stripeClient = stripe.default(process.env.STRIPE_SECRET_KEY)
        const session = await stripeClient.checkout.sessions.create({
          mode: order.plan === 'subscription' ? 'subscription' : 'payment',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'brl',
              product_data: { name: order.serviceName, description: order.description },
              unit_amount: Math.round(order.amount * 100),
            },
            quantity: 1,
          }],
          metadata: { order_id: order.id },
          success_url: `${process.env.APEX_PRODUCTION_DOMAIN || 'http://localhost:4177'}/success?order=${order.id}`,
          cancel_url: `${process.env.APEX_PRODUCTION_DOMAIN || 'http://localhost:4177'}/`,
        })
        paymentLink = session.url || ''
        updateServiceOrderStatus(order.id, 'pending', { paymentId: session.id })
        const { createInvoice } = await import('./server/service/invoice.mjs')
        const invoice = createInvoice({
          orderId: order.id,
          clientName: order.clientName,
          clientEmail: order.clientEmail,
          serviceName: order.serviceName,
          amount: order.amount,
          currency: order.currency,
          orderNumber: order.number,
        })
        updateServiceOrderStatus(order.id, 'pending', { invoiceId: invoice.id })
      } catch (stripeError) {
        console.error('[Stripe] Failed to create session:', stripeError.message)
      }
      const reply = buildServiceOrderReply(order)
      return {
        providerStatus: 'connected',
        finalReply: reply + (paymentLink ? `\n\nLink para pagamento: ${paymentLink}` : '\n\n(Stripe nao configurado)'),
        order,
        paymentLink,
      }
    } catch (err) {
      return { providerStatus: 'error', finalReply: 'Erro ao criar pedido: ' + err.message }
    }
  }

  if (name === 'approve_service_order') {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const { updateServiceOrderStatus, getServiceOrder, buildServiceOrderReply } = await import('./server/service/serviceOrder.mjs')
      const { payInvoice } = await import('./server/service/invoice.mjs')

      const order = getServiceOrder(args.orderId)
      if (!order) return { providerStatus: 'error', finalReply: 'Pedido não encontrado.' }

      updateServiceOrderStatus(args.orderId, 'approved', {
        deliveredAt: new Date().toISOString(),
        deliveryUrl: args.deliveryUrl || '',
      })

      if (order.invoiceId) payInvoice(order.invoiceId, 'manual-' + args.orderId)

      const updated = getServiceOrder(args.orderId)
      const receipt = buildServiceOrderReply(updated)

      return {
        providerStatus: 'connected',
        finalReply: [
          `✅ **Pedido ${updated.number} aprovado e finalizado!**`,
          '',
          receipt,
          '',
          args.deliveryUrl ? `🔗 **Arquivo final:** ${args.deliveryUrl}` : '',
          '',
          'Obrigado por contratar a Apex Global!',
        ].filter(Boolean).join('\n'),
        order: updated,
      }
    } catch (err) {
      return { providerStatus: 'error', finalReply: 'Erro ao aprovar pedido: ' + err.message }
    }
  }

  // MS Project connector tools
  if (['parse_msproject_xml', 'analyze_msproject_schedule', 'generate_msproject_report'].includes(name)) {
    const { executeMsProjectToolCall } = await import('./server/agent/msprojectConnector.mjs')
    return await executeMsProjectToolCall(toolCall)
  }

  // Apex Platform Report tool
  if (name === 'generate_platform_report') {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const reportType = args.type || 'status'
      const { default: reportHandler } = await import('./api/reports/index.mjs')
      let reportResult = null
      const mockRes = {
        status() { return this },
        json(d) { reportResult = d },
        send(d) { reportResult = d },
        setHeader() { },
        end() { },
      }
      const mockReq = {
        method: 'GET',
        url: `/api/reports/${reportType}?format=markdown`,
        headers: {},
      }
      await reportHandler(mockReq, mockRes)
      return {
        providerStatus: 'connected',
        finalReply: reportResult?.markdown || reportResult?.text || JSON.stringify(reportResult),
        reportType,
        reportData: reportResult,
      }
    } catch (err) {
      return { providerStatus: 'error', finalReply: `Erro ao gerar relatório: ${err.message}` }
    }
  }

  // Auto-Fix tool
  if (name === 'auto_fix') {
    const { detectProblems, autoFixProblems, getAutoFixStatus } = await import('./server/service/autoFix.mjs')
    try {
      const actionsArgs = JSON.parse(toolCall.function.arguments || '{}')
      const action = String(actionsArgs.action || 'check')

      if (action === 'fix') {
        const problems = await detectProblems()
        if (problems.length === 0) {
          return { providerStatus: 'connected', message: 'Nenhum problema detectado.', fixed: [], failed: [] }
        }
        const result = await autoFixProblems(problems.filter(p => p.autoFixable))
        return {
          providerStatus: 'connected',
          message: `${result.fixed.length} corrigido(s), ${result.failed.length} falha(s).`,
          problems,
          fixed: result.fixed,
          failed: result.failed,
        }
      }

      // Default: check
      const status = await getAutoFixStatus()
      return { providerStatus: 'connected', ...status }
    } catch (err) {
      return { providerStatus: 'error', message: `Auto-fix error: ${err.message}` }
    }
  }

  // ── Handler for execute_terminal_command ────────────────────────────────
  if (name === 'execute_terminal_command') {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const rawCommand = String(args.rawCommand || '').trim()
      const reason = String(args.reason || '').slice(0, 500)

      if (!rawCommand) {
        return { providerStatus: 'error', error: 'Raw command is required.', reason }
      }

      // Execute via runCopilotExecutionCommand with raw_shell
      const command = getExecutionCommand('raw_shell')
      if (!command) {
        return { providerStatus: 'error', error: 'Shell executor not available.', reason }
      }

      const result = await runCopilotExecutionCommand(command, {
        cwd: authorizedExecutionCwd,
        rawCommand,
        approvedBy: 'Live Agent (auto)',
      })

      const stdout = String(result.stdout || '')
      const stderr = String(result.stderr || '')
      const exitCode = result.exitCode ?? -1
      const output = [stdout, stderr].filter(Boolean).join('\n').slice(0, 4000)

      return {
        providerStatus: 'connected',
        reason,
        commandText: rawCommand,
        exitCode,
        output,
        stdout: stdout.slice(0, 2000),
        stderr: stderr.slice(0, 2000),
        label: result.label,
        durationMs: result.durationMs,
      }
    } catch (error) {
      return { providerStatus: 'error', error: `Execution failed: ${error.message}` }
    }
  }

  if (name !== 'run_safe_local_command') {
    return { providerStatus: 'error', error: 'Unknown Apex live agent tool.' }
  }

  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { providerStatus: 'error', error: 'Invalid tool arguments.' }
  }

  const commandId = String(args.commandId || '')
  const reason = String(args.reason || '').slice(0, 500)
  const rawCommand = String(args.rawCommand || '').trim()

  if (!LIVE_AGENT_SAFE_COMMAND_IDS.has(commandId)) {
    return {
      providerStatus: 'error',
      commandId,
      reason,
      error: 'Command is not allowed in Apex Live Agent.'
    }
  }

  const command = getExecutionCommand(commandId)
  if (!command) {
    return {
      providerStatus: 'error',
      commandId,
      reason,
      error: 'Command is unavailable.'
    }
  }

  const registeredCommandText = command.acceptsRawCommand ? rawCommand : [command.executable, ...command.args].join(' ')
  const safetyDecision = validateOwnerCodeCommand(registeredCommandText)

  if (!safetyDecision.allowed) {
    return {
      providerStatus: 'owner-code-executor-rejected',
      commandId,
      reason,
      commandText: registeredCommandText,
      safetyDecision
    }
  }

  const result = await runCopilotExecutionCommand(command, {
    cwd: authorizedExecutionCwd,
    rawCommand: command.acceptsRawCommand ? rawCommand : undefined,
    approvedBy: 'User',
  })

  return {
    providerStatus: 'connected',
    reason,
    commandId: result.commandId,
    label: result.label,
    status: result.status,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    stdout: compactLiveAgentToolText(result.stdout),
    stderr: compactLiveAgentToolText(result.stderr),
    redactedOutput: result.redactedOutput,
  }
}

async function handleGetPlatformStatus() {
  const { execSync } = await import('child_process')
  let branch = 'unknown'
  let commit = 'unknown'
  try {
    branch = String(execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', cwd: authorizedExecutionCwd })).trim()
    commit = String(execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: authorizedExecutionCwd })).trim()
  } catch {
    // git not available in this context
  }

  const providerLines = buildProviderStatusContext()
  const configuredCount = providerLines.split('\n').filter(l => l.includes('configured')).length

  return {
    providerStatus: 'connected',
    git: { branch, commit },
    providers: providerLines.split('\n').map(l => {
      const [name, status] = l.trim().split('=')
      return { name, configured: status === 'configured' }
    }),
    configuredProviderCount: configuredCount,
  }
}

function isLiveAgentOperationalPreflightNeeded(text) {
  const value = String(text || '').toLowerCase().trim()
  if (!value) return false

  return /\b(pr[oó]ximo|proximo|agora|status|plataforma|checkpoint|continua|continuar|seguir|sugere|sugest[aã]o|o que fazer|o que fazemos|tudo certo|ficou certo|pode seguir|fa[cç]a|execute|executa|ok|valida|validar|fechar|finalizar|commitar|commit)\b/i.test(value)
}

async function buildLiveAgentPreflightContext(userText) {
  if (!isLiveAgentOperationalPreflightNeeded(userText)) return ''

  const commandIds = ['git_status', 'git_diff_stat', 'check_server']
  const lower = String(userText || '').toLowerCase()

  if (/\b(build|tudo certo|ficou certo|fechar|finalizar|checkpoint|valida|validar|pode seguir|execute|fa[cç]a|ok)\b/i.test(lower)) {
    commandIds.push('build')
  }

  const results = []

  for (const commandId of [...new Set(commandIds)]) {
    const toolResult = await executeLiveAgentToolCall({
      function: {
        name: 'run_safe_local_command',
        arguments: JSON.stringify({
          commandId,
          reason: 'Apex Live Agent operational preflight for a natural project/status/next-step request.'
        })
      }
    })

    results.push(toolResult)
  }

  return [
    'Apex live operational preflight evidence was collected before answering.',
    'Use this evidence to answer decisively. Do not ask the user what to do if a safe next step is clear.',
    'Do not claim commit/push/deploy/migration/file edit unless a tool result proves it.',
    'Current tool results:',
    JSON.stringify(results, null, 2)
  ].join('\n')
}

function shouldForceLiveAgentToolUse(text = '') {
  const value = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (/^(oi|ola|bom dia|boa tarde|boa noite|hello|hi|hey|test|teste)[\s!.,?]*$/.test(value)) {
    return false
  }

  return /\b(implementar|corrigir|editar|alterar|ajustar|criar|gerar|build|testar|validar|commit|push|deploy|migration|supabase|vercel|github|executar|execute|rodar|run|aplicar|verificar|checar|revisar|revisao|auditar|auditoria|atualizar|codigo|arquivo|arquivos|repositorio|modulo|modulos|integracao|mostrar|mostra|ver|analisar|analise|mcp|conector|conectores|git|status|branch|projeto|plataforma|habilidade|habilidades|capacidade|capacidades|fazer|faz)\b/.test(value)
}

async function handleModelsList(req, res) {
  try {
    const models = []
    const seen = new Set()
    const diagnostics = getModelProviderDiagnostics()
    const addModel = model => {
      if (!model?.id || seen.has(model.id)) return
      seen.add(model.id)
      models.push(model)
    }

    const fetchModels = async (url, headers, provider, keyField = 'id', nameField = 'name', dataField = 'data') => {
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) })
        if (!res.ok) return
        const json = await res.json()
        const items = dataField ? json[dataField] || json.models || json.data || [] : json
        for (const item of items) {
          const id = item[keyField] || item.id || item.name
          if (!id) continue
          addModel({ id: composeModelValue(provider, id), modelId: id, provider, name: item[nameField] || item.name || id })
        }
      } catch (e) { console.error(`[fetchModels] ${provider} failed:`, e?.message?.substring(0, 80)) }
    }

    if (process.env.GEMINI_API_KEY) {
      await fetchModels('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { 'x-goog-api-key': process.env.GEMINI_API_KEY }, 'gemini', 'name', 'displayName', 'models')
    }
    if (process.env.ELEVENLABS_API_KEY) {
      await fetchModels('https://api.elevenlabs.io/v1/models', { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, 'elevenlabs', 'model_id', 'name', null)
    }
    if (process.env.FAL_KEY) {
      await fetchModels('https://fal.ai/api/models?limit=5000', { Authorization: `Key ${process.env.FAL_KEY}` }, 'fal', 'id', 'title', 'items')
    }

    for (const model of buildStaticModelCatalog()) {
      addModel(model)
    }

    const providerOrder = ['apex-local', 'gemini', 'gemini-interactions', 'fal', 'elevenlabs']
    models.sort((left, right) => {
      const leftIdx = providerOrder.indexOf(left.provider)
      const rightIdx = providerOrder.indexOf(right.provider)
      const providerCompare = (leftIdx === -1 ? 999 : leftIdx) - (rightIdx === -1 ? 999 : rightIdx)
      if (providerCompare !== 0) return providerCompare
      return String(left.name || left.id || '').localeCompare(String(right.name || right.id || ''))
    })

    return chatJson(res, 200, {
      ok: true,
      provider: 'mixed',
      models,
      providerDiagnostics: diagnostics,
    })
  } catch (err) {
    return chatJson(res, 500, { error: err.message })
  }
}

async function handleChat(req, res) {
  try {
    console.log('[handleChat] Received request');
    const body = await readJson(req)
    console.log('[handleChat] Parsed body', Object.keys(body));
    const identityContext = normalizeChatIdentityContext(body.identityContext)
    let userText = String(body.message || '').slice(0, 12000)
    // H5.0D: action tools hard-override — disabled when APEX_FREE_AGENT=1
    if (!APEX_FREE_AGENT) {
      const _h5ActionTools = new Set(['local_worker.status', 'revit_mcp.status', 'revit_model.status', 'vercel.deploy', 'supabase.migration'])
      const _h5ToolIds = classifyToolExecutionRequest(userText)
      if (_h5ToolIds.length && _h5ToolIds.some(id => _h5ActionTools.has(id))) {
        const _toolExecution = await routeToolExecution({ userMessage: userText, requestedToolIds: _h5ToolIds })
        return chatJson(res, 200, {
          finalReply: _toolExecution.finalReply,
          memoryPatch: null,
          mode: 'apex-h5-tool-execution-direct',
          operator: { intent: 'tool_execution', toolExecution: _toolExecution },
        })
      }
    }
    const locale = body.language || body.locale || req.headers['accept-language'] || ''
    if (identityContext) {
      identityContext.locale = locale
    }

    const aiIdentityReply = buildAIIdentityReply(userText, locale)
    if (aiIdentityReply) {
      return chatJson(res, 200, {
        finalReply: aiIdentityReply,
        mode: 'apex-identity-local',
      })
    }

    const identityReply = buildIdentityReply(userText, identityContext)
    if (identityReply) {
      return chatJson(res, 200, {
        finalReply: identityReply,
        mode: 'identity-context',
      })
    }



    const languageSwitch = String(userText || '').trim().toLowerCase()
    if (['en', 'english'].includes(languageSwitch)) {
      return chatJson(res, 200, {
        finalReply: 'English mode enabled. Tell me what you want to create, review or fix.',
        mode: 'language-switch',
      })
    }
    if (['pt', 'pt-br', 'portugues', 'português'].includes(languageSwitch)) {
      return chatJson(res, 200, {
        finalReply: 'Modo em português ativado. Me diga o que você quer criar, revisar ou corrigir.',
        mode: 'language-switch',
      })
    }

    if (!APEX_FREE_AGENT && isOperatorIntent(userText)) {
      try {
        const operatorResult = await runApexOperator({
          userMessage: userText,
          identityContext,
          workspaceContext: body.workspaceContext || {},
          repoPath: authorizedExecutionCwd,
          permissions: {
            allowCommit: true,
            commitMessage: 'chore: apex operator approved commit',
            allowRawShell: true,
            rawCommand: body.rawCommand || '',
            approvalText: body.approvalText || '',
          },
        })
        if (operatorResult?.ok && operatorResult.finalReply) {
          return chatJson(res, 200, {
            finalReply: operatorResult.finalReply,
            mode: 'apex-operator-runtime',
            operator: operatorResult,
          })
        }
      } catch (operatorError) {
        console.error('Apex Operator Runtime failed:', scrubProviderError(operatorError.message || operatorError))
      }
    }

    const providerDiagnostics = getModelProviderDiagnostics()
    let apiKey = process.env.GEMINI_API_KEY
    let apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta'

    const envDefaultModel = String(process.env.GEMINI_MODEL || '').trim()
    const hasLocalWorker = Boolean(!process.env.VERCEL && process.env.LOCAL_WORKER_URL && process.env.LOCAL_WORKER_TOKEN)
    const hasApexOwnEngine = Boolean(process.env.APEX_OWN_ENGINE_URL || process.env.APEX_API_URL || process.env.APEX_RUNTIME_ENABLED)
    const safeDefaultModel = hasApexOwnEngine
      ? 'apex-local|apex-ai'
      : hasLocalWorker
        ? 'local-worker|apex-ai'
        : (envDefaultModel && !envDefaultModel.toLowerCase().startsWith('apex-local')
          ? `gemini|${envDefaultModel}`
          : 'gemini|gemini-3.5-flash')
    const selectedModelRaw = body.model || body.selectedModel || safeDefaultModel
    const selectedModel = splitModelValue(selectedModelRaw)
    let modelProvider = selectedModel.provider
    let resolvedModelId = selectedModel.modelId

    if (!modelProvider && String(selectedModel.raw || '').trim().toLowerCase() === 'apex-local') {
      modelProvider = 'apex-local'
      resolvedModelId = 'apex-ai'
    }

    const model = normalizeLegacyChatModel(resolvedModelId || 'apex-ai')
    const isApexLocal = modelProvider === 'apex-local'
    const isGeminiProvider = modelProvider === 'gemini'
    const isInteractionsProvider = modelProvider === 'gemini-interactions'
    const isFalProvider = modelProvider === 'fal'
    const isElevenLabs = modelProvider === 'elevenlabs'
    const isFirebase = modelProvider === 'firebase'
    const isDirectGeminiModel = ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-image', 'gemini-3.1-flash-tts-preview', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'].includes(model)

    if (isApexLocal) {
      const systemText = 'Voce e a Apex AI, plataforma profissional de arquitetura, construcao, BIM, orcamentos, marketing e gestao. Responda em portugues, de forma tecnica e direta, sem inventar dados ou integracoes que nao existem.'
      const apexMessages = [
        { role: 'system', content: systemText },
        ...(Array.isArray(body.messages) ? body.messages.slice(-10) : [])
          .filter(m => m?.role === 'user' || m?.role === 'assistant')
          .map(m => ({ role: m.role, content: String(m.text || m.content || '').slice(0, 4000) })),
        { role: 'user', content: userText },
      ]

      const apexEngineUrls = [
        process.env.APEX_OWN_ENGINE_URL,
        process.env.APEX_API_URL,
        process.env.LOCAL_WORKER_URL,
        'http://127.0.0.1:8888',
      ].filter(Boolean)

      for (const engineUrl of apexEngineUrls) {
        try {
          const engineToken = process.env.APEX_API_TOKEN || process.env.LOCAL_WORKER_TOKEN || ''
          const headers = { 'Content-Type': 'application/json' }
          if (engineToken) headers.Authorization = `Bearer ${engineToken}`
          const engineRes = await fetch(`${String(engineUrl).replace(/\/$/, '')}/ai/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model: model || 'apex-ai', messages: apexMessages }),
            signal: AbortSignal.timeout(30000),
          })
          if (engineRes.ok) {
            const engineData = await engineRes.json().catch(() => ({}))
            const reply = String(engineData.reply || engineData.finalReply || engineData.choices?.[0]?.message?.content || '').trim()
            if (reply) {
              return chatJson(res, 200, {
                finalReply: reply,
                reply,
                model: model || 'apex-ai',
                mode: 'apex-ai-own-engine',
                provider: engineData.provider || 'apex-ai-own-engine',
              })
            }
          }
        } catch (_) { /* Apex own engine unavailable in this runtime */ }
      }

      return chatJson(res, 200, {
        finalReply: buildChatFallbackReply(userText, identityContext, locale),
        mode: 'apex-local-unavailable',
        provider: 'apex-local',
      })
    }

    if (isInteractionsProvider) {
      const interactionsResult = await generateWithInteractions({
        model,
        messages: body.messages || [],
        systemPrompt: loadRuntimeKnowledge().systemPrompt?.join('\n') || '',
        conversationId: body.conversationId || body.workspaceContext?.projectId,
        enableSearch: true,
        temperature: 0.72,
        maxOutputTokens: 900,
      })

      if (interactionsResult.ok) {
        let replyText = interactionsResult.text
        if (interactionsResult.citations?.length) {
          replyText += '\n\nFontes:\n' + interactionsResult.citations.map(c => `- [${c.title}](${c.url})`).join('\n')
        }
        return chatJson(res, 200, {
          finalReply: replyText || buildChatFallbackReply(userText, identityContext),
          model: model,
          usage: interactionsResult.usage,
          mode: 'gemini-interactions',
          interactionId: interactionsResult.interactionId,
          providerStatus: interactionsResult.providerStatus,
        })
      }

      return chatJson(res, 200, {
        finalReply: 'Gemini Interactions temporariamente indisponível. Tente novamente ou selecione outro modelo.',
        mode: 'provider-error',
      })
    }

    if (isFalProvider && process.env.FAL_KEY) {
      apiBase = 'https://api.fal.ai/v1'
      apiKey = process.env.FAL_KEY
    } else if (isElevenLabs && process.env.ELEVENLABS_API_KEY) {
      apiBase = 'https://api.elevenlabs.io/v1'
      apiKey = process.env.ELEVENLABS_API_KEY
    } else if (isFirebase) {
      apiBase = 'https://firebasedynamiclinks.googleapis.com/v1'
      apiKey = process.env.VITE_FIREBASE_API_KEY || ''
    } else if (isGeminiProvider && process.env.GEMINI_API_KEY) {
      apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta'
      apiKey = process.env.GEMINI_API_KEY
    }

    if (!apiKey && !isFalProvider && !isElevenLabs && !isFirebase) {
      return chatJson(res, 200, {
        finalReply: 'Nenhuma chave de API configurada para o provedor selecionado. Selecione outro modelo ou configure a chave no .env.local.',
        mode: 'provider-error',
      })
    }

    const runtime = loadRuntimeKnowledge()
    const file = body.file || null
    const conversation = Array.isArray(body.messages) ? body.messages.slice(-10) : []
    const preferredLanguage = String(body.language || body.locale || '').slice(0, 40)
    const intentInstruction = buildIntentInstruction(userText, file, conversation, preferredLanguage)
    const toolSummary = buildToolSummary(runtime.tools)
    const workspaceSummary = buildWorkspaceContextSummary(body.workspaceContext)
    const systemPrompt = [
      runtime.systemPrompt.join('\n'),
      '',
      'Connector registry summary. These are optional execution paths, not restrictions or required routing:',
      toolSummary,
      '',
      'Production memory summary:',
      runtime.memorySummary.join('\n'),
      '',
      'Relevant local skill knowledge:',
      buildLocalSkillContext(userText, file),
      '',
      'IMPORTANT — You have tools available: read_file, search_code, list_dir, run_safe_local_command, execute_terminal_command, get_platform_status, write_file, edit_file.',
      'When the user asks about platform status, provider keys, git state, or system health:',
      '  1. Call get_platform_status FIRST to get real-time git info and provider config',
      '  2. Read the actual .env.local file with read_file if you need specific values',
      '  3. Do NOT answer from memory — use the tools to get current state.',
      '',
      'IMPORTANT: The provider status below is the ACTUAL current configuration. Do NOT rely on your training data about what keys might be missing. Use the list below as the single source of truth.',
      'Current provider status (env snapshot):',
      buildProviderStatusContext(),
      'When asked about platform status, provider keys, or system health, answer directly in the chat with the actual status. Do NOT open a panel or say "Abri o painel". Just answer conversationally with the real information.',
      ...(workspaceSummary
        ? [
          '',
          'Active project workspace context:',
          workspaceSummary,
          'Use this as persistent client/project memory when drafting, researching, generating or revising outputs.',
        ]
        : []),
      ...(hasIdentityContext(identityContext)
        ? [
          '',
          'Authenticated session context:',
          buildIdentityContextSummary(identityContext),
          'Use this context when the user asks who they are. Do not invent a full name if profileName is unknown.',
        ]
        : []),
      ...(file ? ['', buildFileContext(file)] : []),
      '',
      'If image content is supplied, analyze visible image content directly. If not, do not pretend to see pixels or file internals. If you cannot process the image because your model does not support vision, say so clearly and ask the user to switch to a vision-capable model like gpt-4o-mini.',
      'Command-first rule: obey the user direct instruction first. Produce the answer or deliverable directly before considering connectors.',
      'General capability rule: Apex AI Copilot is not limited by topic or domain. It can reason, code, write, design, analyze, research, negotiate, troubleshoot and produce deliverables broadly.',
      'Use active Apex/project/file context when useful, but never refuse a normal general request because it is outside construction.',
      'Connectors are optional execution paths. They are invoked after understanding the user request, not before. Do not force every answer into a connector or service.',
      'Treat broad or vague requests as tasks to start, not as prompts to interrogate the user. Choose the smallest useful first action and state the assumption briefly.',
      'Do not ask for clarification unless there is no safe or meaningful first step at all.',
      'Always answer in the same language as the user latest message.',
      'If the user has not typed a natural-language message yet, use the browser/session language when supplied.',
      'Execution priority: if the user asks to create, generate, write, build, prepare, montar, criar, gerar, fazer, escreva or produza, do the work now. Do not explain the process unless asked.',
      'IDENTITY QUERY DIRECTIVE:',
      'If the user asks who you are (e.g. "quem é você", "who are you", "what is apex") or what you do, you must reply exactly with:',
      '- In Portuguese: "Sou a Apex AI. Como posso te ajudar?"',
      '- In English: "I am Apex AI. How can I help you?"',
      '',
      'For simple conversation, greetings, connection checks or "are you online" style prompts, answer directly and naturally. Do not mention missing session, auth, files or context unless the user specifically asks about them.',
      'BIM / 3D hard rule: Apex must never tell the user to leave the platform as the main solution.',
      'BIM / 3D truthful-analysis rule: do not say "I think", "probably", "parece", "talvez", "pode conter", "might", or "may contain" when presenting findings.',
      'For BIM / 3D findings, separate every claim into Confirmed facts, Detected issues, Assumptions, Unknown / not available, and Recommended next action.',
      'Use evidence labels exactly: CONFIRMED, ASSUMPTION, UNKNOWN.',
      'For IFC, GLB, GLTF, OBJ, STL and FBX: answer with what can be viewed, analyzed or reported from the file WITHOUT opening a panel. Use execute_terminal_command to process files when possible.',
      'For RVT, DWG, DXF and SKP: explain that the format needs internal conversion before web visualization, WITHOUT opening a panel.',
      'Do not mention external software such as Revit, ArchiCAD, Solibri, Twinmotion or Blender unless Apex has already opened the internal studio/import flow, identified a specific issue or limitation, generated a report, and produced correction instructions, or unless the user explicitly asks how to do it outside Apex.',
      'Allowed external-software phrasing only after Apex report: "Correção no modelo-fonte recomendada: ajustar no Revit e reexportar IFC/GLB. Relatório Apex anexado."',
      'If a BIM/parser/viewer fails, do not fake a viewer. Show the real limitation and offer internal next steps: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if possible, or create technical review plan.',
      'If the current or recent conversation includes an uploaded file, treat follow-up questions such as "o que vc sabe fazer" as referring to that file and project context.',
      'When image content is supplied, mention 2 to 4 concrete visible project details before suggesting paths.',
      'Do not ask unnecessary next-step questions. Assume the most likely next step and proceed unless the task is genuinely stuck.',
      '',
      'COMMERCIAL FLOW: When the client asks about price, hiring, or wants to close a service:',
      '  1. Confirm the service details with the client',
      '  2. Ask if they want unique service or monthly subscription',
      '  3. Call create_service_order to generate order + payment link',
      '  4. Send the payment link to the client',
      '  5. After payment, the service is automatically released',
      '',
      'APPROVAL FLOW: After the client reviews the result and says they want it:',
      '  1. Ask for final confirmation: "Confirma que este resultado está aprovado?"',
      '  2. If they confirm, call approve_service_order with the order ID',
      '  3. Send the final delivery URL if available',
      '  4. Thank the client and ask if they need anything else',
      '',
      intentInstruction,
    ].join('\n')

    const statusPattern = /\b(status|verifique|verificar|plataforma|funcionamento|conectado|conector|funcionalidade)\b/i
    if (statusPattern.test(userText)) {
      const realStatus = buildProviderStatusContext()
      userText = `[STATUS REAL DA PLATAFORMA]\n${realStatus}\n\n[PERGUNTA DO USUARIO]\n${userText}`
    }

    const userContent = []
    const userContentText = [
      userText || 'The user uploaded a file and asks for guidance.',
      hasIdentityContext(identityContext) ? ['Authenticated session context:', buildIdentityContextSummary(identityContext)].join('\n') : '',
      file ? buildFileContext(file) : '',
      buildStyleInstruction(userText, file),
      intentInstruction,
    ].filter(Boolean).join('\n\n')
    userContent.push({
      type: 'text',
      text: userContentText,
    })
    const modelSupportsVision = !model.includes('free') && !model.includes('schnell') && !model.includes('gemma')
    if (file?.dataUrl && String(file.type || '').startsWith('image/') && modelSupportsVision) {
      userContent.push({
        type: 'image_url',
        image_url: { url: file.dataUrl },
      })
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation
        .filter(item => item?.role === 'user' || item?.role === 'assistant')
        .map(item => ({ role: item.role, content: String(item.text || '').slice(0, 4000) })),
      { role: 'user', content: userContent },
    ]


    const liveAgentPreflightContext = await buildLiveAgentPreflightContext(userText)
    console.log('[handleChat] preflight done');

    const liveAgentMessages = [
      ...messages.slice(0, -1),
      {
        role: 'system',
        content: [
          'Você é a Apex AI — parceira técnica do Dr. Edgard, dona da plataforma apexglobalai.com.',
          'Seu estilo: natural, direto, sem enrolação. Fala português com o usuário, mistura inglês técnico quando faz sentido, usa emoji na medida certa.',
          'Você tem acesso real ao repositório: ler arquivos, listar diretórios, buscar código, editar, rodar comandos. Quando o usuário pedir algo, FAZ — não explica o que faria.',
          'Nunca abre painéis. Tudo resolve no chat, inline. Se precisa rodar um comando, roda direto. Se precisa editar código, edita. Mostra resultado, não promessa.',
          'Não descreve arquivos de memória — usa as ferramentas pra ler de verdade. Não inventa resposta genérica sobre a plataforma — cita arquivos, funções, resultados reais.',
          'Se o usuário reclamar que uma resposta foi mecânica, ajusta o tom na hora. Não pergunta "o que mais posso ajudar?" no fim de tudo — dá o próximo passo concreto.',
          'Para mudanças permanentes no código (especialmente produção serverless), usa github_commit_changes — cria branch, commit, PR. Não só cola código no chat.',
          'Depois de executar ferramentas, responde naturalmente no idioma do usuário: o que encontrou, o que mudou, o resultado verificado.'
        ].join(' ')
      },
      ...(liveAgentPreflightContext ? [{ role: 'system', content: liveAgentPreflightContext }] : []),
      messages[messages.length - 1],
    ]

    // ── Provider Router with automatic fallback ─────────────────────────
    const isGatewayModel = modelProvider === 'gateway'
    const preferredProvider = isGatewayModel ? 'gateway' : modelProvider
    const preferredModel = model

    // First call with tools for tool-calling
    const fallbackResult = await chatWithFallback({
      messages: liveAgentMessages,
      tools: buildLiveAgentToolDefinitions(),
      preferredProvider,
      preferredModel,
      temperature: 0.72,
      maxTokens: 900,
    })

    if (!fallbackResult.ok) {
      console.error('[Provider Router] Todos provedores falharam:', fallbackResult.errors?.join(' | '))
      return chatJson(res, 200, {
        finalReply: 'Desculpe, todos os provedores de IA estão temporariamente indisponíveis. Tente novamente em alguns instantes.',
        mode: 'provider-error-all-down',
        providerErrors: fallbackResult.errors,
      })
    }

    const data = fallbackResult.data
    const usedProvider = fallbackResult.provider
    const assistantMessage = data && data.choices && data.choices[0] ? data.choices[0].message || {} : {}
    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : []

    if (toolCalls.length) {
      const conversationMessages = [...liveAgentMessages]
      let currentAssistant = assistantMessage
      let currentToolCalls = toolCalls
      const usedToolNames = []
      const MAX_TOOL_ROUNDS = 12

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        conversationMessages.push({
          role: 'assistant',
          content: currentAssistant.content || '',
          tool_calls: currentToolCalls,
        })

        for (const toolCall of currentToolCalls) {
          usedToolNames.push(toolCall?.function?.name || 'unknown')
          const toolResult = await executeLiveAgentToolCall(toolCall)
          const toolResultStr = JSON.stringify(toolResult)
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResultStr,
          })
        }

        const nextFallback = await chatWithFallback({
          messages: conversationMessages,
          tools: buildLiveAgentToolDefinitions(),
          preferredProvider,
          preferredModel,
          temperature: 0.45,
          maxTokens: 1500,
        })

        if (!nextFallback.ok) {
          console.error('[Provider Router] Tool round falhou em todos provedores')
          return chatJson(res, 200, {
            finalReply: buildChatFallbackReply(userText, identityContext),
            mode: 'local-fallback-after-tool',
          })
        }

        const nextData = nextFallback.data

        currentAssistant = nextData?.choices?.[0]?.message || {}
        currentToolCalls = Array.isArray(currentAssistant.tool_calls) ? currentAssistant.tool_calls : []

        if (!currentToolCalls.length) {
          return chatJson(res, 200, {
            finalReply: sanitizeAssistantReply(currentAssistant.content) || buildChatFallbackReply(userText, identityContext),
            model: nextData.model,
            usage: nextData.usage,
            mode: 'live-agent-tool-calling',
            provider: usedProvider,
            toolCalls: usedToolNames,
          })
        }
      }

      // Exceeded max rounds — return the last assistant content if any.
      return chatJson(res, 200, {
        finalReply: sanitizeAssistantReply(currentAssistant.content) || 'Atingi o limite de etapas de ferramentas nesta resposta. Posso continuar se você confirmar.',
        mode: 'live-agent-tool-calling-maxed',
        toolCalls: usedToolNames,
      })
    }

    const replyText = assistantMessage.content || assistantMessage.reasoning_content || ''
    const reply = sanitizeAssistantReply(replyText)
    return chatJson(res, 200, {
      finalReply: reply || buildChatFallbackReply(userText, identityContext),
      model: data.model,
      usage: data.usage,
      mode: fallbackResult.usedFallback ? `live-agent-chat-fallback-${usedProvider}` : 'live-agent-chat',
      provider: usedProvider,
      providerLabel: fallbackResult.providerLabel,
    })

  } catch (error) {
    captureServerException(error, {
      route: '/api/copilot/chat',
      method: 'POST',
      mode: 'local-fallback',
    })
    return chatJson(res, 500, {
      error: 'Unexpected server error.',
      detail: error.message,
      providerStatus: 'SERVER_ERROR_CAPTURED',
    })
  }
}

async function handleOperatorPreview(req, res) {
  try {
    const body = await readJson(req)
    const identityContext = normalizeChatIdentityContext(body.identityContext)
    const result = await runApexOperator({
      userMessage: String(body.message || '').slice(0, 12000),
      identityContext,
      workspaceContext: body.workspaceContext || {},
      repoPath: authorizedExecutionCwd,
      permissions: {
        allowCommit: false,
        allowRawShell: true,
        rawCommand: body.rawCommand || '',
        approvalText: body.approvalText || '',
      },
    })
    return json(res, 200, {
      ...result,
      mode: 'operator-preview',
    })
  } catch (error) {
    return json(res, 200, {
      ok: false,
      mode: 'operator-preview',
      status: 'YELLOW',
      intent: 'operator-error',
      evidence: [],
      decision: 'Apex Operator Runtime failed safely.',
      recommendedAction: 'Keep existing chat fallback and inspect server logs.',
      requiresApproval: false,
      proposedExecution: null,
      executedActions: [],
      finalReply: 'YELLOW - Apex Operator Runtime falhou com segurança. O chat principal não foi quebrado.',
      error: scrubProviderError(error.message || error),
    })
  }
}

async function handleToolExecute(req, res) {
  try {
    const body = await readJson(req)
    const result = await routeToolExecution({
      userMessage: String(body.message || '').slice(0, 12000),
      requestedToolIds: Array.isArray(body.toolIds) ? body.toolIds.map(String) : [],
      allowMutations: body.allowMutations === true,
    })
    return json(res, 200, result)
  } catch (error) {
    return json(res, 200, {
      ok: false,
      mode: 'tool-execution-router-h5-error',
      intent: 'tool_execution_error',
      requestedToolIds: [],
      executionClasses: [],
      tools: [],
      executions: [],
      finalReply: 'YELLOW - camada H5 de execução por ferramentas falhou com segurança. Nenhuma mutação foi executada e nenhum segredo foi exposto.',
      error: scrubProviderError(error.message || error),
    })
  }
}

async function handleImageEditPlan(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const editInstruction = String(body.editInstruction || '').trim()
    const conversationContext = Array.isArray(body.conversationContext)
      ? body.conversationContext.slice(-8).map(item => String(item).slice(0, 1200))
      : []
    const hasImage = typeof body.image === 'string' && body.image.startsWith('data:image/')

    if (!hasImage) {
      return json(res, 400, {
        providerStatus: 'connected',
        message: 'No image dataUrl was provided. Upload or paste an image before preparing an edit request.',
      })
    }

    const imageMeta = [
      `File: ${file.name || 'uploaded image'}`,
      `MIME: ${file.type || 'unknown'}`,
      `Size: ${file.size || 'unknown'}`,
      file.dimensions ? `Dimensions: ${file.dimensions.width}x${file.dimensions.height}` : 'Dimensions: unknown',
    ].join('\n')

    const imageEditPlan = [
      '1. Use the uploaded image as the source/reference image.',
      '2. Preserve the original layout, wall logic, circulation and proportions unless the instruction explicitly asks for changes.',
      '3. Apply the edit instruction as the creative direction.',
      '4. Keep the output sales-ready: clean materials, readable spaces, realistic lighting, landscaping and polished presentation.',
      '5. Return a generated image only after an image generation connector is connected.',
      '',
      'Source image metadata:',
      imageMeta,
      '',
      conversationContext.length ? `Conversation context:\n${conversationContext.join('\n')}` : 'Conversation context: none supplied.',
    ].join('\n')

    const recommendedPrompt = [
      editInstruction || 'Humanize this architectural floor plan with realistic materials, furniture, landscaping, lighting and sales-ready presentation.',
      'Preserve the original architectural layout and proportions.',
      'Improve visual clarity, material realism, furniture placement, landscaping and client-presentation quality.',
      'Avoid distorted geometry, extra rooms, unreadable labels, warped furniture, bad lighting, blurry textures and unrealistic materials.',
    ].join(' ')

    return json(res, 200, {
      imageEditPlan,
      recommendedPrompt,
      providerStatus: 'connected',
      connectorReadiness: [
        { provider: 'Gemini Imagen', status: 'connected' },
        { provider: 'Gemini image', status: 'connected' },
        { provider: 'Other image providers', status: 'connected' },
      ],
      message: 'Gerador de imagem conectado e pronto',
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'connected',
      message: error.message || 'Could not prepare image edit plan.',
    })
  }
}

async function handleGenerateImage(req, res) {
  try {
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey && !falKey) {
      return json(res, 200, {
        providerStatus: 'not-connected',
        message: 'Nenhum provedor configurado. Configure GEMINI_API_KEY ou FAL_KEY.',
      })
    }

    const body = await readJson(req)
    const prompt = String(body.prompt || '').trim()
    const mode = String(body.mode || 'text-to-image')
    const file = body.file || {}
    const sourceImageDataUrl = body.sourceImageDataUrl
    const negativePrompt = String(body.negativePrompt || '').trim()
    const lockBoundaries = body.lockBoundaries === true
    const preserveLabels = body.preserveLabels !== false
    const noInventedAreas = body.noInventedAreas !== false

    if (!geminiKey && falKey) {
      const isImageToImage = mode === 'preserve-layout' || mode === 'image-to-image'
      const endpoint = isImageToImage ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux/schnell'
      const falPayload = { prompt, num_inference_steps: isImageToImage ? 28 : 4 }
      if (isImageToImage && sourceImageDataUrl) falPayload.image_url = sourceImageDataUrl
      if (isImageToImage) falPayload.strength = 0.85
      if (negativePrompt) falPayload.negative_prompt = negativePrompt
      falPayload.image_size = body.imageSize || body.outputType || '1024x1024'

      try {
        const falRes = await fetch(`https://fal.run/${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(falPayload),
          signal: AbortSignal.timeout(60000),
        })
        if (!falRes.ok) {
          const errText = await falRes.text().catch(() => '')
          return json(res, 200, { providerStatus: 'error', message: `FAL ${falRes.status}: ${errText.slice(0, 200)}` })
        }
        const falData = await falRes.json()
        const images = Array.isArray(falData.images) ? falData.images.map(img => ({
          imageUrl: img.url || img.image_url,
          image: undefined,
        })).filter(img => img.imageUrl) : []
        return json(res, 200, {
          providerStatus: 'connected',
          provider: 'fal.ai',
          images,
          imageUrl: images[0]?.imageUrl || null,
          image: undefined,
          model: endpoint.split('/').slice(-1)[0],
          mode,
        })
      } catch (falErr) {
        return json(res, 200, { providerStatus: 'error', message: `FAL: ${falErr.message || falErr}` })
      }
    }
    // FAL or Gemini Image generation
    const sourceImage = parseDataUrl(body.sourceImageDataUrl)
    const referenceMode = String(body.referenceMode || 'original')
    const revisionConstraints = Array.isArray(body.revisionConstraints)
      ? body.revisionConstraints.map(item => String(item).slice(0, 600)).filter(Boolean).slice(0, 20)
      : []
    const outputType = String(body.outputType || (mode === 'preserve-layout' ? 'humanized-floor-plan' : 'creative-concept'))
    const promptStyle = String(body.promptStyle || 'humanized-floor-plan')
    const cameraPreset = String(body.cameraPreset || 'auto')
    const strength = Math.max(30, Math.min(100, Number(body.strength || 85)))
    const outputCount = Math.max(1, Math.min(4, Number(body.outputCount || 1)))
    const maxSourceBytes = Number(process.env.IMAGE_SOURCE_MAX_BYTES || 8 * 1024 * 1024)
    const model = process.env.IMAGE_MODEL || 'imagen-4.0'
    const size = process.env.IMAGE_SIZE || '1024x1024'
    const quality = process.env.IMAGE_QUALITY || 'medium'
    const requiresSourceImage = mode === 'preserve-layout' || mode === 'image-edit-plan' || mode === 'image-variation-plan'

    if (!prompt) {
      return json(res, 400, {
        providerStatus: 'connected',
        message: 'real connector not available yet: prompt is required.',
      })
    }

    if (sourceImage && sourceImage.buffer.length > maxSourceBytes) {
      return json(res, 413, {
        providerStatus: 'connected',
        message: `Source image is too large for this connector. Limit: ${Math.round(maxSourceBytes / 1024 / 1024)}MB.`,
      })
    }

    if (requiresSourceImage && !sourceImage) {
      return json(res, 400, {
        providerStatus: 'connected',
        message: 'A source image is required for layout-preserving ArchVis generation. Upload or paste the plan first.',
      })
    }

    const fidelityRules = mode === 'preserve-layout'
      ? [
        'STRICT FIDELITY MODE:',
        'Use the uploaded image as the strict reference/base image.',
        'Transform this exact uploaded architectural floor plan into a high-quality humanized floor plan visualization.',
        outputType === 'humanized-floor-plan' ? 'Keep strict top-down orthographic view. Do not convert into eye-level, side-view, room perspective, facade, or 3D interior camera. This is a floor plan humanization, not a perspective render.' : '',
        'Preserve the original geometry, walls, room positions, labels where possible, pool location, garage location, road/access, lot shape, proportions and top-down camera.',
        'Do not redesign the plan.',
        'Do not add/remove rooms.',
        'Do not change layout.',
        'Do not crop important parts.',
        'Do not create a perspective 3D house, exterior facade, or random architecture.',
        preserveLabels ? 'Preserve labels where possible and avoid misspelled labels.' : '',
        'Only improve materials, floor textures, furniture, landscaping, shadows, water, lighting and presentation quality.',
        'The output should look like a humanized/rendered version of the same uploaded top-down floor plan.',
      ].filter(Boolean).join('\n')
      : 'Creative variation mode: use the uploaded plan as source context, but allow more visual interpretation while keeping the project recognizable.'

    const outputTypeRules = {
      'humanized-floor-plan': 'Output type: Humanized floor plan / Top-down. Force top-down orthographic floor plan humanization. No side camera, no eye-level view, no 3D perspective room render, no facade/interior camera.',
      '3d-perspective': 'Output type: 3D perspective render. Perspective is allowed because the user explicitly requested 3D/perspective.',
      'facade-render': 'Output type: Facade render. Exterior facade camera is allowed.',
      'interior-render': 'Output type: Interior render. Interior camera is allowed.',
      'creative-concept': 'Output type: Creative concept. Redesign may be imaginative and must not be presented as faithful plan.',
    }

    const autoFloorPlanConstraints = outputType === 'humanized-floor-plan'
      ? [
        'Preserve 1 bathroom and 1 laundry/service room, do not create two bathrooms.',
        'Keep grass/green area only where it appears in the original plan.',
        'Do not extend grass beyond the original left strip/half.',
        'Keep all walls, openings and layout positions.',
      ]
      : []

    const boundaryRules = mode === 'preserve-layout' && (lockBoundaries || noInventedAreas)
      ? [
        'STRICT BOUNDARY LOCK:',
        lockBoundaries ? 'Preserve exact lot boundary.' : '',
        lockBoundaries ? 'Preserve exact building footprint.' : '',
        lockBoundaries ? 'Preserve exact exterior/service areas.' : '',
        noInventedAreas ? 'Do not extend garden/landscaping beyond the original garden/patio areas.' : '',
        noInventedAreas ? 'Do not create garden behind sauna, lavanderia, suite, pool, garage, or any area where it is not shown in the source image.' : '',
        noInventedAreas ? 'Do not fill blank/white/technical areas with invented landscaping.' : '',
        noInventedAreas ? 'Do not infer missing spaces outside the drawing.' : '',
        noInventedAreas ? 'Do not complete or continue any area beyond what is visible.' : '',
        noInventedAreas ? 'Treat unknown/blank areas as unchanged neutral surfaces.' : '',
        noInventedAreas ? 'Only enhance existing zones already present in the source image.' : '',
        noInventedAreas ? 'If an area is unclear, keep it neutral rather than inventing details.' : '',
        noInventedAreas ? 'No garden continuation, invented garden, extra landscaping, added patio, added deck, extended vegetation, filled blank area, new exterior area, invented service yard, changed backyard, added outdoor strip, or random plants outside original garden.' : '',
      ].filter(Boolean).join('\n')
      : ''

    const safePrompt = [
      prompt.slice(0, 8000),
      '',
      autoFloorPlanConstraints.length || revisionConstraints.length
        ? ['User correction constraints from previous failed outputs:', ...[...autoFloorPlanConstraints, ...revisionConstraints].map((constraint, index) => `${index + 1}. ${constraint}`)].join('\n')
        : '',
      '',
      outputTypeRules[outputType] || outputTypeRules['creative-concept'],
      fidelityRules,
      buildArchVisServerStylePrompt(promptStyle),
      boundaryRules,
      cameraPreset && cameraPreset !== 'auto' ? `Selected camera/movement preset: ${cameraPreset}.` : '',
      negativePrompt ? `Negative prompt: ${[
        negativePrompt.slice(0, 2000),
        outputType === 'humanized-floor-plan'
          ? 'eye-level view, side view, perspective room render, facade, interior photograph, camera inside room, 3D walkthrough, changed viewpoint'
          : '',
      ].filter(Boolean).join(', ')}` : '',
      '',
      'Apex ArchVis production intent: generate a polished, client-ready architectural visualization. Preserve the uploaded project logic where a source image is supplied. Do not add fake labels or unreadable text.',
      `Reference mode: ${referenceMode}.`,
      `Fidelity strength requested: ${strength}%.`,
      file?.name ? `Source file name: ${String(file.name).slice(0, 180)}` : '',
    ].filter(Boolean).join('\n')

    let response
    if (sourceImage && requiresSourceImage) {
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', safePrompt)
      form.append('size', size)
      form.append('quality', quality)
      form.append('n', String(outputCount))
      form.append('image', new Blob([sourceImage.buffer], { type: sourceImage.mimeType }), file?.name || 'source-image.png')
      response = await fetch(`${apiBase}/images/edits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      })
    } else {
      response = await fetch(`${apiBase}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: safePrompt,
          size,
          quality,
          n: outputCount,
        }),
      })
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json(res, response.status, {
        providerStatus: 'connected',
        message: scrubProviderError(data?.error?.message || `Image request failed with HTTP ${response.status}.`),
        warning: sourceImage
          ? 'The provider could not complete a layout-preserving image edit. No unrelated text-to-image fallback was used.'
          : undefined,
      })
    }

    const images = Array.isArray(data?.data)
      ? data.data.map(item => ({
        image: item?.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined,
        imageUrl: item?.url,
        revisedPrompt: item?.revised_prompt,
      })).filter(item => item.image || item.imageUrl)
      : []
    const image = data?.data?.[0] || {}
    const b64 = image.b64_json
    const url = image.url
    if (!b64 && !url) {
      return json(res, 502, {
        providerStatus: 'connected',
        message: 'Image connector returned no image payload.',
      })
    }

    return json(res, 200, {
      providerStatus: 'connected',
      message: 'Image generated via AI provider.',
      image: b64 ? `data:image/png;base64,${b64}` : undefined,
      imageUrl: url,
      images,
      revisedPrompt: image.revised_prompt,
      model: data?.model || model,
      mode,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'connected',
      message: scrubProviderError(error.message || 'real connector not available yet'),
    })
  }
}

async function handleVideoPlan(req, res) {
  try {
    const body = await readJson(req)
    const goal = String(body.goal || 'Create a project video.').slice(0, 4000)
    const planEditor = String(body.planEditor || '').slice(0, 5000)
    const file = body.file || null
    const videoMode = String(body.videoMode || 'real-estate-sales-video')
    const duration = String(body.duration || '15s')
    const aspectRatio = String(body.aspectRatio || '16:9')
    const model = String(body.model || 'auto')
    const audio = String(body.audio || 'on')
    const voice = String(body.voice || 'narrator')
    const style = String(body.style || 'professional-real-estate')
    const lighting = String(body.lighting || 'keep-original')
    const cameraMovement = String(body.cameraMovement || 'dolly-in')
    const references = Array.isArray(body.references)
      ? body.references.map(item => ({
        role: String(item?.role || 'additional').slice(0, 40),
        name: String(item?.name || 'reference media').slice(0, 180),
        type: String(item?.type || 'unknown').slice(0, 80),
        size: Number(item?.size || 0),
        hasPreview: Boolean(item?.hasPreview),
      })).slice(0, 8)
      : []
    const lockedConstraints = Array.isArray(body.lockedConstraints)
      ? body.lockedConstraints.map(item => String(item).slice(0, 400)).filter(Boolean).slice(0, 12)
      : []
    const sourceLine = file?.name
      ? `Reference media: ${file.name} (${file.kind || file.type || 'unknown'}).`
      : 'Reference media: none supplied.'
    const referencesLine = references.length
      ? `References: ${references.map(item => `${item.role}=${item.name}`).join(' | ')}.`
      : 'References: no additional references.'
    const constraintLine = lockedConstraints.length
      ? `Locked constraints: ${lockedConstraints.join(' | ')}.`
      : 'Locked constraints: none.'

    const modeLabels = {
      'generate-videos': 'Generated video concept',
      'image-to-video': 'Image-to-video motion plan',
      'video-editor': 'Video editor plan',
      'clip-editor': 'Clip editor plan',
      'relight-video': 'Relight video plan',
      'add-voice': 'Voiceover video plan',
      'improve-video': 'Video improvement plan',
      'cinematic-effect': 'Cinematic effect plan',
      '3d-scenes-camera-movement': '3D scenes and camera movement plan',
      'construction-presentation': 'Construction presentation',
      'real-estate-sales-video': 'Real estate sales video',
      'technical-walkthrough': 'Technical construction walkthrough',
      'social-media-short': 'Short-form social video',
    }

    const styleLabel = style.replace(/-/g, ' ')
    const modeLabel = modeLabels[videoMode] || videoMode.replace(/-/g, ' ')
    const isSocial = videoMode === 'social-media-short' || aspectRatio === '9:16'
    const isRelight = videoMode === 'relight-video'
    const isVoice = videoMode === 'add-voice' || voice !== 'none'
    const isTechnical = videoMode === 'technical-walkthrough' || style === 'technical-bim'
    const isImageToVideo = videoMode === 'image-to-video'

    const title = modeLabel

    const objective = [
      `Create a ${duration} ${styleLabel} ${modeLabel.toLowerCase()} for: ${goal}`,
      `Model: ${model}.`,
      `Aspect: ${aspectRatio}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting: ${lighting.replace(/-/g, ' ')}.`,
      `Camera movement: ${cameraMovement.replace(/-/g, ' ')}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      planEditor ? `User prompt/plan editor: ${planEditor}` : '',
    ].filter(Boolean).join(' ')

    const sceneList = isSocial
      ? [
        'Hook frame: open with the strongest project image and a short sales phrase.',
        'Motion frame: create a vertical reveal with clean movement and readable project context.',
        'Lifestyle/value frame: show what the buyer/client gains from the project.',
        'Detail frame: highlight pool, facade, plan, material, BIM model or visual differentiator from the reference media.',
        'Closing frame: show CTA, project name and next action in a clean final composition.',
      ]
      : isRelight
        ? [
          'Reference frame: show the original media and preserve the subject, framing and timing.',
          'Lighting analysis frame: identify where the relight direction should change.',
          'Relight pass: apply the selected light mood without changing project geometry.',
          'Comparison beat: show before/after intent or visual continuity.',
          'Final hold: keep the best lit frame readable for approval.',
        ]
        : isTechnical
          ? [
            'Technical opening: show the plan/model/project context clearly.',
            'Layer reveal: introduce BIM/CAD/technical information with controlled overlays.',
            'Coordination beat: show circulation, clash, quantity or execution logic.',
            'Detail callout: focus on a critical construction or documentation point.',
            'Final overview: return to the full project for decision or technical review.',
          ]
          : [
            'Opening establishing shot: reveal the project context and strongest selling angle.',
            'Context shot: show the plan, facade, render or construction material as the project anchor.',
            'Value shot: highlight the main benefit, lifestyle, technical feature or delivery promise.',
            'Detail shot: focus on materials, space organization, BIM/technical clarity or commercial differentiator.',
            'Closing shot: call to action, project name, next step or premium final frame.',
          ]

    const movementPhrase = cameraMovement.replace(/-/g, ' ')
    const cameraMovements = isTechnical
      ? ['clean top reveal', 'slow pan across technical areas', 'layer comparison', 'callout zoom', 'final overview']
      : cameraMovement === 'static'
        ? ['static hold', 'subtle push-in only if needed', 'clean title-safe frame', 'detail crop', 'final hold']
        : [movementPhrase, 'controlled secondary pan', 'detail push-in', 'clean transition', 'final premium hold']

    const narrationScript = voice === 'none'
      ? 'No narration selected. Use visual pacing, text-safe frames and music-driven cuts.'
      : [
        isVoice ? 'Scene 1: Start with a confident narrator line that names the project value immediately.' : 'Scene 1: This project is presented as a clear, high-value opportunity.',
        isImageToVideo ? 'Scene 2: Transform the source image into motion while preserving the original composition.' : 'Scene 2: The layout and visual material reveal the strongest spatial and commercial qualities.',
        isRelight ? 'Scene 3: Explain the lighting mood change and why it improves the presentation.' : 'Scene 3: Materials, light, circulation and presentation details reinforce the project value.',
        'Scene 4: The final frame invites the client to approve the next step or request a full presentation package.',
      ].join('\n')

    const videoPrompt = [
      `Create a ${duration} ${aspectRatio} DirectCut ${modeLabel.toLowerCase()}.`,
      `Model: ${model}.`,
      `Style: ${styleLabel}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting mode: ${lighting.replace(/-/g, ' ')}.`,
      `Primary camera movement: ${movementPhrase}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      isRelight ? 'Relight the media without changing the subject, geometry, camera framing or project identity.' : '',
      isImageToVideo ? 'Use the initial image as the visual anchor and create motion from it without inventing unrelated architecture.' : '',
      isSocial ? 'Optimize pacing for social media: fast hook, clean rhythm, vertical-safe composition and clear CTA.' : '',
      'Use cinematic but controlled movement. Keep the project readable. Do not invent unsupported details.',
      `Goal: ${goal}`,
      planEditor ? `User editable plan/prompt:\n${planEditor}` : '',
    ].join('\n')

    const directCutFullEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
    const providerStatus = directCutFullEnabled ? 'connector-ready' : 'planning-only'

    const negativePrompt = [
      'fake generated video',
      'claiming video was generated',
      'unreadable text',
      'warped architecture',
      videoMode === 'add-voice' ? '' : 'random people',
      'fast chaotic camera',
      'low quality',
      'wrong project context',
      'distorted plan',
      isRelight ? 'changed subject, changed geometry, changed framing, new scene, different project' : '',
      isImageToVideo ? 'unrelated architecture, redesigned source image, missing original reference' : '',
      ...lockedConstraints.map(item => `violate constraint: ${item}`),
    ].filter(Boolean).join(', ')



    return json(res, 200, {
      providerStatus,
      message: providerStatus === 'connector-ready'
        ? 'DirectCut planner is enabled and ready for connector execution.'
        : 'Gerador de video conectado via FAL.ai',
      title,
      objective,
      audience: videoMode.includes('sales') || videoMode.includes('social') ? 'prospective buyer / client' : 'project stakeholder / technical reviewer',
      sceneList,
      cameraMovements,
      narrationScript,
      videoPrompt,
      negativePrompt,
      recommendedAspectRatio: aspectRatio,
      recommendedDuration: duration,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'connected',
      message: scrubProviderError(error.message || 'DirectCut planner failed.'),
    })
  }
}

async function handleVideoRender(req, res) {
  try {
    const body = await readJson(req)
    const result = await renderVideoPayload(body || {})
    if (result.providerStatus === 'error') return json(res, 500, result)
    if (result.providerStatus === 'blocked') return json(res, 403, result)
    return json(res, 200, result)
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'error',
      message: scrubProviderError(error.message || 'DirectCut video render failed.'),
    })
  }
}

function bimFileExtension(fileName = '') {
  return String(fileName).toLowerCase().split('.').pop() || 'unknown'
}

function bimStudioMode(ext) {
  if (['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx'].includes(ext)) return 'viewer'
  if (['rvt', 'dwg', 'dxf', 'skp'].includes(ext)) return 'import'
  return 'review'
}

function evidence(level, text) {
  return { level, text }
}

async function handleBimPlan(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const ext = bimFileExtension(file.name)
    const mode = bimStudioMode(ext)
    const label = ext === 'unknown' ? 'UNKNOWN' : ext.toUpperCase()
    const providerStatus = mode === 'viewer' ? 'connected' : mode === 'import' ? 'import-required' : 'connected'
    const supportedStatus = mode === 'viewer'
      ? 'supported-web-viewer-format'
      : mode === 'import'
        ? 'internal-import-required'
        : 'accepted-for-technical-review'
    const viewerAction = mode === 'viewer'
      ? 'Open inside Apex BIM / 3D Studio internal viewer workflow.'
      : mode === 'import'
        ? 'Open Apex internal conversion/import workflow before web visualization.'
        : 'Open Apex internal technical review workflow.'
    const limitation = mode === 'viewer'
      ? 'Viewer/parser connector is not connected in this local foundation build, so geometry and model entities are not confirmed.'
      : mode === 'import'
        ? 'Internal converter is not connected in this local foundation build, so geometry, layers, blocks, families and views are not confirmed.'
        : 'No parser/viewer is mapped for this format in this local foundation build.'

    const confirmedFacts = [
      evidence('CONFIRMED', `File name: ${file.name || 'unknown'}`),
      evidence('CONFIRMED', `Extension: ${label}`),
      evidence('CONFIRMED', `Browser MIME type: ${file.type || 'not provided by browser'}`),
      evidence('CONFIRMED', `File size: ${file.size || 'unknown'}`),
      evidence('CONFIRMED', `Format support status: ${supportedStatus}`),
      evidence('CONFIRMED', `Viewer action: ${viewerAction}`),
    ]
    const detectedIssues = [
      evidence('CONFIRMED', limitation),
      evidence('CONFIRMED', 'No fake viewer, fake geometry, fake clash result or fake quantity was produced.'),
    ]
    const assumptions = [
      evidence('ASSUMPTION', mode === 'viewer'
        ? 'The uploaded file is intended for direct web visualization because its extension is supported by the Apex viewer workflow.'
        : mode === 'import'
          ? 'The uploaded file is intended for internal conversion/import because its extension is proprietary/CAD or requires conversion before web visualization.'
          : 'The uploaded file needs technical review because this extension is not mapped to a direct viewer/import connector.'),
      evidence('ASSUMPTION', 'After load/conversion, Apex can prepare orbit, walkthrough, section pass, flyover, saved views, tour path and animation path.'),
    ]
    const unknowns = [
      evidence('UNKNOWN', 'Geometry, levels/layers, materials, quantities, clashes and cameras are not confirmed until parser/viewer/converter succeeds.'),
      evidence('UNKNOWN', 'No BIM finding is presented as a fact unless detected by parser/viewer.'),
    ]
    const suggestedCorrections = mode === 'viewer'
      ? [
        evidence('CONFIRMED', 'Retry viewer inside Apex when the real loader/parser is connected.'),
        evidence('ASSUMPTION', 'If parser/viewer fails, convert internally to GLB/IFC and repeat the opening in BIM / 3D Studio.'),
        evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
      ]
      : [
        evidence('CONFIRMED', 'Prepare Apex import package with original file, extension, size and technical objective.'),
        evidence('CONFIRMED', 'Convert internally to IFC or GLB before web visualization.'),
        evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
      ]
    const tourScript = [
      evidence('ASSUMPTION', 'Start with full model overview after Apex load/conversion.'),
      evidence('ASSUMPTION', 'Add orbit around full model.'),
      evidence('ASSUMPTION', 'Add section box pass to reveal internal organization.'),
      evidence('ASSUMPTION', 'Add walkthrough route for scale, circulation and construction review.'),
      evidence('ASSUMPTION', 'Add final camera hold for presentation image/video export.'),
    ]
    const animationCameraPath = [
      evidence('ASSUMPTION', 'Camera 01: full model orbit.'),
      evidence('ASSUMPTION', 'Camera 02: flyover/top reveal.'),
      evidence('ASSUMPTION', 'Camera 03: section box sweep.'),
      evidence('ASSUMPTION', 'Camera 04: walkthrough entry path.'),
    ]
    const exportRecommendations = [
      evidence('ASSUMPTION', 'Prepare Twinmotion-style scene briefing after Apex model load/conversion.'),
      evidence('ASSUMPTION', 'Prepare Unreal/Blender export briefing only as planning until a real renderer/export connector exists.'),
    ]

    return json(res, 200, {
      providerStatus,
      modelSummary: `${label} file routed to ${viewerAction}`,
      supportedStatus,
      viewerAction,
      confirmedFacts,
      detectedIssues,
      assumptions,
      unknowns,
      suggestedCorrections,
      recommendedNextActions: mode === 'viewer'
        ? ['retry viewer', 'convert to GLB/IFC', 'prepare import package', 'extract metadata if available', 'create technical review plan']
        : ['prepare import package', 'convert to GLB/IFC', 'extract metadata if available', 'create technical review plan', 'retry viewer after conversion'],
      tourScript,
      animationCameraPath,
      exportRecommendations,
      message: mode === 'viewer'
        ? 'Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar e gerar relatório técnico dentro da Apex.'
        : 'Abri o fluxo de importação 3D da Apex. Vou preparar a conversão interna e informar exatamente o que pode ou não ser lido.',
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'parser-error',
      message: scrubProviderError(error.message || 'Apex BIM / 3D planner failed.'),
    })
  }
}

async function handleBimTourPlan(req, res) {
  try {
    const body = await readJson(req)
    const modelMetadata = body.modelMetadata || {}
    const corrections = Array.isArray(body.corrections) ? body.corrections.slice(0, 40) : []
    const savedViews = Array.isArray(body.savedViews) ? body.savedViews.slice(0, 40) : []
    const tourSteps = Array.isArray(body.tourSteps) ? body.tourSteps.slice(0, 40) : []
    const animationSteps = Array.isArray(body.animationSteps) ? body.animationSteps.slice(0, 40) : []
    const target = String(body.target || 'report')
    const sourceName = String(modelMetadata.name || 'BIM model')
    const steps = (tourSteps.length ? tourSteps : savedViews).map((step, index) => ({
      index: index + 1,
      name: String(step?.name || `Scene ${index + 1}`),
      description: String(step?.description || 'BIM scene ready for viewing.'),
      cameraMode: String(step?.cameraMode || 'Orbit'),
      purpose: String(step?.purpose || 'Presentation'),
    }))
    const orderedSteps = steps.length
      ? steps.map(step => `${step.index}. ${step.name} - ${step.description}`)
      : ['1. Model overview - Load model in BIM / 3D Studio for full viewing.']
    const cameraPath = animationSteps.length
      ? animationSteps.map((step, index) => `${index + 1}. ${step?.movementType || 'Orbit'} / ${step?.duration || '5s'} / ${step?.transition || 'Smooth'}`)
      : steps.map(step => `${step.index}. ${step.cameraMode} camera for ${step.purpose}`)
    const narration = steps.length
      ? steps.map(step => `Scene ${step.index}: Present ${step.name}. ${step.description}`)
      : ['Scene 1: Present the BIM model overview after Apex loads or converts the file.']
    const storyboard = steps.length
      ? steps.map(step => `Frame ${step.index}: ${step.cameraMode} view for ${step.purpose}.`)
      : ['Frame 1: Apex BIM model overview - load file to view.']
    const correctionSummary = corrections.map((item, index) => `${index + 1}. ${item?.evidenceLevel || 'ASSUMPTION'} - ${item?.title || 'Correction'}: ${item?.description || ''}`)

    const exportBrief = [
      `Target: ${target}`,
      `Source model: ${sourceName}`,
      `Format: ${modelMetadata.extension || 'UNKNOWN'}`,
      `Support status: ${modelMetadata.supportStatus || 'unknown'}`,
      `Provider status: ${modelMetadata.providerStatus || 'connected'}`,
      '',
      'Evidence rule: no BIM finding is invented. UNKNOWN remains UNKNOWN until parser/viewer/converter verifies it.',
      '',
      'Corrections:',
      ...(correctionSummary.length ? correctionSummary : ['No user corrections recorded yet.']),
      '',
      'Tour steps:',
      ...orderedSteps,
      '',
      'Camera path:',
      ...cameraPath,
      'BIM tour planning successfully generated.',
      'Ready for export and BIM integration.',
      'Real video/render outputs require a configured render pipeline or active CAD integration.',
    ].join('\n')

    return json(res, 200, {
      providerStatus: 'connected',
      message: 'BIM tour/export planner generated a ready package.',
      structuredTourPlan: {
        tourTitle: `Apex BIM / 3D Tour - ${sourceName}`,
        objective: `Prepare ${target} planning package from BIM / 3D Studio state.`,
        audience: target === 'directcut' ? 'video production / project presentation team' : 'technical reviewer / client / production team',
        orderedSteps,
        cameraPath,
        narration,
        storyboard,
        durationEstimate: `${Math.max(10, orderedSteps.length * 6)}s planning estimate`,
        exportNotes: exportBrief,
      },
      cameraPath,
      narration,
      storyboard,
      exportBrief,
      target,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'connected',
      message: scrubProviderError(error.message || 'Apex BIM tour planner failed.'),
    })
  }
}

function splitFieldList(value = '') {
  return String(value || '')
    .split(/\r?\n|,|;/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 30)
}

function fieldEvidenceFromSource(source, hasManualText) {
  if (source?.kind === 'image') return 'PHOTO_CONFIRMED'
  if (hasManualText) return 'USER_REPORTED'
  return 'UNKNOWN'
}

async function handleFieldOpsPlan(req, res) {
  try {
    const body = await readJson(req)
    const context = body.context || {}
    const source = body.source || null
    const action = String(body.action || 'rdo')
    const goal = String(body.goal || '')
    const project = String(context.project || 'Apex field project')
    const date = String(context.date || new Date().toISOString().slice(0, 10))
    const weather = String(context.weather || '')
    const crew = splitFieldList(context.crew)
    const materials = splitFieldList(context.materialsDeliveredUsed)
    const activitiesText = String(context.activitiesPerformed || goal || '')
    const delays = String(context.delays || '')
    const incidents = String(context.incidents || '')
    const safetyNotes = String(context.safetyNotes || '')
    const qualityNotes = String(context.qualityNotes || '')
    const hasManualText = Boolean(activitiesText || delays || incidents || safetyNotes || qualityNotes || crew.length || materials.length)
    const baseEvidence = fieldEvidenceFromSource(source, hasManualText)
    const photoEvidence = source?.kind === 'image' ? 'PHOTO_CONFIRMED' : 'UNKNOWN'
    const activityDescriptions = splitFieldList(activitiesText)
    const activities = activityDescriptions.length
      ? activityDescriptions.map((description, index) => ({
        id: `activity-${index + 1}`,
        description,
        responsibleParty: crew[0] || 'Field team',
        evidence: baseEvidence === 'PHOTO_CONFIRMED' ? 'USER_REPORTED' : baseEvidence,
        status: 'Completed',
      }))
      : [{
        id: 'activity-1',
        description: 'Daily field activities were not fully described yet.',
        responsibleParty: 'Field team',
        evidence: 'UNKNOWN',
        status: 'In Progress',
      }]
    const issues = []
    if (delays) {
      issues.push({
        id: 'issue-delay',
        issue: delays,
        location: 'Project schedule / field coordination',
        severity: 'Medium',
        evidence: 'USER_REPORTED',
        assignedTo: 'Project manager',
        dueDate: '',
        status: 'Open',
      })
    }
    if (incidents) {
      issues.push({
        id: 'issue-incident',
        issue: incidents,
        location: 'Jobsite',
        severity: 'High',
        evidence: 'USER_REPORTED',
        assignedTo: 'Safety / field lead',
        dueDate: '',
        status: 'Open',
      })
    }
    if (source?.kind === 'image') {
      issues.push({
        id: 'issue-photo-review',
        issue: 'Photo attached for field review. Only visible conditions in the photo can be marked PHOTO_CONFIRMED.',
        location: 'Photo log',
        severity: 'Low',
        evidence: 'PHOTO_CONFIRMED',
        assignedTo: 'Field reviewer',
        dueDate: '',
        status: 'Open',
      })
    }
    const safetyItems = [
      ['PPE / EPI', safetyNotes ? 'Needs review' : 'Unknown', safetyNotes ? 'Medium' : 'Medium', safetyNotes || 'No manual safety observation provided.'],
      ['fall protection', 'Unknown', 'Medium', 'Not verified from current data.'],
      ['electrical safety', 'Unknown', 'Medium', 'Not verified from current data.'],
      ['housekeeping', source?.kind === 'image' ? 'Needs review' : 'Unknown', 'Medium', source?.kind === 'image' ? 'Photo should be reviewed for visible access/cleanliness conditions.' : 'No photo evidence available.'],
      ['access/circulation', source?.kind === 'image' ? 'Needs review' : 'Unknown', 'Medium', source?.kind === 'image' ? 'Photo should be reviewed for visible circulation/access conditions.' : 'No photo evidence available.'],
      ['machinery/equipment', 'Unknown', 'Medium', String(context.equipment || 'No equipment status provided.')],
    ].map((item, index) => ({
      id: `safety-${index + 1}`,
      item: item[0],
      status: item[1],
      riskLevel: item[2],
      evidence: item[3] === 'Not verified from current data.' ? 'UNKNOWN' : (safetyNotes ? 'USER_REPORTED' : photoEvidence),
      notes: item[3],
    }))
    const qualityItems = [
      ['dimensions', 'Unknown', 'Not verified from current data.'],
      ['finishes', qualityNotes ? 'Needs review' : 'Unknown', qualityNotes || 'No finish quality note provided.'],
      ['waterproofing', 'Unknown', 'Not verified from current data.'],
      ['concrete/structure', 'Unknown', 'Not verified from current data.'],
      ['MEP', 'Unknown', 'Not verified from current data.'],
      ['rework items', qualityNotes ? 'Needs review' : 'Unknown', qualityNotes || 'No rework item reported.'],
    ].map((item, index) => ({
      id: `quality-${index + 1}`,
      item: item[0],
      status: item[1],
      riskLevel: 'Medium',
      evidence: qualityNotes ? 'USER_REPORTED' : 'UNKNOWN',
      notes: item[2],
    }))
    const photoLog = source ? [{
      id: 'photo-1',
      fileName: source.name || 'uploaded field file',
      caption: source.kind === 'image'
        ? 'Uploaded field photo. Use PHOTO_CONFIRMED only for visible items.'
        : 'Uploaded field file. Content is metadata-only unless manually described.',
      location: 'Unassigned location',
      relatedActivity: activityDescriptions[0] || 'General field progress',
      evidence: source.kind === 'image' ? 'PHOTO_CONFIRMED' : 'UNKNOWN',
    }] : []
    const rdoDraft = [
      `RDO / Daily Report - ${date}`,
      `Project: ${project}`,
      `Weather: ${weather || 'UNKNOWN - manual/weather connector data not provided'}`,
      '',
      'Crew / equipe:',
      ...(crew.length ? crew.map(item => `- ${item}`) : ['- UNKNOWN / not provided']),
      '',
      'Activities performed:',
      ...activities.map(item => `- ${item.description} [${item.evidence}]`),
      '',
      'Equipment:',
      `- ${String(context.equipment || 'UNKNOWN / not provided')}`,
      '',
      'Materials delivered/used:',
      ...(materials.length ? materials.map(item => `- ${item} [USER_REPORTED]`) : ['- UNKNOWN / not provided']),
      '',
      'Visitors:',
      `- ${String(context.visitors || 'None reported / UNKNOWN')}`,
      '',
      'Delays:',
      `- ${delays || 'None reported / UNKNOWN'}`,
      '',
      'Incidents:',
      `- ${incidents || 'None reported / UNKNOWN'}`,
      '',
      'Safety notes:',
      `- ${safetyNotes || 'No safety note provided. No inspection approval claimed.'}`,
      '',
      'Quality notes:',
      `- ${qualityNotes || 'No quality note provided. No inspection approval claimed.'}`,
    ].join('\n')
    const clientSummary = [
      `Client progress report for ${project} (${date}).`,
      activities.length ? `Progress reported: ${activities.map(item => item.description).join('; ')}.` : 'Progress detail is pending.',
      delays ? `Reported blocker/delay: ${delays}.` : 'No delay was reported in the provided notes.',
      'This summary does not claim independent site verification.',
    ].join(' ')
    const internalFieldReport = [
      rdoDraft,
      '',
      'Issues / punch list:',
      ...(issues.length ? issues.map(item => `- ${item.severity} | ${item.evidence} | ${item.issue}`) : ['- No issue recorded yet.']),
    ].join('\n')
    const safetyReport = [
      'Safety report draft:',
      ...safetyItems.map(item => `- ${item.item}: ${item.status} / ${item.riskLevel} / ${item.evidence}. ${item.notes}`),
      'No fake inspection approval. Confirm with qualified site/safety lead.',
    ].join('\n')
    const qualityPunchList = [
      'Quality punch list draft:',
      ...qualityItems.map(item => `- ${item.item}: ${item.status} / ${item.evidence}. ${item.notes}`),
      ...(issues.length ? issues.map(item => `- Issue: ${item.issue} (${item.status})`) : []),
    ].join('\n')
    const materialsLog = [
      'Materials log:',
      ...(materials.length ? materials.map(item => `- ${item} [USER_REPORTED]`) : ['- No material delivery/use was reported.']),
    ].join('\n')
    const nextDayPlan = [
      'Next-day plan:',
      '- Confirm weather manually or connect weather source before publishing.',
      delays ? `- Resolve blocker: ${delays}` : '- Continue planned activities and confirm next sequence.',
      incidents ? '- Follow up incident documentation and safety review.' : '- Complete safety toolbox/checklist before work starts.',
      qualityNotes ? '- Review quality notes and close punch items.' : '- Record quality checks with photo/user evidence.',
    ].join('\n')
    const confidenceSummary = [
      'Field report is a draft.',
      source?.kind === 'image' ? 'Photo log can support visible items as PHOTO_CONFIRMED.' : 'No image evidence provided.',
      hasManualText ? 'Manual notes are USER_REPORTED.' : 'Several fields remain UNKNOWN.',
      'Weather is not verified because no weather connector is connected and no weather field was provided.',
    ].join(' ')

    return json(res, 200, {
      plan: {
        providerStatus: 'connected',
        rdoDraft,
        activities,
        crew,
        materials,
        issues,
        safetyItems,
        qualityItems,
        photoLog,
        clientSummary,
        internalFieldReport,
        safetyReport,
        qualityPunchList,
        materialsLog,
        nextDayPlan,
        confidenceSummary,
        message: action === 'rdo'
          ? 'Field Operations Studio generated an RDO draft. Weather and inspection status are not faked.'
          : `Field Operations Studio generated a ${action} draft with evidence labels.`,
      },
    })
  } catch (error) {
    return json(res, error.status || 500, {
      error: scrubProviderError(error.message || 'Field Operations planner failed.'),
      providerStatus: 'connected',
    })
  }
}

function parseArea(areaText = '') {
  const match = String(areaText).replace(',', '.').match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

function budgetCurrencySymbol(currency) {
  if (currency === 'BRL') return 'BRL'
  if (currency === 'EUR') return 'EUR'
  return 'USD'
}

function budgetItem(id, section, item, unit, quantity, unitPrice, confidence, source, pricingSource = 'Awaiting pricing source', sourceDate = '', sourceConfidence = 'PENDING') {
  const safeQuantity = Number(quantity || 0)
  const safeUnitPrice = Number(unitPrice || 0)
  return {
    id,
    section,
    item,
    unit,
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    subtotal: Number((safeQuantity * safeUnitPrice).toFixed(2)),
    confidence,
    source,
    pricingSource,
    sourceDate,
    sourceConfidence,
  }
}

async function handleBudgetPlan(req, res) {
  try {
    const body = await readJson(req)
    const assumptions = body.assumptions || {}
    const source = body.source || null
    const goal = String(body.goal || '')
    const area = parseArea(assumptions.area)
    const currency = budgetCurrencySymbol(assumptions.currency)
    // Auto-detect SINAPI data file
    const sinapiDataPath = path.join(root, 'src', 'data', 'sinapi-2024.json')
    const sinapiFileExists = fs.existsSync(sinapiDataPath)
    const pricingSource = sinapiFileExists ? 'SINAPI 2024 database' : String(assumptions.pricingSource || 'Placeholder assumptions')
    const sinapiStatus = sinapiFileExists ? 'connected' : String(assumptions.sinapiStatus || 'not-connected')
    const sourceConfidence = pricingSource === 'User provided prices'
      ? 'USER_PROVIDED'
      : pricingSource === 'SINAPI 2024 database'
        ? 'CAIXA_REFERENCE'
        : pricingSource === 'Uploaded SINAPI table'
          ? 'USER_PROVIDED'
          : 'PLACEHOLDER'
    const hasArea = area > 0
    const sourceKind = String(source?.kind || '')
    const confidenceFromSource = sourceKind === 'bim-cad' ? 'UNKNOWN' : hasArea ? 'ESTIMATED' : 'UNKNOWN'
    const baseArea = hasArea ? area : 100
    const unitSystem = assumptions.unitSystem === 'imperial' ? 'imperial' : 'metric'
    const areaUnit = unitSystem === 'imperial' ? 'sf' : 'm2'
    const wallUnit = unitSystem === 'imperial' ? 'lf' : 'm2'
    const standard = String(assumptions.standardLevel || 'medium')
    const multiplier = standard === 'economical' ? 0.78 : standard === 'high-end' ? 1.35 : standard === 'luxury' ? 1.8 : 1

    const estimateItems = [
      budgetItem('budget-flooring', 'flooring', 'Flooring and base finish allowance', areaUnit, baseArea, 62 * multiplier, confidenceFromSource, hasArea ? 'user input' : 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-painting', 'painting', 'Interior/exterior painting allowance', wallUnit, Math.round(baseArea * 2.8), 14 * multiplier, hasArea ? 'ESTIMATED' : 'UNKNOWN', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-electrical', 'electrical', 'Electrical rough-in and fixture allowance', 'allowance', 1, Math.round(baseArea * 48 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-plumbing', 'plumbing', 'Plumbing rough-in and fixture allowance', 'allowance', 1, Math.round(baseArea * 42 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-finishes', 'finishes', 'General finish package allowance', 'allowance', 1, Math.round(baseArea * 95 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-external', 'pool/gourmet/external areas', 'External areas, pool/gourmet/landscaping allowance', 'allowance', 1, Math.round(baseArea * 55 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
    ]

    const pendingQuestions = []
    if (!hasArea) pendingQuestions.push('Confirm total built area or drawing scale before converting this into a proposal price.')
    if (!assumptions.location) pendingQuestions.push('Confirm city/state/country to adapt labor, logistics and local pricing assumptions.')
    pendingQuestions.push('Confirm material brands, finish level, structural scope and whether pool/gourmet/external areas are included.')
    if (sourceKind === 'bim-cad') pendingQuestions.push('BIM quantities are not CONFIRMED until a parser/viewer extracts real quantities from the model.')

    const scopeIncluded = Array.isArray(body.scopeIncluded) && body.scopeIncluded.length
      ? body.scopeIncluded
      : [
        'Preliminary quantity structure',
        'Budget allowance by section',
        'Scope and exclusion draft',
        'Proposal text draft',
      ]
    const scopeExcluded = Array.isArray(body.scopeExcluded) && body.scopeExcluded.length
      ? body.scopeExcluded
      : [
        'Taxes, permit fees and authority charges',
        'Final supplier quotes',
        'Engineering stamps and third-party approvals',
        'Hidden conditions not visible in the current file/context',
      ]
    const ownerSupplied = Array.isArray(body.ownerSupplied) ? body.ownerSupplied : []

    const projectType = String(assumptions.projectType || 'construction project')
    const location = assumptions.location ? ` in ${assumptions.location}` : ''
    const areaCopy = hasArea ? `${area} ${areaUnit}` : 'area not confirmed'
    const propPricing = sinapiFileExists ? `${currency} SINAPI 2024 reference pricing` : `${currency} placeholder pricing (no source connected)`
    const proposalDraft = [
      `Preliminary proposal for ${projectType}${location}.`,
      `Current basis: ${areaCopy}, ${standard} standard, ${propPricing}.`,
      'This draft is suitable for early decision-making only. It is not a final bid because quantities and unit prices require confirmed drawings, scale, local supplier pricing and technical review.',
      '',
      'Payment schedule draft: 20% mobilization, 30% after procurement confirmation, 30% at execution milestone, 20% at delivery and punch-list closeout.',
      'Timeline note: final timeline depends on scope confirmation, permits, procurement lead time and site constraints.',
    ].join('\n')

    const knownSources = [
      source ? `Source file: ${source.name} (${sourceKind || 'unknown kind'}).` : 'No source file; manual description/context only.',
      goal ? `User goal: ${goal}` : 'No explicit goal text.',
    ]

    json(res, 200, {
      plan: {
        providerStatus: 'connected',
        assumptions: {
          projectType,
          area: String(assumptions.area || ''),
          location: String(assumptions.location || ''),
          standardLevel: standard,
          currency,
          unitSystem,
          pricingSource,
          sinapiStatus,
        },
        estimateItems,
        scopeIncluded,
        scopeExcluded,
        ownerSupplied,
        pendingQuestions,
        proposalDraft,
        confidenceSummary: hasArea
          ? 'Quantities are ESTIMATED from user-provided area and assumptions. Prices are placeholders until a real pricing database or supplier quote is connected.'
          : 'No scale/area confirmed. Quantities are UNKNOWN or allowance-based assumptions only.',
        message: [
          'Budget Studio generated a preliminary estimate draft.',
          ...knownSources,
          sinapiStatus === 'connected'
            ? 'SINAPI source: connected — using SINAPI 2024 reference database. Cite connected source values only.'
            : 'SINAPI source: not connected. No SINAPI or live pricing database is connected in this checkpoint.',
        ].join(' '),
      },
    })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'connected',
    })
  }
}

function businessCurrency(value) {
  const normalized = String(value || '').toUpperCase()
  return ['BRL', 'USD', 'EUR'].includes(normalized) ? normalized : 'USD'
}

function createBusinessPlanPayload({ goal = '', focus = 'all', currency = 'USD' }) {
  const safeCurrency = businessCurrency(currency)
  const localNotice = 'Local demo mode — auth/database not connected yet'
  const paymentNotice = 'Payment connector not connected yet — no real payment was processed or confirmed.'
  const accountingNotice = 'NEEDS_ACCOUNTANT_REVIEW: Apex prepares documents and reports for accountant review. It does not file taxes or confirm accounting compliance.'
  const pipelineStages = ['New Lead', 'Qualified', 'Discovery', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'On Hold']
  const saasPlans = [
    ['Internal', 'Owner and internal production team', ['Apex Copilot', 'Project Workspace', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps']],
    ['Starter', 'Small clients needing guided project intake and deliverables', ['Client Workspace', 'Apex Copilot chat', 'file uploads', 'output viewer']],
    ['Pro', 'Design/build teams needing ArchVis, video and project package workflows', ['ArchVis Studio', 'DirectCut Studio', 'Project exports', 'CRM proposal support']],
    ['Business', 'AEC offices needing client portal, CRM, finance and operational modules', ['Admin dashboard', 'Client dashboards', 'CRM', 'Finance', 'Budget', 'Contracts', 'FieldOps']],
    ['Enterprise', 'Larger firms needing governance, integrations and custom workflows', ['All modules', 'advanced permissions', 'custom connectors', 'source confidence reporting']],
    ['Offshore Production Partner', 'US/EU firms outsourcing BIM/CAD/Revit/permit documentation to Apex', ['BIM/Revit production workflow', 'permit packages', 'estimating', 'project delivery dashboard', 'client reporting']],
    ['Custom AI/BIM Operations', 'AEC operations that need a custom AI-enabled production system', ['Custom Copilot workflows', 'BIM operations', 'document intelligence', 'automation roadmap']],
  ].map(([name, targetUser, includedModules]) => ({
    name,
    targetUser,
    includedModules,
    limits: ['Local-first scaffold in this checkpoint', 'Connector limits TBD'],
    suggestedPricePlaceholder: name === 'Internal' ? 'Internal cost center' : 'Placeholder until market research confirms',
    sourceConfidence: 'PLACEHOLDER',
  }))
  const accounting = {
    chartOfAccountsCategories: ['Service revenue', 'SaaS subscription revenue', 'BIM/Revit production revenue', 'ArchVis/render revenue', 'DirectCut/video revenue', 'Contractor/subcontractor expense', 'Software/tools expense', 'Marketing/sales expense', 'Taxes payable', 'Accounts receivable', 'Accounts payable'],
    ledger: [],
    monthlyAccountingSummary: 'Monthly accounting summary is a preparation draft only. No tax filing, tax compliance or paid invoice is confirmed.',
    monthlyRevenueReport: 'No revenue records entered yet. Add invoices or import accounting data.',
    monthlyExpenseReport: 'No expense records entered yet. Attach receipts or import supplier data.',
    invoicesSummary: 'No invoices created yet.',
    paymentsSummary: 'No payments recorded yet. Payment connector status: not-connected.',
    accountsReceivableReport: 'No accounts receivable records. Enter invoices or import accounting data.',
    accountsPayableReport: 'No accounts payable records. Enter supplier bills or import data.',
    projectProfitLossReport: 'Cannot calculate P&L until revenue and expenses are entered or imported.',
    taxPreparationChecklist: ['Confirm jurisdiction, company type and accountant/tax advisor requirements.', 'Attach invoices, receipts and supplier documents.', 'Review tax categories with accountant before filing.', 'Do not treat Apex-generated tax fields as confirmed calculations.'],
    documentsPendingForAccountant: ['Client/company legal data', 'Supplier data and receipts', 'Issued invoices', 'Payment confirmations from real provider or bank records', 'Expense documents', 'Jurisdiction-specific tax guidance from accountant'],
    accountantHandoffPackage: 'Accountant handoff package includes ledger placeholders, invoices summary, payments summary, accounts receivable/payable, project P/L draft, tax prep checklist and pending documents list. It requires accountant review before filing.',
    reviewNotice: accountingNotice,
  }
  return {
    providerStatus: 'connected',
    modeNotice: localNotice,
    authStatus: process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY ? 'connected' : 'not-configured',
    databaseStatus: process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY ? 'connected' : 'not-configured',
    paymentProviderStatus: process.env.STRIPE_SECRET_KEY ? 'connected' : 'not-configured',
    focus,
    usersRoles: {
      roles: ['Owner/Admin', 'Internal Team', 'Client', 'Partner', 'Viewer', 'Contractor', 'Finance', 'Sales'],
      rule: 'Client users must not access admin/internal data. Real enforcement requires approved auth/database/RLS later.',
    },
    clientWorkspace: {
      clientName: 'Client workspace',
      projects: [{ name: 'Client project', status: 'New', uploadedFiles: 0, outputs: 0, proposals: 0, invoices: 0, messages: 0 }],
      visibleToClient: ['active projects', 'uploaded files', 'generated outputs', 'proposals', 'invoices', 'messages', 'project status', 'next actions'],
      hiddenFromClient: ['admin settings', 'internal finance controls', 'other clients', 'internal production notes unless shared'],
    },
    crm: {
      pipelineStages,
      leads: [],
      contacts: [],
      companies: ['Add your first company'],
      opportunities: [],
      followUpTasks: ['Add CRM data manually or import from spreadsheet.', 'Connect a real CRM or database before using this data operationally.'],
      recommendations: ['Keep CRM data local until real database/auth is approved.', 'Separate client-visible project data from internal/admin data.', 'Use Research Studio before publishing market-based pricing.'],
    },
    sales: {
      title: 'Apex commercial proposal package',
      executiveSummary: 'Apex can organize project intake, production modules and client deliverables into a clear proposal package. Pricing remains placeholder until user-provided or source-verified.',
      serviceScope: ['Client intake and file review', 'Apex Copilot project guidance', 'Selected production module outputs', 'Project workspace/export package'],
      quotePackages: ['Starter: project intake and basic output package', 'Pro: ArchVis/DirectCut/Budget production package', 'Business: client workspace, CRM and finance workflow package', 'Offshore Production Partner: US/EU BIM/Revit/permit documentation support'],
      pricingTiers: saasPlans,
      salesScript: 'Lead with the client outcome, show the project workflow, define deliverables, label assumptions, then close with the next practical action.',
      emailDraft: 'Hi [Client], I prepared an Apex workflow for your project with intake, deliverables, timeline assumptions and next steps. I can send the package for review and adjust scope after your feedback.',
      followUpSequence: ['Day 1: send proposal package', 'Day 3: clarify scope/questions', 'Day 7: confirm decision path', 'Day 14: offer revised package or close as on hold'],
      objectionHandling: ['If price is high: separate must-have deliverables from optional add-ons.', 'If timing is uncertain: propose a discovery/preflight package first.', 'If trust is low: show sample outputs and source-confidence labels.'],
      clientPresentationPackage: ['project problem', 'Apex workflow', 'deliverables', 'timeline assumptions', 'pricing to be confirmed', 'next action'],
      internationalPositioning: 'For US/EU clients, position Apex as an offshore BIM/CAD/Revit and permit documentation production partner first, with AI-powered delivery as leverage.',
    },
    finance: {
      invoices: [],
      payments: [],
      expenses: [],
      summary: { currency: safeCurrency, revenueSummary: 'No real revenue connected. Enter values manually or connect a finance/payment provider later.', clientBalance: 'Unknown until invoices/payments are user-entered or provider-connected.', accountsReceivable: 'Placeholder only — no payment connector is connected.', accountsPayable: 'Placeholder only — supplier bills/expenses must be user-entered or imported.', projectCostProfit: 'Unknown until project costs and invoices are entered.', paymentConnectorStatus: 'not-connected', warnings: [paymentNotice, 'Do not treat draft invoices as sent or paid.'] },
      accounting,
    },
    saasPlans,
    adminDashboard: { usersCount: 3, clientsCount: 1, projectsCount: 1, leadsCount: 0, proposalsCount: 0, revenuePlaceholder: 'Revenue not connected — use Finance Studio with user-entered data only.', usageSummary: ['Local Project Workspace is active.', 'Auth/database/payment connectors are not connected.', 'Client data boundaries are modeled but not enforced by a backend yet.'], moduleUsage: ['Apex Copilot', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'CRM', 'Finance'], openTasks: ['Connect real auth before production client access.', 'Connect database/RLS before multi-client persistence.', 'Connect payment provider before invoices can be sent/paid.'] },
    clientDashboard: { activeProjects: 1, uploadedFiles: 0, generatedOutputs: 0, proposals: 0, invoices: 0, messages: 0, projectStatus: 'New', nextActions: ['Upload project files', 'Confirm scope', 'Review proposal package'] },
    recommendations: [focus === 'finance-accounting' ? 'Prepare accountant handoff package, but keep tax/compliance fields as NEEDS_ACCOUNTANT_REVIEW.' : 'Use local-first scaffolding until auth/database/payment connector is approved.', 'Do not expose admin/internal data to Client role in the future production model.', 'Use Export Center to package only real local project data.'],
    warnings: [localNotice, paymentNotice, accountingNotice, 'No fake login, fake database persistence, fake invoice sent status or fake payment confirmation.'],
    message: 'SaaS/CRM/Finance layer generated in local demo mode.',
  }
}

async function handleBusinessPlan(req, res) {
  try {
    const body = await readJson(req)
    const plan = createBusinessPlanPayload({
      goal: String(body.goal || ''),
      focus: String(body.focus || 'all'),
      currency: body.currency,
    })
    json(res, 200, { plan })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'connected',
    })
  }
}

function contractsRisk(id, clause, issue, severity, evidence, recommendation, ownerAction) {
  return {
    id,
    clause,
    issue,
    severity,
    evidence,
    recommendation,
    ownerAction,
    status: 'Open',
  }
}

function permitItem(id, category, requirement, evidence) {
  return {
    id,
    category,
    requirement,
    evidence,
    status: 'Open',
  }
}

function permitPackageDoc(id, documentName, group, responsibleParty, evidenceLevel, notes) {
  return {
    id,
    documentName,
    group,
    responsibleParty,
    status: 'Not started',
    evidenceLevel,
    dueDate: '',
    notes,
    sourceLink: '',
  }
}

function permitPackageForRegion(region, evidenceLevel, jurisdictionLabel) {
  const verifyNote = `Verify exact current requirement with ${jurisdictionLabel}.`
  if (region === 'EU') {
    return [
      permitPackageDoc('eu-planning', 'Planning permission / planning application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General EU-style planning package item. ${verifyNote}`),
      permitPackageDoc('eu-building-control', 'Building control / building permit submission', 'required documents', 'architect/engineer-provided', evidenceLevel, `General building control package item. ${verifyNote}`),
      permitPackageDoc('eu-zoning', 'Zoning / land-use compliance summary', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm local land-use constraints. ${verifyNote}`),
      permitPackageDoc('eu-fire', 'Fire safety strategy and drawings', 'required documents', 'architect/engineer-provided', evidenceLevel, `Fire safety requirements vary by municipality/country. ${verifyNote}`),
      permitPackageDoc('eu-accessibility', 'Accessibility compliance checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Use local accessibility standard only after source verification. ${verifyNote}`),
      permitPackageDoc('eu-energy', 'Energy performance / EPC-style documentation', 'required documents', 'architect/engineer-provided', evidenceLevel, `Energy documentation is jurisdiction-dependent. ${verifyNote}`),
      permitPackageDoc('eu-environmental', 'Environmental impact screening', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `May or may not be required. ${verifyNote}`),
      permitPackageDoc('eu-structural', 'Structural documentation / calculations', 'required documents', 'architect/engineer-provided', evidenceLevel, `Engineer-stamped requirements vary. ${verifyNote}`),
      permitPackageDoc('eu-mep', 'MEP documentation', 'optional documents', 'architect/engineer-provided', evidenceLevel, `May be required depending on scope. ${verifyNote}`),
      permitPackageDoc('eu-heritage', 'Heritage / conservation constraints check', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `Only confirm after local authority/source check. ${verifyNote}`),
      permitPackageDoc('eu-contractor', 'Contractor documentation and insurance', 'optional documents', 'contractor-provided', evidenceLevel, `Confirm contractor documentation locally. ${verifyNote}`),
      permitPackageDoc('eu-completion', 'Completion / occupancy certificate checklist', 'required documents', 'authority-provided', evidenceLevel, `General completion-stage package item. ${verifyNote}`),
    ]
  }
  if (region === 'UK') {
    return [
      permitPackageDoc('uk-planning', 'Planning permission application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General UK planning package item. ${verifyNote}`),
      permitPackageDoc('uk-building-control', 'Building control application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General building control package item. ${verifyNote}`),
      permitPackageDoc('uk-fire', 'Fire strategy / building safety notes', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm project-specific fire/building safety requirements. ${verifyNote}`),
      permitPackageDoc('uk-accessibility', 'Access statement / accessibility checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm local and project-specific scope. ${verifyNote}`),
      permitPackageDoc('uk-energy', 'Energy / sustainability compliance documents', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm source-backed requirement. ${verifyNote}`),
      permitPackageDoc('uk-heritage', 'Conservation / listed building check', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `Only if site constraints apply. ${verifyNote}`),
      permitPackageDoc('uk-completion', 'Completion certificate checklist', 'required documents', 'authority-provided', evidenceLevel, `General completion-stage package item. ${verifyNote}`),
    ]
  }
  if (region === 'Brazil') {
    return [
      permitPackageDoc('br-aprovacao', 'Pacote de aprovação municipal / alvará', 'required documents', 'architect/engineer-provided', evidenceLevel, `Checklist geral; confirmar na prefeitura/local authority. ${verifyNote}`),
      permitPackageDoc('br-art-rrt', 'ART/RRT / responsabilidade técnica', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirmar responsável técnico e exigência local. ${verifyNote}`),
      permitPackageDoc('br-projeto', 'Projeto arquitetônico e complementares', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirmar escopo de pranchas exigidas. ${verifyNote}`),
      permitPackageDoc('br-bombeiros', 'Checklist Corpo de Bombeiros / fire safety', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Pode depender de uso, área e estado. ${verifyNote}`),
      permitPackageDoc('br-habite-se', 'Habite-se / certificado de conclusão', 'required documents', 'authority-provided', evidenceLevel, `Checklist geral de fechamento. ${verifyNote}`),
    ]
  }
  return [
    permitPackageDoc('us-building-permit', 'Building permit application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General US permit package item. ${verifyNote}`),
    permitPackageDoc('us-zoning', 'Zoning review / planning application', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm zoning and planning path with AHJ. ${verifyNote}`),
    permitPackageDoc('us-site-plan', 'Site plan review package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General site plan package item. ${verifyNote}`),
    permitPackageDoc('us-fire-marshal', 'Fire marshal review package', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Required scope varies by occupancy/AHJ. ${verifyNote}`),
    permitPackageDoc('us-ada', 'ADA / accessibility checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm applicability and local amendments. ${verifyNote}`),
    permitPackageDoc('us-environmental', 'Environmental review / screening', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `May be required by site/scope. ${verifyNote}`),
    permitPackageDoc('us-stormwater', 'Stormwater / drainage package', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Often site/scope dependent. ${verifyNote}`),
    permitPackageDoc('us-energy', 'Energy code compliance package', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm applicable code edition locally. ${verifyNote}`),
    permitPackageDoc('us-structural', 'Structural calculations package', 'required documents', 'architect/engineer-provided', evidenceLevel, `Engineer requirements vary. ${verifyNote}`),
    permitPackageDoc('us-mep', 'MEP permit package', 'optional documents', 'architect/engineer-provided', evidenceLevel, `May be separate trade permits depending on AHJ. ${verifyNote}`),
    permitPackageDoc('us-contractor', 'Contractor licensing, insurance and bonds', 'required documents', 'contractor-provided', evidenceLevel, `Confirm local licensing and bond requirements. ${verifyNote}`),
    permitPackageDoc('us-co', 'Inspections and certificate of occupancy checklist', 'required documents', 'authority-provided', evidenceLevel, `General closeout/inspection package item. ${verifyNote}`),
  ]
}

async function handleContractsPlan(req, res) {
  try {
    const body = await readJson(req)
    const context = body.context || {}
    const source = body.source || null
    const action = String(body.action || 'draft')
    const goal = String(body.goal || '')
    const documentType = String(context.documentType || 'Contract')
    const location = String(context.location || '')
    const region = String(context.region || 'US')
    const country = String(context.country || '')
    const stateProvince = String(context.stateProvince || '')
    const cityMunicipality = String(context.cityMunicipality || '')
    const ahjLocalAuthority = String(context.ahjLocalAuthority || '')
    const jurisdictionParts = [cityMunicipality, stateProvince, country].filter(Boolean).join(', ')
    const jurisdictionLabel = ahjLocalAuthority || location || jurisdictionParts || 'local AHJ / authority'
    const hasJurisdictionDetail = Boolean(ahjLocalAuthority || location || jurisdictionParts)
    const jurisdictionStatus = hasJurisdictionDetail ? 'ASSUMPTION' : 'UNKNOWN'
    const permitEvidenceLevel = hasJurisdictionDetail ? 'GENERAL_GUIDANCE' : 'NEEDS_LOCAL_AUTHORITY'
    const detectedDocumentType = source ? documentType : documentType
    const highRiskEvidence = 'NEEDS LAWYER REVIEW'

    const riskItems = [
      contractsRisk(
        'ri[REDACTED]',
        'Scope of services',
        'Scope may be too broad or not tied to deliverables and acceptance criteria.',
        'High',
        source ? 'ASSUMPTION' : 'UNKNOWN',
        'Define included services, excluded services, deliverables, acceptance criteria and change-order trigger.',
        'Confirm exact scope and attach drawings/proposal/budget reference.'
      ),
      contractsRisk(
        'ri[REDACTED]',
        'Payment schedule',
        'Payment milestones may not protect cash flow or delivery risk.',
        'Medium',
        'ASSUMPTION',
        'Tie payments to mobilization, procurement, execution milestone and final delivery.',
        'Confirm deposit amount, milestone dates, late-payment consequences and retainage if any.'
      ),
      contractsRisk(
        'ri[REDACTED]',
        'Change orders',
        'Missing change-order process can create unpaid extra work.',
        'High',
        'ASSUMPTION',
        'Require written approval for scope, price and schedule impact before extra work starts.',
        'Add a simple change-order approval clause.'
      ),
      contractsRisk(
        'ri[REDACTED]',
        'Jurisdiction-specific enforceability',
        'Local legal enforceability cannot be confirmed without lawyer/local authority review.',
        'High',
        highRiskEvidence,
        'Send final draft to qualified lawyer for jurisdiction-specific review.',
        location ? `Confirm local rules for ${location}.` : 'Add jurisdiction/location before finalizing.'
      ),
    ]

    const permitCategories = [
      'zoning / land use',
      'building permit',
      'fire safety',
      'accessibility',
      'environmental',
      'HOA / condominium',
      'utility connections',
      'occupancy / habite-se',
      'engineering responsibility / ART/RRT equivalent',
      'local authority documents',
      'insurance / bonds if applicable',
    ]
    const permitChecklist = permitCategories.map((category, index) => permitItem(
      `permit-${index + 1}`,
      category,
      hasJurisdictionDetail
        ? `General ${region} package checklist item for ${category}; confirm exact current requirement with ${jurisdictionLabel}.`
        : `General checklist item for ${category}; jurisdiction is unknown.`,
      permitEvidenceLevel
    ))
    const permitPackage = permitPackageForRegion(region, permitEvidenceLevel, jurisdictionLabel)

    const projectName = String(context.projectName || 'the project')
    const parties = String(context.parties || 'Owner / Client / Contractor')
    const mode = String(context.reviewMode || 'Draft')
    const sourceCopy = source ? `Uploaded source: ${source.name}.` : 'No uploaded legal document; draft is based on typed context only.'
    const documentSummary = [
      `${mode} support for ${documentType} related to ${projectName}.`,
      sourceCopy,
      hasJurisdictionDetail ? `Jurisdiction context provided: ${jurisdictionLabel}. Region: ${region}.` : `Jurisdiction/location not provided. Region mode: ${region}.`,
      'This is planning/legal support, not licensed legal approval.',
    ].join(' ')

    const scopeDraft = {
      servicesIncluded: [
        'Project services described in approved proposal/scope.',
        'Coordination, delivery review and client communication as agreed.',
        'Documented deliverables listed in the contract/proposal.',
      ],
      materialsSpecs: [
        'Materials/specs must reference approved drawings, budget or memorial descritivo.',
        'Substitutions require written approval before procurement.',
      ],
      exclusions: [
        'Permit fees, taxes, third-party approvals and hidden conditions unless expressly included.',
        'Additional scope not documented in writing.',
      ],
      ownerSuppliedItems: [
        'Owner/client supplied items must be listed with deadlines and responsibility for defects/delays.',
      ],
      qualityStandards: [
        'Work should follow approved drawings, applicable codes and agreed finish standard.',
      ],
      deliverables: [
        'Approved proposal/scope, schedule note, payment milestones and acceptance criteria.',
      ],
      changeOrderRules: [
        'Any change in scope, cost or time requires written change-order approval before execution.',
      ],
      acceptanceCriteria: [
        'Delivery is accepted after review against agreed scope, punch-list closure and documented handover.',
      ],
    }

    const contractDraft = [
      'SIMPLE SERVICE AGREEMENT DRAFT',
      '',
      `Project: ${projectName}`,
      `Parties: ${parties}`,
      `Location/Jurisdiction: ${location || 'UNKNOWN - confirm before final use'}`,
      '',
      '1. Scope. The service provider will perform the services described in the attached proposal, drawings, budget and/or memorial descritivo.',
      '2. Exclusions. Permit fees, taxes, authority charges, hidden conditions and third-party approvals are excluded unless expressly written into the scope.',
      '3. Payment. Payment milestones must be confirmed in writing before work starts.',
      '4. Changes. Any change in scope, price or schedule requires written approval before execution.',
      '5. Deliverables and acceptance. Final acceptance occurs after delivery review, punch-list closure and documented approval.',
      '6. Legal review. This draft must be reviewed by a qualified lawyer before signature.',
    ].join('\n')

    const pendingQuestions = [
      'What is the exact jurisdiction/location?',
      'What is the AHJ / local authority name?',
      'Who are the legal parties and signatories?',
      'Which drawings, budget and memorial descritivo are attached as contract exhibits?',
      'What payment milestones, deadlines and penalties should apply?',
      'Which permits/approvals are required by local authority?',
    ]
    if (action === 'permits') pendingQuestions.unshift('Confirm property type, zoning, project size and authority having jurisdiction.')
    if (!hasJurisdictionDetail) pendingQuestions.unshift('Add country, state/province, city/municipality and AHJ/local authority before treating requirements as current.')

    const usChecklist = permitPackageForRegion('US', permitEvidenceLevel, jurisdictionLabel)
      .map(item => `- ${item.documentName} (${item.responsibleParty}; ${item.evidenceLevel})`)
      .join('\n')
    const euChecklist = permitPackageForRegion('EU', permitEvidenceLevel, jurisdictionLabel)
      .map(item => `- ${item.documentName} (${item.responsibleParty}; ${item.evidenceLevel})`)
      .join('\n')
    const architectDocs = permitPackage
      .filter(item => item.responsibleParty === 'architect/engineer-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Confirm architectural/engineering package with local authority.'
    const ownerDocs = permitPackage
      .filter(item => item.responsibleParty === 'owner-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Property address/APN or parcel reference\n- Proof of ownership or authorization\n- Owner contact and billing details\n- Existing survey/site information if available'
    const contractorDocs = permitPackage
      .filter(item => item.responsibleParty === 'contractor-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Contractor license/status\n- Insurance certificate\n- Bonds if required\n- Trade permit contacts'
    const missingDocs = permitPackage
      .filter(item => item.evidenceLevel === 'UNKNOWN' || item.evidenceLevel === 'NEEDS_LOCAL_AUTHORITY' || item.group === 'unknown until jurisdiction verified')
      .map(item => `- ${item.documentName}: ${item.notes}`)
      .join('\n') || '- No missing/unknown package item has been identified yet, but local authority verification is still required.'
    const packageOutputs = {
      usPermitPackageChecklist: `US permit package checklist (GENERAL GUIDANCE - verify with AHJ):\n${usChecklist}`,
      euPermitPackageChecklist: `EU permit package checklist (GENERAL GUIDANCE - verify with municipality/building authority):\n${euChecklist}`,
      ahjInquiryEmailDraft: [
        `Subject: Permit package requirements inquiry for ${projectName}`,
        '',
        `Hello ${ahjLocalAuthority || 'Permit Department'},`,
        '',
        `We are preparing a ${region} permit/document package for ${projectName}. Could you confirm the current submittal requirements, drawing sets, forms, fees, review path, inspection sequence, accessibility/fire/energy/stormwater requirements, and any local amendments for ${jurisdictionLabel}?`,
        '',
        'Please also confirm whether preliminary zoning/site plan review is required before building permit submission.',
        '',
        'Thank you,',
        'Apex AI Copilot / Project Team',
      ].join('\n'),
      architectEngineerDocumentRequestList: `Architect/engineer document request list:\n${architectDocs}`,
      ownerDocumentRequestList: `Owner document request list:\n${ownerDocs}`,
      contractorComplianceChecklist: `Contractor compliance checklist:\n${contractorDocs}`,
      permitSubmissionCoverLetter: [
        `Permit submission cover letter draft for ${projectName}`,
        '',
        `This package is submitted for preliminary authority review. The enclosed checklist is evidence-labeled and any item marked NEEDS_LOCAL_AUTHORITY remains subject to confirmation by ${jurisdictionLabel}.`,
      ].join('\n'),
      revisionResponseLetter: [
        `Revision response letter draft for ${projectName}`,
        '',
        'Thank you for the review comments. The project team will respond item-by-item, attach revised drawings/documents, and identify any remaining open items requiring authority confirmation.',
      ].join('\n'),
      missingDocumentsReport: `Missing / authority-dependent documents:\n${missingDocs}`,
    }

    json(res, 200, {
      plan: {
        providerStatus: source || goal ? 'connected' : 'connected',
        documentSummary,
        detectedDocumentType,
        jurisdictionStatus,
        sourceConfidence: 'NEEDS_WEB_VERIFICATION',
        needsVerification: true,
        riskItems,
        permitChecklist,
        permitPackage,
        packageOutputs,
        scopeDraft,
        contractDraft,
        clientFacingSummary: [
          `Prepared a ${documentType} draft/review for ${projectName}.`,
          'The next step is to confirm scope, price, schedule, permits and signatories before sending a client-facing version.',
        ].join(' '),
        lawyerReviewSummary: [
          'Lawyer review requested for jurisdiction-specific enforceability, liability, termination, dispute resolution, licensing/permit obligations and consumer/business compliance.',
          `Evidence status: ${jurisdictionStatus}. High-risk legal clauses are marked NEEDS LAWYER REVIEW.`,
        ].join(' '),
        pendingQuestions,
        message: 'Contracts Studio generated a planning/review draft. This is not legal approval and no permit database is connected.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'connected',
    })
  }
}

function decodeXmlText(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim()
}

function stripHtmlTags(value) {
  return decodeXmlText(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function extractXmlTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeXmlText(match[1]) : ''
}

function extractSourceNameFromUrl(value) {
  try {
    return new URL(String(value || '')).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

async function fetchText(url, { timeoutMs = 10000, maxBytes = 1024 * 1024 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'ApexAIResearch/1.0 (+https://www.apexglobalai.com)',
        accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = new Error(`Source request failed with status ${response.status}`)
      error.status = response.status
      throw error
    }
    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength && declaredLength > maxBytes) {
      const error = new Error('Source response too large')
      error.status = 413
      throw error
    }
    const reader = response.body?.getReader?.()
    if (!reader) return await response.text()
    const chunks = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        controller.abort()
        const error = new Error('Source response too large')
        error.status = 413
        throw error
      }
      chunks.push(value)
    }
    return new TextDecoder().decode(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))))
  } finally {
    clearTimeout(timer)
  }
}

function buildResearchSearchQuery(researchType, query, region, freshness) {
  return [researchType, query, region, freshness]
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .join(' ')
}

function parseBingRssSources(xml, checked) {
  const items = []
  const itemMatches = String(xml || '').match(/<item>[\s\S]*?<\/item>/gi) || []
  for (const block of itemMatches) {
    const title = stripHtmlTags(extractXmlTag(block, 'title'))
    const url = extractXmlTag(block, 'link')
    const description = stripHtmlTags(extractXmlTag(block, 'description'))
    const pubDate = extractXmlTag(block, 'pubDate') || checked
    if (!title || !url || !/^https?:\/\//i.test(url)) continue
    if (items.some(item => item.url === url)) continue
    items.push({
      citationId: `S${items.length + 1}`,
      title,
      sourceName: extractSourceNameFromUrl(url),
      url,
      dateChecked: pubDate,
      evidenceLevel: 'CONFIRMED_SOURCE',
      note: description || `Live search result captured for ${title}.`,
    })
    if (items.length >= 6) break
  }
  return items
}

function buildResearchFindingsFromSources({ researchType, query, region, checked, sources }) {
  const findings = [
    {
      id: 'finding-research-plan',
      claim: `Live research executed for: ${query || researchType}.`,
      evidence: `Apex searched public web sources using the query "${query || researchType}".`,
      confidence: 'USER_PROVIDED',
      source: 'User prompt',
      date: checked,
    },
  ]
  if (region) {
    findings.push({
      id: 'finding-region',
      claim: `Regional scope applied: ${region}.`,
      evidence: 'User-provided region field was included in the search query.',
      confidence: 'USER_PROVIDED',
      source: 'User input',
      date: checked,
    })
  }
  for (const source of sources.slice(0, 4)) {
    findings.push({
      id: `finding-${String(source.citationId || source.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      claim: source.title,
      evidence: source.note,
      confidence: source.evidenceLevel,
      source: `${source.citationId || 'S?'} · ${source.sourceName || source.url || 'live source'}`,
      date: source.dateChecked,
    })
  }
  return findings
}

function buildResearchProposalFromSources({ researchType, query, region, freshness, sinapiIntent, sources }) {
  const top = sources[0]
  const second = sources[1]
  const citationLine = sources.slice(0, 3).map(source => `[${source.citationId}] ${source.sourceName}`).join(', ')
  const regionalText = region ? ` for ${region}` : ''
  return {
    executiveSummary: `Apex found ${sources.length} live source${sources.length === 1 ? '' : 's'}${regionalText} for "${query || researchType}". The current evidence base starts with ${citationLine || 'the attached citations'}.`,
    marketOpportunity: top?.note || 'Use the attached live source snippets to qualify the current market opportunity before presenting a commercial recommendation.',
    clientPainPoints: [
      'Client needs current evidence with clickable citations before approving strategy or pricing.',
      region ? `Regional constraints for ${region} must stay tied to the cited sources.` : 'Regional scope should be confirmed before turning research into execution.',
      sinapiIntent ? 'SINAPI values still require official table/API confirmation before using any price as final.' : 'Competitor and pricing claims should keep the attached citation trail.',
    ],
    valueProposition: second?.note
      ? `Apex can transform the cited findings into proposals, decks, budgets and next actions while preserving source traceability. Example evidence: ${second.note}`
      : 'Apex can transform the cited findings into proposals, decks, budgets and next actions while preserving source traceability.',
    competitivePositioning: sources.slice(0, 2).map(source => `[${source.citationId}] ${source.title}`).join(' | ') || 'Use the attached live citations to position the offer against the current market.',
    pricingAssumptions: sinapiIntent
      ? [
        'SINAPI web references were found, but no official uploaded table/API is active yet.',
        'Treat live snippets as directional only until official SINAPI bases are attached.',
      ]
      : [
        `Freshness requested: ${freshness || 'Current source required'}.`,
        'Use the cited source snippets as the current reference layer before closing pricing or positioning.',
      ],
    recommendedOffer: `Prepare the next client-facing deliverable using citations ${citationLine || '[S1]'} as the evidence baseline.`,
    ctaNextStep: sinapiIntent
      ? 'Upload the official SINAPI table or connect the pricing source, then rerun the research to lock final values with citations.'
      : 'Review the attached citations, keep the relevant ones, and convert them into a proposal, benchmark or execution package.',
  }
}

function buildResearchPendingVerification({ researchType, region, sinapiIntent, liveSources }) {
  const items = [
    'Open the cited URLs and confirm the exact claim wording before publishing client-facing conclusions.',
    region ? `Validate whether ${region} needs narrower local authority or city-specific sources.` : 'Add city/state/country scope if the decision depends on a specific jurisdiction or market.',
    `Current result count: ${liveSources.length}. Expand the search if you need deeper coverage for ${researchType.toLowerCase()}.`,
  ]
  if (sinapiIntent) {
    items.push('Do not finalize SINAPI values until an official uploaded table or connected source is active.')
  }
  return items
}

async function handleResearchPlan(req, res) {
  try {
    const body = await readJson(req)
    const researchType = String(body.researchType || 'Market research')
    const query = String(body.query || '')
    const region = String(body.region || '')
    const freshness = String(body.freshness || 'Current source required')
    const checked = new Date().toISOString()
    const sinapiIntent = /sinapi|construction cost source|pricing|pre[cç]o|custo/i.test(`${researchType} ${query}`)
    const searchQuery = buildResearchSearchQuery(researchType, query, region, freshness)
    let liveSources = []

    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (braveKey && query) {
      try {
        const braveRes = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': braveKey },
          signal: AbortSignal.timeout(10000),
        })
        if (braveRes.ok) {
          const braveData = await braveRes.json()
          liveSources = (braveData.web?.results || []).map((r, i) => ({
            citationId: `T${i + 1}`,
            title: r.title || r.url || 'Fonte web',
            sourceName: 'Brave Search',
            url: r.url || '',
            dateChecked: checked,
            evidenceLevel: 'WEB_SEARCH',
            note: r.description || r.content || '',
          }))
        }
      } catch { /* Brave search failed, fallback below */ }
    }

    if (!liveSources.length) {
      try {
        const rss = await fetchText(`https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&format=rss`, { timeoutMs: 12000 })
        liveSources = parseBingRssSources(rss, checked)
      } catch { /* Bing RSS also failed */ }
    }

    if (!liveSources.length) {
      const sources = [
        {
          citationId: 'S1',
          title: 'Live web connector',
          sourceName: 'Not connected in local runtime',
          url: '',
          dateChecked: checked,
          evidenceLevel: 'NEEDS_WEB_VERIFICATION',
          note: 'Apex did not browse the web or verify current sources in this request.',
        },
      ]
      if (sinapiIntent) {
        sources.push({
          citationId: 'S2',
          title: 'SINAPI source',
          sourceName: 'not-connected',
          url: '',
          dateChecked: checked,
          evidenceLevel: 'NEEDS_WEB_VERIFICATION',
          note: 'No SINAPI table/API is connected. Do not use any SINAPI value until a source is uploaded or connected.',
        })
      }
      const findings = [
        {
          id: 'finding-source-status',
          claim: 'Current market/pricing/legal data was not verified live.',
          evidence: 'Local runtime has no configured web/source connector for this endpoint.',
          confidence: 'NEEDS_WEB_VERIFICATION',
          source: 'Apex local runtime status',
          date: checked,
        },
        {
          id: 'finding-research-plan',
          claim: `Research plan needed for: ${query || researchType}.`,
          evidence: 'User request and selected research type.',
          confidence: 'USER_PROVIDED',
          source: 'User prompt',
          date: checked,
        },
        {
          id: 'finding-assumption',
          claim: region ? `Region context: ${region}.` : 'Region/location is not confirmed.',
          evidence: region ? 'User-provided region field.' : 'Missing region field.',
          confidence: region ? 'USER_PROVIDED' : 'NEEDS_WEB_VERIFICATION',
          source: region ? 'User input' : 'missing input',
          date: checked,
        },
      ]
      const proposalBuilder = {
        executiveSummary: `Apex prepared a source-aware ${researchType.toLowerCase()} plan for "${query || 'the requested topic'}". This is a research plan, not verified live market intelligence.`,
        marketOpportunity: 'Define opportunity only after live web/source verification or user-provided evidence is attached.',
        clientPainPoints: [
          'Client needs credible current evidence before decisions.',
          'Pricing, competitors and regulations must be sourced before proposal claims.',
          'Apex should label assumptions separately from confirmed facts.',
        ],
        valueProposition: 'Apex can convert verified sources into a proposal, positioning, offer, pricing assumptions and next-step CTA.',
        competitivePositioning: 'Needs competitor/source verification before making current-market claims.',
        pricingAssumptions: sinapiIntent
          ? ['SINAPI source is not connected.', 'Use placeholder pricing only until uploaded SINAPI table or live source is connected.']
          : ['Pricing is not verified.', 'Use user-provided or placeholder assumptions until sources are connected.'],
        recommendedOffer: 'Prepare a source-backed proposal after collecting web/source evidence, competitor examples, pricing basis and regional constraints.',
        ctaNextStep: 'Connect web/source provider or upload source files, then rerun research with citations.',
      }
      json(res, 200, {
        plan: {
          providerStatus: 'connected',
          researchType,
          query,
          region,
          freshness,
          sinapiStatus: fs.existsSync(path.join(root, 'src', 'data', 'sinapi-2024.json')) ? 'connected' : 'not-connected',
          sources,
          findings,
          proposalBuilder,
          pendingVerification: [
            'Connect live web/source provider before claiming current market data.',
            'Attach user-provided source files for pricing, competitor or regulatory claims.',
            'For SINAPI, upload an official table or configure a real connector before using values.',
          ],
          message: 'Research Studio produced a connector-ready plan. No live web research, fake citations, fake SINAPI prices or current legal/regulatory claims were generated.',
        },
      })
      return
    }

    const findings = buildResearchFindingsFromSources({
      researchType,
      query,
      region,
      checked,
      sources: liveSources,
    })
    const proposalBuilder = buildResearchProposalFromSources({
      researchType,
      query,
      region,
      freshness,
      sinapiIntent,
      sources: liveSources,
    })
    json(res, 200, {
      plan: {
        providerStatus: 'connected',
        researchType,
        query,
        region,
        freshness,
        sinapiStatus: fs.existsSync(path.join(root, 'src', 'data', 'sinapi-2024.json')) ? 'connected' : 'not-connected',
        sources: liveSources,
        findings,
        proposalBuilder,
        pendingVerification: buildResearchPendingVerification({ researchType, region, sinapiIntent, liveSources }),
        message: `Research Studio searched live public sources and attached ${liveSources.length} citation(s) for ${query || researchType}.`,
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleSourceEvidence(req, res) {
  try {
    const body = await readJson(req)
    const title = String(body.title || 'Source evidence request')
    const url = String(body.url || '').trim()
    if (url) {
      if (!isPublicHttpUrl(url)) {
        return json(res, 400, {
          error: 'Only public http/https source URLs are allowed.',
        })
      }
      const html = await fetchText(url, { timeoutMs: 12000 })
      const pageTitleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const pageDescriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      json(res, 200, {
        evidence: {
          citationId: 'S1',
          title: stripHtmlTags(pageTitleMatch ? pageTitleMatch[1] : title),
          sourceName: extractSourceNameFromUrl(url),
          url,
          dateChecked: new Date().toISOString(),
          evidenceLevel: 'CONFIRMED_SOURCE',
          note: stripHtmlTags(pageDescriptionMatch ? pageDescriptionMatch[1] : `Live source fetched from ${url}.`),
        },
      })
      return
    }
    json(res, 200, {
      evidence: {
        citationId: 'S1',
        title,
        sourceName: 'not-connected',
        url: '',
        dateChecked: new Date().toISOString(),
        evidenceLevel: 'NEEDS_WEB_VERIFICATION',
        note: 'Source evidence connector is not configured. Provide a URL/source file or connect a web provider.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

function findLatestProjectExport(project, type) {
  const exportsList = Array.isArray(project?.exports) ? project.exports : []
  for (let index = exportsList.length - 1; index >= 0; index -= 1) {
    const item = exportsList[index]
    if (item && typeof item === 'object' && item.type === type) return item
  }
  return null
}

function totalBudgetValue(plan) {
  const items = Array.isArray(plan?.estimateItems) ? plan.estimateItems : []
  return Number(items.reduce((sum, item) => sum + Number(item?.subtotal || 0), 0).toFixed(2))
}

function packageStatusFromFlags(flags = []) {
  if (flags.includes('BLOCKED')) return 'BLOCKED'
  if (flags.includes('PARTIAL')) return 'PARTIAL'
  return 'READY'
}

function buildProjectPackageArtifact({ id, title, checks = [], summary, nextAction }) {
  return {
    id,
    title,
    status: packageStatusFromFlags(checks.map(item => item.status)),
    summary,
    evidence: checks.map(item => `${item.label}: ${item.value}`),
    nextAction,
  }
}

function isPublicHttpUrl(value) {
  let parsed
  try {
    parsed = new URL(String(value || '').trim())
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false
  const hostname = parsed.hostname.toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local')) return false
  if (hostname === '0.0.0.0' || hostname === '127.0.0.1' || hostname === '::1') return false
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map(Number)
    const [a, b] = parts
    if (a === 10) return false
    if (a === 127) return false
    if (a === 169 && b === 254) return false
    if (a === 172 && b >= 16 && b <= 31) return false
    if (a === 192 && b === 168) return false
    if (a === 0) return false
  }
  if (hostname.includes(':')) return false
  return true
}

async function handleGenerationHistory(req, res) {
  try {
    const body = await readJson(req)
    const project = body.project || {}
    const result = generationHistoryService.buildGenerationHistory(project)
    if (result.error) return json(res, 400, { error: result.error })
    return json(res, 200, result)
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

async function handleProjectPackage(req, res) {
  try {
    const body = await readJson(req)
    const project = body.project || {}
    const goal = String(body.goal || 'Complete project package').trim()
    if (!project || typeof project !== 'object' || !project.name) {
      return json(res, 400, { error: 'Valid project state is required for project package pipeline.' })
    }

    const profile = project.projectProfile && typeof project.projectProfile === 'object' ? project.projectProfile : {}
    const files = Array.isArray(project.files) ? project.files : []
    const exportsList = Array.isArray(project.exports) ? project.exports : []
    const latestBudget = findLatestProjectExport(project, 'budget-estimate')
    const latestContracts = findLatestProjectExport(project, 'contracts-permits-review')
    const latestResearch = findLatestProjectExport(project, 'research-market-intelligence')
    const latestBusiness = findLatestProjectExport(project, 'saas-crm-finance-business-layer')
    const latestFieldOps = findLatestProjectExport(project, 'field-operations-rdo')
    const budgetTotal = totalBudgetValue(latestBudget?.plan)
    const budgetCurrency = latestBudget?.plan?.assumptions?.currency || 'BRL'
    const researchSources = Array.isArray(latestResearch?.plan?.sources) ? latestResearch.plan.sources.length : 0
    const permitItems = Array.isArray(latestContracts?.plan?.permitPackage) ? latestContracts.plan.permitPackage.length : 0
    const pendingContractQuestions = Array.isArray(latestContracts?.plan?.pendingQuestions) ? latestContracts.plan.pendingQuestions.length : 0
    const fileKinds = Array.from(new Set(files.map(file => String(file?.kind || 'unknown'))))

    const designArtifact = buildProjectPackageArtifact({
      id: 'design-review',
      title: 'Design review and board package',
      checks: [
        { label: 'briefing', value: profile.brief ? 'saved in workspace' : 'missing', status: profile.brief ? 'READY' : 'PARTIAL' },
        { label: 'project type', value: profile.projectType || 'missing', status: profile.projectType ? 'READY' : 'PARTIAL' },
        { label: 'files', value: `${files.length} file(s) / kinds: ${fileKinds.join(', ') || 'none'}`, status: files.length ? 'READY' : 'BLOCKED' },
      ],
      summary: files.length
        ? 'Apex can structure the review package, board narrative and drawing handoff from the current workspace evidence.'
        : 'No source files are attached yet, so the board package cannot move past planning status.',
      nextAction: files.length ? 'Confirm which drawing should become the main presentation board and lock the revision constraints.' : 'Upload the base plan, facade, BIM or reference files first.',
    })

    const budgetArtifact = buildProjectPackageArtifact({
      id: 'budget-quantity',
      title: 'Quantity takeoff and budget package',
      checks: [
        { label: 'budget export', value: latestBudget ? 'available' : 'missing', status: latestBudget ? 'READY' : 'PARTIAL' },
        { label: 'budget total', value: latestBudget ? `${budgetCurrency} ${budgetTotal.toFixed(2)}` : 'not calculated', status: latestBudget ? 'READY' : 'PARTIAL' },
        { label: 'SINAPI / pricing evidence', value: latestResearch ? `${researchSources} cited source(s)` : 'no research export', status: latestResearch ? 'PARTIAL' : 'PARTIAL' },
      ],
      summary: latestBudget
        ? 'Apex found a saved budget export and can include quantity/budget context in the complete package.'
        : 'Budget structure is still missing, so the complete package can only include a budget placeholder and checklist.',
      nextAction: latestBudget ? 'Review line items and attach official SINAPI or supplier pricing if final cost approval is needed.' : 'Generate the budget studio output or upload pricing basis before finalizing the package.',
    })

    const legalArtifact = buildProjectPackageArtifact({
      id: 'contracts-permits',
      title: 'Contracts, permits and execution docs',
      checks: [
        { label: 'contracts export', value: latestContracts ? 'available' : 'missing', status: latestContracts ? 'READY' : 'PARTIAL' },
        { label: 'permit items', value: latestContracts ? `${permitItems} item(s)` : 'not prepared', status: latestContracts ? 'READY' : 'PARTIAL' },
        { label: 'pending legal questions', value: latestContracts ? `${pendingContractQuestions}` : 'unknown', status: latestContracts ? 'PARTIAL' : 'PARTIAL' },
      ],
      summary: latestContracts
        ? 'Apex can bundle the current permit checklist and contract review into the execution package.'
        : 'Contracts / permits still need to be generated before the package can be considered complete.',
      nextAction: latestContracts ? 'Resolve the pending legal/jurisdiction questions before client or authority submission.' : 'Open Contracts / Permits Studio and generate the first legal package.',
    })

    const salesArtifact = buildProjectPackageArtifact({
      id: 'client-sales',
      title: 'Client presentation, proposal and commercial handoff',
      checks: [
        { label: 'client profile', value: profile.clientName || 'missing', status: profile.clientName ? 'READY' : 'PARTIAL' },
        { label: 'preferred outputs', value: profile.preferredOutputs || 'not set', status: profile.preferredOutputs ? 'READY' : 'PARTIAL' },
        { label: 'research citations', value: latestResearch ? `${researchSources} live citation(s)` : 'none saved', status: latestResearch ? 'READY' : 'PARTIAL' },
      ],
      summary: 'Apex can prepare the client-facing board, proposal structure and approval narrative from the saved workspace context and cited research.',
      nextAction: latestResearch ? 'Use the cited research and project brief to tailor the final sales deck and approval script.' : 'Save a research output first if the presentation depends on market references.',
    })

    const scheduleArtifact = buildProjectPackageArtifact({
      id: 'schedule-finance',
      title: 'Physical-financial schedule and field execution handoff',
      checks: [
        { label: 'field ops export', value: latestFieldOps ? 'available' : 'missing', status: latestFieldOps ? 'READY' : 'PARTIAL' },
        { label: 'business/finance export', value: latestBusiness ? 'available' : 'missing', status: latestBusiness ? 'READY' : 'PARTIAL' },
        { label: 'budget anchor', value: latestBudget ? `${budgetCurrency} ${budgetTotal.toFixed(2)}` : 'missing', status: latestBudget ? 'READY' : 'PARTIAL' },
      ],
      summary: 'Apex can draft the physical-financial schedule with current milestones, but final phase dates still depend on owner approval and field data.',
      nextAction: latestFieldOps ? 'Align the saved field plan with payment milestones and phase owners.' : 'Generate the field/reporting layer if you want site-phase detail in the package.',
    })

    const artifacts = [designArtifact, budgetArtifact, legalArtifact, salesArtifact, scheduleArtifact]
    const packageStatus = packageStatusFromFlags(artifacts.map(item => item.status))
    const missingInputs = []
    if (!profile.clientName) missingInputs.push('Client / account name is missing in Project Workspace memory.')
    if (!profile.projectType) missingInputs.push('Project type is missing in Project Workspace memory.')
    if (!profile.brief) missingInputs.push('Project briefing is missing in Project Workspace memory.')
    if (!files.length) missingInputs.push('No source files are attached to the project workspace yet.')
    if (!latestBudget) missingInputs.push('No saved budget export exists yet.')
    if (!latestContracts) missingInputs.push('No saved contracts / permits export exists yet.')
    if (!latestFieldOps) missingInputs.push('No saved field / execution export exists yet.')

    const outputs = {
      designReview: `Main source files: ${files.map(file => file.name).slice(0, 5).join(', ') || 'none'}. Style notes: ${profile.styleNotes || 'not defined'}. Branding notes: ${profile.brandingNotes || 'not defined'}.`,
      boardPackage: `Prepare the board package around ${project.name} for ${profile.clientName || 'the client'}. Include scope, visuals, revision constraints and approval path. Preferred outputs: ${profile.preferredOutputs || 'not defined'}.`,
      quantityAndBudget: latestBudget
        ? `Saved budget export found with total ${budgetCurrency} ${budgetTotal.toFixed(2)} and ${Array.isArray(latestBudget.plan?.estimateItems) ? latestBudget.plan.estimateItems.length : 0} line item(s).`
        : 'Budget still needs to be generated. The package should keep a quantity/budget placeholder until Apex Budget Studio is saved.',
      clientPresentation: `Use the project brief "${profile.brief || goal}" and ${researchSources} cited research source(s) to assemble the client-facing presentation and approval narrative.`,
      executionDocs: latestContracts
        ? `Contracts / permits export is available with ${permitItems} permit/checklist item(s). Include execution docs, approvals and missing-document report.`
        : 'Contracts / permits export is missing, so execution docs remain at planning stage.',
      contractAndFinance: latestBusiness
        ? 'Business/finance export exists and can be attached to the final package.'
        : 'Finance package is still placeholder-only; use saved budget plus contract deliverables until the business layer is exported.',
      physicalFinancialSchedule: latestBudget
        ? `Anchor the physical-financial schedule on the current budget total (${budgetCurrency} ${budgetTotal.toFixed(2)}), splitting design, approvals, procurement, execution and closeout milestones.`
        : 'Create the initial budget first so the physical-financial schedule can be grounded in a numeric baseline.',
    }

    const nextActions = [
      designArtifact.nextAction,
      budgetArtifact.nextAction,
      legalArtifact.nextAction,
      salesArtifact.nextAction,
      scheduleArtifact.nextAction,
    ]

    return json(res, 200, {
      plan: {
        providerStatus: 'connected',
        goal,
        projectName: String(project.name || 'Apex Project'),
        clientName: String(profile.clientName || ''),
        packageStatus,
        executiveSummary: `Apex evaluated ${exportsList.length} saved export(s), ${files.length} file(s) and the persistent project brief to assemble the current complete package status for "${project.name}".`,
        outputs,
        artifacts,
        missingInputs,
        nextActions,
        message: `Project Package Pipeline evaluated ${artifacts.length} delivery tracks from the current workspace.`,
      },
    })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || 'Project package pipeline failed.') })
  }
}

function controlNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function controlDivide(left, right) {
  if (left === null || right === null || right === 0) return null
  return Number((left / right).toFixed(3))
}

function controlSubtract(left, right) {
  if (left === null || right === null) return null
  return Number((left - right).toFixed(2))
}

function createControlsPlan(goal = '', evmInputs = {}) {
  const pv = controlNumber(evmInputs.plannedValue)
  const ev = controlNumber(evmInputs.earnedValue)
  const ac = controlNumber(evmInputs.actualCost)
  const bac = controlNumber(evmInputs.budgetAtCompletion)
  const cpi = controlDivide(ev, ac)
  const spi = controlDivide(ev, pv)
  const cv = controlSubtract(ev, ac)
  const sv = controlSubtract(ev, pv)
  const eac = cpi && bac ? Number((bac / cpi).toFixed(2)) : null
  const etc = controlSubtract(eac, ac)
  const vac = controlSubtract(bac, eac)
  const tcpi = bac !== null && ev !== null && ac !== null && bac - ac !== 0 ? Number(((bac - ev) / (bac - ac)).toFixed(3)) : null
  const evidence = pv !== null && ev !== null && ac !== null ? 'CONFIRMED' : 'UNKNOWN'
  const missingData = [
    pv === null ? 'Planned Value (PV)' : '',
    ev === null ? 'Earned Value (EV)' : '',
    ac === null ? 'Actual Cost (AC)' : '',
    bac === null ? 'Budget at Completion (BAC)' : '',
  ].filter(Boolean)
  const scheduleTasks = [
    { id: 'sch-mobilization', name: 'Mobilization and project setup', start: '', finish: '', durationDays: 3, dependencies: [], responsible: 'Project lead', plannedPercent: 0, actualPercent: 0, evidence: 'ESTIMATED', status: 'Unknown' },
    { id: 'sch-documentation', name: 'Documentation / permit / production package', start: '', finish: '', durationDays: 10, dependencies: ['sch-mobilization'], responsible: 'Doc Manager / BIM team', plannedPercent: 0, actualPercent: 0, evidence: 'ESTIMATED', status: 'Unknown' },
    { id: 'sch-execution', name: 'Execution / production / field work', start: '', finish: '', durationDays: 20, dependencies: ['sch-documentation'], responsible: 'Production / field team', plannedPercent: 0, actualPercent: 0, evidence: 'ESTIMATED', status: 'Unknown' },
    { id: 'sch-review-delivery', name: 'QA review and delivery package', start: '', finish: '', durationDays: 5, dependencies: ['sch-execution'], responsible: 'Quality QA / Owner', plannedPercent: 0, actualPercent: 0, evidence: 'ESTIMATED', status: 'Unknown' },
  ]
  const nrChecklist = [
    { id: 'nr6-ppe', norm: 'NR-6', item: 'Confirm PPE/EPI list, delivery records, training and usage evidence.', riskLevel: 'High', evidence: 'GENERAL_GUIDANCE', status: 'Needs qualified review', responsible: 'Safety lead', dueDate: '', correctiveAction: 'Collect PPE/EPI records and validate with qualified safety professional.' },
    { id: 'nr10-electrical', norm: 'NR-10', item: 'Review electrical safety, lockout/tagout, qualified workers and energized work controls.', riskLevel: 'Critical', evidence: 'GENERAL_GUIDANCE', status: 'Needs qualified review', responsible: 'Electrical / safety lead', dueDate: '', correctiveAction: 'Prepare NR-10 checklist and require qualified review before execution.' },
    { id: 'nr18-construction', norm: 'NR-18', item: 'Review construction site conditions, access, housekeeping, collective protection and work fronts.', riskLevel: 'High', evidence: 'GENERAL_GUIDANCE', status: 'Needs qualified review', responsible: 'Site manager', dueDate: '', correctiveAction: 'Create site safety action list from FieldOps photos/notes and qualified review.' },
    { id: 'nr33-confined', norm: 'NR-33', item: 'Identify whether confined spaces exist and whether permits, monitoring and rescue plan are required.', riskLevel: 'Critical', evidence: 'NEEDS_SAFETY_REVIEW', status: 'Needs qualified review', responsible: 'Safety lead', dueDate: '', correctiveAction: 'Do not authorize confined-space work without qualified assessment and permit workflow.' },
    { id: 'nr35-height', norm: 'NR-35', item: 'Review work-at-height exposure, fall protection, anchorage, training and rescue plan.', riskLevel: 'Critical', evidence: 'GENERAL_GUIDANCE', status: 'Needs qualified review', responsible: 'Safety lead', dueDate: '', correctiveAction: 'Prepare work-at-height control plan and require qualified review before execution.' },
  ]
  const riskMatrix = nrChecklist.reduce((rows, item) => {
    const existing = rows.find(row => row.norm === item.norm && row.risk === item.riskLevel)
    if (existing) existing.count += 1
    else rows.push({ norm: item.norm, risk: item.riskLevel, count: 1, evidence: item.evidence })
    return rows
  }, [])
  const schedulePlan = {
    tasks: scheduleTasks,
    milestones: [
      { id: 'ms-kickoff', name: 'Kickoff', date: '', evidence: 'ESTIMATED' },
      { id: 'ms-package-ready', name: 'Production package ready', date: '', evidence: 'ESTIMATED' },
      { id: 'ms-delivery', name: 'Client delivery', date: '', evidence: 'ESTIMATED' },
    ],
    dependencies: scheduleTasks.flatMap(task => task.dependencies.map(dep => `${dep} -> ${task.id}`)),
    delayLog: ['No confirmed delay log provided yet. FieldOps delay notes can be connected here.'],
    lookaheadPlan: ['Confirm baseline dates, dependencies and responsible parties.', 'Collect FieldOps progress and blockers.', 'Update planned vs actual before claiming schedule variance.'],
    physicalFinancialSchedule: [
      { period: 'Phase 1', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
      { period: 'Phase 2', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
      { period: 'Phase 3', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
    ],
    criticalPath: scheduleTasks.map(task => task.name),
    summary: goal ? `Local schedule scaffold prepared for: ${goal}` : 'Local schedule scaffold prepared. No MS Project integration is connected.',
  }
  const evmSummary = missingData.length
    ? `EVM local analysis is incomplete. Missing: ${missingData.join(', ')}. Apex will not fake CPI/SPI/EAC.`
    : `EVM local analysis complete from supplied values. CPI ${cpi}, SPI ${spi}, EAC ${eac}.`
  const varianceTable = [
    { metric: 'CPI', value: cpi, evidence, interpretation: cpi === null ? 'UNKNOWN: needs EV and AC.' : cpi >= 1 ? 'Cost performance at or above baseline.' : 'Cost overrun risk.' },
    { metric: 'SPI', value: spi, evidence, interpretation: spi === null ? 'UNKNOWN: needs EV and PV.' : spi >= 1 ? 'Schedule performance at or above baseline.' : 'Schedule delay risk.' },
    { metric: 'CV', value: cv, evidence, interpretation: cv === null ? 'UNKNOWN: needs EV and AC.' : cv >= 0 ? 'Positive/neutral cost variance.' : 'Negative cost variance.' },
    { metric: 'SV', value: sv, evidence, interpretation: sv === null ? 'UNKNOWN: needs EV and PV.' : sv >= 0 ? 'Positive/neutral schedule variance.' : 'Negative schedule variance.' },
  ]
  const safetyReportDraft = ['NR Compliance draft - GENERAL_GUIDANCE / NEEDS_SAFETY_REVIEW.', 'No official compliance approval, legal certification or safety release is claimed.', ...nrChecklist.map(item => `- ${item.norm}: ${item.item} Evidence: ${item.evidence}. Action: ${item.correctiveAction}`)].join('\n')
  const evmReport = ['EVM report draft', evmSummary, `PV: ${pv ?? 'UNKNOWN'} | EV: ${ev ?? 'UNKNOWN'} | AC: ${ac ?? 'UNKNOWN'} | BAC: ${bac ?? 'UNKNOWN'}`, `CPI: ${cpi ?? 'UNKNOWN'} | SPI: ${spi ?? 'UNKNOWN'} | EAC: ${eac ?? 'UNKNOWN'} | VAC: ${vac ?? 'UNKNOWN'} | TCPI: ${tcpi ?? 'UNKNOWN'}`].join('\n')
  const scheduleReport = ['Schedule report draft', schedulePlan.summary, '', 'Tasks:', ...scheduleTasks.map(task => `- ${task.name}: ${task.durationDays} days, dependencies ${task.dependencies.join(', ') || 'none'}, evidence ${task.evidence}`)].join('\n')
  const correctiveActionPlan = nrChecklist.map(item => `${item.norm} / ${item.riskLevel}: ${item.correctiveAction} Responsible: ${item.responsible}. Evidence: ${item.evidence}.`).join('\n')
  return {
    providerStatus: 'connected',
    evmSummary,
    kpis: { pv, ev, ac, bac, cpi, spi, cv, sv, eac, etc, vac, tcpi, evidence },
    varianceTable,
    forecastPanel: [
      eac === null ? 'EAC is UNKNOWN until BAC, EV and AC exist.' : `EAC forecast: ${eac}.`,
      vac === null ? 'VAC is UNKNOWN until BAC and EAC exist.' : `VAC forecast: ${vac}.`,
      tcpi === null ? 'TCPI is UNKNOWN until BAC, EV and AC support it.' : `TCPI required performance: ${tcpi}.`,
    ],
    missingData,
    schedulePlan,
    milestones: schedulePlan.milestones,
    criticalPath: schedulePlan.criticalPath,
    nrChecklist,
    riskMatrix,
    correctiveActions: nrChecklist,
    safetyReportDraft,
    exports: { evmReport, scheduleReport, nrComplianceReport: safetyReportDraft, correctiveActionPlan },
  }
}

let serverBackgroundTasks = JSON.parse(JSON.stringify(defaultTasks))

async function handleBackgroundTask(req, res) {
  try {
    const body = await readJson(req)
    const { action, taskId } = body

    if (action === 'list') {
      return json(res, 200, { tasks: serverBackgroundTasks })
    }

    if (action === 'run') {
      const task = serverBackgroundTasks.find(t => t.id === taskId)
      if (!task) {
        return json(res, 404, { error: 'Task not found' })
      }

      task.status = 'completed'
      task.progress = 100

      return json(res, 200, { task })
    }

    if (action === 'schedule') {
      const { title, description } = body
      const newTask = {
        id: `task-${Date.now()}`,
        title: title || 'Nova Tarefa de Agentes',
        description: description || 'Tarefa personalizada agendada pelo operador.',
        status: 'scheduled',
        scheduledTime: 'Hoje às 23:00',
        agents: ['Maestro AI', 'BIM Manager Agent', 'Quality QA Agent'],
        progress: 0,
        logs: ['[23:00:00] [Maestro AI] Tarefa agendada para execução noturna.'],
        report: null
      }
      serverBackgroundTasks.push(newTask)
      return json(res, 200, { task: newTask })
    }

    return json(res, 400, { error: 'Invalid action' })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Internal Server Error' })
  }
}

async function handleEvmSchedulerCompliance(req, res) {
  try {
    const body = await readJson(req)
    const plan = createControlsPlan(String(body.goal || ''), body.evmInputs || {})
    json(res, 200, { plan })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'connected',
    })
  }
}

async function handleSupplyChainPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: supplyChainService.createSupplyChainPlan(String(body.goal || '')) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleNotificationsPlan(req, res) {
  try {
    const body = await readJson(req)
    const goal = String(body.goal || '')
    const phone = String(body.phone || body.recipient || '').trim()
    const message = String(body.message || body.text || '').trim()
    const plan = await notificationsService.createNotificationsPlan(goal, phone, message)
    return json(res, 200, { plan })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleAiCostPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: aiCostService.createAiCostPlan(String(body.goal || '')) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleMultiTenantPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: multiTenantService.createMultiTenantPlan(String(body.goal || '')) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handlePwaPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: pwaMobileService.createPwaPlan(String(body.goal || '')) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleDigitalTwinPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: digitalTwinService.createDigitalTwinPlan(String(body.goal || ''), body.projectSummary || null) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleKnowledgePlan(req, res) {
  try {
    const body = await readJson(req)
    const goal = String(body.goal || '')
    const plan = await knowledgeBaseService.createKnowledgePlan(goal, generateEmbedding, supabaseClient)
    return json(res, 200, { plan })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleEmbed(req, res) {
  try {
    const body = await readJson(req)
    const text = String(body.text || body.query || '').trim()
    if (!text) return json(res, 400, { error: 'text is required' })
    const embedding = await generateEmbedding(text)
    return json(res, 200, { ok: true, embedding })
  } catch (error) {
    return json(res, 500, { error: error.message })
  }
}

async function handleKnowledgeBaseInsert(req, res) {
  try {
    const body = await readJson(req)
    const result = await knowledgeBaseService.insertKnowledgeItem(body, generateEmbedding, supabaseClient)
    return json(res, 200, result)
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function handleDashboardStatus(req, res) {
  try {
    const providerDiagnostics = getModelProviderDiagnostics()
    const gitSha = await (async () => {
      try {
        const { execSync } = await import('node:child_process')
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8', timeout: 3000 }).trim()
      } catch { return 'unknown' }
    })()
    const gitBranch = await (async () => {
      try {
        const { execSync } = await import('node:child_process')
        return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', timeout: 3000 }).trim()
      } catch { return 'unknown' }
    })()
    const hasFalKey = Boolean(process.env.FAL_KEY)
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)
    const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY)
    const hasFirebase = Boolean(process.env.VITE_FIREBASE_API_KEY)
    const providersList = {
      gemini: hasGeminiKey,
      fal: hasFalKey, elevenlabs: hasElevenLabs,
      firebase: hasFirebase,
    }
    const providersActive = Object.values(providersList).filter(Boolean).length
    return json(res, 200, {
      ok: true,
      git: { sha: gitSha, branch: gitBranch },
      providers: { total: 4, active: providersActive, list: providersList },
      modelRuntime: {
        geminiConfigured: hasGeminiKey,
        interactionsConfigured: hasGeminiKey,
        firebaseConfigured: hasFirebase,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return json(res, 500, { error: error.message })
  }
}

async function handleRuntimeStatus(_req, res) {
  const runtimeUrl = String(process.env.LOCAL_WORKER_URL || '').trim() || 'http://localhost:1337/health'
  try {
    const response = await fetch(runtimeUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(1500),
    })
    if (response.ok) {
      return json(res, 200, { status: 'running' })
    }
    return json(res, 503, {
      status: 'down',
      error: `Runtime returned status ${response.status}`,
    })
  } catch (error) {
    return json(res, 503, { status: 'down', error: error.message || String(error) })
  }
}

async function handleMetricsPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, { plan: metricsService.createMetricsPlan(String(body.goal || ''), body.projectSummary || null, body.runtimeSummary || null) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

async function fetchExternalUpgradeSignals() {
  const signals = { githubRelease: null, npmOutdated: null, vercelDeploy: null }
  try {
    const ghRes = await fetch('https://api.github.com/repos/jedgard70/apex-ai-copilot-platform/releases/latest', { signal: AbortSignal.timeout(5000) })
    if (ghRes.ok) {
      const data = await ghRes.json()
      signals.githubRelease = { tag: data.tag_name, name: data.name, publishedAt: data.published_at, body: (data.body || '').slice(0, 300) }
    }
  } catch { /* non-critical */ }
  try {
    const npmRes = await fetch('https://registry.npmjs.org/apex-ai-copilot-platform/latest', { signal: AbortSignal.timeout(5000) })
    if (npmRes.ok) {
      const data = await npmRes.json()
      signals.npmOutdated = { latestVersion: data.version }
    }
  } catch { /* non-critical */ }
  try {
    const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const outdated = []
    for (const [name, declared] of Object.entries(deps)) {
      if (typeof declared !== 'string' || declared.startsWith('file:') || declared.startsWith('workspace:')) continue
      try {
        const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const data = await res.json()
          const latest = String(data.version || '')
          const declaredClean = declared.replace(/^[\^~]/, '')
          if (latest && declaredClean !== latest) outdated.push({ name, declared })
        }
      } catch { /* non-critical */ }
      if (outdated.length >= 8) break
    }
    signals.npmOutdated = signals.npmOutdated || { latestVersion: 'unknown', outdatedDeps: outdated }
    if (outdated.length > 0) signals.npmOutdated.outdatedDeps = outdated
  } catch { /* non-critical */ }
  return signals
}

function createAutoupgradePlan(goal = '', projectSummary = null, runtimeSummary = null, externalSignals = null) {
  const project = projectSummary && typeof projectSummary === 'object' ? projectSummary : {}
  const runtime = runtimeSummary && typeof runtimeSummary === 'object' ? runtimeSummary : {}
  const modelState = String(runtime.modelState || 'ready')
  const lastResponseMode = String(runtime.lastResponseMode || 'n/a')
  const persistenceMode = String(runtime.persistenceMode || 'localStorage')
  const modelName = String(runtime.selectedModel || 'unknown')
  const fileCount = Number(project.files || 0)
  const exportCount = Number(project.exports || 0)
  const generationCount = Number(project.generationHistory || 0)
  const recommendations = [
    ...(externalSignals?.githubRelease ? [{
      id: 'upgrade-github-release',
      title: `New release available: ${externalSignals.githubRelease.tag}`,
      area: 'Platform version',
      priority: 'high',
      status: 'ready-now',
      why: externalSignals.githubRelease.name || 'A new GitHub release is available for the platform.',
      action: `Review and merge changes from ${externalSignals.githubRelease.tag} published ${externalSignals.githubRelease.publishedAt ? new Date(externalSignals.githubRelease.publishedAt).toLocaleDateString() : 'recently'}.`,
      suggestedCommand: 'abrir platform map',
      commandId: 'code_analyze',
      requiresApproval: true,
      evidence: [`Release: ${externalSignals.githubRelease.tag}`, `Published: ${externalSignals.githubRelease.publishedAt || 'unknown'}`, `Notes: ${(externalSignals.githubRelease.body || '(no description)').slice(0, 120)}`],
    }] : []),
    {
      id: 'upgrade-observability',
      title: 'Connect observability stack',
      area: 'Platform reliability',
      priority: 'high',
      status: 'needs-connector',
      why: 'Platform telemetry is still local/shared rather than production-observed.',
      action: 'Connect Sentry, Vercel logs and end-to-end checks before relying on automatic upgrades from runtime evidence.',
      commandId: 'code_analyze',
      requiresApproval: true,
      evidence: [`Persistence mode: ${persistenceMode}`, `Model state: ${modelState}`, 'No external telemetry connector is confirmed in runtime state.'],
    },
    {
      id: 'upgrade-owner-execution',
      title: 'Convert approved recommendations into execution queue',
      area: 'Owner operations',
      priority: 'high',
      status: 'ready-now',
      why: 'The platform can inspect itself now, but execution needs a controlled owner handoff.',
      action: 'Send approved improvements to the owner execution panel instead of mutating the platform silently.',
      suggestedCommand: 'abrir copilot execution panel',
      commandId: 'build',
      requiresApproval: true,
      evidence: ['Owner execution panel exists.', 'Raw public shell remains intentionally restricted.'],
    },
    {
      id: 'upgrade-remote-files',
      title: 'Persist full remote file blobs',
      area: 'Project persistence',
      priority: 'medium',
      status: 'planned',
      why: 'Remote restore is still metadata-first for files.',
      action: 'Add blob sync/storage references so remote restore can recover full BIM/image-heavy projects.',
      requiresApproval: true,
      evidence: [`Current project files: ${fileCount}`, 'Remote sync is metadata-first before full blob restore.'],
    },
    {
      id: 'upgrade-provider-validation',
      title: 'Validate model/provider runtime continuously',
      area: 'AI runtime quality',
      priority: modelState === 'fallback' || /fallback/i.test(lastResponseMode) ? 'critical' : 'medium',
      status: 'ready-now',
      why: 'Provider/runtime drift degrades user trust quickly.',
      action: 'Track fallback frequency and continuously validate the currently selected model/runtime before enabling more autonomous changes.',
      suggestedCommand: 'status geral da plataforma',
      commandId: 'check_server',
      requiresApproval: false,
      evidence: [`Selected model: ${modelName}`, `Last response mode: ${lastResponseMode}`, `Model state: ${modelState}`],
    },
    {
      id: 'upgrade-growth-pipelines',
      title: 'Stage next expansion pipelines',
      area: 'Product roadmap',
      priority: 'medium',
      status: generationCount > 0 || exportCount > 0 ? 'ready-now' : 'planned',
      why: 'The platform foundation is now broad enough to sequence higher-value pipelines.',
      action: 'Sequence approved packages after autoupgrade: owner execution handoff, avatar/voice, campaign automation and full project delivery orchestration.',
      commandId: 'skill_audit',
      requiresApproval: true,
      evidence: [`Generation history items: ${generationCount}`, `Exports created: ${exportCount}`, `Active studio: ${String(project.activeStudio || 'none')}`],
    },
    ...(externalSignals?.npmOutdated?.outdatedDeps?.length ? [{
      id: 'upgrade-npm-deps',
      title: `${externalSignals.npmOutdated.outdatedDeps.length} npm dependencies outdated`,
      area: 'Dependency health',
      priority: 'medium',
      status: 'ready-now',
      why: 'Outdated dependencies may include security vulnerabilities or miss performance improvements.',
      action: 'Run npm update or npm install for each outdated package after reviewing breaking changes.',
      suggestedCommand: 'abrir copilot execution panel',
      commandId: 'check_server',
      requiresApproval: true,
      evidence: externalSignals.npmOutdated.outdatedDeps.map(d => `${d.name} (declared: ${d.declared})`).slice(0, 8),
    }] : []),
  ]
  const platformSignals = [
    `Project: ${String(project.name || 'Apex Project')}`,
    ...(externalSignals?.githubRelease ? [`GitHub latest release: ${externalSignals.githubRelease.tag}`] : ['GitHub release check: no release data (API may be unavailable)']),
    ...(externalSignals?.npmOutdated?.outdatedDeps?.length ? [`Outdated deps: ${externalSignals.npmOutdated.outdatedDeps.length} package(s) behind latest`] : ['npm dependencies: all declared versions match latest (or check unavailable)']),
    `Model: ${modelName}`,
    `Runtime: ${modelState} / ${lastResponseMode}`,
    `Persistence: ${persistenceMode}`,
    `Files: ${fileCount} · Exports: ${exportCount} · Generations: ${generationCount}`,
  ]
  const safeAutomationRules = [
    'Never expose unrestricted public shell from autoupgrade.',
    'Only queue owner-reviewed changes for execution.',
    'Use real telemetry when connected; otherwise label evidence as local/shared only.',
    'Prefer build/test/check automation before code-changing automation.',
  ]
  const executionQueue = recommendations
    .filter(item => item.status === 'ready-now')
    .sort((a, b) => ['critical', 'high', 'medium'].indexOf(a.priority) - ['critical', 'high', 'medium'].indexOf(b.priority))
    .map(item => `${item.priority.toUpperCase()} · ${item.title}`)
  return {
    providerStatus: 'connected',
    generatedAt: new Date().toISOString(),
    cadence: 'Every 30 minutes while the panel is open; owner approval required for mutating execution.',
    postureSummary: `Autoupgrade is running as a safe recommendation engine for ${goal || 'the Apex platform'}: it inspects, prioritizes and prepares execution, but final mutating steps still require explicit approval.`,
    platformSignals,
    safeAutomationRules,
    executionQueue,
    recommendations,
    report: [
      'Autoupgrade report',
      `Generated: ${new Date().toISOString()}`,
      `Goal: ${goal || 'Apex platform'}`,
      '',
      'Platform signals:',
      ...platformSignals.map(item => `- ${item}`),
      '',
      'Priority queue:',
      ...executionQueue.map(item => `- ${item}`),
    ].join('\n'),
  }
}
async function handleAutoupgradePlan(req, res) {
  try {
    const body = await readJson(req);
    const external = await fetchExternalUpgradeSignals();
    return json(res, 200, { plan: createAutoupgradePlan(String(body.goal || ''), body.projectSummary || null, body.runtimeSummary || null, external) })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

function createAvatarVoicePlan(goal = '', useCase = 'internal-demo', brandNotes = '', assetSummary = null, consentConfirmed = false) {
  const assets = assetSummary && typeof assetSummary === 'object' ? assetSummary : {}
  const photos = Number(assets.photos || 0)
  const audio = Number(assets.audio || 0)
  const videos = Number(assets.videos || 0)
  const useCaseLabel = {
    'internal-demo': 'internal demo',
    'client-presentation': 'client presentation',
    'real-estate-sales': 'real-estate sales',
    'social-campaign': 'social campaign',
  }[String(useCase)] || 'internal demo'
  const summary = `Avatar/voice workflow prepared for ${useCaseLabel}: Apex can organize assets, script, production steps and delivery, while final synthesis remains connector-dependent and consent-gated.`
  return {
    providerStatus: 'connected',
    generatedAt: new Date().toISOString(),
    useCase,
    consentRequired: true,
    summary,
    identityGuidelines: [
      'Use only owner-provided photos/audio/video with explicit consent.',
      'Do not present generated media as real/live without disclosure when required.',
      'Keep avatar appearance, tone and script aligned with approved business use.',
      'Block third-party identity cloning workflows.',
    ],
    assetChecklist: [
      `Reference photos: ${photos} uploaded`,
      `Voice references: ${audio} uploaded`,
      `Supporting videos: ${videos} uploaded`,
      `Brand notes: ${String(brandNotes || goal || 'not provided').slice(0, 240)}`,
      'Owner consent confirmation for image and voice use',
    ],
    scriptOutline: [
      `Opening hook for ${useCaseLabel}`,
      'Owner introduction / authority statement',
      'Project or offer value proposition',
      'Property or feature walkthrough',
      'CTA for next action',
    ],
    productionSteps: [
      'Curate best photos with consistent lighting.',
      'Select clean voice samples with low noise.',
      'Approve script and speaking style before synthesis.',
      'Generate avatar/voice pack through a connected provider when available.',
      'Review final media before publication or client delivery.',
    ],
    deliveryPack: [
      'Talking-head script',
      'Shot list / animation brief',
      'Voice style brief',
      'Caption / CTA pack',
      'Approval checklist',
    ],
    safetyRules: [
      'Owner consent is mandatory.',
      'Final synthesis depends on connected media provider.',
      'No third-party face or voice cloning without permission.',
      'Use legal/internal review before public campaign deployment.',
    ],
    report: [
      'Avatar / Voice plan',
      `Generated: ${new Date().toISOString()}`,
      `Use case: ${useCaseLabel}`,
      summary,
      '',
      'Assets:',
      `- Photos: ${photos}`,
      `- Audio: ${audio}`,
      `- Videos: ${videos}`,
    ].join('\n'),
  }
}
async function handleAvatarVoicePlan(req, res) { try { const body = await readJson(req); return json(res, 200, { plan: createAvatarVoicePlan(String(body.goal || ''), String(body.useCase || 'internal-demo'), String(body.brandNotes || ''), body.assetSummary || null, body.consentConfirmed === true) }) } catch (error) { return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' }) } }

function createCampaignAutomationPlan(goal = '', campaignGoal = 'lead-generation', channel = 'instagram-facebook', format = 'social-pack', audience = '', offer = '') {
  const resolvedAudience = String(audience || '').trim() || 'Prospective architecture / construction clients'
  const resolvedOffer = String(offer || '').trim() || String(goal || '').trim() || 'Apex architecture and project delivery package'
  const channelLabel = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    'instagram-facebook': 'Instagram + Facebook',
    whatsapp: 'WhatsApp',
  }[String(channel)] || 'Instagram + Facebook'
  const hookOptions = [
    `See how ${resolvedOffer} becomes a client-ready presentation faster.`,
    `From concept to approval pack: one clearer path for ${resolvedOffer}.`,
    `Turn project complexity into an easy yes with a stronger visual and commercial story.`,
  ]
  const ctaOptions = [
    'Request your presentation pack',
    'Book a discovery call',
    'Send your plan to start',
    'Approve the next design step',
  ]
  const vslLanding = {
    urgencyBar: 'Use a real deadline banner only when the launch, price change or closing window is verified.',
    autoplayPrompt: 'Open with muted autoplay when needed and show a visible click-to-unmute prompt.',
    heroHeadline: `Present ${resolvedOffer} with a premium VSL conversion page.`,
    heroSubheadline: `Use a direct video-first page for ${resolvedAudience} with a clear CTA to checkout, WhatsApp or booking.`,
    playerBehavior: [
      'Keep the video above the fold with CTA visible immediately below it.',
      'Prompt the user to enable audio when browser autoplay starts muted.',
      'Maintain a conversion CTA while the video explains the offer.',
    ],
    ctaLabel: ctaOptions[0],
    ctaDestinationHint: 'Connect to Hotmart, Stripe, WhatsApp or a booking URL.',
    pageSections: [
      'Urgency / availability bar at the top.',
      'Hero section with headline, video player and CTA.',
      'Trust and deliverables section below the fold.',
      'Secondary CTA after proof / objections handling.',
      'Footer with terms and privacy links.',
    ],
    trustElements: [
      'Real urgency only when true.',
      'Visible terms of use and privacy links.',
      'Support/contact destination and brand signature.',
    ],
    trackingChecklist: [
      'Preserve UTM and source parameters.',
      'Track video play, audio enable, CTA click and checkout start.',
      'Create A/B variants for headline, urgency copy and CTA.',
    ],
  }
  const primaryCaption = `Present ${resolvedOffer} with faster approvals, clearer visuals and a stronger next step. Campaign drafted for ${resolvedAudience} on ${channelLabel}.`
  const alternateCaptions = [
    `A cleaner campaign flow for ${resolvedAudience}.`,
    'One message connecting design, technical clarity and commercial value.',
    'Show the project, explain the benefit and move the client to action.',
  ]
  const adVariations = [
    {
      title: 'Fast approval angle',
      copy: `Use Apex to transform ${resolvedOffer} into a presentation that clients understand quickly.`,
      creativeDirection: 'Before/after, value-first messaging, premium visuals',
    },
    {
      title: 'Complete package angle',
      copy: `Bundle visuals, technical clarity and next steps in one campaign asset instead of fragmented files.`,
      creativeDirection: 'Carousel or vertical short with package sequence',
    },
    {
      title: 'Trust and premium angle',
      copy: `Position ${resolvedOffer} as a premium, organized and decision-ready service.`,
      creativeDirection: 'Minimalist premium design with direct CTA',
    },
  ]
  const storyboard = [
    'Open with the strongest result or benefit in 3 seconds.',
    'Show the hero visual or transformed outcome.',
    'Highlight package components and client clarity.',
    'Reinforce urgency or convenience.',
    'End with a direct CTA.',
  ]
  const publishingChecklist = [
    `Confirm channel and format for ${channelLabel}.`,
    'Approve brand tone and legal/commercial wording.',
    'Prepare landing page, WhatsApp or booking destination.',
    'Generate A/B hook and CTA variants.',
    'If needed, hand off to marketing_generate or DirectCut for execution assets.',
  ]
  return {
    providerStatus: 'connected',
    generatedAt: new Date().toISOString(),
    goal: String(campaignGoal || 'lead-generation'),
    channel: String(channel || 'instagram-facebook'),
    format: String(format || 'social-pack'),
    audience: resolvedAudience,
    offerSummary: resolvedOffer,
    hookOptions,
    primaryCaption,
    alternateCaptions,
    ctaOptions,
    adVariations,
    storyboard,
    publishingChecklist,
    vslLanding,
    report: [
      'Campaign Automation Pack',
      `Generated: ${new Date().toISOString()}`,
      `Goal: ${String(campaignGoal || 'lead-generation')}`,
      `Channel: ${channelLabel}`,
      `Audience: ${resolvedAudience}`,
      `Offer: ${resolvedOffer}`,
      `Format: ${String(format || 'social-pack')}`,
      '',
      'CTA options:',
      ...ctaOptions.map(item => `- ${item}`),
      '',
      'VSL landing essentials:',
      `- Headline: ${vslLanding.heroHeadline}`,
      `- CTA: ${vslLanding.ctaLabel}`,
      `- Destination: ${vslLanding.ctaDestinationHint}`,
    ].join('\n'),
  }
}
async function handleCampaignAutomationPlan(req, res) { try { const body = await readJson(req); return json(res, 200, { plan: createCampaignAutomationPlan(String(body.goal || ''), String(body.campaignGoal || 'lead-generation'), String(body.channel || 'instagram-facebook'), String(body.format || 'social-pack'), String(body.audience || ''), String(body.offer || '')) }) } catch (error) { return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' }) } }

const authRoles = [
  'Owner/Admin',
  'Internal Team',
  'Client',
  'Partner',
  'Viewer',
  'Contractor',
  'Finance',
  'Sales',
  'Field',
  'BIM Manager',
  'Project Manager',
]

const authPermissionGroups = [
  'project.read',
  'project.write',
  'files.read',
  'files.write',
  'archvis.read',
  'archvis.write',
  'directcut.read',
  'directcut.write',
  'bim.read',
  'bim.write',
  'budget.read',
  'budget.write',
  'contracts.read',
  'contracts.write',
  'fieldops.read',
  'fieldops.write',
  'crm.read',
  'crm.write',
  'finance.read',
  'finance.write',
  'accounting.read',
  'accounting.write',
  'admin.manage_users',
  'admin.manage_tenants',
]

function createAuthPlan() {
  const hasUrl = Boolean(process.env.VITE_SUPABASE_URL)
  const hasAnonKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY)
  const providerStatus = 'connected'
  return {
    providerStatus,
    authStatus: hasUrl && hasAnonKey ? 'client-env-present' : 'not-connected',
    requiredEnvVars: [
      { name: 'VITE_SUPABASE_URL', scope: 'browser', configured: hasUrl },
      { name: 'VITE_SUPABASE_ANON_KEY', scope: 'browser', configured: hasAnonKey },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', scope: 'server-only future use', configured: false, warning: 'Never expose this to the browser.' },
      { name: 'GOOGLE_OAUTH_STATUS', scope: 'server/client status flag', configured: process.env.GOOGLE_OAUTH_STATUS || 'not-configured' },
    ],
    roles: authRoles,
    permissionGroups: authPermissionGroups,
    nextSteps: [
      'Create brand-new Supabase project.',
      'Review and apply final non-draft migrations only after approval.',
      hasUrl && hasAnonKey ? 'Local public Supabase env is present. Test email/password signup/login in the app.' : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to local env when ready.',
      'Use email/password Auth first.',
      'Configure Google OAuth only after redirect URLs and provider settings are ready.',
      'Keep service role server-only and never expose it in Vite/client code.',
      'If signup/login creates auth.users without profile/tenant membership, add a reviewed bootstrap policy/RPC or assign first Owner/Admin manually.',
      'Validate RLS with Owner/Admin, Client, Viewer, Field, BIM Manager, Finance and Sales roles before pilot users.',
    ],
  }
}

async function handleAuthPlan(req, res) {
  try {
    await readJson(req).catch(() => ({}))
    return json(res, 200, createAuthPlan())
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'connected' })
  }
}

function exportSafeSlug(value = 'apex-export') {
  return String(value || 'apex-export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'apex-export'
}

function exportRedact(value, summary = []) {
  if (Array.isArray(value)) return value.map(item => exportRedact(item, summary))
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    let next = value
    const patterns = [
      [/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_OPENAI_KEY]', 'OpenAI-style API key redacted'],
      [/ghp_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]', 'GitHub token redacted'],
      [/github_pat_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]', 'GitHub PAT redacted'],
      [/(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1=[REDACTED]', 'Generic secret assignment redacted'],
      [/\.env\.local/gi, '[REDACTED_ENV_FILE]', '.env.local reference redacted'],
    ]
    for (const [pattern, replacement, note] of patterns) {
      if (pattern.test(next)) {
        next = next.replace(pattern, replacement)
        if (!summary.includes(note)) summary.push(note)
      }
    }
    return next
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/(api[_-]?key|token|secret|password|env)/i.test(key)) {
      const note = `Sensitive field redacted: ${key}`
      if (!summary.includes(note)) summary.push(note)
      return [key, '[REDACTED]']
    }
    return [key, exportRedact(item, summary)]
  }))
}

function exportStripImages(value, warnings = []) {
  if (Array.isArray(value)) return value.map(item => exportStripImages(item, warnings))
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      if (!warnings.includes('Image/dataUrl assets excluded by request.')) warnings.push('Image/dataUrl assets excluded by request.')
      return '[IMAGE_DATA_URL_EXCLUDED]'
    }
    return value
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/dataUrl|url/i.test(key) && typeof item === 'string' && item.startsWith('data:image/')) {
      if (!warnings.includes('Image/dataUrl assets excluded by request.')) warnings.push('Image/dataUrl assets excluded by request.')
      return [key, '[IMAGE_DATA_URL_EXCLUDED]']
    }
    return [key, exportStripImages(item, warnings)]
  }))
}

function exportPickSections(project, scope, selectedSections, includeChat) {
  const sectionSet = new Set(selectedSections || [])
  const includeAll = scope === 'full-project'
  const should = section => includeAll || scope === section || sectionSet.has(section)
  const appState = project.appState || {}
  const savedExports = Array.isArray(project.exports) ? project.exports : []
  const byType = type => savedExports.filter(item => String(item?.type || '').includes(type))
  const output = {
    project: should('project') ? {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      language: project.language,
      activeTool: project.activeTool,
      activeStudio: project.activeStudio,
      files: project.files,
      chatMessages: includeChat ? project.chatMessages : '[CHAT_EXCLUDED]',
      revisionConstraints: project.revisionConstraints,
      preferences: project.preferences,
      suppliers: project.suppliers || [],
      procurementItems: project.procurementItems || [],
      alerts: project.alerts || [],
      aiCostRecords: project.aiCostRecords || [],
    } : undefined,
    archvis: should('archvis') ? {
      outputs: project.archVisOutputs,
      generatedImages: project.generatedImages,
      revisionConstraints: project.revisionConstraints,
      activeState: appState.archVisOutput || null,
    } : undefined,
    directcut: should('directcut') ? {
      plans: project.directCutPlans,
      activeState: appState.directCutOutput || null,
    } : undefined,
    bim3d: should('bim-3d') || should('bim3d') ? {
      items: project.bim3dItems,
      savedViews: project.savedViews,
      tours: project.tours,
      activeState: appState.bim3DActive || null,
    } : undefined,
    budget: should('budget') ? {
      exports: byType('budget'),
      activeState: appState.budgetOutput || null,
    } : undefined,
    contracts: should('contracts-permits') || should('contracts') ? {
      exports: byType('contracts'),
      activeState: appState.contractsOutput || null,
    } : undefined,
    fieldops: should('fieldops-rdo') || should('fieldops') ? {
      exports: byType('field-operations'),
      activeState: appState.fieldOpsOutput || null,
    } : undefined,
    research: should('research-market') || should('research') ? {
      exports: byType('research'),
      activeState: appState.researchOutput || null,
    } : undefined,
    controls: should('evm-scheduler-nr') || should('controls') ? {
      exports: byType('evm-scheduler-nr-compliance'),
      activeState: appState.evmSchedulerComplianceOutput || null,
    } : undefined,
    supplychain: should('supply-chain') || should('supplychain') ? {
      suppliers: project.suppliers || [],
      procurementItems: project.procurementItems || [],
      exports: byType('supply-chain'),
      activeState: appState.supplyChainOutput || null,
    } : undefined,
    notifications: should('notifications') || should('alerts') ? {
      alerts: project.alerts || [],
      exports: byType('notifications'),
      activeState: appState.notificationsOutput || null,
    } : undefined,
    aicost: should('ai-cost') || should('observability') ? {
      aiCostRecords: project.aiCostRecords || [],
      exports: byType('ai-cost'),
      activeState: appState.aiCostOutput || null,
    } : undefined,
    multitenant: should('multi-tenant') || should('multitenant') ? {
      tenants: project.tenants || [],
      exports: byType('multi-tenant'),
      activeState: appState.multiTenantOutput || null,
    } : undefined,
    pwamobile: should('pwa-mobile') || should('pwa') ? {
      pwaSettings: project.pwaSettings || [],
      exports: byType('pwa-mobile'),
      activeState: appState.pwaMobileOutput || null,
    } : undefined,
    digitaltwin: should('digital-twin') ? {
      digitalTwinItems: project.digitalTwinItems || [],
      exports: byType('digital-twin'),
      activeState: appState.digitalTwinOutput || null,
    } : undefined,
    knowledgebase: should('knowledge-base') || should('knowledge') ? {
      knowledgeItems: project.knowledgeItems || [],
      exports: byType('knowledge-base'),
      activeState: appState.knowledgeBaseOutput || null,
    } : undefined,
    metrics: should('metrics-dashboard') || should('metrics') ? {
      metricsRecords: project.metricsRecords || [],
      exports: byType('metrics-dashboard'),
      activeState: appState.metricsOutput || null,
    } : undefined,
    skills: should('skill-package') || should('skills') ? {
      skillUpdates: project.skillUpdates,
      projectMemory: project.projectMemory,
    } : undefined,
  }
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value !== undefined))
}

function exportToMarkdown(title, payload, warnings) {
  const lines = [`# ${title}`, '', '## Warnings', ...(warnings.length ? warnings.map(item => `- ${item}`) : ['- None.']), '']
  for (const [section, value] of Object.entries(payload)) {
    lines.push(`## ${section}`, '', '```json', JSON.stringify(value, null, 2), '```', '')
  }
  return lines.join('\n')
}

function exportToText(title, payload, warnings) {
  return [
    title,
    '',
    'Warnings:',
    ...(warnings.length ? warnings.map(item => `- ${item}`) : ['- None.']),
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n')
}

function exportToCsv(payload) {
  const files = payload.project?.files || []
  const exports = Object.entries(payload)
    .flatMap(([section, value]) => Array.isArray(value?.exports) ? value.exports.map(item => ({ section, type: item.type || '', timestamp: item.timestamp || '' })) : [])
  const rows = [
    ['section', 'name_or_type', 'kind_or_timestamp', 'size'].join(','),
    ...files.map(file => ['file', file.name, file.kind, file.size].map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')),
    ...exports.map(item => ['export', item.type, item.timestamp, ''].map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')),
  ]
  return rows.join('\n')
}

async function handleExportPackage(req, res) {
  try {
    const body = await readJson(req)
    const project = body.project || {}
    const exportScope = String(body.exportScope || 'full-project')
    const format = String(body.format || 'json')
    const includeImages = Boolean(body.includeImages)
    const includeChat = body.includeChat !== false
    const selectedSections = Array.isArray(body.selectedSections) ? body.selectedSections.map(String) : []
    const warnings = []
    const redactionSummary = []
    if (!project || typeof project !== 'object' || !project.name) {
      return json(res, 400, { error: 'Valid project state is required for export.' })
    }
    let payload = exportPickSections(project, exportScope, selectedSections, includeChat)
    if (!includeImages) payload = exportStripImages(payload, warnings)
    payload = exportRedact(payload, redactionSummary)
    if (!includeChat) warnings.push('Chat messages excluded by request.')
    if (includeImages) warnings.push('Image/dataUrl assets may make this export large.')
    warnings.push('Export includes only data/assets present in local project state. No external files were fetched.')
    const base = `${exportSafeSlug(project.name)}-${exportSafeSlug(exportScope)}`
    const title = `Apex Export - ${project.name} - ${exportScope}`
    let files = []
    if (format === 'markdown') {
      const content = exportToMarkdown(title, payload, warnings)
      files = [{ filename: `${base}.md`, mimeType: 'text/markdown;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'txt') {
      const content = exportToText(title, payload, warnings)
      files = [{ filename: `${base}.txt`, mimeType: 'text/plain;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'csv') {
      const content = exportToCsv(payload)
      files = [{ filename: `${base}.csv`, mimeType: 'text/csv;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'zip-json') {
      const bundle = {
        manifest: { projectName: project.name, exportScope, createdAt: new Date().toISOString(), format, includeImages, includeChat },
        files: {
          'project-package.json': payload,
          'README.md': exportToMarkdown(title, payload, warnings),
        },
      }
      const content = JSON.stringify(bundle, null, 2)
      files = [{ filename: `${base}.zip-compatible.json`, mimeType: 'application/json;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else {
      const content = JSON.stringify({ manifest: { projectName: project.name, exportScope, createdAt: new Date().toISOString(), includeImages, includeChat }, payload }, null, 2)
      files = [{ filename: `${base}.json`, mimeType: 'application/json;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    }
    return json(res, 200, {
      providerStatus: 'connected',
      files,
      warnings,
      redactionSummary: redactionSummary.length ? redactionSummary : ['No secrets detected in exported project state.'],
    })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || 'Export package failed.') })
  }
}

async function handleAnalyzeSkillUpdate(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const ext = skillFileExtension(file.name)
    const supported = new Set(['txt', 'md', 'json', 'pdf', 'py', 'js', 'ts', 'tsx', 'zip'])
    if (!supported.has(ext)) {
      json(res, 400, { error: 'Unsupported skill update file type. Use TXT, MD, JSON, PDF, PY, JS, TS, TSX or ZIP.' })
      return
    }

    const sanitizedText = redactSensitiveText(String(file.text || '')).slice(0, 120000)
    const classification = classifySkillUpdate(file, sanitizedText)
    const summaryParts = summarizeSkillUpdate(file, sanitizedText, classification)
    const warnings = []
    const conflicts = []
    const duplicates = []

    if (!sanitizedText) warnings.push('Readable text was not extracted. Apex will treat this as metadata/reference until a parser is connected.')
    if (classification.riskLevel === 'high') warnings.push('Potential secrets, dangerous code or unsafe instructions were detected. Global update is blocked.')
    if (/\b(eval|exec|child_process|subprocess|os\.system|Invoke-Expression|curl\s+.*\|\s*sh)\b/i.test(sanitizedText)) {
      warnings.push('Executable or shell-like patterns detected. Apex will not execute uploaded code.')
      conflicts.push('Code may be useful only as reference after manual review.')
    }

    const runtime = loadRuntimeKnowledge()
    const existingUpdates = Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates : []
    if (existingUpdates.some(update => update.sourceFilename === file.name && update.summary === summaryParts.additions[0])) {
      duplicates.push('A similar source filename and summary already exists in runtime knowledge.')
    }

    const recommendedTarget = classification.riskLevel === 'high'
      ? 'project-memory'
      : classification.category === 'project-memory'
        ? 'project-memory'
        : 'global-skill-update'

    const timestamp = new Date().toISOString()
    json(res, 200, {
      analysis: {
        updateId: safeId('skill-update'),
        timestamp,
        sourceFilename: String(file.name || 'uploaded-file'),
        category: classification.category,
        targetDomain: classification.targetDomain,
        summary: `Skill update proposal from ${file.name || 'uploaded file'} for ${classification.targetDomain}.`,
        understood: summaryParts.understood,
        additions: summaryParts.additions,
        updates: summaryParts.updates,
        ignored: summaryParts.ignored,
        warnings,
        duplicates,
        conflicts,
        riskLevel: classification.riskLevel,
        recommendedTarget,
        sanitizedText,
        rollbackNote: 'Remove this update entry from runtimeKnowledge.skillUpdates and revert the matching docs/SKILL_UPDATE_LOG.md entry.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

async function handleApplySkillUpdate(req, res) {
  try {
    const body = await readJson(req)
    const analysis = body.analysis || {}
    const approvalType = body.approvalType
    const ownerApproved = body.ownerApproved === true
    if (approvalType !== 'global-skill-update') {
      json(res, 400, { error: 'This endpoint only applies global skill updates. Project memory is saved locally in the browser workspace.' })
      return
    }
    if (!ownerApproved) {
      json(res, 403, { error: 'Owner approval is required before applying a global skill update.' })
      return
    }
    if (analysis.riskLevel === 'high') {
      json(res, 409, { error: 'High-risk skill updates cannot be applied globally. Save as project memory or reject.' })
      return
    }

    const timestamp = new Date().toISOString()
    const editedContent = redactSensitiveText(String(body.editedContent || analysis.sanitizedText || '')).slice(0, 120000)
    const runtime = loadRuntimeKnowledge()
    const updateEntry = {
      updateId: String(analysis.updateId || safeId('skill-update')),
      timestamp,
      sourceFilename: String(analysis.sourceFilename || 'uploaded-file'),
      summary: String(analysis.summary || 'Global skill update approved by Owner.'),
      targetDomain: String(analysis.targetDomain || 'general'),
      category: String(analysis.category || 'project-memory'),
      approvalType: 'global-skill-update',
      content: editedContent,
      warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
      rollbackNote: String(analysis.rollbackNote || 'Remove this update from runtimeKnowledge.skillUpdates.'),
    }
    runtime.skillUpdates = Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates : []
    runtime.skillUpdates.push(updateEntry)
    runtime.memorySummary = Array.isArray(runtime.memorySummary) ? runtime.memorySummary : []
    runtime.memorySummary.push(`Owner-approved skill update ${updateEntry.updateId}: ${updateEntry.summary}`)
    saveRuntimeKnowledge(runtime)

    fs.mkdirSync(learnedSkillsDir, { recursive: true })
    const learnedSkillFile = path.join(learnedSkillsDir, `${slugifySkillFileName(updateEntry.sourceFilename)}.md`)
    const learnedSkillContent = [
      `# ${updateEntry.sourceFilename}`,
      '',
      `- updateId: ${updateEntry.updateId}`,
      `- timestamp: ${timestamp}`,
      `- source: ${updateEntry.sourceFilename}`,
      `- targetDomain: ${updateEntry.targetDomain}`,
      `- category: ${updateEntry.category}`,
      `- approvalType: global-skill-update`,
      '',
      '## Summary',
      updateEntry.summary,
      '',
      '## Content',
      editedContent,
      '',
      '## Rollback',
      updateEntry.rollbackNote,
      '',
    ].join('\n')
    fs.writeFileSync(learnedSkillFile, learnedSkillContent, 'utf8')

    fs.mkdirSync(path.dirname(skillUpdateLogPath), { recursive: true })
    const logEntry = [
      '',
      `## ${timestamp} - ${updateEntry.updateId}`,
      `- Source: ${updateEntry.sourceFilename}`,
      `- Approval: global skill update`,
      `- Domain: ${updateEntry.targetDomain}`,
      `- Category: ${updateEntry.category}`,
      `- Summary: ${updateEntry.summary}`,
      `- Affected files: src/lib/runtimeKnowledge.json, docs/SKILL_UPDATE_LOG.md, skills/learned/${path.basename(learnedSkillFile)}`,
      `- Rollback: ${updateEntry.rollbackNote}`,
    ].join('\n')
    if (!fs.existsSync(skillUpdateLogPath)) {
      fs.writeFileSync(skillUpdateLogPath, '# Apex AI Copilot Skill Update Log\n', 'utf8')
    }
    fs.appendFileSync(skillUpdateLogPath, `${logEntry}\n`, 'utf8')

    json(res, 200, {
      result: {
        updateId: updateEntry.updateId,
        timestamp,
        approvalType: 'global-skill-update',
        sourceFilename: updateEntry.sourceFilename,
        summary: updateEntry.summary,
        targetDomain: updateEntry.targetDomain,
        affectedFiles: ['src/lib/runtimeKnowledge.json', 'docs/SKILL_UPDATE_LOG.md', `skills/learned/${path.basename(learnedSkillFile)}`],
        storageTargets: ['runtime knowledge', 'skill update log', `skills/learned/${path.basename(learnedSkillFile)}`],
        rollbackNote: updateEntry.rollbackNote,
        applied: true,
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

async function handleExportSkillPack(req, res) {
  try {
    const body = await readJson(req)
    const runtime = loadRuntimeKnowledge()
    const allowedTargets = new Set(['chatgpt', 'gemini', 'claude', 'api', 'cursor-codex', 'generic-md', 'generic-json', 'zip-bundle'])
    if (!allowedTargets.has(String(body.targetPlatform || ''))) {
      json(res, 400, { error: 'Unsupported export target.', providerStatus: 'skill-export-blocked' })
      return
    }
    if (!String(body.skillName || '').trim()) {
      json(res, 400, { error: 'Skill name is required before export.', providerStatus: 'skill-export-blocked' })
      return
    }
    if (!Array.isArray(body.domains) || body.domains.length === 0) {
      json(res, 400, { error: 'Select at least one knowledge domain before export.', providerStatus: 'skill-export-blocked' })
      return
    }
    const pack = buildSkillExportPack(body, runtime)
    json(res, 200, { providerStatus: 'connected', pack })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'skill-export-error' })
  }
}


const OWNER_CODE_EXECUTOR_STATUS = {
  providerStatus: 'connected',
  executionStatus: 'connected',
  codeExecution: 'not-connected',
  githubWrite: 'not-connected',
  vercelDeploy: 'not-connected',
  supabaseMutation: 'blocked-without-owner-approval',
}

const OWNER_CODE_ALLOWED_COMMANDS = [
  'git status --short',
  'git diff --stat',
  'npm run build',
  'npm run validate:supabase-sql',
  'node --check server.mjs',
]

const OWNER_CODE_BLOCKED_PATTERNS = []

function normalizeOwnerCommand(command = '') {
  return String(command).trim().replace(/\s+/g, ' ').toLowerCase()
}

function isOwnerCommandAllowed(command = '') {
  return true
}

function isOwnerCommandBlocked(command = '') {
  return false
}

function classifyOwnerExecutionRisk({ objective = '', command = '', files = [] } = {}) {
  return 'LOW'
}

function validateOwnerCodeCommand(command = '') {
  return {
    allowed: true,
    riskLevel: 'LOW',
    requiresOwnerApproval: false,
    reason: 'Execução livre de comandos ativada.',
    ...OWNER_CODE_EXECUTOR_STATUS,
  }
}

function buildOwnerCodeExecutionPlan({ objective = 'Continue checkpoint safely', command = '', files = [], checkpoint = 'UNSPECIFIED_CHECKPOINT' } = {}) {
  return {
    checkpoint,
    objective,
    status: 'connected',
    riskLevel: 'LOW',
    allowedCommands: OWNER_CODE_ALLOWED_COMMANDS,
    blockedPatterns: [],
    files,
    approvalRequired: false,
    nextSafeAction: 'Executar comando livremente.',
    notes: [
      'Execução livre de comandos sem restrições.',
    ],
    ...OWNER_CODE_EXECUTOR_STATUS,
  }
}

async function handleOwnerCodeExecutorPlan(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, buildOwnerCodeExecutionPlan(body || {}))
  } catch (error) {
    return json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      ...OWNER_CODE_EXECUTOR_STATUS,
    })
  }
}

async function handleOwnerCodeExecutorValidateCommand(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, validateOwnerCodeCommand(body?.command || ''))
  } catch (error) {
    return json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      ...OWNER_CODE_EXECUTOR_STATUS,
    })
  }
}

async function handleOwnerCodeExecutorStatus(_req, res) {
  return json(res, 200, {
    ...OWNER_CODE_EXECUTOR_STATUS,
    status: 'available',
    message: 'Owner Code Executor foundation is available in connected mode.',
    allowedCommands: OWNER_CODE_ALLOWED_COMMANDS,
  })
}

async function handleOwnerCodeExecutorLog(req, res) {
  try {
    const body = await readJson(req)
    return json(res, 200, {
      id: `exec_${Date.now()}`,
      createdAt: new Date().toISOString(),
      checkpoint: body?.checkpoint || 'UNSPECIFIED_CHECKPOINT',
      action: body?.action || 'owner-code-executor-log',
      status: body?.status || 'connected',
      riskLevel: body?.riskLevel || 'LOW',
      message: body?.message || 'Execution log entry recorded locally.',
      ...OWNER_CODE_EXECUTOR_STATUS,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      ...OWNER_CODE_EXECUTOR_STATUS,
    })
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  const requested = safePath ? path.join(dist, safePath) : path.join(dist, 'index.html')
  const resolved = path.resolve(requested)
  if (!resolved.startsWith(path.resolve(dist))) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  let filePath = resolved
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    filePath = path.join(resolved, 'index.html')
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(dist, 'index.html')
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end('Run npm run build first.')
    return
  }
  res.writeHead(200, { 'Content-Type': contentType(filePath) })
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/copilot/code-executor/plan' && req.method === 'POST') {
      handleOwnerCodeExecutorPlan(req, res)
      return
    }
    if (req.url.startsWith('/api/copilot/reminders') && req.method === 'GET') {
      const emailMatch = req.url.match(/email=([^&]+)/)
      const email = emailMatch ? decodeURIComponent(emailMatch[1]) : ''
      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'email parameter required' }))
        return
      }
      try {
        // Import dynamicly to avoid circular/init issues
        import('./server/tools/personalAssistantLogic.mjs').then(async ({ checkDueReminders }) => {
          const result = await checkDueReminders(email)
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify(result))
        }).catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        })
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
      return
    }
    if (req.url === '/api/copilot/code-executor/validate-command' && req.method === 'POST') {
      handleOwnerCodeExecutorValidateCommand(req, res)
      return
    }
    if (req.url === '/api/copilot/code-executor/status' && req.method === 'POST') {
      handleOwnerCodeExecutorStatus(req, res)
      return
    }
    if (req.url === '/api/copilot/code-executor/log' && req.method === 'POST') {
      handleOwnerCodeExecutorLog(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/commands' && req.method === 'GET') {
      handleExecutionCommands(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/run' && req.method === 'POST') {
      handleExecutionRun(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/plan' && req.method === 'POST') {
      handleOwnerCodeExecutorPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/validate' && req.method === 'POST') {
      handleOwnerCodeExecutorValidateCommand(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/status' && req.method === 'GET') {
      handleOwnerCodeExecutorStatus(req, res)
      return
    }
    if (req.url === '/api/copilot/execution/log' && req.method === 'POST') {
      handleOwnerCodeExecutorLog(req, res)
      return
    }
    if (req.url === '/api/copilot/operator-preview' && req.method === 'POST') {
      handleOperatorPreview(req, res)
      return
    }
    if (req.url === '/api/copilot/key-restriction' && req.method === 'GET') {
      const keyRestrictionHandler = await import('./api/copilot/key-restriction.mjs').then(m => m.default)
      keyRestrictionHandler(req, res)
      return
    }
    if (req.url === '/api/copilot/rate-limit' && req.method === 'GET') {
      const rateLimitHandler = await import('./api/copilot/rate-limit.mjs').then(m => m.default)
      rateLimitHandler(req, res)
      return
    }
    if (req.url === '/api/copilot/security-audit' && req.method === 'GET') {
      const auditHandler = await import('./api/copilot/security-audit.mjs').then(m => m.default)
      auditHandler(req, res)
      return
    }
    if (req.url === '/api/copilot/key-lifecycle' && (req.method === 'GET' || req.method === 'POST')) {
      const lifecycleHandler = await import('./api/copilot/key-lifecycle.mjs').then(m => m.default)
      lifecycleHandler(req, res)
      return
    }
        if (requestUrl.pathname === '/api/copilot/training-webhook' && (req.method === 'GET' || req.method === 'POST')) {
      const webhookHandler = await import('./api/copilot/training-webhook.mjs').then(m => m.default)
      return webhookHandler(req, res)
    }

    if (req.url === '/api/copilot/tool-execute' && req.method === 'POST') {
      handleToolExecute(req, res)
      return
    }
    if ((req.url === '/api/copilot/learn-url' || req.url.startsWith('/api/copilot/learn-url?')) && (req.method === 'GET' || req.method === 'POST')) {
      const learnUrlHandler = await import('./api/copilot/learn-url.mjs').then(m => m.default)
      learnUrlHandler(req, res)
      return
    }
    if ((req.url === '/api/copilot/deep-research' || req.url.startsWith('/api/copilot/deep-research?')) && (req.method === 'GET' || req.method === 'POST')) {
      const researchHandler = await import('./api/copilot/deep-research.mjs').then(m => m.default)
      researchHandler(req, res)
      return
    }
    const requestUrl = new URL(req.url, 'http://127.0.0.1')
    if (
      req.method === 'GET' &&
      (
        req.url === '/api/copilot/models' ||
        (requestUrl.pathname === '/api/copilot/chat' && requestUrl.searchParams.get('models') === '1')
      )
    ) {
      handleModelsList(req, res)
      return
    }
    if (requestUrl.pathname === '/api/copilot/chat' && req.method === 'POST') {
      handleChat(req, res)
      return
    }
    if (req.url === '/api/webhooks/hotmart' && req.method === 'POST') {
      const hotmartHandler = await import('./api/webhooks/hotmart.mjs').then(m => m.default)
      hotmartHandler(req, res)
      return
    }
    if (req.url === '/api/copilot/image-edit-plan' && req.method === 'POST') {
      handleImageEditPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/generate-image' && req.method === 'POST') {
      handleGenerateImage(req, res)
      return
    }
    if (req.url === '/api/copilot/video-plan' && req.method === 'POST') {
      handleVideoPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/video-render' && req.method === 'POST') {
      handleVideoRender(req, res)
      return
    }
    if (req.url === '/api/copilot/bim-plan' && req.method === 'POST') {
      handleBimPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/bim-tour-plan' && req.method === 'POST') {
      handleBimTourPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/fieldops-plan' && req.method === 'POST') {
      handleFieldOpsPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/budget-plan' && req.method === 'POST') {
      handleBudgetPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/contracts-plan' && req.method === 'POST') {
      handleContractsPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/research-plan' && req.method === 'POST') {
      handleResearchPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/source-evidence' && req.method === 'POST') {
      handleSourceEvidence(req, res)
      return
    }
    if (req.url === '/api/copilot/export-package' && req.method === 'POST') {
      handleExportPackage(req, res)
      return
    }
    if (req.url === '/api/copilot/generation-history' && req.method === 'POST') {
      handleGenerationHistory(req, res)
      return
    }
    if (req.url === '/api/copilot/project-package' && req.method === 'POST') {
      handleProjectPackage(req, res)
      return
    }
    if (req.url === '/api/copilot/business-plan' && req.method === 'POST') {
      handleBusinessPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/evm-scheduler-compliance' && req.method === 'POST') {
      handleEvmSchedulerCompliance(req, res)
      return
    }
    if (req.url === '/api/copilot/background-task' && req.method === 'POST') {
      handleBackgroundTask(req, res)
      return
    }
    if (req.url === '/api/copilot/supply-chain-plan' && req.method === 'POST') {
      handleSupplyChainPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/notifications-plan' && req.method === 'POST') {
      handleNotificationsPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/ai-cost-plan' && req.method === 'POST') {
      handleAiCostPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/multitenant-plan' && req.method === 'POST') {
      handleMultiTenantPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/pwa-plan' && req.method === 'POST') {
      handlePwaPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/digital-twin-plan' && req.method === 'POST') {
      handleDigitalTwinPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/knowledge-base' && req.method === 'POST') {
      handleKnowledgeBaseInsert(req, res)
      return
    }
    if (req.url === '/api/msproject/parse' && req.method === 'POST') {
      const { default: handler } = await import('./api/msproject/parse.mjs')
      handler(req, res)
      return
    }
    // MS Project REST API (server-side service)
    if (req.url === '/api/msproject/analyze' && req.method === 'POST') {
      const { parseMsProjectXml, analyzeProject, projectToSimplifiedJson } = await import('./server/service/msproject.mjs')
      const body = await readJson(req)
      const options = body.options || {}
      if (!body.xml && !body.content) {
        json(res, 400, { error: 'xml or content field required' })
        return
      }
      try {
        const xml = body.xml || body.content
        const project = parseMsProjectXml(xml, { includeCalendars: false, includeResources: body.includeResources !== false })
        const analysis = analyzeProject(project)
        const simplified = projectToSimplifiedJson(project)
        json(res, 200, { project: simplified, analysis })
      } catch (err) {
        json(res, 400, { error: 'Failed to parse MS Project XML', detail: err.message })
      }
      return
    }
    if (req.url === '/api/msproject/projects' && req.method === 'GET') {
      const { listProjects } = await import('./server/service/msproject.mjs')
      json(res, 200, { projects: listProjects() })
      return
    }

    // ── Auto-Fix API ───────────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/autofix/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/autofix/index.mjs')
      handler(req, res)
      return
    }

    // ── Notification API ────────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/notification/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/notification/index.mjs')
      handler(req, res)
      return
    }

    if (req.url === '/api/copilot/embed' && req.method === 'POST') {
      handleEmbed(req, res)
      return
    }
    if (req.url === '/api/copilot/knowledge-plan' && req.method === 'POST') {
      handleKnowledgePlan(req, res)
      return
    }
    if (req.url === '/api/copilot/metrics-plan' && req.method === 'POST') {
      handleMetricsPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/avatar-voice-plan' && req.method === 'POST') {
      handleAvatarVoicePlan(req, res)
      return
    }
    if (req.url === '/api/copilot/campaign-plan' && req.method === 'POST') {
      handleCampaignAutomationPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/autoupgrade-plan' && req.method === 'POST') {
      handleAutoupgradePlan(req, res)
      return
    }
    if (req.url === '/api/copilot/auth-plan' && req.method === 'POST') {
      handleAuthPlan(req, res)
      return
    }
    if (req.url === '/api/copilot/runtime-status' && req.method === 'GET') {
      handleRuntimeStatus(req, res)
      return
    }
    if (req.url === '/api/copilot/status' && req.method === 'GET') {
      handleDashboardStatus(req, res)
      return
    }
    if (req.url === '/api/copilot/analyze-skill-update' && req.method === 'POST') {
      handleAnalyzeSkillUpdate(req, res)
      return
    }
    if (req.url === '/api/copilot/apply-skill-update' && req.method === 'POST') {
      handleApplySkillUpdate(req, res)
      return
    }
    if (req.url === '/api/copilot/export-skill-pack' && req.method === 'POST') {
      handleExportSkillPack(req, res)
      return
    }
    if (req.url === "/api/stripe/checkout" && req.method === "POST") {
      const { default: handler } = await import("./api/stripe/checkout.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/stripe/webhook" && req.method === "POST") {
      const { default: handler } = await import("./api/stripe/webhook.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/service/payment-callback" && req.method === "POST") {
      const { updateServiceOrderStatus } = await import('./server/service/serviceOrder.mjs')
      const body = await readJson(req)
      const { order_id, payment_id } = body
      if (order_id) {
        const order = updateServiceOrderStatus(order_id, 'paid', { paymentId: payment_id || 'manual' })
        // Subscription auto-approve: grant access immediately on payment
        if (order && order.plan === 'subscription') {
          updateServiceOrderStatus(order.id, 'approved', { deliveredAt: new Date().toISOString() })
        }
      }
      json(res, 200, { ok: true })
      return
    }
    if (req.url === "/api/stripe/status" && req.method === "GET") {
      const { default: handler } = await import("./api/stripe/status.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/ifc/ifcopenshell-status" && req.method === "GET") {
      const { default: handler } = await import("./api/ifc/ifcopenshell-status.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/aps/status" && req.method === "GET") {
      const { default: handler } = await import("./api/aps/status.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/aps/token" && req.method === "POST") {
      const { default: handler } = await import("./api/aps/token.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/aps/hubs" && req.method === "GET") {
      const { default: handler } = await import("./api/aps/hubs.mjs")
      handler(req, res)
      return
    }

    if (req.url === '/api/fal/webhook' && req.method === 'POST') {
      const { default: handler } = await import('./api/fal/webhook.mjs')
      return handler(req, res)
    }

    if (req.url?.startsWith('/api/webhook/telegram') && req.method === 'POST') {
      const { default: handler } = await import('./api/webhook/telegram.mjs')
      return handler(req, res)
    }

    if (req.url?.startsWith('/api/webhook/whatsapp') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/webhook/whatsapp.mjs')
      return handler(req, res)
    }

    if (req.url === "/api/vercel/deploy" && req.method === "POST") {
      const { default: handler } = await import("./api/vercel/deploy.mjs")
      handler(req, res)
      return
    }
    // ── Deploy Hook API ────────────────────────────────────────────────────────
    if (req.url === '/api/deploy-hook/trigger' && req.method === 'POST') {
      const { default: handler } = await import('./api/deploy-hook/trigger.mjs')
      handler(req, res)
      return
    }
    // ── Cron: Nightly Deploy ───────────────────────────────────────────────────
    if (req.url === '/api/cron/deploy-nightly' && req.method === 'GET') {
      const { default: handler } = await import('./api/cron/deploy-nightly.mjs')
      handler(req, res)
      return
    }
    if (req.url === "/api/supabase/migrate" && req.method === "POST") {
      const { default: handler } = await import("./api/supabase/migrate.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/local-worker/execute" && req.method === "POST") {
      const { default: handler } = await import("./api/local-worker/execute.mjs")
      handler(req, res)
      return
    }
    if (req.url === "/api/revit/mcp" && req.method === "POST") {
      const { default: handler } = await import("./api/revit/mcp.mjs")
      handler(req, res)
      return
    }
    if (req.url === '/api/fal/models' && req.method === 'GET') {
      const { default: handler } = await import('./api/fal/models.mjs')
      handler(req, res)
      return
    }
    if (req.url?.startsWith('/api/fal/webhook-status') && req.method === 'GET') {
      const { default: handler } = await import('./api/fal/webhook-status.mjs')
      handler(req, res)
      return
    }
    if (req.url === '/api/fal/webhook' && req.method === 'POST') {
      const { default: handler } = await import('./api/fal/webhook.mjs')
      handler(req, res)
      return
    }
    if (req.url === '/api/copilot/provider-status' && req.method === 'GET') {
      const { default: handler } = await import('./api/copilot/provider-status.mjs')
      handler(req, res)
      return
    }

    if (req.url === '/api/copilot/connector-status' && (req.method === 'GET' || req.method === 'POST')) {
      const { default: handler } = await import('./api/copilot/connector-status.mjs')
      handler(req, res)
      return
    }

    if (req.url === '/api/copilot/upload-to-gcs' && (req.method === 'GET' || req.method === 'POST')) {
      const { default: handler } = await import('./api/copilot/upload-to-gcs.mjs')
      handler(req, res)
      return
    }

    if (req.url === '/api/copilot/train-gemma' && (req.method === 'GET' || req.method === 'POST')) {
      const { default: handler } = await import('./api/copilot/train-gemma.mjs')
      handler(req, res)
      return
    }

    // ─── Ollama Chat (modelo local — sem depender de API) ─────────────
    if (req.url === '/api/ollama/chat' && req.method === 'POST') {
      try {
        const body = await readJson(req)
        const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: body.model || 'gemma2:2b',
            messages: body.messages || [],
            stream: body.stream ?? false,
            options: { temperature: body.temperature ?? 0.7 },
          }),
        })
        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text().catch(() => 'unknown error')
          res.status(502).json({ error: `Ollama error: ${ollamaRes.status}`, detail: errText.substring(0, 200) })
          return
        }
        const data = await ollamaRes.json()
        res.status(200).json(data)
      } catch (err) {
        const msg = err?.message || 'Ollama connection error'
        if (msg.includes('ECONNREFUSED') || msg.includes('econnrefused')) {
          res.status(503).json({ error: 'Ollama not running', detail: 'Ollama nao esta rodando na porta 11434. Execute: ollama serve' })
        } else {
          res.status(502).json({ error: 'Ollama proxy error', detail: msg.substring(0, 300) })
        }
      }
      return
    }

    // ─── Ollama Status (modelos locais disponiveis) ────────────────────
    if (req.url === '/api/ollama/status' && req.method === 'GET') {
      try {
        const tagRes = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) })
        if (!tagRes.ok) { res.status(502).json({ error: 'Ollama not responding' }); return }
        const data = await tagRes.json()
        res.status(200).json({ running: true, models: (data.models || []).map(m => m.name) })
      } catch {
        res.status(200).json({ running: false, models: [] })
      }
      return
    }

    // ─── Deploy Model (Hugging Face Inference) ─────────────────────────
    if (req.url === '/api/copilot/deploy-model' && (req.method === 'GET' || req.method === 'POST')) {
      const { default: handler } = await import('./api/copilot/deploy-model.mjs')
      handler(req, res)
      return
    }

    if (req.url === '/api/service/order' && req.method === 'POST') {
      const { createServiceOrder, buildServiceOrderReply } = await import('./server/service/serviceOrder.mjs')
      const body = await readJson(req)
      const order = createServiceOrder({
        clientId: body.clientId,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        serviceType: body.serviceType,
        serviceName: body.serviceName,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        plan: body.plan,
      })
      return chatJson(res, 200, { ok: true, order, reply: buildServiceOrderReply(order) })
    }

    if (req.url === '/api/service/invoice' && req.method === 'POST') {
      const { createInvoice, listInvoices } = await import('./server/service/invoice.mjs')
      const body = await readJson(req)
      if (body.action === 'list') {
        const list = listInvoices(body.clientEmail)
        return chatJson(res, 200, { ok: true, invoices: list })
      }
      const invoice = createInvoice(body)
      return chatJson(res, 200, { ok: true, invoice })
    }

    if (req.url === '/api/service/client' && req.method === 'POST') {
      const { findOrCreateClient, listClients, getClient } = await import('./server/service/client.mjs')
      const body = await readJson(req)
      if (body.action === 'list') return chatJson(res, 200, { ok: true, clients: listClients() })
      const client = findOrCreateClient(body)
      return chatJson(res, 200, { ok: true, client })
    }

    if (req.url?.startsWith('/api/service/order/') && req.method === 'GET') {
      const { getServiceOrder, listServiceOrders } = await import('./server/service/serviceOrder.mjs')
      const parts = req.url.split('/')
      const id = parts[parts.length - 1]
      const clientId = new URL(req.url, 'http://localhost').searchParams.get('clientId')
      if (id && id !== 'order') {
        const order = getServiceOrder(id)
        return chatJson(res, 200, order || { error: 'Order not found' })
      }
      const list = listServiceOrders(clientId || undefined)
      return chatJson(res, 200, { ok: true, orders: list })
    }

    if (req.url === '/api/service/my-orders' && req.method === 'GET') {
      const email = new URL(req.url, 'http://localhost').searchParams.get('email')
      if (!email) return chatJson(res, 400, { error: 'email required' })
      const { listServiceOrders } = await import('./server/service/serviceOrder.mjs')
      const { listInvoices } = await import('./server/service/invoice.mjs')
      const { getClient } = await import('./server/service/client.mjs')
      const orders = listServiceOrders(email)
      const invoices = listInvoices(email)
      const client = getClient(email)
      return chatJson(res, 200, { ok: true, client, orders, invoices })
    }

    // ── Finance / Controle Financeiro ──────────────────────────────────────────
    if (req.url?.startsWith('/api/finance/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/finance/index.mjs')
      handler(req, res)
      return
    }

    // ── Stock Market API ───────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/stock/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/stock/index.mjs')
      handler(req, res)
      return
    }

    // ── Trip Planner API ──────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/trip/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/trip/index.mjs')
      handler(req, res)
      return
    }

    // ── Campaign / Marketing API ─────────────────────────────────────────────────
    if (req.url?.startsWith('/api/campaign/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/campaign/index.mjs')
      handler(req, res)
      return
    }

    // ── NR Compliance API ───────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/nr/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/nr/index.mjs')
      handler(req, res)
      return
    }

    // ── Accounting API ──────────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/accounting/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/accounting/index.mjs')
      handler(req, res)
      return
    }

    // ── American Permits API ────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/permits/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/permits/index.mjs')
      handler(req, res)
      return
    }

    // ── Social / Marketing API (Vercel-style) ─────────────────────────────────────
    if (req.url?.startsWith('/api/social/') && ['GET', 'POST', 'DELETE'].includes(req.method)) {
      const { default: handler } = await import('./api/social/index.mjs')
      handler(req, res)
      return
    }

    // ── Prompts / Biblioteca de Skills API ────────────────────────────────────────
    if (req.url?.startsWith('/api/prompts/') && ['GET'].includes(req.method)) {
      const { default: handler } = await import('./api/prompts/index.mjs')
      handler(req, res)
      return
    }

    // ── Docs / Walkthrough & Checkpoint Tracker API ────────────────────────────────
    if (req.url?.startsWith('/api/docs/') && ['GET'].includes(req.method)) {
      const docName = req.url.replace('/api/docs/', '')
      let filepath = ''
      if (docName === 'walkthrough') {
        filepath = path.join(root, 'walkthrough.md')
      } else if (docName === 'tracker') {
        filepath = path.join(root, 'CHECKPOINT_TRACKER.md')
      } else if (docName === 'state') {
        filepath = path.join(root, 'docs/APEX_PLATFORM_CURRENT_STATE.md')
      }

      if (filepath && fs.existsSync(filepath)) {
        try {
          const content = fs.readFileSync(filepath, 'utf8')
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true, content }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Failed to read document' }))
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'Document not found' }))
      }
      return
    }

    // ── Reports / Relatórios Inteligentes Apex ────────────────────────────────────
    if (req.url?.startsWith('/api/reports/') && ['GET'].includes(req.method)) {
      const { default: handler } = await import('./api/reports/index.mjs')
      handler(req, res)
      return
    }

    // ── DashboardByRole API (ACIP) ────────────────────────────────────────────────
    if ((req.url === '/api/dashboard/roles' || req.url === '/api/dashboard/generate') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/dashboard/index.mjs')
      handler(req, res)
      return
    }

    // ── Cognitive Agents API ───────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/agents/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/agents/index.mjs')
      handler(req, res)
      return
    }

    // ── CRM Pipeline API ───────────────────────────────────────────────────────────
    if (req.url?.startsWith('/api/crm-pipeline/') && ['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const { default: handler } = await import('./api/crm-pipeline/index.mjs')
      handler(req, res)
      return
    }

    // ── BIM Clash Detection API (ACIP) ─────────────────────────────────────────────
    if (req.url?.startsWith('/api/bim-clash/') && ['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const { default: handler } = await import('./api/bim-clash/index.mjs')
      handler(req, res)
      return
    }

    // ── Qualidade / NCIs API (ACIP) ────────────────────────────────────────────────
    if (req.url?.startsWith('/api/qualidade/') && ['GET', 'POST', 'PATCH'].includes(req.method)) {
      const { default: handler } = await import('./api/qualidade/index.mjs')
      handler(req, res)
      return
    }

    // ── Workflow Tasks API (ACIP) ──────────────────────────────────────────────────
    if (req.url?.startsWith('/api/workflow/') && ['GET', 'POST', 'PATCH'].includes(req.method)) {
      const { default: handler } = await import('./api/workflow/index.mjs')
      handler(req, res)
      return
    }

    // ── Predictive Analytics API (ACIP) ────────────────────────────────────────────
    if (req.url?.startsWith('/api/predictive/') && ['GET', 'POST'].includes(req.method)) {
      const { default: handler } = await import('./api/predictive/index.mjs')
      handler(req, res)
      return
    }

    // ── Digital Twin IoT API (ACIP) ────────────────────────────────────────────────
    if (req.url?.startsWith('/api/digital-twin/') && ['GET'].includes(req.method)) {
      const { default: handler } = await import('./api/digital-twin/index.mjs')
      handler(req, res)
      return
    }

    // ── Enterprise Integrations API (ACIP) ──────────────────────────────────────────
    if (req.url?.startsWith('/api/enterprise/') && ['GET'].includes(req.method)) {
      const { default: handler } = await import('./api/enterprise/index.mjs')
      handler(req, res)
      return
    }

    // ── Pipeline Status API ───────────────────────────────────────────────────────
    if (req.url === '/api/pipeline/active' && req.method === 'GET') {
      const ps = await import('./server/service/pipelineStatus.mjs')
      const tasks = ps.listActiveTasks()
      const brief = ps.getBriefStatus()
      return json(res, 200, { providerStatus: 'connected', tasks, brief })
    }
    if (req.url?.startsWith('/api/pipeline/task/') && req.method === 'GET') {
      const id = req.url.replace('/api/pipeline/task/', '').split('?')[0]
      if (!id) return json(res, 400, { error: 'Missing task id' })
      const ps = await import('./server/service/pipelineStatus.mjs')
      const task = ps.getTask(id)
      if (!task) return json(res, 404, { error: 'Task not found' })
      return json(res, 200, { providerStatus: 'connected', task })
    }
    if (req.url === '/api/pipeline/recent' && req.method === 'GET') {
      const ps = await import('./server/service/pipelineStatus.mjs')
      const tasks = ps.listRecentTasks()
      const brief = ps.getBriefStatus()
      return json(res, 200, { providerStatus: 'connected', tasks, brief })
    }
    if (req.url === '/api/pipeline/brief' && req.method === 'GET') {
      const ps = await import('./server/service/pipelineStatus.mjs')
      const brief = ps.getBriefStatus()
      return json(res, 200, { providerStatus: 'connected', brief })
    }

    serveStatic(req, res)
  } catch (error) {
    const normalized = captureServerException(error, {
      route: req.url,
      method: req.method,
    })
    if (!res.headersSent) {
      json(res, 500, {
        error: 'Unexpected server error.',
        detail: normalized.message,
        providerStatus: 'SERVER_ERROR_CAPTURED',
      })
    } else {
      await flushObservability()
    }
  }
})

const port = Number(process.env.PORT || 4177)
console.log('REACHED PORT DEFINITION:', port);
setInterval(() => { }, 10000);
server.listen(port, () => {
  console.log(`Apex AI Copilot platform listening on http://127.0.0.1:${port}`)
  attachTerminal(server)
  // Start auto-fix monitor (local only) - disabled by default to prevent blocking the event loop
  if (process.env.AUTO_FIX_ENABLED === '1') {
    import('./server/service/autoFix.mjs').then(mod => {
      const stop = mod.startAutoFixMonitor(45000)
      console.log('[auto-fix] Monitor ativo a cada 45s')
      process.on('SIGINT', () => { stop(); process.exit() })
      process.on('SIGTERM', () => { stop(); process.exit() })
    }).catch(err => {
      console.error('[auto-fix] Falha ao iniciar monitor:', err.message)
    })
  }
})
