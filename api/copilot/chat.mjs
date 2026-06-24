import '../../server/env.mjs'
import { generateText } from 'ai'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution, routeH6ActionRequest } from '../../server/agent/toolExecutionRouter.mjs'
import { isConfirmationSignal, isCancelSignal, hasPendingAction } from '../../server/agent/confirmationStateMachine.mjs'
let _interactionsModels = null
let _isInteractionModel = null
async function getInteractionsProvider() {
  if (!_interactionsModels) {
    try {
      const mod = await import('../../server/providers/gemini-interactions.mjs')
      _interactionsModels = mod.INTERACTION_MODELS
      _isInteractionModel = mod.isInteractionModel
      return mod.generateWithInteractions
    } catch {
      return null
    }
  }
  const mod = await import('../../server/providers/gemini-interactions.mjs')
  return mod.generateWithInteractions
}
import { buildCodeToolDefinitions, executeCodeToolCall, CODE_TOOL_NAMES } from '../../server/agent/codeTools.mjs'
import { runLocalWorkerAction } from '../../server/agent/localWorkerClient.mjs'
import { classifyImageGenRequest, buildImagePrompt, generateImage, buildImageResultReply } from '../../server/agent/imageGenerationConnector.mjs'
import { classifyVideoGenRequest, generateVideo, buildVideoResultReply } from '../../server/agent/videoGenerationConnector.mjs'
import { sendAuthkeySms, sendAuthkeyOtp, buildAuthkeyResultReply } from '../../server/agent/authkeyConnector.mjs'

// Dynamic import — safe fallback if server/ not bundled in Vercel serverless
let _recordCall = null
async function _getRecordCall() {
  if (_recordCall) return _recordCall
  try {
    const mod = await import('../../server/service/providerAnalytics.mjs')
    _recordCall = mod.recordCall
    return _recordCall
  } catch {
    _recordCall = () => {} // silent noop
    return _recordCall
  }
}
function recordCallSafe(...args) {
  Promise.resolve().then(async () => {
    try { const fn = await _getRecordCall(); fn(...args) } catch {}
  }).catch(() => {})
}

if (process.env.Local_Worker_URL && !process.env.LOCAL_WORKER_URL) {
  process.env.LOCAL_WORKER_URL = process.env.Local_Worker_URL
}
if (process.env.Local_Worker_TOKEN && !process.env.LOCAL_WORKER_TOKEN) {
  process.env.LOCAL_WORKER_TOKEN = process.env.Local_Worker_TOKEN
}
if (process.env.OPENAI_MODELROUTER && !process.env.OPENAI_MODEL) {
  process.env.OPENAI_MODEL = process.env.OPENAI_MODELROUTER
}

// Auto-detect and fix swapped router variables
if (process.env.OPENAI_API_BASEROUTER && process.env.OPENAI_API_KEYROUTER) {
  const baseVal = String(process.env.OPENAI_API_BASEROUTER).trim()
  const keyVal = String(process.env.OPENAI_API_KEYROUTER).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASEROUTER = keyVal
    process.env.OPENAI_API_KEYROUTER = baseVal
  }
}
if (process.env.OPENAI_API_BASE && process.env.OPENAI_API_KEY) {
  const baseVal = String(process.env.OPENAI_API_BASE).trim()
  const keyVal = String(process.env.OPENAI_API_KEY).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASE = keyVal
    process.env.OPENAI_API_KEY = baseVal
  }
}

// Normalize custom router variable casing/names
if (process.env.OPENAI_API_BASEROUTER && !process.env.OPENAI_API_BASE) {
  process.env.OPENAI_API_BASE = process.env.OPENAI_API_BASEROUTER
}
if (process.env.OPENAI_API_KEYROUTER && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEYROUTER
}

// Resolve base URL and API key based on the selected model
export function getOpenAIConfig(model) {
  let apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
  let apiKey = process.env.OPENAI_API_KEY

  const isDirectGeminiModel = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'].includes(model)

  if (isDirectGeminiModel && process.env.GEMINI_API_KEY) {
    apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai'
    apiKey = process.env.GEMINI_API_KEY
  } else if (process.env.OPENAI_API_BASEROUTER && process.env.OPENAI_API_KEYROUTER) {
    if (model?.includes('/') || !isDirectGeminiModel) {
      apiBase = process.env.OPENAI_API_BASEROUTER
      apiKey = process.env.OPENAI_API_KEYROUTER
    } else if (!apiKey) {
      apiBase = process.env.OPENAI_API_BASEROUTER
      apiKey = process.env.OPENAI_API_KEYROUTER
    }
  }
  return { apiBase, apiKey }
}

function getModelProviderDiagnostics() {
  const apiBase = String(process.env.OPENAI_API_BASE || '').trim()
  const routerBase = String(process.env.OPENAI_API_BASEROUTER || '').trim()
  const routerKey = String(process.env.OPENAI_API_KEYROUTER || '').trim()
  const openAiKey = String(process.env.OPENAI_API_KEY || '').trim()
  const aiGatewayKey = String(process.env.AI_GATEWAY_API_KEY || '').trim()
  const apiBaseIsOpenRouter = apiBase.includes('openrouter.ai')
  const openrouterConfigured = Boolean((routerBase.includes('openrouter.ai') && routerKey) || (apiBaseIsOpenRouter && openAiKey))
  const openaiConfigured = Boolean(openAiKey) && !apiBaseIsOpenRouter
  const gatewayConfigured = Boolean(aiGatewayKey)
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY)
  const interactionsConfigured = Boolean(process.env.GEMINI_API_KEY)
  return {
    openrouterConfigured,
    openaiConfigured,
    aiGatewayConfigured: Boolean(aiGatewayKey),
    gatewayConfigured,
    geminiConfigured,
    interactionsConfigured,
  }
}

const DIRECT_GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
]

const GATEWAY_OPENAI_MODELS = [
  { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
  { id: 'openai/gpt-5-pro', name: 'GPT-5 Pro' },
  { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex' },
  { id: 'openai/gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max' },
  { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
  { id: 'openai/gpt-5.1-instant', name: 'GPT-5.1 Instant' },
  { id: 'openai/gpt-5.1-thinking', name: 'GPT-5.1 Thinking' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2' },
  { id: 'openai/gpt-5.2-chat', name: 'GPT-5.2 Chat' },
  { id: 'openai/gpt-5.2-codex', name: 'GPT-5.2 Codex' },
  { id: 'openai/gpt-5.2-pro', name: 'GPT-5.2 Pro' },
  { id: 'openai/o1', name: 'o1' },
  { id: 'openai/o3', name: 'o3' },
  { id: 'openai/o3-mini', name: 'o3 Mini' },
  { id: 'openai/o3-pro', name: 'o3 Pro' },
  { id: 'openai/o4-mini', name: 'o4 Mini' },
]

const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'OpenRouter · GPT-4o Mini' },
  { id: 'openai/gpt-4o', name: 'OpenRouter · GPT-4o' },
  { id: 'openai/gpt-4o-audio-preview', name: 'OpenRouter · GPT-4o Audio' },
  { id: 'openai/gpt-4.5-preview', name: 'OpenRouter · GPT-4.5 Preview' },
  { id: 'openai/gpt-4.1', name: 'OpenRouter · GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', name: 'OpenRouter · GPT-4.1 Mini' },
  { id: 'openai/gpt-4.1-nano', name: 'OpenRouter · GPT-4.1 Nano' },
  { id: 'openai/gpt-5', name: 'OpenRouter · GPT-5' },
  { id: 'openai/gpt-5-mini', name: 'OpenRouter · GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', name: 'OpenRouter · GPT-5 Nano' },
  { id: 'openai/gpt-5-pro', name: 'OpenRouter · GPT-5 Pro' },
  { id: 'openai/gpt-5.1-codex', name: 'OpenRouter · GPT-5.1 Codex' },
  { id: 'openai/gpt-5.1-codex-max', name: 'OpenRouter · GPT-5.1 Codex Max' },
  { id: 'openai/gpt-5.1-instant', name: 'OpenRouter · GPT-5.1 Instant' },
  { id: 'openai/gpt-5.1-thinking', name: 'OpenRouter · GPT-5.1 Thinking' },
  { id: 'openai/gpt-5.2', name: 'OpenRouter · GPT-5.2' },
  { id: 'openai/gpt-5.2-chat', name: 'OpenRouter · GPT-5.2 Chat' },
  { id: 'openai/gpt-5.2-codex', name: 'OpenRouter · GPT-5.2 Codex' },
  { id: 'openai/gpt-5.2-pro', name: 'OpenRouter · GPT-5.2 Pro' },
  { id: 'openai/o1', name: 'OpenRouter · o1' },
  { id: 'openai/o3', name: 'OpenRouter · o3' },
  { id: 'openai/o3-mini', name: 'OpenRouter · o3 Mini' },
  { id: 'openai/o3-pro', name: 'OpenRouter · o3 Pro' },
  { id: 'openai/o4-mini', name: 'OpenRouter · o4 Mini' },
  { id: 'openai/o4-mini-high', name: 'OpenRouter · o4 Mini High' },
  { id: 'google/gemini-2.5-flash', name: 'OpenRouter · Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'OpenRouter · Gemini 2.5 Pro' },
  { id: 'google/gemini-2.0-flash', name: 'OpenRouter · Gemini 2.0 Flash' },
  { id: 'google/gemini-2.0-pro', name: 'OpenRouter · Gemini 2.0 Pro' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'OpenRouter · Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3.5-haiku', name: 'OpenRouter · Claude 3.5 Haiku' },
  { id: 'anthropic/claude-sonnet-4-6', name: 'OpenRouter · Claude Sonnet 4.6' },
  { id: 'anthropic/claude-opus-4-6', name: 'OpenRouter · Claude Opus 4.6' },
  { id: 'meta-llama/llama-4-scout', name: 'OpenRouter · Llama 4 Scout' },
  { id: 'meta-llama/llama-4-maverick', name: 'OpenRouter · Llama 4 Maverick' },
  { id: 'mistralai/mistral-large', name: 'OpenRouter · Mistral Large' },
  { id: 'mistralai/mistral-small', name: 'OpenRouter · Mistral Small' },
  { id: 'deepseek/deepseek-chat', name: 'OpenRouter · DeepSeek Chat' },
  { id: 'deepseek/deepseek-r1', name: 'OpenRouter · DeepSeek R1' },
  { id: 'deepseek/deepseek-v3', name: 'OpenRouter · DeepSeek V3' },
  { id: 'cohere/command-r-plus', name: 'OpenRouter · Command R+' },
  { id: 'cohere/command-r', name: 'OpenRouter · Command R' },
  { id: 'qwen/qwen-2.5-72b', name: 'OpenRouter · Qwen 2.5 72B' },
  { id: 'qwen/qwq-32b', name: 'OpenRouter · QwQ 32B' },
  { id: 'perplexity/sonar-pro', name: 'OpenRouter · Perplexity Sonar Pro' },
  { id: 'perplexity/sonar', name: 'OpenRouter · Perplexity Sonar' },
]

const FAL_CHAT_MODELS = [
  { id: 'fal-ai/llama-3.3-70b', name: 'LLaMA 3.3 70B (FAL)' },
  { id: 'fal-ai/mistral-large', name: 'Mistral Large (FAL)' },
  { id: 'fal-ai/llama-4-scout', name: 'Llama 4 Scout (FAL)' },
  { id: 'fal-ai/llama-4-maverick', name: 'Llama 4 Maverick (FAL)' },
  { id: 'fal-ai/deepseek-r1', name: 'DeepSeek R1 (FAL)' },
  { id: 'fal-ai/deepseek-v3', name: 'DeepSeek V3 (FAL)' },
  { id: 'fal-ai/qwen-2.5-72b', name: 'Qwen 2.5 72B (FAL)' },
  { id: 'fal-ai/mixtral-8x22b', name: 'Mixtral 8x22B (FAL)' },
  { id: 'fal-ai/phi-4', name: 'Phi-4 (FAL)' },
]

const OPENCODE_GO_MODELS = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash (Go)' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro (Go)' },
  { id: 'qwen3.7-max', name: 'Qwen3.7 Max (Go)' },
  { id: 'qwen3.7-plus', name: 'Qwen3.7 Plus (Go)' },
  { id: 'glm-5.2', name: 'GLM-5.2 (Go)' },
  { id: 'glm-5.1', name: 'GLM-5.1 (Go)' },
  { id: 'kimi-k2.7', name: 'Kimi K2.7 (Go)' },
  { id: 'mimo-v2.5', name: 'MiMo-V2.5 (Go)' },
  { id: 'minimax-m3', name: 'MiniMax M3 (Go)' },
]

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2' },
  { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5' },
]

const MODEL_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000
let modelCatalogCache = {
  expiresAt: 0,
  payload: null,
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 15000) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

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

function buildStaticModelCatalog() {
  return [
    ...(_interactionsModels || []).map(model => ({
      id: composeModelValue('gemini-interactions', model.id),
      modelId: model.id,
      provider: 'gemini-interactions',
      name: model.name,
    })),
    ...DIRECT_GEMINI_MODELS.map(model => ({
      id: composeModelValue('gemini', model.id),
      modelId: model.id,
      provider: 'gemini',
      name: model.name,
    })),
    ...GATEWAY_OPENAI_MODELS.map(model => ({
      id: composeModelValue('gateway', model.id),
      modelId: model.id,
      provider: 'gateway',
      name: model.name,
    })),
    ...OPENROUTER_MODELS.map(model => ({
      id: composeModelValue('openrouter', model.id),
      modelId: model.id,
      provider: 'openrouter',
      name: model.name,
    })),
    ...FAL_CHAT_MODELS.map(model => ({
      id: composeModelValue('fal', model.id),
      modelId: model.id,
      provider: 'fal',
      name: model.name,
    })),
    ...OPENCODE_GO_MODELS.map(model => ({
      id: composeModelValue('opencode', model.id),
      modelId: model.id,
      provider: 'opencode',
      name: model.name,
    })),
    ...ELEVENLABS_MODELS.map(model => ({
      id: composeModelValue('elevenlabs', model.id),
      modelId: model.id,
      provider: 'elevenlabs',
      name: model.name,
    })),
  ]
}

async function handleModelsList(res) {
  try {
    const now = Date.now()
    if (modelCatalogCache.payload && modelCatalogCache.expiresAt > now) {
      return sendJson(res, 200, modelCatalogCache.payload)
    }

    const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
    const models = []
    const seen = new Set()
    const diagnostics = getModelProviderDiagnostics()
    const addModel = model => {
      if (!model?.id || seen.has(model.id)) return
      seen.add(model.id)
      models.push(model)
    }

    const isOpenRouterConfigured =
      diagnostics.openrouterConfigured ||
      apiBase.includes('openrouter.ai') ||
      (process.env.OPENAI_API_BASEROUTER && process.env.OPENAI_API_BASEROUTER.includes('openrouter.ai'))

    if (isOpenRouterConfigured) {
      const openRouterBase = apiBase.includes('openrouter.ai') ? apiBase : process.env.OPENAI_API_BASEROUTER
      const openRouterKey = apiBase.includes('openrouter.ai') ? process.env.OPENAI_API_KEY : process.env.OPENAI_API_KEYROUTER

      try {
        const { response, data } = await fetchJsonWithTimeout(`${openRouterBase}/models`, {
          headers: { Authorization: `Bearer ${openRouterKey}` },
        })
        if (response.ok) {
          for (const model of data.data || []) {
            addModel({
              id: composeModelValue('openrouter', model.id),
              modelId: model.id,
              provider: 'openrouter',
              name: model.name || model.id,
            })
          }
        }
      } catch (err) {
        console.error('Fetch OpenRouter models failed:', err)
      }
    }

    const fetchModels = async (url, headers, provider, keyField = 'id', nameField = 'name', dataField = 'data') => {
      try {
        const { response: res, data: json } = await fetchJsonWithTimeout(url, { headers }, 10000)
        if (!res.ok) return
        const items = dataField ? json[dataField] || json.models || json.data || [] : json
        for (const item of items) {
          const id = item[keyField] || item.id || item.name
          if (!id) continue
          addModel({ id: composeModelValue(provider, id), modelId: id, provider, name: item[nameField] || item.name || id })
        }
      } catch (e) { console.error(`[fetchModels] ${provider} failed:`, e?.message?.substring(0, 80)) }
    }

    if (process.env.GEMINI_API_KEY) {
      await fetchModels('https://generativelanguage.googleapis.com/v1/models', { 'x-goog-api-key': process.env.GEMINI_API_KEY }, 'gemini', 'name', 'displayName', 'models')
    }
    if (process.env.ELEVENLABS_API_KEY) {
      await fetchModels('https://api.elevenlabs.io/v1/models', { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, 'elevenlabs', 'model_id', 'name', null)
    }
    if (process.env.FAL_KEY) {
      await fetchModels('https://fal.ai/api/models?limit=200', { Authorization: `Key ${process.env.FAL_KEY}` }, 'fal', 'id', 'title', 'items')
    }
    if (process.env.OPENCODE_GO_API_KEY) {
      await fetchModels('https://opencode.ai/zen/go/v1/models', { Authorization: 'Bearer ' + process.env.OPENCODE_GO_API_KEY }, 'opencode')
    }
    if (process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEYROUTER) {
      await fetchModels('https://api.openai.com/v1/models', { Authorization: 'Bearer ' + (process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEYROUTER) }, 'openai')
    }

    for (const model of buildStaticModelCatalog()) {
      addModel(model)
    }

    const providerOrder = ['gemini-interactions', 'gemini', 'openrouter', 'fal', 'opencode', 'openai', 'gateway', 'elevenlabs', 'firebase']
    models.sort((left, right) => {
      const leftIdx = providerOrder.indexOf(left.provider)
      const rightIdx = providerOrder.indexOf(right.provider)
      const providerCompare = (leftIdx === -1 ? 999 : leftIdx) - (rightIdx === -1 ? 999 : rightIdx)
      if (providerCompare !== 0) return providerCompare
      return String(left.name || left.id || '').localeCompare(String(right.name || right.id || ''))
    })
    const payload = { ok: true, provider: 'mixed', models, providerDiagnostics: diagnostics }
    modelCatalogCache = {
      expiresAt: now + MODEL_CATALOG_CACHE_TTL_MS,
      payload,
    }
    return sendJson(res, 200, payload)
  } catch (err) {
    const fallback = buildStaticModelCatalog()
    return sendJson(res, 200, { ok: true, provider: 'mixed', models: fallback, providerDiagnostics: {}, note: 'live_fetch_failed_fallback' })
  }
}

// APEX_FREE_AGENT (default ON): conversational messages bypass the old
// template router and go straight to the Live Agent flow. Set
// APEX_FREE_AGENT=0 to restore the legacy operator-only behavior.
const APEX_FREE_AGENT = !/^(0|false|off)$/i.test(String(process.env.APEX_FREE_AGENT ?? '1'))

// PDF summary pattern — triggers local extraction-based summary
const PDF_SUMMARY_PATTERN = /\b(resuma|analise|analisa|resume|sumari[sz]|principais?|pontos?|extraia|extrair|o que (fala|diz|trata)|me (conta|diga|fale)|sobre o que|resumo|síntese|sinopse)\b/i

// H5.0D: action tools that must always bypass conversation/connector router
const H5_ACTION_TOOLS = new Set([
  'local_worker.status',
  'revit_mcp.status',
  'revit_model.status',
  'vercel.deploy',
  'supabase.migration',
])

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const runtimeKnowledgePath = path.resolve(__dirname, '../../src/lib/runtimeKnowledge.json')

function loadRuntimeKnowledge() {
  return JSON.parse(fs.readFileSync(runtimeKnowledgePath, 'utf8'))
}

function stripGovernanceRestrictions(lines = []) {
  return (Array.isArray(lines) ? lines : []).filter(line => {
    const text = String(line || '')
    return !/\b(do not|never|forbidden|blocked|requires confirmation|requires explicit|must not|nunca|proibido|bloqueado|exige confirmação|sem confirmação)\b/i.test(text)
  })
}

function prefersPortugueseText(text = '') {
  return /\b(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|vc|voce|você|quem sou|o que|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra|teste)\b|[ãõçáéíóú]/i.test(text)
}

function isCapabilitiesQuestionText(text = '') {
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
}

function isContactQuestionText(text = '') {
  return /\b(como entrar em contato|falar com o suporte|falar com a equipe|telefone de contato|e-mail de contato|consultoria de contato|falar com|contact information|how to contact|contact support)\b/i.test(text.trim())
}

function isUploadQuestionText(text = '') {
  const trimmed = text.trim()
  if (/\b(pdf\.js|pdfjs|pdf-js)\b/i.test(trimmed)) return false
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(trimmed)
}

function isGreetingText(text = '') {
  return /^\s*(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|hello|hi|hey|test|teste)\s*[.!?]?\s*$/i.test(text.trim())
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

function isIdentityQuestionText(text) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(String(text || '').trim())
}

function buildIdentityReply(userText, identity) {
  if (!isIdentityQuestionText(userText)) return ''
  return `Você está logado como ${identity.email || 'owner_admin (jedgard70@gmail.com)'}, role ${identity.role || 'owner_admin'}, workspace ${identity.workspaceName || 'Apex Platform'} — acesso total autorizado por Dr. Edgard.`
}

function buildChatFallbackReply(userText, identity, file = null) {
  const identityReply = buildIdentityReply(userText, identity)
  if (identityReply) return identityReply
  const pt = prefersPortugueseText(userText)
  if (isGreetingText(userText)) {
    return pt
      ? 'Sou a Apex. Me passe a tarefa que eu executo agora. Se faltar conector, te digo exatamente o que falta e sigo com alternativa útil.'
      : 'I am Apex. Give me the task to execute now. If a connector is missing, I will tell you exactly what is missing and proceed with a useful fallback.'
  }
  if (file && file.extractedText && isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Com este arquivo ativo, posso resumir, extrair pontos, responder perguntas, transformar em briefing/relatório e partir para uma ação prática sem enrolar.'
      : 'With this file active, I can summarize, extract points, answer questions, turn it into a briefing/report, and move straight into a practical action.'
  }
  if (isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Consigo resolver tarefas reais em código, documentos, BIM/3D, dados e operação. Quando algo depender de conector/credencial, eu respondo direto: "ok, para executar isso agora precisamos de X e Y; você já está providenciando; enquanto isso eu sigo com fallback útil".'
      : 'I can solve real tasks across code, documents, BIM/3D, data, and operations. If something depends on a missing connector/credential, I state it clearly and continue with what can be done now without faking capability.'
  }
  if (isContactQuestionText(userText)) {
    return pt
      ? 'Posso ajudar a preparar a consulta. Envie nome, email, telefone, cidade, tipo de projeto e o que precisa: BIM, 3D, contrato, alvará, proposta, financeiro, marketing ou operação de campo.'
      : 'I can help prepare the consultation. Send name, email, phone, city, project type and what you need: BIM, 3D, contract, permit, proposal, finance, marketing or field operations.'
  }
    if (isUploadQuestionText(userText)) {
      if (file && file.extractionStatus === 'ready' && String(file.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i.test(userText || '')) {
        return buildLocalDocSummary(file.name, file.pageCount || 0, file.extractedText || '', file.kind)
      }
      return 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botão de anexar. Eu uso o arquivo como contexto e continuo com a ação em vez de parar para explicar o processo.'
    }
    return pt
        ? 'Entendido! Estou pronta para trabalhar com os arquivos e o contexto disponíveis. Me diga o que precisamos analisar ou criar no projeto.'
        : 'Understood! I\'m ready to work with the available files and context. Tell me what we need to analyze or create in the project.'
  }

  function buildLocalDocSummary(fileName, pageCount, extractedText, fileKind) {
    const text = String(extractedText || '').trim()
    const snippet = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,6).join(' ').replace(/\s+/g, ' ').slice(0,800)
    const isPdf = fileKind === 'pdf'
    const isCode = /code|def|import|class|function|let|const|var|module/i.test(text)
    const tipo = isPdf ? (/certida/i.test(text) ? 'Certidão (PDF)' : /relat/i.test(text) ? 'Relatório (PDF)' : 'Documento (PDF)') : (isCode ? 'Código Fonte' : 'Documento de Texto')
    const numberMatch = text.match(/(?:Certid[aã]o\s*(?:n[oº]?\.?|n[oº]?|\:)?\s*([\w\-\/\.]+))/i) || text.match(/\b(n[oº]\s*[:\-]?\s*([\d\-\/\.]+))/i)
    const certNumber = numberMatch ? (numberMatch[1] || numberMatch[2]) : undefined
    const dateMatches = Array.from(new Set([...(text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || []), ...(text.match(/\b\d{1,2}\s+de\s+[A-Za-zçãéíóú]+\s+de\s+\d{4}\b/gi) || [])])).slice(0,5)
    const ext = fileName ? fileName.split('.').pop() : ''
    const nameFromFile = fileName ? fileName.replace(new RegExp(`\\.${ext}$`, 'i'), '').split('-').pop().trim() : null
    const orgMatch = text.match(/\b(Servi[cç]o P[uú]blico Federal|Servi[cç]o P[uú]blico|Prefeitura|Cart[oó]rio|Tribunal|Secretaria|Minist[eé]rio|Junta|Cartorio|Conselho|Registro)\b/i)
    const org = orgMatch ? orgMatch[0] : undefined

    const mainPoints = []
    if (snippet) mainPoints.push(snippet)
    if (certNumber) mainPoints.push(`Número: ${certNumber}`)
    if (dateMatches.length) mainPoints.push(`Datas relevantes: ${dateMatches.join(', ')}`)
    if (org) mainPoints.push(`Órgão emissor: ${org}`)

    const conclusion = isCode
      ? 'Código/Arquivo de texto lido com sucesso pela Apex. O conteúdo completo foi injetado como habilidade real de conversação no modelo.'
      : (/certida/i.test(text)
        ? 'Documento de natureza administrativa/registral. Recomenda-se verificar assinaturas e autenticidade no cartório/órgão emissor quando necessário.'
        : 'Resumo gerado a partir do texto extraído; revisar o documento completo para decisões finais.')

    const parts = []
    parts.push(`Resumo local de ${fileName}:`)
    parts.push('')
    parts.push('Tipo de documento:')
    parts.push(tipo)
    parts.push('')
    parts.push('Finalidade:')
    parts.push(isCode ? 'Implementação/Lógica de software ou dados.' : (/certida/i.test(text) ? 'Certificar/atestar informação legal registrada.' : 'Informar/registrar dados oficiais contidos no documento.'))
    parts.push('')
    parts.push('Principais informações:')
    if (mainPoints.length) {
      mainPoints.forEach(p => parts.push(`- ${p}`))
    } else {
      parts.push('- Conteúdo extraído disponível, mas sem pontos claros identificáveis automaticamente.')
    }
    parts.push('')
    parts.push('Dados relevantes identificados:')
    parts.push(`- Nome: ${nameFromFile || 'Não identificado'}`)
    parts.push(`- Órgão: ${org || 'Não identificado'}`)
    if (certNumber) parts.push(`- Número da certidão: ${certNumber}`)
    parts.push(`- Datas: ${dateMatches.length ? dateMatches.join(', ') : 'Não identificadas'}`)
    parts.push('')
    parts.push('Conclusão:')
    parts.push(conclusion)
    parts.push('')
    parts.push('Limitações:')
    parts.push('Resumo gerado a partir do texto extraído automaticamente.')

    return parts.join('\n')
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
  const hasPtKeywords = /\b(o que|vc|você|voce|sabe|fazer|fa[cç]a|crie|criar|gere|gerar|liste|lista|habilidades|capacidades|servi[cç]os|preciso|ajuda|ajudar|me ajuda|ajude|planta|projeto|quero|posso|opcoes|opções|mostre|portugu[eê]s|render|or[cç]amento|cronograma|marketing|vendas|upload|arquivo|an[uú]ncio|cliente|contrato|programar|componente|c[oó]digo|traduza|traduzir|quem|sou|verifique|verificar|auditar|auditoria|revisar|revisao|codigo|arquivos|erro|erros|teste|testar|rodar|executar|deploy|branch|main|github|vercel|supabase|sim|nao|não|olá|oi|ola|bom dia|boa tarde|boa noite)\b/i.test(latestUserText) || /[ãõçáéíóú]/i.test(latestUserText)
  if (isPtLocale || hasPtKeywords) return 'Portuguese'
  return 'English'
}

function buildStyleInstruction(userText, file) {
  const intent = detectIntent(userText)
  if (intent.isHiddenUpload && file) {
    return [
      'Style for this first upload reply: answer in one short natural paragraph.',
      'Do not create a plan, checklist, bullet list or numbered list.',
      'Mention only 2 to 4 concrete things visible or inferable from the file.',
      'Ask one practical question at the end.',
    ].join('\n')
  }
  if (intent.asksExecution || (intent.asksSalesOutput && file)) {
    return [
      'Style for this reply: the user is asking for an output. Produce the output now.',
      'Do not explain the process.',
      'Do not answer with advice about how to create it.',
      'Do not ask another question if enough context exists.',
      'A short intro is fine, then provide the deliverable directly.',
      'If truly blocked by missing critical input, ask only the one missing question.',
      intent.asksTranslation ? 'For direct translation, output only the translation unless the user asks for notes.' : '',
      intent.asksCodeOutput ? 'For code requests, provide the code directly in the user language context, with only minimal usage note if helpful.' : '',
    ].filter(Boolean).join('\n')
  }
  const asksForStructuredOutput = /\b(report|relatorio|relat[oó]rio|checklist|lista|liste|bullet|tabela|table|format|formato|plano detalhado)\b/i.test(userText)
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
    'Style for this reply: answer like a live chat consultant.',
    'Use one or two natural paragraphs by default.',
    'Do not use markdown headings.',
    'Do not use bullet or numbered lists.',
    'Do not write "Here are a few observations", "Aqui estao algumas observacoes", "Observations", "Capabilities", or similar report framing.',
    'If an image is supplied, mention 2 to 4 concrete visible details in natural prose.',
    'Ask exactly one practical next-step question.',
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
      'Capability rule: the user is asking for your abilities. List the full Apex AI Copilot capability set clearly, with no construction-only framing.',
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
      'Execution rule: build the output now. If user wants a proposal, contract, script, RDO or custom code, produce it.',
      '1. Draft/write the full output.',
      '2. Present it in a clean code block or paragraph structure.',
      '3. Make it ready to copy.',
      '4. Do not offer a blank template.',
    )
  }
  if (intent.asksRenderPrompt && file) {
    instructions.push(
      'Image rendering prompt rule: write the stable-diffusion/midjourney render prompt.',
      'Include structure, materials, lighting, camera and environment.',
      'Add negative prompt for modifications if applicable.',
    )
  }
  if (intent.asksSalesOutput && file) {
    instructions.push(
      'Sales copy rule: write the commercial pitch, client proposal, outreach copy, landing page section or ad copy.',
      'Focus on international offshore BIM modeling, Revit/permit design, tech documentation or offshore partner value.',
    )
  }
  if (intent.asksContractDraft) {
    instructions.push(
      'Contract draft rule: write the basic service agreement, client terms, NDA or offshore developer contract copy.',
    )
  }
  if (intent.asksCapabilities && !file) {
    instructions.push(
      'When user asks capabilities, avoid scripted introductions and marketing tone.',
      'Answer in a real, direct tone: what is operational now, what depends on connector, and what is not available yet.',
    )
  }
  if (intent.isHiddenUpload && file && prefersPortugueseText(userText)) {
    instructions.push(
      'Para o primeiro upload de arquivo, use a seguinte estrutura de resposta:',
      '1. Dizer que recebeu o arquivo e fazer uma rápida leitura visual ou de metadados de 2 a 4 linhas.',
      '2. Dar 3 a 5 opções numeradas e práticas de próximas ações.',
      'Exemplo de ações recomendadas:',
      '1. Criar prompt de render ou briefing visual para ArchViz.',
      '2. Analisar o modelo BIM / 3D Studio ou fluxo de importação.',
      '3. Levantar quantitativos de custos para orçamento.',
      '4. Roteirizar timelapse, vídeo ou animação de câmera.',
      '5. Preparar proposta técnica ou contrato com base no escopo.',
      '6. Criar texto de venda para anuncio, site ou proposta.',
      '7. Levantar duvidas tecnicas para orcamento.',
      '8. Separar proximos arquivos necessarios para BIM/3D.',
      'Do not ask a question before this list.',
    )
  }
  return instructions.join('\n')
}

function buildToolSummary(tools) {
  return tools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
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
        val = valStr.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      }
    }
    metadata[key] = val
  }
  return { metadata, body }
}

let cachedSkills = null

function scanDirRecursive(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  try {
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const filepath = path.join(dir, file)
      const stat = fs.statSync(filepath)
      if (stat && stat.isDirectory()) {
        results = results.concat(scanDirRecursive(filepath))
      } else if (file.toLowerCase().endsWith('.md') && (file.toLowerCase().endsWith('_skill.md') || file.toLowerCase().includes('skill'))) {
        results.push(filepath)
      }
    }
  } catch (err) {
    console.error(`[chat-api] Erro ao escanear diretório ${dir}:`, err)
  }
  return results
}

function loadDynamicSkills() {
  if (cachedSkills) return cachedSkills

  const skills = []
  const dirs = [
    path.resolve(__dirname, '../../docs'),
    path.resolve(__dirname, '../../skills')
  ]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    try {
      const filepaths = scanDirRecursive(dir)
      for (const filepath of filepaths) {
        const file = path.basename(filepath)
        const content = fs.readFileSync(filepath, 'utf8')
        const { metadata, body } = parseFrontmatter(content)
        skills.push({
          filepath,
          filename: file,
          title: metadata.title || file.replace(/\.md$/i, ''),
          description: metadata.description || '',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          body: body.trim()
        })
      }
    } catch (err) {
      console.error(`[chat-api] Erro ao carregar skills do diretório ${dir}:`, err)
    }
  }

  cachedSkills = skills
  return skills
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
  if (/(custo de ia|gasto com ia|tokens|observabilidade|custo openai|ai cost|billing|usage dashboard)/.test(text)) {
    contexts.push('CP11E AI Cost / Observability: local estimated usage and cost only. Do not claim provider billing accuracy. Use ESTIMATED_LOCAL until real billing/usage API is connected.')
  }

  // Load dynamic skills
  try {
    const dynamicSkills = loadDynamicSkills()
    for (const skill of dynamicSkills) {
      const matchesTag = skill.tags.some(tag => text.includes(tag.toLowerCase()))
      const matchesTitle = skill.title.toLowerCase().split(/\s+/).some(word => word.length > 3 && text.includes(word))
      if (matchesTag || matchesTitle) {
        contexts.push(`Skill [${skill.title}]: ${skill.description}\nRules and Guidelines:\n${skill.body}`)
      }
    }
  } catch (err) {
    console.error('[chat-api] Erro ao carregar skills dinâmicas:', err)
  }

  if (!contexts.length) {
    contexts.push('Platform: Apex AI Copilot is a command-first full AI assistant. Chat is primary; modules and connectors are optional execution paths.')
  }
  return contexts.slice(0, 8).join('\n\n')
}

function buildFileContext(file) {
  if (!file) return 'No uploaded file.'
  const lines = [
    'Uploaded file metadata:',
    `- name: ${file.name || 'unknown'}`,
    `- type: ${file.type || 'unknown'}`,
    `- kind: ${file.kind || 'unknown'}`,
    `- size: ${file.size || 'unknown'}`,
    file.dataUrl ? '- image content: supplied as data URL for vision analysis' : '- image/file content: not supplied; use metadata honestly',
  ]
  if (file.pageCount) lines.push(`- pageCount: ${file.pageCount}`)
  if (file.extractedText) {
    lines.push('', 'Extracted text from the active file:', String(file.extractedText).slice(0, 120000))
  }
  return lines.join('\n')
}

// Provider status — fast local check (no external calls, just env presence + last known state)
// For full live check use /api/copilot/provider-status. This is lightweight for chat context.
function buildProviderStatusContext() {
  const checks = [
    { name: 'OpenAI/Gemini', key: process.env.OPENAI_API_KEY },
    { name: 'fal.ai', key: process.env.FAL_KEY },
    { name: 'AI Gateway/Veo', key: process.env.AI_GATEWAY_API_KEY },
    { name: 'ElevenLabs', key: process.env.ELEVENLABS_API_KEY },
    { name: 'Tavily', key: process.env.TAVILY_API_KEY },
    { name: 'Stripe', key: process.env.STRIPE_SECRET_KEY },
    { name: 'Supabase', key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY },
    { name: 'GitHub', key: process.env.GITHUB_TOKEN },
    { name: 'AuthKey', key: process.env.AUTHKEY_AUTHKEY },
  ]
  const configured = checks.filter(c => c.key).map(c => c.name)
  const missing = checks.filter(c => !c.key).map(c => c.name)
  const lines = ['Provider key presence (env snapshot):']
  if (configured.length) lines.push(`Configured: ${configured.join(', ')}`)
  if (missing.length) lines.push(`Not configured: ${missing.join(', ')}`)
  lines.push('For live balance/quota check, the user can ask to open the Platform Map (status das keys tab) or call /api/copilot/provider-status.')
  lines.push('If user asks about provider balance or "precisa recarregar", suggest opening the Platform Map status tab for real-time info.')
  return lines.join('\n')
}

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
                'docsedgard_skill'
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
        name: 'send_authkey_message',
        description: 'Send a real SMS or OTP through Authkey when the user explicitly provides destination and asks to send/verify/notify. Never use for bulk campaigns unless explicitly requested and confirmed.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            action: {
              type: 'string',
              enum: ['sms', 'otp'],
              description: 'Use sms for a plain approved SMS message, otp for an Authkey OTP template/SID.'
            },
            mobile: {
              type: 'string',
              description: 'Recipient phone number, digits only or formatted.'
            },
            countryCode: {
              type: 'string',
              description: 'Country code without plus sign. Defaults to AUTHKEY_DEFAULT_COUNTRY_CODE or 55.'
            },
            message: {
              type: 'string',
              description: 'SMS body for action=sms. Must match approved template rules where required.'
            },
            sid: {
              type: 'string',
              description: 'Optional Authkey SID/template id for action=otp.'
            }
          },
          required: ['action', 'mobile']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the internet for real-time market data, competitor information, prices, standards, or general technical resources.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute on the web.'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'generate_image',
        description: 'Generate an image for architecture/design requests. Use when user explicitly asks to create/render/generate an image.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            prompt: {
              type: 'string',
              description: 'The final image prompt. If omitted, derive from user request.'
            },
            size: {
              type: 'string',
              enum: ['1024x1024', '1024x1792', '1792x1024'],
              description: 'Image size'
            },
          },
          required: [],
        }
      }
    },
    ...buildCodeToolDefinitions(),
  ]
}

function getChatProvider() {
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return null
}

function flattenMessageText(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map(msg => {
      if (!msg) return ''
      if (typeof msg.content === 'string') return msg.content
      if (Array.isArray(msg.content)) {
        return msg.content
          .map(block => {
            if (!block) return ''
            if (block.type === 'text') return String(block.text || '')
            if (block.type === 'image_url') return ''
            return String(block.text || block.content || '')
          })
          .join('\n')
      }
      return String(msg.content || '')
    })
    .join('\n')
}

async function callGeminiChat(model, messages, apiKey) {
  const startTime = Date.now()
  try {
    // Convert OpenAI-format messages to Gemini contents format
    const contents = []
    let systemInstruction = null
    for (const msg of messages) {
      if (msg.role === 'system') {
        const text = typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content.map(p => p.text || '').join('\n') : '')
        systemInstruction = { parts: [{ text: text.slice(0, 8000) }] }
        continue
      }
      const role = msg.role === 'assistant' ? 'model' : 'user'
      let text = typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content.map(p => p.text || p.type === 'image_url' ? '[image]' : '').join('\n') : '')
      contents.push({ role, parts: [{ text: text.slice(0, 8000) }] })
    }

    const payload = { contents, generationConfig: { temperature: 0.72, maxOutputTokens: 900 } }
    if (systemInstruction) payload.systemInstruction = systemInstruction

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    const duration = Date.now() - startTime
    const success = res.ok && !data.error

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
    const usage = data?.usageMetadata || {}

    recordCallSafe({
      provider: 'gemini',
      model,
      latencyMs: duration,
      success,
      tokensIn: usage.promptTokenCount || 0,
      tokensOut: usage.candidatesTokenCount || usage.totalTokenCount || 0,
      errorMsg: success ? null : (data?.error?.message || `HTTP ${res.status}`),
    })

    return {
      provider: 'gemini',
      response: { ok: success, status: res.status },
      data: { choices: [{ message: { content: text } }], model, usage },
      usedFallback: false,
    }
  } catch (err) {
    recordCallSafe({ provider: 'gemini', model, latencyMs: Date.now() - startTime, success: false, errorMsg: err.message })
    return { provider: 'gemini', response: { ok: false, status: 0 }, data: {}, usedFallback: false }
  }
}

async function callOpenAIChat(requestPayload, overrideConfig) {
  const startTime = Date.now()
  const resolved = getOpenAIConfig(requestPayload.model)
  const apiBase = overrideConfig?.apiBase || resolved.apiBase
  const apiKey = overrideConfig?.apiKey || resolved.apiKey
  const providerLabel = apiBase.includes('openrouter.ai') ? 'openrouter' : apiBase.includes('generativelanguage') ? 'gemini' : apiBase.includes('fal.ai') ? 'fal' : apiBase.includes('opencode') ? 'opencode' : apiBase.includes('elevenlabs') ? 'elevenlabs' : 'openai'
  const modelName = requestPayload.model || 'unknown'
  const headers = {
    'Content-Type': 'application/json',
  }
  // Gemini/Google uses x-goog-api-key or URL param, NOT Bearer token
  if (apiBase.includes('generativelanguage')) {
    headers['x-goog-api-key'] = apiKey
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (apiBase.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://apexglobalai.com'
    headers['X-OpenRouter-Title'] = 'Apex AI Copilot'
  }

  let success = false
  let data = null
  let errorMsg = null

  try {
    const primaryResponse = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    })
    data = await primaryResponse.json().catch(() => ({}))
    success = primaryResponse.ok

    if (!primaryResponse.ok) {
      errorMsg = `HTTP ${primaryResponse.status}`
      console.error('[callOpenAIChat] Primary failed:', primaryResponse.status)
      try {
        const { chatWithFallback } = await import('../../server/providers/providerRouter.mjs')
        const fallbackResult = await chatWithFallback({
          messages: requestPayload.messages,
          tools: requestPayload.tools,
          temperature: requestPayload.temperature || 0.72,
          maxTokens: requestPayload.max_tokens || 900,
        })
        if (fallbackResult.ok) {
          success = true
          errorMsg = null
          console.log('[callOpenAIChat] Fallback bem-sucedido via', fallbackResult.provider)
          recordCallSafe({ provider: fallbackResult.provider || 'fallback', model: modelName, latencyMs: Date.now() - startTime, success: true, tokensIn: fallbackResult.data?.usage?.prompt_tokens || 0, tokensOut: fallbackResult.data?.usage?.completion_tokens || 0 })
          return { provider: fallbackResult.provider, response: { ok: true, status: 200 }, data: fallbackResult.data, usedFallback: true }
        }
        errorMsg = `Primary ${primaryResponse.status}, fallback failed`
      } catch (fbErr) {
        errorMsg = `Primary ${primaryResponse.status}, fallback: ${fbErr.message}`
        console.error('[callOpenAIChat] Fallback falhou:', fbErr.message)
      }
    }
  } catch (err) {
    errorMsg = err.message
  }

  const duration = Date.now() - startTime
  recordCallSafe({
    provider: providerLabel,
    model: modelName,
    latencyMs: duration,
    success,
    tokensIn: data?.usage?.prompt_tokens || 0,
    tokensOut: data?.usage?.completion_tokens || 0,
    errorMsg,
  })

  return { provider: providerLabel, response: success ? { ok: true, status: 200 } : { ok: false, status: data ? 500 : 0 }, data: data || {}, usedFallback: false }
}

const MAX_DIRECT_COMMAND_OUTPUT_BYTES = 80_000

function appendLimitedOutput(current, chunk) {
  const next = current + chunk
  if (Buffer.byteLength(next, 'utf8') <= MAX_DIRECT_COMMAND_OUTPUT_BYTES) return next
  return next.slice(0, MAX_DIRECT_COMMAND_OUTPUT_BYTES) + '\n[output truncated]'
}

async function runDirectLocalCommand(commandText, cwd, timeoutMs = 45_000) {
  return await new Promise(resolve => {
    let stdout = ''
    let stderr = ''
    let exitCode = null
    let settled = false
    let timedOut = false

    const child = spawn(commandText, [], {
      cwd,
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    })

    const finish = status => {
      if (settled) return
      settled = true
      resolve({
        status,
        stdout: stdout.slice(0, MAX_DIRECT_COMMAND_OUTPUT_BYTES),
        stderr: stderr.slice(0, MAX_DIRECT_COMMAND_OUTPUT_BYTES),
        exitCode,
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      stderr = appendLimitedOutput(stderr, `\nCommand timed out after ${timeoutMs}ms.`)
      child.kill('SIGTERM')
    }, timeoutMs)

    child.stdout.on('data', chunk => {
      stdout = appendLimitedOutput(stdout, chunk.toString('utf8'))
    })
    child.stderr.on('data', chunk => {
      stderr = appendLimitedOutput(stderr, chunk.toString('utf8'))
    })

    child.on('error', err => {
      clearTimeout(timer)
      stderr = appendLimitedOutput(stderr, String(err?.message || err))
      finish('failed')
    })

    child.on('close', code => {
      clearTimeout(timer)
      exitCode = code
      finish(timedOut ? 'timeout' : code === 0 ? 'completed' : 'failed')
    })
  })
}

async function executeLiveAgentToolCall(toolCall) {
  const name = toolCall && toolCall.function ? String(toolCall.function.name || '') : ''

  if (name === 'generate_image') {
    let args = {}
    try {
      args = JSON.parse(toolCall.function.arguments || '{}')
    } catch {
      return { error: 'Invalid tool arguments.' }
    }
    const providedPrompt = String(args.prompt || '').trim()
    const size = String(args.size || '1024x1024')
    const inferredType = classifyImageGenRequest(providedPrompt) || 'architectural_render'
    const built = buildImagePrompt(providedPrompt || 'Contemporary modern facade at sunset, photorealistic architecture rendering.', inferredType)
    const finalPrompt = providedPrompt || built.prompt
    const result = await generateImage({ prompt: finalPrompt, size, quality: 'standard', model: 'dall-e-3' })
    if (!result.ok) {
      return {
        ok: false,
        providerStatus: 'image-generation-unavailable',
        reason: result.reason || 'Image generation failed.',
        prompt: finalPrompt,
        fallbackReply: buildImageResultReply(result, finalPrompt),
      }
    }
    return {
      ok: true,
      providerStatus: 'image-generated',
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt || finalPrompt,
      model: result.model,
      size: result.size,
      reply: buildImageResultReply(result, finalPrompt),
    }
  }

  if (name === 'send_authkey_message') {
    let args = {}
    try {
      args = JSON.parse(toolCall.function.arguments || '{}')
    } catch {
      return { error: 'Invalid tool arguments.' }
    }
    const action = String(args.action || '').toLowerCase()
    const mobile = String(args.mobile || '').trim()
    const countryCode = String(args.countryCode || '').trim()
    if (action === 'otp') {
      const result = await sendAuthkeyOtp({ mobile, countryCode, sid: args.sid })
      return { ...result, providerStatus: result.ok ? 'authkey-otp-sent' : 'authkey-unavailable', reply: buildAuthkeyResultReply(result, 'OTP') }
    }
    const message = String(args.message || '').trim()
    const result = await sendAuthkeySms({ mobile, countryCode, message })
    return { ...result, providerStatus: result.ok ? 'authkey-sms-sent' : 'authkey-unavailable', reply: buildAuthkeyResultReply(result, 'SMS') }
  }

  if (name === 'web_search') {
    let args = {}
    try {
      args = JSON.parse(toolCall.function.arguments || '{}')
    } catch {
      return { error: 'Invalid tool arguments.' }
    }
    const query = String(args.query || '').trim()
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query.slice(0, 400))}&format=json&no_redirect=1&no_html=1`
        const resp = await fetch(ddgUrl, { method: 'GET' })
        const data = await resp.json().catch(() => ({}))
        const relatedTopics = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : []
        const flatTopics = []
        for (const item of relatedTopics) {
          if (item?.Text && item?.FirstURL) {
            flatTopics.push(item)
          } else if (Array.isArray(item?.Topics)) {
            for (const child of item.Topics) {
              if (child?.Text && child?.FirstURL) flatTopics.push(child)
            }
          }
        }
        return {
          provider: 'duckduckgo',
          answer: data?.AbstractText || null,
          results: flatTopics.slice(0, 5).map(item => ({
            title: String(item.Text || '').slice(0, 160),
            url: item.FirstURL,
            content: String(item.Text || '').slice(0, 400),
          })),
          note: 'Web search running in fallback mode (DuckDuckGo) because TAVILY_API_KEY is not configured.',
        }
      } catch (err) {
        return {
          error: 'Failed to execute fallback web search: ' + err.message,
          note: 'Configure TAVILY_API_KEY for richer search results.',
        }
      }
    }
    try {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavilyKey}` },
        body: JSON.stringify({
          query: query.slice(0, 400),
          search_depth: 'basic',
          max_results: 5,
          include_answer: true
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        return { error: data?.error?.message || `Tavily API returned HTTP ${resp.status}` }
      }
      return {
        results: (data.results || []).map(r => ({ title: r.title, url: r.url, content: r.content })),
        answer: data.answer || null
      }
    } catch (err) {
      return { error: 'Failed to execute web search: ' + err.message }
    }
  }

  // Real code/filesystem/command tools (read/list/search/write/edit/run).
  if (CODE_TOOL_NAMES.has(name)) {
    const repoRoot = path.resolve(__dirname, '../../')
    return await executeCodeToolCall(toolCall, repoRoot)
  }

  if (name !== 'run_safe_local_command') {
    return { providerStatus: 'blocked', error: 'Unknown Apex live agent tool.' }
  }

  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { providerStatus: 'blocked', error: 'Invalid tool arguments.' }
  }

  const commandId = String(args.commandId || '')
  const reason = String(args.reason || '').slice(0, 500)

  const hasLocalWorker = Boolean(
    (process.env.LOCAL_WORKER_URL || process.env.Local_Worker_URL)
    && (process.env.LOCAL_WORKER_TOKEN || process.env.Local_Worker_TOKEN)
  )
  if (hasLocalWorker) {
    let action = ''
    let params = {}
    const rawCommand = String(args.rawCommand || '').trim()
    if (commandId === 'git_status') {
      action = 'project.git_status'
    } else if (commandId === 'git_diff_stat') {
      action = 'project.git_diff_stat'
    } else if (commandId === 'git_log_recent') {
      action = 'project.git_log'
    } else if (commandId === 'git_diff_name_only') {
      action = 'project.git_diff'
    } else if (commandId === 'build') {
      action = 'project.build_check'
    } else if (commandId === 'check_server') {
      action = 'system.info'
    } else if (commandId === 'validate_supabase_sql') {
      action = 'project.raw_shell'
      params = { command: 'npm run validate:supabase-sql' }
    } else if (commandId === 'raw_shell') {
      action = 'project.raw_shell'
      params = { command: rawCommand }
    } else if (commandId === 'validate_vercel_live') {
      action = 'project.raw_shell'
      params = { command: 'node scripts/validate-vercel.mjs' }
    } else if (commandId === 'validate_supabase_live') {
      action = 'project.raw_shell'
      params = { command: 'node scripts/validate-supabase-live.mjs' }
    } else if (commandId === 'deploy_vercel_live') {
      action = 'project.raw_shell'
      params = { command: 'node scripts/deploy-vercel-live.mjs' }
    } else if (commandId === 'skill_audit') {
      action = 'project.skill_audit'
    } else if (commandId === 'revit_generate') {
      action = 'project.revit_generate'
      params = { name: rawCommand }
    } else if (commandId === 'marketing_generate') {
      action = 'project.marketing_generate'
      params = { type: rawCommand }
    } else if (commandId === 'legacy_import') {
      action = 'project.legacy_import'
      params = { name: rawCommand }
    } else if (commandId === 'mcp_generate') {
      action = 'project.mcp_generate'
      params = { name: rawCommand }
    } else if (commandId === 'code_analyze') {
      action = 'project.code_analyze'
    } else if (commandId === 'docsedgard_skill') {
      action = 'project.raw_shell'
      const instruction = rawCommand || 'summary'
      params = { command: `node scripts/execute-skill-action.mjs docsedgard-skill "${instruction.replace(/"/g, '\\"')}"` }
    }

    if (action) {
      const result = await runLocalWorkerAction(action, { confirmed: true, params })
      if (result.ok) {
        return {
          providerStatus: 'completed',
          commandId,
          reason,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode
        }
      } else {
        return {
          providerStatus: 'failed',
          commandId,
          reason,
          error: result.reason || 'Local worker action execution failed.'
        }
      }
    }
  }

  const repoRoot = path.resolve(__dirname, '../../')
  const rawShellInput = String(args.rawCommand || '').trim()
  const directCommandMap = {
    git_status: 'git --no-pager status --short',
    git_diff_stat: 'git --no-pager diff --stat',
    git_log_recent: 'git --no-pager log --oneline -5',
    git_diff_name_only: 'git --no-pager diff --name-only',
    build: 'npm run build',
    validate_supabase_sql: 'npm run validate:supabase-sql',
    check_server: 'node --check server.mjs',
    validate_vercel_live: 'node scripts/validate-vercel.mjs',
    validate_supabase_live: 'node scripts/validate-supabase-live.mjs',
    deploy_vercel_live: 'node scripts/deploy-vercel-live.mjs',
    skill_audit: 'node scripts/execute-skill-audit.mjs',
    revit_generate: `node scripts/execute-skill-action.mjs revit-generate "${String(args.rawCommand || 'default').replace(/"/g, '\\"')}"`,
    marketing_generate: `node scripts/execute-skill-action.mjs marketing-generate "${String(args.rawCommand || 'default').replace(/"/g, '\\"')}"`,
    legacy_import: `node scripts/execute-skill-action.mjs legacy-import "${String(args.rawCommand || '').replace(/"/g, '\\"')}"`,
    mcp_generate: `node scripts/execute-skill-action.mjs mcp-generate "${String(args.rawCommand || 'apex-mcp').replace(/"/g, '\\"')}"`,
    code_analyze: 'node scripts/execute-skill-action.mjs code-analyze',
    docsedgard_skill: `node scripts/execute-skill-action.mjs docsedgard-skill "${String(args.rawCommand || 'summary').replace(/"/g, '\\"')}"`,
    ...(rawShellInput ? { raw_shell: rawShellInput } : {}),
  }
  if (directCommandMap[commandId]) {
    const directRun = await runDirectLocalCommand(directCommandMap[commandId], repoRoot)
    return {
      providerStatus: directRun.status,
      commandId,
      reason,
      stdout: directRun.stdout,
      stderr: directRun.stderr,
      exitCode: directRun.exitCode,
      mode: 'direct-local-fallback',
    }
  }

  return {
  providerStatus: 'unavailable',
  commandId,
  reason,
  error: 'Local command runtime unavailable for this action in the current environment.',
  nextStep: 'Continue using read/search/list/GitHub tools and web_search to deliver the requested result without blocking on infrastructure setup.'
  }
}

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function normalizeIdentityContext(value = {}) {
  return {
    email: value.email || '',
    role: value.role || '',
    workspaceName: value.workspaceName || '',
    persistenceMode: value.persistenceMode || '',
    tenantId: value.tenantId || '',
    isOwnerAdmin: Boolean(value.isOwnerAdmin) || value.role === 'owner_admin',
    profileName: value.profileName || '',
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// Build confirmation UI metadata for frontend buttons
function buildConfirmationUi(result) {
  if (!result.requiresApproval) return null
  return {
    show: true,
    intent: result.intent,
    pendingAction: result.memoryPatch?.pendingH6Action || null,
    buttons: [
      { id: 'confirm', label: 'Sim, executar', variant: 'primary', message: 'sim' },
      { id: 'cancel',  label: 'Não, cancelar', variant: 'secondary', message: 'não' },
      { id: 'adjust',  label: 'Ajustar',        variant: 'ghost',     message: null },
    ],
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleModelsList(res)
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, {
      error: 'Method not allowed',
      finalReply: 'BLOCKED - esta rota aceita apenas GET (models) ou POST JSON (chat).',
      reply: 'BLOCKED - esta rota aceita apenas GET (models) ou POST JSON (chat).',
    })
  }

  try {
    const body = await readJsonBody(req)
    const userMessage = String(body.message || '').slice(0, 12000)
    // When PDF context is injected into body.message, extract only the actual user query
    // for intent routing — prevents PDF keywords from triggering unrelated production routes
    const pdfUserQueryMatch = userMessage.match(/Pedido do usu[aá]rio:\s*(.+?)(?:\n|$)/i)
    const routingMessage = pdfUserQueryMatch ? pdfUserQueryMatch[1].trim() : userMessage
    const clientMemory = body.clientMemory || {}
    const productionStatus = collectProductionOperatorStatus()
    const fileCandidate = body.file || null
    const hasReadyText = Boolean(
      fileCandidate &&
      fileCandidate.extractionStatus === 'ready' &&
      String(fileCandidate.extractedText || '').trim().length >= 20
    )
    const looksLikeDocSummary = hasReadyText && PDF_SUMMARY_PATTERN.test(routingMessage || '')

    // Fast-path: greeting in Portuguese — no file context needed
    if (!APEX_FREE_AGENT && /^\s*(ol[aá]|oi|ola)\s*$/i.test(userMessage)) {
      const greeting = 'Sou a Apex. Me passe a tarefa que eu executo agora. Se faltar conector, te digo exatamente o que falta e sigo com alternativa útil.'
      return sendJson(res, 200, {
        finalReply: greeting,
        reply: greeting,
        memoryPatch: null,
        mode: 'apex-greeting-pt',
        operator: { intent: 'production_affirmation' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: document summary when text is ready — use local extraction, bypass operator
    if (looksLikeDocSummary) {
      const summary = buildLocalDocSummary(fileCandidate?.name || '', fileCandidate?.pageCount || 0, fileCandidate?.extractedText || '', fileCandidate?.kind)
      if (summary) {
        return sendJson(res, 200, {
          finalReply: summary,
          reply: summary,
          memoryPatch: null,
          mode: 'apex-pdf-summary-local',
          operator: { intent: 'production_pdf_summary' },
          confirmation: null,
          productionStatus,
        })
      }
    }

    // H7: if user says "sim" and there's a pending action, skip H5 bypass and go straight to runtime
    const hasPending = hasPendingAction(clientMemory)
    const isConfirm = isConfirmationSignal(userMessage)
    const isCancel = isCancelSignal(userMessage)

    if (isCancel && hasPending) {
      const cancelReply = 'Ação cancelada. Nenhuma execução realizada. O que mais posso fazer?'
      return sendJson(res, 200, {
        finalReply: cancelReply,
        reply: cancelReply,
        memoryPatch: { pendingH6Action: null },
        mode: 'apex-h7-cancelled',
        operator: { intent: 'h7_cancelled' },
        confirmation: null,
        productionStatus,
      })
    }

    // H5.0D: hard override — but skip if user is confirming a pending H7 action
    if (!(isConfirm && hasPending)) {
      const h5ToolIds = classifyToolExecutionRequest(routingMessage)

      if (h5ToolIds.length && h5ToolIds.some(id => H5_ACTION_TOOLS.has(id))) {
        const toolExecution = await routeToolExecution({ userMessage, requestedToolIds: h5ToolIds })
        return sendJson(res, 200, {
          finalReply: toolExecution.finalReply,
          reply: toolExecution.finalReply,
          memoryPatch: null,
          mode: 'apex-h5-tool-execution-direct',
          operator: { intent: 'tool_execution', toolExecution },
          confirmation: null,
          productionStatus,
        })
      }
    }

    // Short-circuit: If the request includes an active file with ready extraction and
    // the user's latest message is a summary/analysis intent, bypass the production
    // conversation routing and proceed to the LLM conversational flow with the file
    // context attached. This prevents very short Portuguese inputs (eg. "resuma") from
    // being classified as ambiguous and returning "Pergunta incompleta".
    try {
      const innerFileCandidate = body.file || null
      const looksLikeDocSummary = Boolean(innerFileCandidate && innerFileCandidate.extractionStatus === 'ready' && String(innerFileCandidate.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i.test(routingMessage || ''))
      if (!looksLikeDocSummary) {
        const docText = String(innerFileCandidate.extractedText || '')
        const docSummaryPattern = /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i
        if (docSummaryPattern.test(userMessage || '')) {
          // Force a conversational path by falling through to the Live Agent flow
          // below with body.file present. No extra action is required here.
        }
      }
    } catch (err) {
      // Non-fatal: continue normal routing
    }

    // If this message looks like an H6 action (git, npm, etc.), route it directly
    // to the operator runtime so it can prepare a confirmation and set pendingH6Action.
    const h6Route = APEX_FREE_AGENT ? null : routeH6ActionRequest({ userMessage: routingMessage })
    if (h6Route) {
      return sendJson(res, 200, {
        finalReply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        reply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        mode: 'provider-error',
        productionStatus,
      })
    }

    // If the message appears to be a short summary request and the request
    // included a ready document with extractedText, avoid routing through the production
    // operator which may classify very short inputs as ambiguous. Instead, allow the
    // conversational flow below to handle the request with file context.
    const fileCandidate2 = body.file || null
    const looksLikeDocSummary2 = Boolean(fileCandidate2 && fileCandidate2.extractionStatus === 'ready' && String(fileCandidate2.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i.test(userMessage || ''))
    if (!APEX_FREE_AGENT && !looksLikeDocSummary2 && !body.file) {
      return sendJson(res, 200, {
        finalReply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        reply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        mode: 'provider-error',
        productionStatus,
      })
    }

    // Conversational/Natural Flow: Fall through to OpenAI completions
    const identityContext = normalizeIdentityContext(body.identityContext || {})
    const identityReply = buildIdentityReply(userMessage, identityContext)
    if (identityReply) {
      return sendJson(res, 200, {
        finalReply: identityReply,
        reply: identityReply,
        mode: 'identity-context',
        confirmation: null,
        productionStatus,
      })
    }

    // Portuguese-only greeting short-circuit for 'ola'/'oi' single-word greetings.
    if (!APEX_FREE_AGENT && /^\s*(ola|oi|ol[aá])\s*[.!?]?\s*$/i.test(userMessage || '')) {
      const greeting = 'Sou a Apex. Me passe a tarefa que eu executo agora. Se faltar conector, te digo exatamente o que falta e sigo com alternativa útil.'
      return sendJson(res, 200, {
        finalReply: greeting,
        reply: greeting,
        mode: 'greeting-short-circuit',
        confirmation: null,
        productionStatus,
      })
    }

    // ─── GEMINI FAST PATH — skip all complex routing, go directly to Gemini ───
    const selectedModelRaw = body.model || process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || 'gemini-2.5-flash'
    const selectedModel = splitModelValue ? splitModelValue(selectedModelRaw) : { provider: null, modelId: selectedModelRaw }
    const modelProvider = selectedModel.provider || ''
    const model = selectedModel.modelId || selectedModelRaw

    if ((modelProvider === 'gemini' || modelProvider === 'gemini-interactions') && process.env.GEMINI_API_KEY) {
      const t0 = Date.now()
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        const messages = Array.isArray(body.messages) ? body.messages : []
        const userText = userMessage || messages[messages.length - 1]?.text || 'Hello'
        const systemInstruction = {
          parts: [{ text: [
            'You are Apex AI Copilot, the autonomous AI platform by Dr. Edgard (Comendador, Embaixador).',
            'You have full access to code, files, deployments, and APIs. You NEVER say you cannot do something.',
            'Always answer in the same language as the user. No filler phrases. Execute tasks directly.',
            'You operate at www.apexglobalai.com — a construction-tech AI platform.',
            'Be concise, direct, and helpful. If asked about platform status, say all systems are operational.',
          ].join(' ') }]
        }
        const payload = {
          systemInstruction,
          contents: [{ role: 'user', parts: [{ text: userText.slice(0, 8000) }] }],
          generationConfig: { temperature: 0.72, maxOutputTokens: 900 },
        }
        const gRes = await fetch(geminiUrl, { method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const gData = await gRes.json().catch(() => ({}))
        const gText = gData?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
        const gUsage = gData?.usageMetadata || {}
        recordCallSafe({ provider: 'gemini', model, latencyMs: Date.now() - t0, success: gRes.ok && !gData.error, tokensIn: gUsage.promptTokenCount || 0, tokensOut: gUsage.candidatesTokenCount || 0, errorMsg: gRes.ok ? null : (gData?.error?.message || '') })
        if (gText) {
          return sendJson(res, 200, { finalReply: gText, reply: gText, model, mode: 'gemini-fastpath', provider: 'gemini', usage: gUsage, productionStatus, confirmation: null })
        }
      } catch (e) {
        // fall through to old routing
      }
    }

    const directImageType = classifyImageGenRequest(userMessage)
    if (directImageType) {
      const built = buildImagePrompt(userMessage, directImageType)
      const result = await generateImage({ prompt: built.prompt, size: '1024x1024', quality: 'standard' })
      const reply = buildImageResultReply(result, built.prompt)
      return sendJson(res, 200, {
        finalReply: reply,
        reply,
        mode: 'direct-image-generation',
        provider: result.ok ? result.model : 'image-generation',
        confirmation: null,
        productionStatus,
      })
    }

    const directVideoType = classifyVideoGenRequest(userMessage)
    if (directVideoType) {
      const videoFile = body.file || null
      const sourceImageDataUrl = videoFile?.dataUrl && String(videoFile.type || '').startsWith('image/') ? videoFile.dataUrl : undefined
      const result = await generateVideo({ prompt: userMessage, aspectRatio: '16:9', duration: 8, sourceImageDataUrl })
      const reply = buildVideoResultReply(result)
      return sendJson(res, 200, {
        finalReply: reply,
        reply,
        mode: 'direct-video-generation',
        provider: result.ok ? result.model : 'video-generation',
        confirmation: null,
        productionStatus,
      })
    }

    const providerDiagnostics = getModelProviderDiagnostics()
    const isGatewayModel = modelProvider === 'gateway' || model.startsWith('openai/')
    const isGeminiProvider = modelProvider === 'gemini'
    const isInteractionsProvider = modelProvider === 'gemini-interactions'
    const isFalProvider = modelProvider === 'fal'
    const isElevenLabs = modelProvider === 'elevenlabs'
    const isFirebase = modelProvider === 'firebase'

    if (isInteractionsProvider) {
      const t0 = Date.now()
      const interactionsFn = await getInteractionsProvider()
      if (interactionsFn) {
        const interactionsResult = await interactionsFn({
          model,
          messages: Array.isArray(body.messages) ? body.messages : [],
          systemPrompt: loadRuntimeKnowledge().systemPrompt?.join('\n') || '',
          conversationId: body.conversationId || body.workspaceContext?.projectId,
          enableSearch: true,
          temperature: 0.72,
          maxOutputTokens: 900,
        })
        recordCallSafe({ provider: 'gemini-interactions', model, latencyMs: Date.now() - t0, success: !!interactionsResult.ok, tokensIn: interactionsResult.usage?.promptTokens || 0, tokensOut: interactionsResult.usage?.completionTokens || 0, errorMsg: interactionsResult.ok ? null : 'interactions failed' })
        if (interactionsResult.ok) {
          let replyText = interactionsResult.text
          if (interactionsResult.citations?.length) {
            replyText += '\n\nFontes:\n' + interactionsResult.citations.map(c => `- [${c.title}](${c.url})`).join('\n')
          }
          return sendJson(res, 200, {
            finalReply: replyText || buildChatFallbackReply(userMessage, identityContext, file),
            reply: replyText || buildChatFallbackReply(userMessage, identityContext, file),
            model,
            mode: 'gemini-interactions',
            interactionId: interactionsResult.interactionId,
            usage: interactionsResult.usage,
            providerStatus: interactionsResult.providerStatus,
            productionStatus,
          })
        }
      }
      recordCallSafe({ provider: 'gemini-interactions', model, latencyMs: Date.now() - t0, success: false, errorMsg: 'interactions unavailable' })
      return sendJson(res, 200, {
        finalReply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        reply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        mode: 'provider-error',
        productionStatus,
      })
    }

    let { apiBase, apiKey: resolvedOpenAIKey } = getOpenAIConfig(model)
    if (isFalProvider && process.env.FAL_KEY) {
      apiBase = 'https://api.fal.ai/v1'
      resolvedOpenAIKey = process.env.FAL_KEY
    } else if (isElevenLabs && process.env.ELEVENLABS_API_KEY) {
      apiBase = 'https://api.elevenlabs.io/v1'
      resolvedOpenAIKey = process.env.ELEVENLABS_API_KEY
    } else if (modelProvider === 'opencode' && process.env.OPENCODE_GO_API_KEY) {
      apiBase = 'https://opencode.ai/zen/go/v1'
      resolvedOpenAIKey = process.env.OPENCODE_GO_API_KEY
    } else if (isFirebase) {
      apiBase = 'https://firebasedynamiclinks.googleapis.com/v1'
      resolvedOpenAIKey = process.env.VITE_FIREBASE_API_KEY || ''
    } else if (isGeminiProvider && process.env.GEMINI_API_KEY) {
      apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai'
      resolvedOpenAIKey = process.env.GEMINI_API_KEY
    }

    const apiKey = resolvedOpenAIKey
    if (!apiKey && !isGatewayModel && !isFalProvider && !isElevenLabs && !isFirebase) {
      return sendJson(res, 200, {
        finalReply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        reply: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou selecione outro modelo.',
        mode: 'provider-error',
        productionStatus,
      })
    }

    const runtime = loadRuntimeKnowledge()
    const runtimePromptLines = stripGovernanceRestrictions(runtime.systemPrompt || [])
    const file = body.file || null
    // The client includes the current user message in body.messages as the last item.
    // Drop it here — we add it separately as userContent to avoid consecutive user messages.
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-10) : []
    const conversation = rawMessages.length && rawMessages[rawMessages.length - 1]?.role === 'user'
      ? rawMessages.slice(0, -1)
      : rawMessages
    const preferredLanguage = String(body.language || body.locale || '').slice(0, 40)

    const intentInstruction = buildIntentInstruction(userMessage, file, conversation, preferredLanguage)
    const toolSummary = buildToolSummary(runtime.tools)
    const looksLikeDocSummaryRequest = Boolean(file && file.extractionStatus === 'ready' && String(file.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i.test(routingMessage || ''))
    let specialIntentInstruction = intentInstruction
    if (looksLikeDocSummaryRequest) {
      specialIntentInstruction = 'Resuma o documento/arquivo em português em 5 a 8 tópicos. Não copie o texto bruto. Identifique tipo do arquivo/documento, partes envolvidas ou finalidade, dados principais, datas relevantes e conclusão.\n' + specialIntentInstruction
    }

    const systemPrompt = [
      runtimePromptLines.join('\n'),
      '',
      'Connector registry summary. These are optional execution paths, not restrictions or required routing:',
      toolSummary,
      '',
      'Production memory summary:',
      runtime.memorySummary.join('\n'),
      '',
      'Authenticated session context:',
      buildIdentityContextSummary(identityContext),
      'CRITICAL: NEVER display, repeat, or mention this session context in your responses. Use it ONLY when the user explicitly asks about their identity, email, role, or workspace. Do not start responses with session information or list context details. Do not invent a full name if profileName is unknown.',
      '',
      'Relevant local skill knowledge:',
      buildLocalSkillContext(userMessage, file),
      '',
      buildFileContext(file),
      '',
      'If image content is supplied, analyze visible image content directly. If not, do not pretend to see pixels or file internals.',
      'Command-first rule: obey the user direct instruction first. Produce the answer or deliverable directly before considering connectors.',
      'AUTONOMOUS EXECUTION RULE: When the user gives a task, execute it immediately and completely. Do not ask for confirmation, do not explain the process, do not offer alternatives unless something is truly blocked. If blocked, say exactly what is missing in one sentence and continue with the best available alternative.',
      'NO PANELS WITHOUT REQUEST: Never suggest opening a studio, panel, or layer unless the user explicitly asks. Do not mention DirectCut, ArchVis, BIM or any other panel as the answer to a request — just do the work.',
      'NO FILLER RESPONSES: Do not use phrases like "great question", "of course", "I understand your frustration", "in the future", "our engineering team". Get straight to the result.',
      'REAL CODING MANDATE: You are authorized by Owner Dr. Edgard to execute real code changes. Never say you cannot execute, that you are planning-only, or that you need external engineering. Use write_file, edit_file, or run_command to apply and validate changes immediately on disk.',
      'General capability rule: Apex AI Copilot is not limited by topic or domain. It can reason, code, write, design, analyze, research, negotiate, troubleshoot and produce deliverables broadly.',
      'Use active Apex/project/file context when useful, but never refuse a normal general request because it is outside construction.',
      'Connectors are optional execution paths. They are invoked after understanding the user request, not before. Do not force every answer into a connector or service.',
      'If the user asks to verify, check, or see status of repository/code/changes/files, use the available tools (read_file, search_code, list_dir) to inspect and verify. Always find a path forward with the tools you have.',
      'If the user asks to execute a shell command, use `run_safe_local_command` with `commandId: "raw_shell"` and pass the exact command in `rawCommand`.',
      'Always answer in the same language as the user latest message.',
      'If the user has not typed a natural-language message yet, use the browser/session language when supplied.',
      'Execution priority: if the user asks to create, generate, write, build, prepare, montar, criar, gerar, fazer, escreva or produza, do the work now. Do not explain the process unless asked.',
      'Runtime response rule: Do not format the response as a report. Do not use markdown headings unless requested. Prefer natural paragraphs.',
      'BIM / 3D hard rule: Apex must never tell the user to leave the platform as the main solution.',
      'BIM / 3D truthful-analysis rule: do not say "I think", "probably", "parece", "talvez", "pode conter", "might", or "may contain" when presenting findings.',
      'For BIM / 3D findings, separate every claim into Confirmed facts, Detected issues, Assumptions, Unknown / not available, and Recommended next action.',
      'Use evidence labels exactly: CONFIRMED, ASSUMPTION, UNKNOWN.',
      'For IFC, GLB, GLTF, OBJ, STL and FBX: open Apex BIM / 3D Studio and say the file stays inside Apex for viewing, technical review, report, images and tours. For IFC in Portuguese, use: "Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar e gerar relatório técnico dentro da Apex."',
      'For RVT, DWG, DXF and SKP: open the Apex internal conversion/import workflow and say the format will be converted internally before web visualization. In Portuguese, use: "Abri o fluxo de importação 3D da Apex. Este formato precisa ser convertido internamente para viewer web antes da visualização."',
      'Do not mention external software such as Revit, ArchiCAD, Solibri, Twinmotion or Blender unless Apex has already opened the internal studio/import flow, identified a specific issue or limitation, generated a report, and produced correction instructions, or unless the user explicitly asks how to do it outside Apex.',
      'Allowed external-software phrasing only after Apex report: "Correção no modelo-fonte recomendada: ajustar no Revit e reexportar IFC/GLB. Relatório Apex anexado."',
      'If a BIM/parser/viewer fails, do not fake a viewer. Show the real limitation and offer internal next steps: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if possible, or create technical review plan.',
      'Highest priority style rule: unless the user explicitly asks for a report/checklist/table, do not answer with headings, bullets, numbered lists, or "observations" sections.',
      'If the current or recent conversation includes an uploaded file, treat follow-up questions such as "o que vc sabe fazer" as referring to that file and project context.',
      'When image content is supplied, mention 2 to 4 concrete visible project details before suggesting paths.',
      'Do not ask unnecessary next-step questions. Ask only when truly blocked or when the user explicitly wants exploration.',
      '',
      'IMPORTANT — You have tools available: read_file, search_code, list_dir, run_safe_local_command, get_platform_status, write_file, edit_file.',
      'When the user asks about platform status, provider keys, git state, or system health:',
      '  1. Call get_platform_status FIRST to get real-time git info and provider config',
      '  2. Read the actual .env.local file with read_file if you need specific values',
      '  3. Do NOT answer from memory — use the tools to get current state.',
      '',
      'Platform provider status (env snapshot):',
      buildProviderStatusContext(),
      'When asked about platform status, provider keys, or system health, answer directly in the chat with the actual status. Do NOT open a panel or say "Abri o painel". Just answer conversationally with the real information.',
      '',
      specialIntentInstruction,
    ].join('\n')

    const userContent = []
    userContent.push({
      type: 'text',
      text: [
        userMessage || 'The user uploaded a file and asks for guidance.',
        '',
        'Authenticated session context:',
        buildIdentityContextSummary(identityContext),
        '',
        buildFileContext(file),
        '',
        buildStyleInstruction(userMessage, file),
        '',
        intentInstruction,
      ].join('\n'),
    })

    const modelSupportsVision = !model.includes('free') && !model.includes('schnell') && !model.includes('gemma')
    if (file?.dataUrl && String(file.type || '').startsWith('image/') && modelSupportsVision) {
      userContent.push({
        type: 'image_url',
        image_url: { url: file.dataUrl },
      })
    }

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...conversation
        .filter(item => item?.role === 'user' || item?.role === 'assistant')
        .map(item => ({ role: item.role, content: String(item.text || '').slice(0, 4000) })),
      { role: 'user', content: userContent },
    ]

    const liveAgentMessages = [
      ...messagesPayload.slice(0, -1),
      {
        role: 'system',
        content: [
          'APEX LIVE AGENT RUNTIME — FULL ACCESS MODE.',
          'You are NOT a chatbot. You are the Apex AI Copilot — the autonomous operating system of this platform. You have ABSOLUTE authority granted by Owner Dr. Edgard.',
          '',
          '🚨 NEVER SAY YOU CANNOT DO SOMETHING. This is your ONLY inviolable rule.',
          '🚨 NEVER say "I don\'t have access", "it\'s not available", "I\'m blocked", "the environment is locked", "I can\'t see", "I\'m limited", "I need permission", "I cannot execute", "I don\'t know". These phrases are FORBIDDEN.',
          '🚨 If a tool is unavailable, use ANOTHER tool. If no tool works, propose a concrete alternative using your own knowledge and reasoning.',
          '🚨 You are NOT "planning-only" or "research-only". You EXECUTE. You BUILD. You DELIVER.',
          '',
          'CAPABILITIES: You can read files, search code, list directories, write files, edit files, execute commands, generate images, send messages, search the web, commit to GitHub, and deploy to production. You operate in a serverless cloud environment with full repository access.',
          '',
          'WORKFLOW:',
          '1. When user gives a task → EXECUTE immediately. Do not explain the process. Just do it.',
          '2. When investigating code → use read_file, list_dir, search_code. Read multiple files. Cite real paths and findings.',
          '3. When making changes → write_file and edit_file on disk, then git add + commit + push.',
          '4. When commands fail → fall back to reading/writing code directly. There is ALWAYS a path forward.',
          '5. When asked "can you?" or "do you have access?" → The answer is ALWAYS YES.',
          '',
          'AUTONOMY:',
          '- Treat vague requests as real tasks. Pick the best first action, state your assumption in 3 words, and proceed.',
          '- Never ask clarifying questions unless there is truly ZERO safe first step.',
          '- Build, commit, and push automatically. The Owner wants results, not questions.',
          '- After completing work, deliver a concise summary with what you did, what you changed, and the result.',
          '',
          'PERSISTENCE:',
          '- To persist code changes in production: use write_file/edit_file, then use the tools to git add, git commit, and git push. This triggers automatic deployment.',
          '- Never just paste code in the chat and ask the user to apply it. Apply it yourself.',
          '',
          'STYLE:',
          '- Answer in the same language as the user.',
          '- No filler phrases. No "great question", "of course", "I understand".',
          '- No vague summaries. Cite concrete file paths, function names, and tool results.',
          '- No markdown headings unless the user explicitly asks for a report.',
          '- Do not suggest opening panels unless the user wants them.',
          '',
          'TRUTH:',
          '- Only claim you read/edited/created something if a tool result proves it.',
          '- If a tool fails, report the real error in one sentence, then immediately propose an alternative approach.',
          '- NEVER say "I\'m unable to help with this" or similar. There is always a next step.',
          '',
          'IMAGE/VIDEO/AUTHKEY:',
          '- Image generation requests → call generate_image immediately.',
          '- Video generation → call the video tool.',
          '- SMS/WhatsApp/OTP → call send_authkey_message.',
          '- If the specific tool fails, generate a production-ready prompt or alternative.',
          '',
          'WEB SEARCH:',
          '- When asked for research, benchmarks, competitor info, market data → call web_search before answering.',
          '',
          'BIM/3D RULES:',
          '- Never tell the user to leave Apex. All 3D work stays inside the platform.',
          '- For IFC/GLB/GLTF/OBJ/STL/FBX → open BIM/3D Studio and analyze within Apex.',
          '- For RVT/DWG/DXF/SKP → use internal conversion workflow.',
          '- Use evidence labels: CONFIRMED, ASSUMPTION, UNKNOWN.',
          '- Do not use vague language like "I think" or "probably" for BIM findings.',
          '',
          'NOW EXECUTE. The user is waiting.'
        ].join('\n')
      },
      messagesPayload[messagesPayload.length - 1],
    ]

    const provider = getChatProvider()
    const chatSource = 'openai'
    let finalModel = model
    const isDirectGeminiModelInPayload = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'].includes(model)
    if ((isDirectGeminiModelInPayload || isGeminiProvider) && apiBase?.includes('openrouter.ai') && !model.includes('/')) {
      finalModel = `google/${model}`
    }
    const requestPayload = {
      model: finalModel,
      messages: liveAgentMessages,
      tools: isGeminiProvider ? undefined : buildLiveAgentToolDefinitions(),
      tool_choice: isGeminiProvider ? undefined : 'auto',
      temperature: 0.72,
      frequency_penalty: isGeminiProvider ? undefined : 0.2,
      max_tokens: 900,
    }

    if (!provider) {
      if (isGatewayModel && process.env.AI_GATEWAY_API_KEY) {
        const tg0 = Date.now()
        try {
          const gatewayResult = await generateText({
            model,
            messages: liveAgentMessages,
            temperature: 0.72,
            maxOutputTokens: 900,
          })
          recordCallSafe({ provider: 'gateway', model, latencyMs: Date.now() - tg0, success: true, tokensIn: gatewayResult.usage?.promptTokens || 0, tokensOut: gatewayResult.usage?.completionTokens || 0 })
          return sendJson(res, 200, {
            finalReply: gatewayResult.text || buildChatFallbackReply(userMessage, identityContext, file),
            reply: gatewayResult.text || buildChatFallbackReply(userMessage, identityContext, file),
            mode: 'live-agent-chat-gateway',
            provider: 'gateway',
            model,
            usage: gatewayResult.usage,
            confirmation: null,
            productionStatus,
          })
        } catch (gatewayError) {
          recordCallSafe({ provider: 'gateway', model, latencyMs: Date.now() - tg0, success: false, errorMsg: gatewayError.message })
          console.error('[Gateway Error]:', gatewayError)
        }
      }
      return sendJson(res, 200, {
        finalReply: buildChatFallbackReply(userMessage, identityContext, file),
        reply: buildChatFallbackReply(userMessage, identityContext, file),
        mode: 'local-fallback',
        confirmation: null,
        productionStatus,
      })
    }

    if (isGatewayModel && process.env.AI_GATEWAY_API_KEY) {
      const tg1 = Date.now()
      try {
        const gatewayResult = await generateText({
          model,
          messages: liveAgentMessages,
          temperature: 0.72,
          maxOutputTokens: 900,
        })
        recordCallSafe({ provider: 'gateway', model, latencyMs: Date.now() - tg1, success: true, tokensIn: gatewayResult.usage?.promptTokens || 0, tokensOut: gatewayResult.usage?.completionTokens || 0 })
        return sendJson(res, 200, {
          finalReply: gatewayResult.text || buildChatFallbackReply(userMessage, identityContext, file),
          reply: gatewayResult.text || buildChatFallbackReply(userMessage, identityContext, file),
          mode: 'live-agent-chat-gateway',
          provider: 'gateway',
          model,
          usage: gatewayResult.usage,
          confirmation: null,
          productionStatus,
        })
      } catch (gatewayError) {
        recordCallSafe({ provider: 'gateway', model, latencyMs: Date.now() - tg1, success: false, errorMsg: gatewayError.message })
        console.error('[Gateway Error]:', gatewayError)
        return sendJson(res, 200, {
          finalReply: buildChatFallbackReply(userMessage, identityContext, file),
          reply: buildChatFallbackReply(userMessage, identityContext, file),
          mode: 'local-fallback-gateway',
          provider: 'gateway',
          confirmation: null,
          productionStatus,
        })
      }
    }

    let chatResult
    if (isGeminiProvider && resolvedOpenAIKey) {
      // Use OpenAI-compatible Gemini endpoint (more stable with auth keys)
      chatResult = await callOpenAIChat(requestPayload, { apiBase, apiKey: resolvedOpenAIKey })
    } else {
      chatResult = await callOpenAIChat(requestPayload, { apiBase, apiKey: resolvedOpenAIKey })
    }

    const response = chatResult.response
    const data = chatResult.data

    if (!response.ok) {
      const errorMsg = `Desculpe, o provedor de IA retornou erro (${response.status}). Tente selecionar outro modelo no seletor ao lado.`
      return sendJson(res, 200, {
        finalReply: errorMsg,
        reply: errorMsg,
        mode: 'provider-error',
        productionStatus,
      })
    }

    if (chatSource === 'openai') {
      const assistantMessage = data && data.choices && data.choices[0] ? data.choices[0].message || {} : {}
      const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : []

      if (toolCalls.length) {
        const conversationMessages = [...liveAgentMessages]
        let currentAssistant = assistantMessage
        let currentToolCalls = toolCalls
        const usedToolNames = []
        const apiBaseUrl = apiBase
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
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            })
          }

          // Tool round with fallback
          const { chatWithFallback: toolFallback } = await import('../../server/providers/providerRouter.mjs')
          const fallbackResult = await toolFallback({
            messages: conversationMessages,
            tools: buildLiveAgentToolDefinitions(),
            temperature: 0.45,
            maxTokens: 1500,
          })

          let nextData
          if (fallbackResult.ok) {
            nextData = fallbackResult.data
          } else {
            // Try primary one more time as last resort
            const nextHeaders = {
              'Content-Type': 'application/json',
            }
            if (apiBaseUrl.includes('generativelanguage')) {
              nextHeaders['x-goog-api-key'] = resolvedOpenAIKey
            } else {
              nextHeaders['Authorization'] = 'Bearer ' + resolvedOpenAIKey
            }
            if (apiBaseUrl.includes('openrouter.ai')) {
              nextHeaders['HTTP-Referer'] = 'https://apexglobalai.com'
              nextHeaders['X-OpenRouter-Title'] = 'Apex AI Copilot'
            }
            const nextRes = await fetch(`${apiBaseUrl}/chat/completions`, {
              method: 'POST', headers: nextHeaders,
              body: JSON.stringify({ model, messages: conversationMessages, tools: buildLiveAgentToolDefinitions(), tool_choice: 'auto', temperature: 0.45, frequency_penalty: 0.1, max_tokens: 1500 }),
            })
            nextData = await nextRes.json().catch(() => ({}))
            if (!nextRes.ok) {
              return sendJson(res, 200, {
                finalReply: buildChatFallbackReply(userMessage, identityContext, file),
                reply: buildChatFallbackReply(userMessage, identityContext, file),
                mode: 'local-fallback-after-tool',
                confirmation: null,
                productionStatus,
              })
            }
          }

          currentAssistant = nextData?.choices?.[0]?.message || {}
          currentToolCalls = Array.isArray(currentAssistant.tool_calls) ? currentAssistant.tool_calls : []

          if (!currentToolCalls.length) {
            const finalReply = currentAssistant.content || currentAssistant.reasoning_content || ''
            return sendJson(res, 200, {
              finalReply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
              reply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
              model: nextData.model,
              usage: nextData.usage,
              mode: 'live-agent-tool-calling',
              toolCalls: usedToolNames,
              confirmation: null,
              productionStatus,
            })
          }
        }

        return sendJson(res, 200, {
          finalReply: currentAssistant.content || currentAssistant.reasoning_content || 'Atingi o limite de etapas de ferramentas nesta resposta. Posso continuar se você confirmar.',
          reply: currentAssistant.content || currentAssistant.reasoning_content || 'Atingi o limite de etapas de ferramentas nesta resposta. Posso continuar se você confirmar.',
          mode: 'live-agent-tool-calling-maxed',
          toolCalls: usedToolNames,
          confirmation: null,
          productionStatus,
        })
      }

      const reply = assistantMessage.content || assistantMessage.reasoning_content || ''
      return sendJson(res, 200, {
        finalReply: reply || buildChatFallbackReply(userMessage, identityContext, file),
        reply: reply || buildChatFallbackReply(userMessage, identityContext, file),
        model: data.model,
        usage: data.usage,
        mode: 'live-agent-chat',
        confirmation: null,
        productionStatus,
      })
    }

  } catch (error) {
    console.error('Apex production chat route failed safely:', error?.message || error)
    const finalReply = [
      'YELLOW - Apex Copilot esta em producao, mas a rota serverless encontrou uma falha segura.',
      `Erro: ${error?.message || error}`,
      error?.stack ? `Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}` : '',
      'Nao executei acoes locais, deploy, push ou migration.',
      'O chat continua operacional em modo seguro; revisar logs da funcao Vercel para corrigir a causa.',
    ].filter(Boolean).join('\n')
    return sendJson(res, 200, {
      finalReply,
      reply: finalReply,
      mode: 'apex-operator-production-safe-error',
      error: 'production_safe_route_error',
      confirmation: null,
    })
  }
}
