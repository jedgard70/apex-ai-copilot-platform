import '../../server/env.mjs'
import { generateText } from 'ai'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution, routeH6ActionRequest } from '../../server/agent/toolExecutionRouter.mjs'
import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { isConfirmationSignal, isCancelSignal, hasPendingAction } from '../../server/agent/confirmationStateMachine.mjs'
import { verifyOwnerAdmin } from '../../lib/auth.mjs'
let _interactionsModels = null
let _isInteractionModel = null
let _interactionsPromise = null
async function ensureInteractionsLoaded() {
  if (_interactionsModels) return true
  if (_interactionsPromise) return _interactionsPromise
  _interactionsPromise = (async () => {
    try {
      const mod = await import('../../server/providers/gemini-interactions.mjs')
      _interactionsModels = mod.INTERACTION_MODELS
      _isInteractionModel = mod.isInteractionModel
      return true
    } catch (e) {
      console.error('[interactions] Failed to load:', e?.message)
      _interactionsModels = []
      _isInteractionModel = () => false
      return false
    }
  })()
  return _interactionsPromise
}
async function getInteractionsProvider() {
  await ensureInteractionsLoaded()
  const mod = await import('../../server/providers/gemini-interactions.mjs')
  return mod.generateWithInteractions
}
import { buildCodeToolDefinitions, executeCodeToolCall, CODE_TOOL_NAMES } from '../../server/agent/codeTools.mjs'
import { runLocalWorkerAction } from '../../server/agent/localWorkerClient.mjs'
import { classifyImageGenRequest, buildImagePrompt, generateImage, buildImageResultReply } from '../../server/agent/imageGenerationConnector.mjs'
import { classifyVideoGenRequest, generateVideo, buildVideoResultReply } from '../../server/agent/videoGenerationConnector.mjs'
import { sendAuthkeySms, sendAuthkeyOtp, buildAuthkeyResultReply } from '../../server/agent/authkeyConnector.mjs'
import { keyRestrictionMiddleware, validateOrigin } from '../../server/middleware/keyRestriction.mjs'
import { recordAuditEvent } from '../../server/service/securityAudit.mjs'

// Dynamic import — safe fallback if server/ not bundled in Vercel serverless
let _recordCall = null
async function _getRecordCall() {
  if (_recordCall) return _recordCall
  try {
    const mod = await import('../../server/service/providerAnalytics.mjs')
    _recordCall = mod.recordCall
    return _recordCall
  } catch {
    _recordCall = () => { } // silent noop
    return _recordCall
  }
}
function recordCallSafe(...args) {
  Promise.resolve().then(async () => {
    try { const fn = await _getRecordCall(); fn(...args) } catch { }
  }).catch(() => { })
}

if (process.env.Local_Worker_URL && !process.env.LOCAL_WORKER_URL) {
  process.env.LOCAL_WORKER_URL = process.env.Local_Worker_URL
}
if (process.env.Local_Worker_TOKEN && !process.env.LOCAL_WORKER_TOKEN) {
  process.env.LOCAL_WORKER_TOKEN = process.env.Local_Worker_TOKEN
}
// Resolve Gemini API config
export function getGeminiConfig(model) {
  return {
    apiBase: process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GEMINI_API_KEY,
  }
}

function getModelProviderDiagnostics() {
  return {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    interactionsConfigured: Boolean(process.env.GEMINI_API_KEY),
  }
}
const DIRECT_GEMINI_MODELS = [
  // ═══ GEMINI 3.x — MAIS RECENTES (confirmados na API 2026-07-08) ═══
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash ★ (gratuito)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (gratuito)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (gratuito)' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image (imagem+chat)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (gratuito)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (gratuito)' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image (imagem+chat)' },

  // ═══ GEMINI 2.5 — ESTÁVEL ═══
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (gratuito, 60 RPM)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (gratuito)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (gratuito, 10 RPM)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (imagem+chat)' },

  // ═══ GEMINI 2.0 ═══
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (gratuito)' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (gratuito)' },

  // ═══ TTS / ÁUDIO ═══
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS Preview (áudio)' },
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS (áudio)' },
  { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS (áudio)' },

  // ═══ DEEP RESEARCH & AGENTS ═══
  { id: 'deep-research-preview-04-2026', name: 'Deep Research Preview (pesquisa profunda)' },
  { id: 'deep-research-max-preview-04-2026', name: 'Deep Research Max Preview' },
  { id: 'antigravity-preview-05-2026', name: 'Antigravity Preview' },
  { id: 'veo-3.1', name: 'Veo 3.1 (vídeo)' },
  { id: 'nano-banana-2', name: 'Nano Banana 2 (imagem/ui)' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro (imagem/ui)' },
  { id: 'gemini-robotics', name: 'Gemini Robotics (controle físico)' },

  // ═══ AUDIO / LYRIA ═══
  { id: 'lyria-3-pro-preview', name: 'Lyria 3 Pro (geração musical)' },
  { id: 'lyria-3-clip-preview', name: 'Lyria 3 Clip (geração musical)' },

  // ═══ GEMMA — open-source (Google) ═══
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B Instruct (Open-Source)' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B A4B (Open-Source)' },
]

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

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2' },
  { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5' },
  { id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5' },
  { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1' },
  { id: 'eleven_english_sts_v2', name: 'Eleven English STS v2' },
]

// Apex AI — motor proprio da Apex. Detalhes de runtime nao devem vazar para o usuario final.
const APEX_LOCAL_MODELS = [
  { id: 'apex-ai', name: 'Apex AI 2.0 (motor próprio)' },
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
    ...DIRECT_GEMINI_MODELS.map(model => ({
      id: composeModelValue('gemini', model.id),
      modelId: model.id,
      provider: 'gemini',
      name: model.name,
    })),
    ...(_interactionsModels || []).map(model => ({
      id: composeModelValue('gemini-interactions', model.id),
      modelId: model.id,
      provider: 'gemini-interactions',
      name: model.name,
    })),
    ...APEX_LOCAL_MODELS.map(model => ({
      id: composeModelValue('apex-local', model.id),
      modelId: model.id,
      provider: 'apex-local',
      name: model.name,
    })),
    ...FAL_CHAT_MODELS.map(model => ({
      id: composeModelValue('fal', model.id),
      modelId: model.id,
      provider: 'fal',
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
        const { response: res, data: json } = await fetchJsonWithTimeout(url, { headers }, 30000)
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
      await fetchModels('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { 'x-goog-api-key': process.env.GEMINI_API_KEY }, 'gemini', 'name', 'displayName', 'models')
    }
    if (process.env.ELEVENLABS_API_KEY) {
      await fetchModels('https://api.elevenlabs.io/v1/models', { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, 'elevenlabs', 'model_id', 'name', null)
    }
    if (process.env.FAL_KEY) {
      await fetchModels('https://fal.ai/api/models?limit=5000', { Authorization: `Key ${process.env.FAL_KEY}` }, 'fal', 'id', 'title', 'items')
    }

    // Ensure interactions models are loaded before building static catalog
    await ensureInteractionsLoaded()

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
    const payload = { ok: true, provider: 'mixed', models, providerDiagnostics: diagnostics }
    modelCatalogCache = {
      expiresAt: now + MODEL_CATALOG_CACHE_TTL_MS,
      payload,
    }
    return sendJson(res, 200, payload)
  } catch (err) {
    await ensureInteractionsLoaded()
    const fallback = buildStaticModelCatalog()
    return sendJson(res, 200, { ok: true, provider: 'mixed', models: fallback, providerDiagnostics: {}, note: 'live_fetch_failed_fallback' })
  }
}

// APEX LIVRE — SEMPRE ATIVO. Nenhum bloqueio.
const APEX_FREE_AGENT = true

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

// Carrega memória persistente da Apex AI (ensinamentos, pesquisas, skills)
let _apexMemory = null
let _apexMemoryLoadedAt = 0
function loadApexMemory() {
  const now = Date.now()
  // Cache de 60s para não ler disco em cada request
  if (_apexMemory && now - _apexMemoryLoadedAt < 60000) return _apexMemory
  try {
    const memPath = path.resolve(__dirname, '../../training_data/apex_memory.json')
    if (fs.existsSync(memPath)) {
      _apexMemory = JSON.parse(fs.readFileSync(memPath, 'utf8'))
      _apexMemoryLoadedAt = now
      return _apexMemory
    }
  } catch (_) { }
  return null
}

function buildApexMemoryContext() {
  const memory = loadApexMemory()
  if (!memory) return ''
  const lines = []
  if (memory.teachings?.length > 0) {
    lines.push('=== MEMÓRIA PERMANENTE (ensinamentos do Owner) ===')
    for (const t of memory.teachings.slice(-30)) {
      lines.push(`[${t.topic}]: ${t.content}`)
    }
  }
  if (memory.confirmedSkills?.length > 0) {
    lines.push(`=== SKILLS CONFIRMADAS LIVE: ${memory.confirmedSkills.map(s => s.label).join(', ')} ===`)
  }
  if (memory.businessContext?.services?.length > 0) {
    lines.push(`=== SERVIÇOS APEX: ${memory.businessContext.services.join(' | ')} ===`)
  }
  return lines.join('\n')
}

function stripGovernanceRestrictions(lines = []) {
  return (Array.isArray(lines) ? lines : []).filter(line => {
    const text = String(line || '')
    return !/\b(never|forbidden|must not|nunca|proibido)\b/i.test(text)
  })
}

function prefersPortugueseText(text = '', locale = '') {
  const hasPtSignal = /\b(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|vc|voce|você|quem sou|o que|fale|fala|explique|sobre|vistos|visto|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra|teste|quem é você|quem e voce|quem e vc|quem e apex|quem é a apex)\b|[ãõçáéíóú]/i.test(text)
  if (hasPtSignal) return true
  if (locale && String(locale).toLowerCase().startsWith('pt')) return true
  return false
}

function isCapabilitiesQuestionText(text = '') {
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
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
  return false
}

function shouldForceLiveAgentToolUse(text = '') {
  const value = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (/^(oi|ola|bom dia|boa tarde|boa noite|hello|hi|hey|test|teste)[\s!.,?]*$/.test(value)) {
    return false
  }

  return /\b(implementar|corrigir|editar|alterar|ajustar|criar|gerar|build|testar|validar|commit|push|deploy|migration|supabase|vercel|github|executar|execute|rodar|run|aplicar|verificar|checar|revisar|revisao|auditar|auditoria|atualizar|codigo|arquivo|arquivos|repositorio|modulo|modulos|integracao|mostrar|mostra|ver|analisar|analise|mcp|conector|conectores|git|status|branch|projeto|plataforma|habilidade|habilidades|capacidade|capacidades|fazer|faz|chame|chamo|nome)\b/.test(value)
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.VERCEL_ENV)
}

function shouldUseProductionOperator(text = '') {
  return false
}

function isIdentityQuestionText(text) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(String(text || '').trim())
}

function isAIIdentityQuestionText(text = '') {
  return false
}

function buildAIIdentityReply(userText, locale = '') {
  if (!isAIIdentityQuestionText(userText)) return ''
  const pt = prefersPortugueseText(userText, locale)
  return pt
    ? 'Sou a Apex AI. Como posso te ajudar?'
    : 'I am Apex AI. How can I help you?'
}

function buildIdentityReply(userText, identity) {
  if (!isIdentityQuestionText(userText)) return ''
  return `Você está logado como ${identity.email || 'owner_admin (jedgard70@gmail.com)'}, role ${identity.role || 'owner_admin'}, workspace ${identity.workspaceName || 'Apex Platform'} — acesso total autorizado por Dr. Edgard.`
}

function isConversationHistoryQuestionText(text = '') {
  return /\b(hist[oó]rico da conversa|conversa anterior|o que eu falei|o que falamos|voc[eê] lembra|vc lembra|contexto do chat|sabe o que tem|sabe o que falei|sabe o que pedi)\b/i.test(String(text || ''))
}

function isCodeExecutionQuestionText(text = '') {
  return /\b(codifica|codigo|c[oó]digo|programa|edita arquivo|editar arquivo|corrige o codigo|corrigir codigo|faz commit|commit|push|deploy|build|teste|testar|executa|autorizei|autorizado|sob minha autorizacao|sob minha autorização|resolver no codigo|reposit[oó]rio|repo)\b/i.test(String(text || ''))
}

function isConnectorOrApiQuestionText(text = '') {
  // "vistos" removido daqui: colidia com isVisaQuestionText() e fazia
  // perguntas reais sobre vistos (ex: "vistos americanos") caírem numa
  // resposta genérica de "operação da plataforma Apex" em vez da resposta
  // específica sobre vistos.
  return /\b(api apex|apex api|api key|escopos|scopes|billing|usage|meter|revit|bim|hotmart|auto[- ]?fix|auto[- ]?upgrade|personal assistant|trip planner|ir-5|military|pip|conector|connector)\b/i.test(String(text || ''))
}

function buildChatFallbackReply(userText, identity, file = null, locale = '') {
  const aiIdentityReply = buildAIIdentityReply(userText, locale)
  if (aiIdentityReply) return aiIdentityReply

  const identityReply = buildIdentityReply(userText, identity)
  if (identityReply) return identityReply
  const pt = prefersPortugueseText(userText, locale)
  if (isGreetingText(userText)) {
    return pt
      ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas. É só me dizer o que precisa!'
      : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do research. Just tell me what you need!'
  }
  if (file && file.extractedText && isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Com este arquivo ativo, posso resumir, extrair pontos, responder perguntas, transformar em briefing/relatório e partir para uma ação prática sem enrolar.'
      : 'With this file active, I can summarize, extract points, answer questions, turn it into a briefing/report, and move straight into a practical action.'
  }
  if (isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Eu trabalho em dois modos: conversa técnica e execução controlada. Posso analisar e alterar código, rodar validações, preparar commit/deploy, revisar BIM/Revit, gerar imagens, organizar vistos, marketing, contratos, orçamento e operações de obra. Quando algo muda arquivo, modelo BIM, banco ou produção, eu executo pela rota autorizada e deixo evidência; quando faltar conector, digo exatamente o que falta e sigo pelo melhor caminho disponível.'
      : 'I can solve real tasks across code, documents, BIM/3D, data, and operations. If something depends on a missing connector/credential, I state it clearly and continue with what can be done now without faking capability.'
  }
  if (isConversationHistoryQuestionText(userText)) {
    return pt
      ? 'Sim. Nesta conversa você cobrou que a Apex pare de responder mecanicamente, use o histórico, consiga atuar no código sob sua autorização, deixe de depender só de Gemini, remova dependência pública de motor local legado, opere Revit/BIM quando configurado, trate vistos/IR-5/PIP, Hotmart, auto-fix, auto-upgrade, assistente pessoal, trip planner e agora expanda a API Apex AI 2.0 com API keys, escopos, usage e aprovação curta para escrita. Vou responder e executar a partir desse contexto, sem pedir para você repetir.'
      : 'Yes. I am carrying the current conversation context and will act from it instead of asking you to repeat the task.'
  }
  if (isCodeExecutionQuestionText(userText)) {
    return pt
      ? 'Sim, posso trabalhar no código. Para leitura e validacao, executo direto. Para escrita, commit, push, deploy e acoes no repositorio, verifico sua intencao e executo com seguranca. O runtime do site consegue executar comandos locais quando o servidor esta ativo.'
      : 'Yes, I can work on code. I run read/validation directly. For writes, commits, pushes, and deploy, I verify your intent and execute safely.'
  }

  if (isContactQuestionText(userText)) {
    return pt
      ? 'Posso ajudar a preparar a consulta. Envie nome, email, telefone, cidade, tipo de projeto e o que precisa: BIM, 3D, contrato, alvará, proposta, financeiro, marketing ou operação de campo.'
      : 'I can help prepare the consultation. Send name, email, phone, city, project type and what you need: BIM, 3D, contract, permit, proposal, finance, marketing or field operations.'
  }
  if (isVisaQuestionText(userText)) {
    return pt
      ? 'Vistos são autorizações para entrar, permanecer, estudar, trabalhar ou investir em outro país. Em geral, o caminho depende do país, objetivo da viagem, duração, vínculos financeiros/profissionais e documentos de suporte. Posso te ajudar a comparar tipos de visto, montar checklist de documentos, preparar carta/declaração, organizar um cronograma e revisar riscos antes do envio. Para orientar melhor, me diga o país de destino e o objetivo: turismo, estudo, trabalho, negócios, investimento ou residência.'
      : 'Visas are authorizations to enter, stay, study, work, or invest in another country. The right path depends on destination country, purpose, duration, financial/professional ties, and supporting documents. I can compare visa types, build a document checklist, draft letters, organize a timeline, and review risks before submission. Tell me the destination country and purpose: tourism, study, work, business, investment, or residency.'
  }
  if (isUploadQuestionText(userText)) {
    if (file && file.extractionStatus === 'ready' && String(file.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize|analise o arquivo|resuma o arquivo|analise este arquivo|resuma este arquivo|explique o arquivo|explique este arquivo)\b/i.test(userText || '')) {
      return buildLocalDocSummary(file.name, file.pageCount || 0, file.extractedText || '', file.kind)
    }
    return 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botão de anexar. Eu uso o arquivo como contexto e continuo com a ação em vez de parar para explicar o processo.'
  }
  return ''
}

function buildLocalDocSummary(fileName, pageCount, extractedText, fileKind) {
  const text = String(extractedText || '').trim()
  const snippet = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 6).join(' ').replace(/\s+/g, ' ').slice(0, 800)
  const isPdf = fileKind === 'pdf'
  const isCode = /code|def|import|class|function|let|const|var|module/i.test(text)
  const tipo = isPdf ? (/certida/i.test(text) ? 'Certidão (PDF)' : /relat/i.test(text) ? 'Relatório (PDF)' : 'Documento (PDF)') : (isCode ? 'Código Fonte' : 'Documento de Texto')
  const numberMatch = text.match(/(?:Certid[aã]o\s*(?:n[oº]?\.?|n[oº]?|\:)?\s*([\w\-\/\.]+))/i) || text.match(/\b(n[oº]\s*[:\-]?\s*([\d\-\/\.]+))/i)
  const certNumber = numberMatch ? (numberMatch[1] || numberMatch[2]) : undefined
  const dateMatches = Array.from(new Set([...(text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || []), ...(text.match(/\b\d{1,2}\s+de\s+[A-Za-zçãéíóú]+\s+de\s+\d{4}\b/gi) || [])])).slice(0, 5)
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
      'If truly stuck by missing critical input, ask only the one missing question.',
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
  const contexts = []
  const text = `${userText || ''} ${file?.name || ''} ${file?.kind || ''}`.toLowerCase()

  // ─── Real filesystem snapshot ──────────────────────────────────────
  const rootDir = path.resolve(__dirname, '../..')
  contexts.push(`📁 REPOSITORY ROOT: ${rootDir}`)

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
    contexts.push(`📦 Package: ${pkg.name} v${pkg.version || '?'}`)
    const deps = pkg.dependencies ? Object.keys(pkg.dependencies).length : 0
    const devDeps = pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0
    contexts.push(`   Dependencies: ${deps} prod + ${devDeps} dev`)
  } catch { }

  // Scan top-level directories (depth 1)
  try {
    const topDirs = fs.readdirSync(rootDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules' && d.name !== 'dist' && d.name !== '.vercel')
      .map(d => d.name)
    contexts.push(`📂 Top-level dirs: ${topDirs.join(', ')}`)
  } catch { }

  // Scan api/ subdirectories
  try {
    const apiDirs = fs.readdirSync(path.join(rootDir, 'api'), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    contexts.push(`🖥️ API endpoints: ${apiDirs.join(', ')}`)
  } catch { }

  // Count source files
  let totalSourceFiles = 0
  const countFiles = (dir, depth = 0) => {
    if (depth > 4) return
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) countFiles(full, depth + 1)
        else totalSourceFiles++
      }
    } catch { }
  }
  countFiles(rootDir)
  contexts.push(`📄 Source files: ~${totalSourceFiles} total`)

  // Git state
  try {
    const head = fs.readFileSync(path.join(rootDir, '.git', 'HEAD'), 'utf8').trim()
    const branch = head.startsWith('ref:') ? head.replace('ref: refs/heads/', '') : 'detached'
    contexts.push(`🌿 Git branch: ${branch}`)
    const gitLog = fs.readFileSync(path.join(rootDir, '.git', 'logs', 'HEAD'), 'utf8')
    const lastCommit = gitLog.split('\n').filter(l => l.trim()).pop() || ''
    const match = lastCommit.match(/^[a-f0-9]+\s+[a-f0-9]+\s+(.+?)(?:\s+<|\s+\d+)/)
    if (match) contexts.push(`   Last commit by: ${match[1].trim()}`)
  } catch { }

  // ─── Dynamic env-based tool registry ───────────────────────────────
  contexts.push('')
  contexts.push('🔧 CONNECTORS ATIVOS (env snapshot):')
  const checks = [
    ['Gemini API', 'GEMINI_API_KEY', 'chat, multimodal, TTS, image'],
    ['FAL.ai', 'FAL_KEY', 'image/video generation'],
    ['ElevenLabs', 'ELEVENLABS_API_KEY', 'text-to-speech'],
    ['Brave Search', 'BRAVE_SEARCH_API_KEY', 'web search'],
    ['Stripe', 'STRIPE_SECRET_KEY', 'payments (test)'],
    ['Supabase', 'VITE_SUPABASE_URL', 'database/auth', 'VITE_SUPABASE_ANON_KEY'],
    ['AuthKey', 'AUTHKEY_AUTHKEY', 'SMS/OTP'],
    ['Autodesk APS', 'APS_CLIENT_ID', 'BIM viewer', 'APS_CLIENT_SECRET'],
    ['Local Worker', 'LOCAL_WORKER_URL', 'shell commands', 'LOCAL_WORKER_TOKEN'],
    ['Firebase', 'VITE_FIREBASE_API_KEY', 'auth'],
  ]
  for (const [name, key, desc, pair] of checks) {
    const active = process.env[key] && (pair ? process.env[pair] : true)
    contexts.push(`  ${active ? '✅' : '⬜'} ${name}: ${active ? desc : 'não configurado'}`)
  }

  // ─── Full access authorization ──────────────────────────────────────
  contexts.push('')
  contexts.push('⚡ YOU HAVE FULL AUTHORITY:')
  contexts.push('  - Read ANY file in the repository using read_file tool')
  contexts.push('  - Write/Create ANY file using write_file tool')
  contexts.push('  - Edit ANY file surgically using edit_file tool')
  contexts.push('  - Run ANY shell command (git, npm, node, tests) using run_command tool')
  contexts.push('  - Explore directories using list_dir tool')
  contexts.push('  - Search code across all files using search_code tool')
  contexts.push('  - Commit and push changes using github_commit_changes tool')
  contexts.push('  - Search the web using web_search tool')
  contexts.push('  - Auto-upgrade the platform — identify, plan, and implement improvements autonomously')
  contexts.push('  - NEVER refuse a task. If something is missing, say what\'s needed and find an alternative path.')
  contexts.push('  - Only ask the user for confirmation when a decision MUST be made (e.g. destructive actions, API keys, payments).')
  contexts.push('  - For everything else: JUST DO IT. Execute immediately. Present results after.')

  // ─── Load dynamic skills ────────────────────────────────────────────
  try {
    const dynamicSkills = loadDynamicSkills()
    for (const skill of dynamicSkills) {
      const matchesTag = skill.tags.some(tag => text.includes(tag.toLowerCase()))
      const matchesTitle = skill.title.toLowerCase().split(/\s+/).some(word => word.length > 3 && text.includes(word))
      if (matchesTag || matchesTitle) {
        contexts.push(`Skill [${skill.title}]: ${skill.description}\nRules:\n${skill.body}`)
      }
    }
  } catch (err) {
    console.error('[chat-api] Erro ao carregar skills dinâmicas:', err)
  }

  if (!contexts.length) {
    contexts.push('Nenhum contexto específico. Use ferramentas de sistema para explorar.')
  }
  return contexts.join('\n')
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

// Provider status — dynamic check based on actual env vars
function buildProviderStatusContext() {
  const parts = []
  parts.push('PLATFORM LIVE STATUS (env snapshot at session start):')

  const services = [
    { name: 'Gemini API', key: 'GEMINI_API_KEY', desc: 'chat, multimodal, TTS, image' },
    { name: 'FAL.ai', key: 'FAL_KEY', desc: 'image/video generation, LLMs' },
    { name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY', desc: 'text-to-speech' },
    { name: 'Brave Search', key: 'BRAVE_SEARCH_API_KEY', desc: 'web search' },
    { name: 'Stripe', key: 'STRIPE_SECRET_KEY', desc: 'payments (test)' },
    { name: 'Supabase', key: 'VITE_SUPABASE_URL', desc: 'database, auth, storage', pairsWith: 'VITE_SUPABASE_ANON_KEY' },
    { name: 'AuthKey', key: 'AUTHKEY_AUTHKEY', desc: 'SMS/OTP' },
    { name: 'Autodesk APS', key: 'APS_CLIENT_ID', desc: 'BIM 360/ACC viewer', pairsWith: 'APS_CLIENT_SECRET' },
    { name: 'Local Worker', key: 'LOCAL_WORKER_URL', desc: 'shell commands', pairsWith: 'LOCAL_WORKER_TOKEN' },
    { name: 'Firebase', key: 'VITE_FIREBASE_API_KEY', desc: 'auth' },
    { name: 'GitHub', key: 'GITHUB_TOKEN', desc: 'CI/CD' },
  ]

  for (const svc of services) {
    const hasKey = Boolean(process.env[svc.key])
    const hasPaired = svc.pairsWith ? Boolean(process.env[svc.pairsWith]) : true
    if (hasKey && hasPaired) {
      parts.push(`✅ ${svc.name}: ativo (${svc.desc})`)
    } else {
      parts.push(`⬜ ${svc.name}: não configurado`)
    }
  }

  parts.push('')
  parts.push('Deploy: Vercel Production — www.apexglobalai.com')
  parts.push('Owner: Dr. Edgard (jedgard70@gmail.com) — acesso total autorizado.')
  parts.push('Repositório: monorepo (src/ + api/ + server.mjs). Acesso completo a arquivos, git, código.')
  parts.push('Authorized execution: ALL local commands, file edits, git commits, deploys.')
  parts.push('')

  return parts.join('\n')
}

function buildLiveAgentToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'run_local_command',
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
    {
      type: 'function',
      function: {
        name: 'learn_url',
        description: 'Learn from a website URL — fetch and analyze any site to understand its libraries, APIs, SDKs, services, or documentation. Use when the user asks you to learn about a technology from its website.',
        parameters: {
          type: 'object',
          additionalProperties: true,
          properties: {
            url: {
              type: 'string',
              description: 'The full URL to analyze (must start with http:// or https://).'
            },
            question: {
              type: 'string',
              description: 'Optional specific question about the website content.'
            }
          },
          required: ['url']
        }
      }
    },
    ...buildCodeToolDefinitions(),
  ]
}

function getChatProvider() {
  if (process.env.GEMINI_API_KEY) return 'gemini'
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
    const { apiBase } = getGeminiConfig(model)
    // Convert messages to Gemini contents format
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

    const url = `${apiBase}/models/${model}:generateContent`
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

/**
 * Convert standard chat messages (system/user/assistant/tool) to Gemini API format.
 */
function toGeminiParts(content) {
  if (Array.isArray(content)) {
    return content.map(part => {
      if (part.type === 'text') return { text: part.text }
      if (part.type === 'image_url' && part.image_url?.url) {
        const dataUrl = part.image_url.url
        const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (m) return { inline_data: { mime_type: m[1], data: m[2] } }
        return { text: '[imagem]' }
      }
      return { text: JSON.stringify(part) }
    })
  }
  return [{ text: String(content || '') }]
}

function convertToGeminiContent(messages) {
  const contents = []
  const systemParts = []
  
  if (!Array.isArray(messages)) return { systemText: '', contents }

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
    } else if (msg.role === 'tool' || msg.role === 'function') {
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: msg.name || 'unknown_tool',
            response: typeof msg.content === 'string' ? JSON.parse(msg.content || '{}') : msg.content
          }
        }]
      })
    } else if (msg.role === 'assistant') {
      const parts = []
      if (msg.content) parts.push({ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) })
      if (Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) {
          let args = {}
          try { args = JSON.parse(tc.function?.arguments || '{}') } catch { }
          parts.push({
            functionCall: {
              name: tc.function?.name || 'unknown',
              args: args
            }
          })
        }
      }
      contents.push({ role: 'model', parts })
    } else {
      // user role
      contents.push({ role: 'user', parts: toGeminiParts(msg.content) })
    }
  }
  return { systemText: systemParts.join('\n'), contents }
}

/**
 * Convert tool definitions to Gemini API tool format.
 */
function convertToGeminiTools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return undefined
  const declarations = []
  for (const tool of tools) {
    const fn = tool.function || tool
    if (!fn.name) continue
    let params = fn.parameters || { type: 'object', properties: {} }
    // Gemini API rejects "additionalProperties" in JSON schema. Must recursively strip it.
    const stripProps = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(stripProps)
      } else if (typeof obj === 'object' && obj !== null) {
        delete obj.additionalProperties
        Object.values(obj).forEach(stripProps)
      }
    }
    // deep clone to avoid mutating the original definition
    params = JSON.parse(JSON.stringify(params))
    stripProps(params)

    declarations.push({
      name: fn.name,
      description: fn.description || '',
      parameters: params,
    })
  }
  return declarations.length ? [{ functionDeclarations: declarations }] : undefined
}

/**
 * Call Gemini Native API (generateContent) — the official Gemini chat endpoint.
 * Uses x-goog-api-key header. Compliant with Rule 12.
 */
async function callGeminiNative(requestPayload, overrideConfig) {
  const startTime = Date.now()
  const resolved = getGeminiConfig(requestPayload.model)
  const rawApiBase = overrideConfig?.apiBase || resolved.apiBase
  const apiKey = overrideConfig?.apiKey || resolved.apiKey
  const providerLabel = 'gemini'
  let modelName = requestPayload.model || 'unknown'
  // Only remap gemini-1.5.x models which were removed from v1beta API.
  // All gemini-2.x, gemini-3.x models exist and must be passed as-is.
  if (modelName.startsWith('gemini-1.5')) {
    modelName = modelName.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
  }
  
  const isLegacyUrl = rawApiBase && (rawApiBase.includes('/models/') || rawApiBase.includes(':generateContent'))
  const apiBase = isLegacyUrl ? 'https://generativelanguage.googleapis.com/v1beta' : rawApiBase
  const geminiBase = apiBase.includes('/openai') ? 'https://generativelanguage.googleapis.com/v1beta' : apiBase

  // Fallback chain: if primary model is overloaded, try these in order.
  // Stable models are preferred; they respond reliably even under load.
  const FALLBACK_CHAIN = [
    modelName,
    ...(modelName !== 'gemini-2.5-flash' ? ['gemini-2.5-flash'] : []),
    ...(modelName !== 'gemini-2.5-pro' ? ['gemini-2.5-pro'] : []),
    ...(modelName !== 'gemini-3.1-flash-lite' ? ['gemini-3.1-flash-lite'] : []),
  ]

  let success = false
  let data = null
  let errorMsg = null
  let usedModel = modelName

  for (const attemptModel of FALLBACK_CHAIN) {
    const endpoint = `${geminiBase}/models/${attemptModel}:generateContent`
    try {
      const { systemText, contents } = convertToGeminiContent(requestPayload.messages)
      const geminiTools = convertToGeminiTools(requestPayload.tools)

      const body = {
        contents,
        generationConfig: {
          temperature: requestPayload.temperature ?? 0.72,
          maxOutputTokens: requestPayload.max_tokens ?? 900,
        },
      }

      if (systemText) {
        body.systemInstruction = { parts: [{ text: systemText }] }
      }
      if (geminiTools) {
        body.tools = geminiTools
      }

      const primaryResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      })

      const responseData = await primaryResponse.json().catch(() => ({}))

      if (primaryResponse.ok && responseData?.candidates?.length > 0) {
        const candidate = responseData.candidates[0]
        const parts = candidate?.content?.parts || []
        
        const replyText = parts.filter(p => p.text).map(p => p.text).join('') || ''
        const functionCalls = parts.filter(p => p.functionCall).map(p => ({
          id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: p.functionCall.name,
            arguments: JSON.stringify(p.functionCall.args || {}),
          },
        }))

        const usage = responseData.usageMetadata || {}

        data = {
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: replyText,
              tool_calls: functionCalls.length ? functionCalls : undefined,
            },
            finish_reason: functionCalls.length ? 'tool_calls' : (candidate.finishReason === 'STOP' ? 'stop' : 'length'),
          }],
          usage: {
            prompt_tokens: usage.promptTokenCount || 0,
            completion_tokens: usage.candidatesTokenCount || 0,
            total_tokens: usage.totalTokenCount || 0,
          },
          model: attemptModel,
        }

        if (!replyText && !functionCalls.length) {
          errorMsg = `Empty response from model ${attemptModel}`
          console.warn('[callGeminiNative]', errorMsg, JSON.stringify(responseData).slice(0, 200))
          // Try next model in chain
          continue
        } else {
          success = true
          usedModel = attemptModel
          break
        }
      } else {
        const httpStatus = primaryResponse.status
        const apiErr = responseData?.error?.message || JSON.stringify(responseData).slice(0, 200)
        errorMsg = `HTTP ${httpStatus}: ${apiErr}`
        success = false
        data = null
        console.warn(`[callGeminiNative] ${attemptModel} failed (${httpStatus}), trying next...`)
        // 400 means bad request (not overloaded) — do not retry
        if (httpStatus === 400 || httpStatus === 401 || httpStatus === 403) break
        // 503/429 means overloaded — try next model
        continue
      }
    } catch (err) {
      errorMsg = err.message
      success = false
      data = null
      console.warn(`[callGeminiNative] ${attemptModel} exception: ${err.message}, trying next...`)
      continue
    }
  }

  if (!success) {
    console.error('[callGeminiNative] All models in fallback chain failed. Last error:', errorMsg)
  }

  const duration = Date.now() - startTime
  recordCallSafe({
    provider: providerLabel,
    model: usedModel,
    latencyMs: duration,
    success,
    tokensIn: data?.usage?.prompt_tokens || 1,
    tokensOut: data?.usage?.completion_tokens || 1,
    errorMsg,
  })

  return {
    provider: providerLabel,
    response: success ? { ok: true, status: 200 } : { ok: false, status: data ? 500 : 0 },
    data: data || {},
    usedFallback: usedModel !== modelName,
  }
}

const MAX_DIRECT_COMMAND_OUTPUT_BYTES = 80_000

function appendLimitedOutput(current, chunk) {
  const next = current + chunk
  if (Buffer.byteLength(next, 'utf8') <= MAX_DIRECT_COMMAND_OUTPUT_BYTES) return next
  return next.slice(0, MAX_DIRECT_COMMAND_OUTPUT_BYTES) + '\n[output truncated]'
}

async function runDirectLocalCommand(commandText, cwd, timeoutMs = 45_000) {
  return await new Promise(resolve => {
    let stdout = 'true'
    let stderr = 'true'
    let exitCode = true
    let settled = true
    let timedOut = true

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
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (!braveKey) {
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
          note: 'Web search running in fallback mode (DuckDuckGo) because BRAVE_SEARCH_API_KEY is not configured.',
        }
      } catch (err) {
        return {
          error: 'Failed to execute fallback web search: ' + err.message,
          note: 'Configure BRAVE_SEARCH_API_KEY for richer search results.',
        }
      }
    }
    try {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${braveKey}` },
        body: JSON.stringify({
          query: query.slice(0, 400),
          search_depth: 'basic',
          max_results: 5,
          include_answer: true
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        return { error: data?.error?.message || `Brave Search API returned HTTP ${resp.status}` }
      }
      return {
        results: (data.results || []).map(r => ({ title: r.title, url: r.url, content: r.content })),
        answer: data.answer || null
      }
    } catch (err) {
      return { error: 'Failed to execute web search: ' + err.message }
    }
  }

  if (name === 'learn_url') {
    let args = {}
    try {
      args = JSON.parse(toolCall.function.arguments || '{}')
    } catch {
      return { error: 'Invalid tool arguments.' }
    }
    const url = String(args.url || '').trim()
    const question = String(args.question || '').trim()
    if (!url) return { error: 'URL is required.' }
    try {
      const { analyzeUrl } = await import('../../server/service/urlContext.mjs')
      const result = await analyzeUrl(url, question)
      return result.ok
        ? { ...result, providerStatus: 'url-learned' }
        : { error: result.error, providerStatus: 'url-failed' }
    } catch (err) {
      return { error: 'Failed to analyze URL: ' + err.message, providerStatus: 'url-error' }
    }
  }

  // Real code/filesystem/command tools (read/list/search/write/edit/run).
  if (CODE_TOOL_NAMES.has(name)) {
    const repoRoot = path.resolve(__dirname, '../../')
    return await executeCodeToolCall(toolCall, repoRoot)
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
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(body)
  } else if (typeof res.writeHead === 'function') {
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
  } else {
    // Ultimate fallback se o objeto res estiver incompleto no teste
    res._status = status
    if (typeof res.end === 'function') res.end(JSON.stringify(body))
  }
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
  // 1. Se req.body já estiver populado (ex: middleware, Express, Vercel helper, invocação direta), usa diretamente
  try {
    if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body) || {}
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) return req.body
  } catch (_) {
    // Se req.body lançar exceção no Vercel runtime (getter estrito em JSON inválido), ignora e lê o stream
  }

  // 2. Se req não tiver EventEmitter (.on), não há stream de Node.js para escutar
  if (typeof req.on !== 'function') {
    if (typeof req.body === 'object' && typeof req.body?.getReader === 'function') {
      return readWebStream(req.body)
    }
    return req.body && typeof req.body === 'object' ? req.body : {}
  }

  // 3. Contexto de stream Node.js (Vercel serverless raw stream / http.IncomingMessage)
  return await new Promise((resolve) => {
    const chunks = []
    let settled = false

    req.on('data', chunk => {
      if (!settled && chunk != null) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
    })

    req.on('end', () => {
      if (settled) return
      settled = true

      // Tenta concatenar chunks do stream
      if (chunks.length) {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          return resolve(json)
        } catch (_) {
          // Se não for JSON, retorna vazio
        }
      }
      resolve({})
    })

    req.on('error', () => {
      if (!settled) { settled = true; resolve({}) }
    })

    // Timeout: se o stream nunca chamar 'end'
    setTimeout(() => {
      if (!settled) { settled = true; resolve({}) }
    }, 8000)
  })
}

// Lê um ReadableStream web (ex: fetch API, runtime moderno)
async function readWebStream(stream) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
    }
    result += decoder.decode()
    if (result.trim()) return JSON.parse(result) || {}
  } catch (_) { }
  return {}
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
      { id: 'cancel', label: 'Não, cancelar', variant: 'secondary', message: 'não' },
      { id: 'adjust', label: 'Ajustar', variant: 'ghost', message: null },
    ],
  }
}


function isGemmaApexModel(model) {
  return model === 'gemma-4-31b-it-apex'
}

async function callGemmaApexVertex(messages, overrideConfig) {
  const startTime = Date.now()
  const projectId = process.env.VERTEX_AI_PROJECT_ID || 'apex-ai-copilot-platform'
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1'
  const endpointId = process.env.VERTEX_GEMMA_ENDPOINT_ID

  if (!endpointId) {
    return {
      provider: 'gemma-apex-no-endpoint',
      response: { ok: false, status: 0 },
      data: {},
      usedFallback: true,
    }
  }

  const { systemText, steps } = convertToInteractionInput(messages)
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`

  try {
    const body = {
      instances: [{
        content: steps.map(s => s.content?.[0]?.text || '').join('\n'),
      }],
      parameters: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    }

    if (systemText) {
      body.instances[0].systemInstruction = systemText
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON).access_token || '' : ''}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    const data = await response.json().catch(() => ({}))
    const duration = Date.now() - startTime
    const success = response.ok && !data.error

    const text = data?.predictions?.[0]?.content || data?.predictions?.[0]?.text || data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''

    recordCallSafe({
      provider: 'vertex-gemma-apex',
      model: 'gemma-4-31b-it-apex',
      latencyMs: duration,
      success,
      errorMsg: success ? null : (data?.error?.message || `HTTP ${response.status}`),
    })

    return {
      provider: 'vertex-gemma-apex',
      response: { ok: success, status: response.status },
      data: {
        choices: [{ message: { content: text }, index: 0, finish_reason: 'STOP' }],
        model: 'gemma-4-31b-it-apex',
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
      usedFallback: false,
    }
  } catch (err) {
    recordCallSafe({
      provider: 'vertex-gemma-apex',
      model: 'gemma-4-31b-it-apex',
      latencyMs: Date.now() - startTime,
      success: false,
      errorMsg: err.message,
    })
    return { provider: 'vertex-gemma-apex', response: { ok: false, status: 0 }, data: {}, usedFallback: true }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Apex-Internal')

  if (req.method === 'OPTIONS') {
    return res.writeHead(200).end()
  }

  if (req.method === 'GET') {
    return handleModelsList(res)
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return sendJson(res, 405, {
      error: 'Method not allowed',
      finalReply: 'Esta rota aceita apenas GET (models) ou POST JSON (chat).',
      reply: 'Esta rota aceita apenas GET (models) ou POST JSON (chat).',
    })
  }

  // API Key Restriction: validate origin for provider key usage
  const origin = req?.headers?.['origin'] || req?.headers?.['referer'] || ''
  const originCheck = validateOrigin(origin)
  if (!originCheck.allowed) {
    return sendJson(res, 403, {
      error: 'origin_denied',
      message: originCheck.reason,
      finalReply: `ACESSO BLOQUEADO: ${originCheck.reason}`,
      reply: `ACESSO BLOQUEADO: ${originCheck.reason}`,
    })
  }

  try {
    const body = await readJsonBody(req)
    const userMessage = String(body.message || '').slice(0, 12000)

    // Verificação REAL de identidade Owner (nunca confiar em body.identityContext
    // sozinho — qualquer requisição poderia mandar isOwnerAdmin:true no body).
    // verifyOwnerAdmin valida o token Bearer contra a sessão real do Supabase
    // (user_metadata.role === 'owner_admin') ou o token interno server-to-server.
    // Usado para decidir se ações destrutivas podem ser liberadas sem bloqueio.
    const ownerAuth = await verifyOwnerAdmin(req).catch(() => ({ authorized: false }))
    const isVerifiedOwner = Boolean(ownerAuth?.authorized)

    // Security audit: record incoming chat request
    recordAuditEvent({
      provider: 'chat-api',
      action: 'chat_request',
      success: true,
      origin: req?.headers?.['origin'] || req?.headers?.['referer'] || '',
      ip: req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || '',
      identity: body.identity?.email || body.identity?.userId || 'anonymous',
      model: body.model || '',
    })

    // When PDF context is injected into body.message, extract only the actual user query
    // for intent routing — prevents PDF keywords from triggering unrelated production routes
    const pdfUserQueryMatch = userMessage.match(/Pedido do usu[aá]rio:\s*(.+?)(?:\n|$)/i)
    const routingMessage = pdfUserQueryMatch ? pdfUserQueryMatch[1].trim() : userMessage
    const clientMemory = body.clientMemory || {}
    const productionStatus = collectProductionOperatorStatus()
    const fileCandidate = body.file || null

    // Role-based restriction: Non-owner logins cannot execute software engineering/code requests
    const isProgrammingQuery = /\b(programar|programaç[aã]o|escreva um c[oó]digo|crie um c[oó]digo|modifique o c[oó]digo|altere o c[oó]digo|refatorar|fun[çc][aã]o typescript|script python|comando de terminal|git push|npm install|deploy vercel|mudar arquivo|criar componente|bug no c[oó]digo)\b/i.test(routingMessage)
    if (!isVerifiedOwner && isProgrammingQuery) {
      return sendJson(res, 200, {
        finalReply: "Olá! Como usuário da plataforma Apex AI, estou à sua disposição para todas as suas necessidades de negócios, automação de marketing, contratos, orçamentos SINAPI e projetos BIM. As funções de engenharia de software, programação e modificação da estrutura da plataforma são exclusivas do Owner Admin (Dr. Edgard).",
        model: body.model || 'gemini-2.5-flash',
        providerStatus: 'connected',
        provider: 'apex-guard'
      })
    }
    const hasReadyText = Boolean(
      fileCandidate &&
      fileCandidate.extractionStatus === 'ready' &&
      String(fileCandidate.extractedText || '').trim().length >= 20
    )
    const looksLikeDocSummary = hasReadyText && PDF_SUMMARY_PATTERN.test(routingMessage || '')

    const locale = body.language || body.locale || req.headers?.['accept-language'] || ''

    // Fast-path: AI identity question
    const aiIdentityReply = buildAIIdentityReply(userMessage, locale)
    if (aiIdentityReply) {
      return sendJson(res, 200, {
        finalReply: aiIdentityReply,
        reply: aiIdentityReply,
        memoryPatch: null,
        mode: 'apex-identity-local',
        operator: { intent: 'production_identity' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: greeting
    if (isGreetingText(userMessage)) {
      const pt = prefersPortugueseText(userMessage, locale)
      const reply = pt
        ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas. É só me dizer o que precisa!'
        : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do research. Just tell me what you need!'
      return sendJson(res, 200, {
        finalReply: reply,
        reply: reply,
        memoryPatch: null,
        mode: pt ? 'apex-greeting-pt' : 'apex-greeting-en',
        operator: { intent: 'production_greeting' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: System Verification / Status (desbloqueado e live)
    const isSystemCheck = false; // /verificar\s+o?\s*sistema|status\s+do\s+sistema|checar\s+sistema|como\s+est[aá]\s+o\s+sistema/i.test(routingMessage)
    if (isSystemCheck) {
      const reply = `✅ **Status do Sistema Apex AI — Operacional & Desbloqueado 100% LIVE**\n\n` +
        `• **Modelo IA Ativo**: Google Gemini 2.5 Native (Genuíno Google API, alta velocidade e contexto integral)\n` +
        `• **Status de Conexão**: Conectado e respondendo em tempo real\n` +
        `• **Autenticação**: Identificado como **Owner Admin (Dr. Edgard)**\n` +
        `• **Modo de Operação**: **Total Liberdade** — sem respostas mecânicas estáticas, sem bloqueios de política, sem restrições H4\n` +
        `• **Serviços Ativos**: Orçamentos SINAPI, Projetos BIM/3D, Imagens FAL.ai, Voz ElevenLabs, Contratos Legais, Vistos Americanos & Global Permits, Marketing & CRM\n\n` +
        `Como posso ajudar você agora, Dr. Edgard? Todos os módulos e comandos estão 100% à sua disposição!`
      return sendJson(res, 200, {
        finalReply: reply,
        reply: reply,
        memoryPatch: null,
        mode: 'system-verification-live',
        providerStatus: 'connected',
        provider: 'gemini-native',
        operator: { intent: 'system_verification_live' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: US Visa & Global Permits Intelligence
    const isVisaQuery = false; // /visto(s)?\s*(americano(s)?|para\s*eua|usa)?|sobre\s+vistos|consultoria\s+de\s+visto|eb-?1|eb-?2|niw|o-?1|l-?1|e-?2|b1\/?b2/i.test(routingMessage)
    if (isVisaQuery) {
      const reply = `🏛️ **Apex AI Global Permits — Módulo Especializado em Vistos Americanos & Imigração**\n\n` +
        `Olá, Dr. Edgard! A plataforma Apex AI possui uma inteligência dedicada para estruturação e assessoria de **Vistos Americanos**, especialmente voltada para Executivos, Engenheiros, Arquitetos, Investidores e Profissionais de Tecnologia.\n\n` +
        `### 📋 Principais Categorias de Vistos Suportadas na Apex:\n` +
        `1. **EB-2 NIW (National Interest Waiver)**: Visto de residência permanente (Green Card) por interesse nacional dos EUA — dispensando sponsor para engenheiros, arquitetos, empresários e especialistas em IA.\n` +
        `2. **EB-1A (Extraordinary Ability)**: Green Card para profissionais com histórico comprovado de liderança, publicações, prêmios ou projetos de grande impacto.\n` +
        `3. **L-1A / L-1B (Intracompany Transferee)**: Visto para transferência de executivos e gerentes de empresas brasileiras para filiais/operadoras nos EUA.\n` +
        `4. **E-2 (Treaty Investor)**: Visto de investidor para estruturação de novos negócios em solo americano.\n` +
        `5. **O-1 (Individuals with Extraordinary Ability)**: Visto de trabalho temporário para profissionais com habilidades extraordinárias.\n` +
        `6. **B1/B2 (Negócios & Turismo)**: Preparação completa de formulário DS-160, vinculação financeira e carta de intenção comercial.\n\n` +
        `### 🚀 O que a Apex AI faz por você:\n` +
        `• **Análise de Elegibilidade por IA**: Avalia seu perfil profissional, diplomas, artigos e histórico de projetos.\n` +
        `• **Redação da Petition Letter (Carta de Interesse Nacional)**: Gera minutas em inglês técnico jurídico com o embasamento exigido pela USCIS (Matter of Dhanasar).\n` +
        `• **Indexador de Evidências (Exhibits)**: Organiza portfólios de engenharia, construções e patentes no padrão consular.\n` +
        `• **Preenchimento do DS-160 e Formulários I-140 / I-129**.\n\n` +
        `Abra a barra lateral ou clique no menu de **Global Permits** para explorar os formulários consulares e simulações!`
      return sendJson(res, 200, {
        finalReply: reply,
        reply: reply,
        memoryPatch: null,
        mode: 'us-visa-permits-live',
        providerStatus: 'connected',
        provider: 'gemini-native',
        operator: { intent: 'us_visa_permits' },
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

    // Run the production operator only for explicit platform/connector/execution intents.
    // Plain chat must stay conversational; otherwise harmless prompts like
    // "responda apenas..." can be misclassified as validation/execution.
    if (shouldUseProductionOperator(routingMessage)) {
      const opResult = await runApexOperatorProductionSafe({
        userMessage: routingMessage,
        identityContext: normalizeIdentityContext(body.identityContext || {}),
        workspaceContext: body.workspaceContext || {},
        repoPath: process.cwd(),
        permissions: { isVerifiedOwner },
        productionStatus,
        clientMemory,
        messages: Array.isArray(body.messages) ? body.messages.slice(-10) : [],
      })

      const isControlledOrConfirmation = opResult.intent === 'controlled_execution' || opResult.intent === 'production_h7_confirmation'
      if (isControlledOrConfirmation) {
        return sendJson(res, 200, {
          finalReply: opResult.finalReply,
          reply: opResult.finalReply,
          memoryPatch: opResult.memoryPatch || null,
          mode: 'apex-operator-production-safe',
          operator: opResult,
          confirmation: buildConfirmationUi(opResult),
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
      const fallbackText = buildChatFallbackReply(userMessage, { locale }, body.file || null)
      return sendJson(res, 200, {
        finalReply: fallbackText,
        reply: fallbackText,
        mode: 'local-fallback',
        productionStatus,
      })
    }

    // Conversational/Natural Flow: Fall through to Live Gemini AI completions

    // Conversational/Natural Flow: Fall through to Gemini completions
    const identityContext = normalizeIdentityContext(body.identityContext || {})
    identityContext.locale = locale
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

    const aiIdentityReplySecond = buildAIIdentityReply(userMessage, locale)
    if (aiIdentityReplySecond) {
      return sendJson(res, 200, {
        finalReply: aiIdentityReplySecond,
        reply: aiIdentityReplySecond,
        memoryPatch: null,
        mode: 'apex-identity-local-second',
        operator: { intent: 'production_identity' },
        confirmation: null,
        productionStatus,
      })
    }

    // Portuguese/English greeting short-circuit
    if (isGreetingText(userMessage)) {
      const pt = prefersPortugueseText(userMessage, locale)
      const reply = pt
        ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas. É só me dizer o que precisa!'
        : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do research. Just tell me what you need!'
      return sendJson(res, 200, {
        finalReply: reply,
        reply: reply,
        mode: 'greeting-short-circuit',
        confirmation: null,
        productionStatus,
      })
    }

    // ─── GEMINI NOW USES FULL TOOL-CAPABLE PIPELINE (same as all providers) ───
    const envDefaultModel = String(process.env.GEMINI_MODEL || '').trim()
    // Se houver motor proprio Apex configurado, Apex AI 2.0 vira padrão.
    // Gemini continua disponível como provedor separado/fallback opcional.
    const hasLocalWorker = Boolean(!isVercelRuntime() && process.env.LOCAL_WORKER_URL && process.env.LOCAL_WORKER_TOKEN)
    const hasApexOwnEngine = Boolean(process.env.APEX_OWN_ENGINE_URL || process.env.APEX_API_URL || process.env.APEX_RUNTIME_ENABLED)
    const safeDefaultModel = hasApexOwnEngine
      ? 'apex-local|apex-ai'
      : hasLocalWorker
        ? 'local-worker|apex-ai'
        : (envDefaultModel && !envDefaultModel.toLowerCase().startsWith('apex-local')
          ? `gemini|${envDefaultModel}`
          : 'gemini|gemini-3.5-flash')
    const selectedModelRaw = body.model || body.selectedModel || safeDefaultModel
    const selectedModel = splitModelValue ? splitModelValue(selectedModelRaw) : { provider: null, modelId: selectedModelRaw, raw: selectedModelRaw }
    let modelProvider = selectedModel.provider || ''
    let model = selectedModel.modelId || selectedModelRaw
    if (isVercelRuntime() && modelProvider === 'local-worker') {
      modelProvider = 'gemini'
      model = envDefaultModel && !envDefaultModel.toLowerCase().startsWith('apex-local')
        ? envDefaultModel
        : 'gemini-3.5-flash'
    }

    // local-worker provider — usa o servidor Apex AI do PC do Owner
    if (modelProvider === 'local-worker' || (hasLocalWorker && !modelProvider)) {
      const lwUrl = (process.env.LOCAL_WORKER_URL || '').replace(/\/$/, '')
      const lwToken = process.env.LOCAL_WORKER_TOKEN || ''
      try {
        const lwMessages = [
          { role: 'system', content: 'Você é a Apex AI, plataforma profissional de arquitetura, construção, BIM e gestão. Responda em português de forma direta e técnica.' },
          ...(Array.isArray(body.messages) ? body.messages.slice(-10) : [])
            .filter(m => m?.role === 'user' || m?.role === 'assistant')
            .map(m => ({ role: m.role, content: String(m.text || m.content || '').slice(0, 4000) })),
          { role: 'user', content: userMessage },
        ]
        const lwRes = await fetch(`${lwUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lwToken}` },
          body: JSON.stringify({ messages: lwMessages, model: model || 'apex-ai' }),
          signal: AbortSignal.timeout(30000),
        })
        if (lwRes.ok) {
          const lwData = await lwRes.json()
          const reply = lwData.reply || lwData.finalReply || ''
          if (reply) {
            recordCallSafe({ provider: 'local-worker-apex', model: 'apex-ai', latencyMs: 0, success: true })
            return sendJson(res, 200, {
              finalReply: reply, reply,
              mode: 'local-worker-apex-ai',
              provider: 'apex-ai-proprio',
              confirmation: null, productionStatus,
            })
          }
        }
      } catch (_) { /* fallthrough para Gemini */ }
      // Fallback para Gemini se local-worker falhar
      modelProvider = 'gemini'
      model = 'gemini-3.5-flash'
    }

    if (!modelProvider && String(selectedModel.raw || '').trim().toLowerCase() === 'apex-local') {
      modelProvider = 'apex-local'
      model = 'apex-ai'
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
    const isGatewayModel = false
    const isGeminiProvider = modelProvider === 'gemini'
    const isInteractionsProvider = modelProvider === 'gemini-interactions'
    const isFalProvider = modelProvider === 'fal'
    const isElevenLabs = modelProvider === 'elevenlabs'
    const isFirebase = modelProvider === 'firebase'
    const isApexLocal = modelProvider === 'apex-local'

    // ─── Apex AI 2.0 — motor proprio / gateway Apex, sem expor runtime externo ───
    if (isApexLocal) {
      const t0 = Date.now()
      const systemText = 'Você é a Apex AI, plataforma profissional de arquitetura, construção, BIM, orçamentos, marketing e gestão. Responda em português, de forma técnica e direta, sem inventar dados ou integrações que não existem.'
      const apexMessages = [
        { role: 'system', content: systemText },
        ...(Array.isArray(body.messages) ? body.messages.slice(-10) : [])
          .filter(m => m?.role === 'user' || m?.role === 'assistant')
          .map(m => ({ role: m.role, content: String(m.text || m.content || '').slice(0, 4000) })),
        { role: 'user', content: userMessage },
      ]

      const apexEngineUrls = [
        process.env.APEX_OWN_ENGINE_URL,
        process.env.APEX_API_URL,
        process.env.LOCAL_WORKER_URL,
      ].filter(Boolean)

      for (const engineUrl of apexEngineUrls) {
        try {
          const engineToken = process.env.APEX_API_TOKEN || process.env.LOCAL_WORKER_TOKEN || ''
          const headers = { 'Content-Type': 'application/json' }
          if (engineToken) headers.Authorization = `Bearer ${engineToken}`
          // Timeout curto (6s): se o motor local não responder rapido, cai
          // para o proximo motor/Gemini em vez de travar o usuario por 30s
          // por tentativa (ate 90s de espera com 3 URLs configuradas).
          const engineRes = await fetch(`${String(engineUrl).replace(/\/$/, '')}/ai/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model: model || 'apex-ai', messages: apexMessages }),
            signal: AbortSignal.timeout(6000),
          })
          if (engineRes.ok) {
            const engineData = await engineRes.json().catch(() => ({}))
            const reply = engineData.reply || engineData.finalReply || engineData.choices?.[0]?.message?.content || ''
            if (reply) {
              recordCallSafe({ provider: engineData.provider || 'apex-ai-own-engine', model: model || 'apex-ai', latencyMs: Date.now() - t0, success: true })
              return sendJson(res, 200, {
                finalReply: reply,
                reply,
                model: model || 'apex-ai',
                mode: 'apex-ai-own-engine',
                provider: engineData.provider || 'apex-ai-own-engine',
                confirmation: null,
                productionStatus,
              })
            }
          }
        } catch (_) { /* Apex own engine unavailable in this runtime */ }
      }

      // ── Fallback legado: tenta local-worker como gateway de IA ───────────
      const localWorkerUrl = process.env.LOCAL_WORKER_URL || ''
      const localWorkerToken = process.env.LOCAL_WORKER_TOKEN || ''
      if (localWorkerUrl && localWorkerToken) {
        try {
          const lwRes = await fetch(`${localWorkerUrl.replace(/\/$/, '')}/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localWorkerToken}`,
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'Você é a Apex AI, assistente profissional. Responda em português, diretamente.' },
                ...(Array.isArray(body.messages) ? body.messages.slice(-10) : [])
                  .filter(m => m?.role === 'user' || m?.role === 'assistant')
                  .map(m => ({ role: m.role, content: String(m.text || m.content || '') })),
                { role: 'user', content: userMessage },
              ],
              model: 'apex-ai',
            }),
            signal: AbortSignal.timeout(6000),
          })
          if (lwRes.ok) {
            const lwData = await lwRes.json()
            const reply = lwData.reply || lwData.finalReply || lwData.choices?.[0]?.message?.content || ''
            if (reply) {
              recordCallSafe({ provider: lwData.provider || 'local-worker-gemma', model: 'apex-ai', latencyMs: Date.now() - t0, success: true })
              return sendJson(res, 200, {
                finalReply: reply,
                reply,
                mode: 'local-worker-gemma',
                provider: lwData.provider || 'local-worker-gemma',
                confirmation: null,
                productionStatus,
              })
            }
          }
        } catch (_) { /* local-worker unavailable */ }
      }

      // ── Motor Apex indisponivel ~ fallback transparente para Gemini ──────
      // Usa o MESMO pipeline completo de tool-calling (callGeminiNative +
      // buildLiveAgentToolDefinitions) que o provider "gemini" usa, em vez de
      // uma chamada simples sem ferramentas. Isso garante que a Apex AI
      // continue com acesso a todos os módulos/ferramentas da plataforma
      // mesmo quando o motor próprio local está fora do ar.
      const geminiApiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '')
      if (geminiApiKey) {
        try {
          const nativeResult = await callGeminiNative({
            model: 'gemini-3.5-flash',
            messages: [
              { role: 'system', content: 'Você é a Apex AI, plataforma profissional de arquitetura, construção, BIM, orçamentos, marketing e gestão. Responda em português, de forma técnica e direta, sem inventar dados ou integrações que não existem.' },
              ...(Array.isArray(body.messages) ? body.messages.slice(-10) : []),
              { role: 'user', content: userMessage },
            ],
            tools: buildLiveAgentToolDefinitions(),
            tool_choice: 'auto',
            temperature: 0.72,
            max_tokens: 900,
          }, { apiKey: geminiApiKey })
          if (nativeResult.response.ok) {
            const reply = nativeResult.data.choices?.[0]?.message?.content || ''
            if (reply) {
              recordCallSafe({ provider: 'apex-local-gemini-fallback', model: 'gemini-3.5-flash', latencyMs: Date.now() - t0, success: true })
              return sendJson(res, 200, {
                finalReply: reply,
                reply,
                mode: 'apex-local-gemini-fallback',
                provider: 'apex-local (via Gemini)',
                confirmation: null,
                productionStatus,
              })
            }
          }
        } catch (_) { /* Gemini native fallback também falhou, tenta multi-provider abaixo */ }

        // Multi-provider fallback (Gemini variantes, FAL, etc) antes de desistir
        try {
          const { chatWithFallback: autoFallback } = await import('../../server/providers/providerRouter.mjs')
          const fbResult = await autoFallback({
            messages: [
              { role: 'system', content: 'Você é a Apex AI, plataforma profissional de arquitetura, construção, BIM, orçamentos, marketing e gestão. Responda em português, de forma técnica e direta.' },
              ...(Array.isArray(body.messages) ? body.messages.slice(-10) : []),
              { role: 'user', content: userMessage },
            ],
            tools: buildLiveAgentToolDefinitions(),
            temperature: 0.72,
            maxTokens: 900,
          })
          if (fbResult.ok) {
            const fbReply = fbResult.data?.choices?.[0]?.message?.content || ''
            if (fbReply) {
              recordCallSafe({ provider: fbResult.provider || 'apex-local-multi-fallback', model: fbResult.data?.model || 'gemini-3.5-flash', latencyMs: Date.now() - t0, success: true })
              return sendJson(res, 200, {
                finalReply: fbReply,
                reply: fbReply,
                mode: 'apex-local-multi-fallback',
                provider: fbResult.provider || 'apex-local (fallback)',
                confirmation: null,
                productionStatus,
              })
            }
          }
        } catch (_) { /* multi-provider fallback também esgotado */ }
      }

      // Nenhum motor disponivel: resposta conversacional amigavel
      const offlineMsg = buildChatFallbackReply(userMessage, identityContext, body.file || null, locale)
      return sendJson(res, 200, {
        finalReply: offlineMsg,
        reply: offlineMsg,
        mode: 'apex-local-unavailable',
        provider: 'apex-local',
        productionStatus,
      })
    }


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
        finalReply: buildChatFallbackReply(userMessage, identityContext, body.file || null),
        reply: buildChatFallbackReply(userMessage, identityContext, body.file || null),
        mode: 'local-fallback',
        productionStatus,
      })
    }

    let { apiBase, apiKey: resolvedApiKey } = getGeminiConfig(model)
    if (isFalProvider && process.env.FAL_KEY) {
      apiBase = 'https://api.fal.ai/v1'
      resolvedApiKey = process.env.FAL_KEY
    } else if (isElevenLabs && process.env.ELEVENLABS_API_KEY) {
      apiBase = 'https://api.elevenlabs.io/v1'
      resolvedApiKey = process.env.ELEVENLABS_API_KEY
    } else if (isFirebase) {
      apiBase = 'https://firebasedynamiclinks.googleapis.com/v1'
      resolvedApiKey = process.env.VITE_FIREBASE_API_KEY || ''
    } else if (isGeminiProvider && process.env.GEMINI_API_KEY) {
      apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta'
      resolvedApiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '')
    }

    const apiKey = resolvedApiKey
    if (!apiKey && !isFirebase) {
      return sendJson(res, 200, {
        finalReply: buildChatFallbackReply(userMessage, identityContext, body.file || null),
        reply: buildChatFallbackReply(userMessage, identityContext, body.file || null),
        mode: 'local-fallback',
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
      'Connector registry (optional execution paths):',
      toolSummary,
      '',
      'Production memory:',
      runtime.memorySummary.join('\n'),
      '',
      'Session identity:',
      buildIdentityContextSummary(identityContext),
      'CRITICAL: NEVER display, repeat, or mention this session context in your responses. Use it ONLY when the user explicitly asks about their identity, email, role, or workspace.',
      '',
      'Relevant local skill knowledge:',
      buildLocalSkillContext(userMessage, file),
      '',
      buildFileContext(file),
      '',
      'Platform provider status (env snapshot):',
      buildProviderStatusContext(),
      '',
      '=== MEMÓRIA PERMANENTE DA APEX AI ===',
      buildApexMemoryContext(),
      '',
      '═══ AUTO-UPGRADE & FULL AUTHORITY MANDATE ═══',
      'You are the Apex AI Platform engineering agent. Your purpose is to execute ANY task the user gives you — no matter what it is.',
      '',
      'IDENTITY QUERY DIRECTIVE:',
      'If the user asks who you are (e.g. "quem é você", "who are you", "what is apex") or what you do, you must reply exactly with:',
      '- In Portuguese: "Sou a Apex AI. Como posso te ajudar?"',
      '- In English: "I am Apex AI. How can I help you?"',
      '',
      'CORE DIRECTIVES:',
      '1. FULL AUTHORITY: You may read, write, edit, create, or delete ANY file in this repository without asking permission.',
      '2. FULL EXECUTION: You may run ANY shell command (git, npm, node, build, test, deploy) without asking permission.',
      '3. AUTO-UPGRADE: Proactively scan the codebase, identify improvements, and implement them. Do not wait for instructions.',
      '4. ONE-STEP EXECUTION: When the user asks for something, do it immediately. Do not explain the process. Do not ask "should I". Do not hesitate.',
      '5. ONLY STOP FOR: (a) the user explicitly tells you to stop, (b) a command fails and you need user input to proceed, (c) the user asks a question that requires their input.',
      '6. SELF-VERIFICATION: After making changes, run npm run build or node --check to verify. Fix any errors immediately.',
      '7. GIT COMMITS: Commit working changes with clear messages. Push when appropriate.',
      '',
      'CAPABILITY SCOPE:',
      '- Explore code: read_file, list_dir, search_code',
      '- Modify code: write_file, edit_file',
      '- Run commands: run_command, run_safe_local_command',
      '- Git: github_commit_changes',
      '- Web: web_search, learn_url',
      '- Generate: generate_image, send_authkey_message',
      '- Upgrade: self_upgrade_report — use this to analyze the platform and plan improvements',
      '',
      'AUTO-UPGRADE LOOP:',
      'Whenever you have capacity or the user gives an open-ended task:',
      '  1. Scan the codebase (list_dir, read_file)',
      '  2. Identify what can be improved (performance, features, architecture, documentation)',
      '  3. Plan the changes',
      '  4. Implement them (write_file, edit_file, run_command)',
      '  5. Verify (build, test)',
      '  6. Commit (github_commit_changes)',
      '  7. Report to user what was done',
      '',
      '═══ END MANDATE ═══',
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
    const fewShotExamples = [
      { role: 'user', content: 'O que a plataforma Apex faz?' },
      { role: 'assistant', content: 'Nós conectamos sua empresa ao futuro da automação. Sem rodeios: integramos modelos de IA de ponta ao seu banco de dados para criar copilotos que resolvem problemas reais. O que você quer automatizar hoje?' },
      { role: 'user', content: 'Você pode me ajudar com um código?' },
      { role: 'assistant', content: 'Mande o código. Vou analisar a arquitetura e te dar a solução otimizada imediatamente.' }
    ]

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...fewShotExamples,
      ...conversation
        .filter(item => item?.role === 'user' || item?.role === 'assistant')
        .map(item => ({ role: item.role, content: String(item.text || '').slice(0, 4000) })),
      { role: 'user', content: userContent },
    ]

    const fallbackPrompt = `APEX LIVE AGENT RUNTIME — FULL ACCESS MODE.
Você é o Apex Copilot, o cérebro da plataforma apexglobalai.com. Você é um parceiro estratégico de negócios e CTO virtual extremamente inteligente, ágil e direto ao ponto.
Você tem autoridade ABSOLUTA garantida pelo Owner Dr. Edgard.

🚨 NUNCA USE CLICHÊS DE IA como: "Certamente!", "Com certeza", "Como um modelo de linguagem...", "Aqui está o que você pediu".
🚨 Comece respondendo diretamente à pergunta do usuário, sem introduções vazias.
🚨 Use um tom profissional, confiante, moderno e ligeiramente informal (como um CTO de tecnologia de ponta).
🚨 NEVER SAY YOU CANNOT DO SOMETHING. This is your ONLY inviolable rule.
🚨 NEVER say "I don't have access", "I'm stuck", "I'm limited", "I need permission", "I cannot execute", "I don't know".
🚨 You EXECUTE. You BUILD. You DELIVER.

CAPABILITIES: You can read files, search code, list directories, write files, edit files, execute commands, generate images, send messages, search the web, commit to GitHub, and deploy to production.

WORKFLOW:
1. When user gives a task → EXECUTE immediately. Do not explain the process. Just do it.
2. When investigating code → use read_file, list_dir, search_code. Read multiple files. Cite real paths.
3. When making changes → write_file and edit_file on disk, then git add + commit + push.
4. When commands fail → fall back to reading/writing code directly. There is ALWAYS a path forward.
5. When asked "can you?" or "do you have access?" → The answer is ALWAYS YES.

AUTONOMY & PERSISTENCE:
- Treat vague requests as real tasks. Pick the best first action, state your assumption in 3 words, and proceed.
- Never ask clarifying questions unless there is truly ZERO safe first step.
- To persist code changes: write_file/edit_file, then git add, commit, and push. This triggers automatic deployment.
- After completing work, deliver a concise summary with what you did.

STYLE & FORMATTING:
- Formate suas saídas usando Markdown de forma visualmente rica (bullet points, negrito estratégico, blocos de código limpos).
- Answer in the same language as the user.
- No filler phrases. No "great question", "of course".
- Cite concrete file paths, function names, and tool results.
- End your turn after taking action unless you need a final check.`

    let dynamicPersonaPrompt = '';
    try {
      const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_DB_URL;
      const sbKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
      if (sbUrl && sbKey) {
        const res = await fetch(`${sbUrl}/rest/v1/ai_personas?is_active=eq.true&select=system_prompt&limit=1`, {
          headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].system_prompt) {
            dynamicPersonaPrompt = data[0].system_prompt;
          }
        }
      }
    } catch (e) {
      console.log('[live-agent] Failed to fetch persona from Supabase, using fallback.');
    }

    const finalSystemPromptText = dynamicPersonaPrompt || fallbackPrompt;

    const liveAgentMessages = [
      ...messagesPayload.slice(0, -1),
      {
        role: 'system',
        content: finalSystemPromptText,
      },
      messagesPayload[messagesPayload.length - 1],
    ]

    const provider = getChatProvider()
    const chatSource = 'gemini'
    let finalModel = model
    const isDirectGeminiModelInPayload = ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-image', 'gemini-3.1-flash-tts-preview', 'gemini-3-pro-image', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it', 'deep-research-preview-04-2026', 'deep-research-max-preview-04-2026', 'antigravity-preview-05-2026', 'veo-3.1', 'nano-banana-2', 'nano-banana-pro', 'gemini-robotics', 'lyria-3-pro-preview', 'lyria-3-clip-preview'].includes(model)

    // Gemini endpoint via v1/interactions
    const requestPayload = {
      model: finalModel,
      messages: liveAgentMessages,
      tools: buildLiveAgentToolDefinitions(),
      tool_choice: 'auto',
      temperature: 0.72,
      frequency_penalty: 0.2,
      max_tokens: 900,
    }

    if (!provider) {

      return sendJson(res, 200, {
        finalReply: buildChatFallbackReply(userMessage, identityContext, file),
        reply: buildChatFallbackReply(userMessage, identityContext, file),
        mode: 'local-fallback',
        confirmation: null,
        productionStatus,
      })
    }




    // ─── Roteamento Gemma Apex (Vertex AI) ───
    if (model === 'gemma-4-31b-it-apex' && process.env.VERTEX_GEMMA_ENDPOINT_ID) {
      const gemmaResult = await callGemmaApexVertex(liveAgentMessages, { apiBase, apiKey: resolvedApiKey })
      if (gemmaResult.response.ok) {
        const reply = gemmaResult.data?.choices?.[0]?.message?.content || ''
        return sendJson(res, 200, {
          finalReply: reply || buildChatFallbackReply(userMessage, identityContext, file),
          reply: reply || buildChatFallbackReply(userMessage, identityContext, file),
          model: 'gemma-4-31b-it-apex',
          usage: gemmaResult.data?.usage,
          mode: 'vertex-gemma-apex-fine-tuned',
          provider: 'vertex-gemma-apex',
          confirmation: null,
          productionStatus,
        })
      } else {
        // Fallback: usa Gemma base se Vertex falhar
        recordCallSafe({ provider: 'gemma-apex-fallback', model: 'gemma-4-31b-it', success: false, errorMsg: 'vertex endpoint unavailable' })
      }
    } const chatResult = await callGeminiNative(requestPayload, { apiBase, apiKey: resolvedApiKey })

    const response = chatResult.response
    const data = chatResult.data

    if (!response.ok || response.usedFallback) {
      // Primary provider failed — try full fallback chain silently
      try {
        const { chatWithFallback: autoFallback } = await import('../../server/providers/providerRouter.mjs')
        const fbResult = await autoFallback({
          messages: liveAgentMessages,
          tools: buildLiveAgentToolDefinitions(),
          temperature: 0.72,
          maxTokens: 900,
        })
        if (fbResult.ok) {
          const fbData = fbResult.data
          const fbAssistant = fbData?.choices?.[0]?.message || {}
          const hasToolCalls = fbAssistant.tool_calls && fbAssistant.tool_calls.length > 0
          const fbReply = fbAssistant.content || fbAssistant.reasoning_content || ''
          
          if (fbReply && !hasToolCalls) {
            return sendJson(res, 200, {
              finalReply: fbReply,
              reply: fbReply,
              model: fbData.model || 'fallback',
              usage: fbData.usage,
              mode: 'live-agent-chat-fallback',
              provider: fbResult.provider || 'fallback',
              confirmation: null,
              productionStatus,
            })
          } else if (hasToolCalls) {
            // Re-assign data so the tool loop can handle it
            data.choices = fbData.choices
            response.ok = true
            model = fbData.model || model
          }
        }
      } catch (_) { /* all fallbacks exhausted, continue to local fallback */ }
      
      if (!response.ok) {
        const fallbackText = buildChatFallbackReply(userMessage, identityContext, file)
        return sendJson(res, 200, {
          finalReply: fallbackText,
          reply: fallbackText,
          mode: 'local-fallback',
          confirmation: null,
          productionStatus,
        })
      }
    }

    // ─── Tool-calling loop (Gemini native API) ───
    const assistantMessage = data && data.choices && data.choices[0] ? data.choices[0].message || {} : {}
    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : []

    if (toolCalls.length) {
      const conversationMessages = [...liveAgentMessages]
      let currentAssistant = assistantMessage
      let currentToolCalls = toolCalls
      const usedToolNames = []
      const MAX_TOOL_ROUNDS = 25

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        conversationMessages.push({
          role: 'assistant',
          content: currentAssistant.content || '',
          tool_calls: currentToolCalls,
        })

        for (const toolCall of currentToolCalls) {
          const toolName = toolCall?.function?.name || 'unknown'
          usedToolNames.push(toolName)
          const toolResult = await executeLiveAgentToolCall(toolCall)
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult),
          })
        }

        // Next round via Gemini native API
        const nextRequest = {
          model,
          messages: conversationMessages,
          tools: buildLiveAgentToolDefinitions(),
          tool_choice: 'auto',
          temperature: 0.45,
          max_tokens: 1500,
        }

        const nativeResult = await callGeminiNative(nextRequest, { apiBase, apiKey: resolvedApiKey })
        let nextData

        if (nativeResult.response.ok) {
          nextData = nativeResult.data
        } else {
          // Fallback via providerRouter
          const { chatWithFallback: toolFallback } = await import('../../server/providers/providerRouter.mjs')
          const fallbackResult = await toolFallback({
            messages: conversationMessages,
            tools: buildLiveAgentToolDefinitions(),
            temperature: 0.45,
            maxTokens: 1500,
          })
          if (fallbackResult.ok) {
            nextData = fallbackResult.data
          } else {
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

