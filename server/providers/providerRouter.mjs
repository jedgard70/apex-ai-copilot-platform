/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * Apenas provedores autorizados: Gemini e FAL.ai
 * NUNCA mostra erro para o usuario final.
 */

import { chatWithLocalGguf } from './localGgufProvider.mjs'

const MODEL_CACHE = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 min

async function fetchModels(url, headers, extractor) {
  const cacheKey = url
  const cached = MODEL_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.models

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json()
    const models = extractor(data)
    MODEL_CACHE.set(cacheKey, { models, expiresAt: Date.now() + CACHE_TTL })
    return models
  } catch {
    return []
  }
}

async function getGeminiModels(apiKey) {
  // /v1beta sem /openai para listar modelos
  const base = "https://generativelanguage.googleapis.com/v1beta"
  return fetchModels(`${base}/models?key=${apiKey}`, {}, (data) => {
    return (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
      .map(m => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name,
      }))
  })
}

async function getFalModels(apiKey) {
  const baseList = [
    { id: "fal-ai/mistral-large", name: "Mistral Large" },
    { id: "fal-ai/llama-3.3-70b", name: "Llama 3.3 70B" },
    { id: "fal-ai/llama-4-scout", name: "Llama 4 Scout" },
    { id: "fal-ai/llama-4-maverick", name: "Llama 4 Maverick" },
    { id: "fal-ai/deepseek-r1", name: "DeepSeek R1" },
    { id: "fal-ai/deepseek-v3", name: "DeepSeek V3" },
    { id: "fal-ai/qwen-2.5-72b", name: "Qwen 2.5 72B" },
  ]
  if (!apiKey) return baseList

  try {
    const fetched = await fetchModels("https://fal.ai/api/models?limit=1000", { Authorization: `Key ${apiKey}` }, (data) => {
      return (data.items || [])
        .filter(m => {
          const id = (m.id || "").toLowerCase()
          // FAL models — allow LLM chat models (gemma movido para Gemini, nao no FAL)
          return id.includes("llm") || id.includes("llama") || id.includes("mistral") || id.includes("qwen") || id.includes("deepseek") || id.includes("chat") || id.includes("phi")
        })
        .map(m => ({
          id: m.id,
          name: m.title || m.id,
        }))
    })

    if (fetched && fetched.length > 0) {
      const seen = new Set(fetched.map(m => m.id))
      return [...fetched, ...baseList.filter(m => !seen.has(m.id))]
    }
  } catch (err) {
    console.error("[getFalModels] failed, using static fallback:", err?.message)
  }
  return baseList
}

const providerOrder = [
  { name: "gemini", label: "Gemini FREE" },
  { name: "fal", label: "FAL.ai" },
]

// Maps model names to real API IDs.
// Only gemini-1.5.x was removed from v1beta; all other models (gemini-2.x, gemini-3.x) exist.
function resolveGeminiModelName(model) {
  if (!model) return 'gemini-2.5-flash'
  if (model.startsWith('gemini-1.5')) {
    return model.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
  }
  return model
}

function prioritizeGeminiModels(modelsList) {
  return Array.from(new Set(modelsList))
}

export async function getProviderChain(options = {}) {
  const { preferredModel, skipDynamicFetch } = options
  const chain = []

  const geminiKey = (process.env.GEMINI_API_KEY || "").trim()
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim()

  // Real models confirmed via API list on 2026-07-08
  const GEMINI_STATIC_FALLBACKS = [
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-image",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3-pro-image",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ]

  const FAL_STATIC_FALLBACKS = [
    "fal-ai/mistral-large",
    "fal-ai/llama-3.3-70b",
    "fal-ai/llama-4-scout",
    "fal-ai/llama-4-maverick",
    "fal-ai/deepseek-r1",
    "fal-ai/deepseek-v3",
    "fal-ai/qwen-2.5-72b"
  ]

  // Gemini — API nativa com X-goog-api-key
  if (geminiKey) {
    const geminiBase = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"
    const models = skipDynamicFetch ? [] : await getGeminiModels(geminiKey)
    const rawList = models.length > 0 ? models.map(m => m.id) : GEMINI_STATIC_FALLBACKS
    const geminiModelsList = prioritizeGeminiModels(rawList)
    const defaultModel = preferredModel && preferredModel.startsWith("gemini") ? preferredModel : (geminiModelsList[0] || "gemini-3.5-flash")
    chain.push({
      name: "gemini",
      baseUrl: geminiBase,
      apiKey: geminiKey,
      model: defaultModel,
      label: "Gemini FREE",
      models: geminiModelsList,
      nativeGemini: true,  // usa X-goog-api-key + /models/{model}:generateContent
    })
  }

  // Injeta o Apex Runtime local se estiver habilitado (Agora como motor SECUNDÁRIO/Fallback)
  if (process.env.APEX_RUNTIME_ENABLED === 'true') {
    const localModels = ["apex-ai-custom", "gemma-12b", "gemma-2b-it-gguf", "phi-3-mini-gguf"];
    chain.push({
      name: "apex-runtime",
      baseUrl: "http://localhost:1337/v1", // OpenAI-compatible API
      apiKey: "local-no-key",
      model: preferredModel && localModels.includes(preferredModel) ? preferredModel : localModels[0],
      label: "Apex Runtime (Local)",
      models: localModels,
    });
  }

  // FAL.ai
  if (falKey) {
    const models = skipDynamicFetch ? [] : await getFalModels(falKey)
    const falModelsList = models.length > 0 ? models.map(m => m.id) : FAL_STATIC_FALLBACKS
    const defaultModel = preferredModel && preferredModel.startsWith("fal") ? preferredModel : (falModelsList[0] || "fal-ai/mistral-large")
    chain.push({
      name: "fal",
      baseUrl: "https://api.fal.ai/v1",
      apiKey: falKey,
      model: defaultModel,
      label: "FAL.ai",
      models: falModelsList
    })
  }

  return chain
}

export async function chatWithFallback(params) {
  const { messages, tools, preferredProvider, preferredModel, temperature = 0.72, maxTokens = 900, toolRound = 0 } = params
  const chain = await getProviderChain({ preferredProvider, preferredModel, skipDynamicFetch: true })
  if (chain.length === 0) return { ok: false, error: "Nenhum provedor configurado." }

  const errors = []
  let lastError = ""

  if (preferredProvider) {
    const idx = chain.findIndex(p => p.name === preferredProvider)
    if (idx > 0) { const [item] = chain.splice(idx, 1); chain.unshift(item) }
  }

  const triedModelSet = new Set()
  for (const provider of chain) {
    let modelsToTry = provider.models || [provider.model]
    if (preferredModel && (provider.name === preferredProvider || preferredModel.startsWith(provider.name))) {
      // Force selected preferredModel to be tried first
      modelsToTry = [preferredModel, ...modelsToTry.filter(m => m !== preferredModel)]
    }
    for (const model of modelsToTry) {
      const modelKey = `${provider.name}|${model}`
      if (triedModelSet.has(modelKey)) continue
      triedModelSet.add(modelKey)
      try {
        console.log(`[chatWithFallback] Trying ${provider.name} with model ${model}...`);
        let response
        if (provider.name === "apex-runtime") {
          const systemMessages = (messages || []).filter(m => m.role === 'system');
          const systemPrompt = systemMessages.length > 0 ? systemMessages.map(m => typeof m.content === 'string' ? m.content : '').join('\n') : '';
          const localResponse = await chatWithLocalGguf(messages, systemPrompt, model, toolRound > 0 ? 0.45 : temperature, toolRound > 0 ? 1500 : maxTokens);
          if (localResponse.ok) {
            return { ok: true, data: localResponse.data, model, provider: provider.name, providerLabel: provider.label, usedFallback: triedModelSet.size > 1 }
          }
          throw new Error(localResponse.error || "Local GGUF Failed");
        } else if (provider.nativeGemini) {
          // API nativa Gemini: X-goog-api-key + /models/{model}:generateContent
          function toGeminiParts(content) {
            if (typeof content === 'string') return [{ text: content || '' }]
            if (Array.isArray(content)) {
              return content.map(part => {
                if (part.type === 'text') return { text: part.text || '' }
                if (part.type === 'image_url') {
                  const dataUrl = part.image_url?.url || ''
                  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
                  if (m) return { inline_data: { mime_type: m[1], data: m[2] } }
                  return { text: '[imagem]' }
                }
                return { text: JSON.stringify(part) }
              })
            }
            return [{ text: String(content || '') }]
          }

          const geminiContents = []
          for (const m of (messages || [])) {
            if (m.role === 'system') continue
            if (m.role === 'tool' || m.role === 'function') {
              let responseObj = {}
              try { responseObj = typeof m.content === 'string' ? JSON.parse(m.content || '{}') : m.content } catch { responseObj = { result: m.content } }
              geminiContents.push({
                role: 'user',
                parts: [{
                  functionResponse: {
                    name: m.name || m.tool_call_id || 'unknown_tool',
                    response: responseObj
                  }
                }]
              })
            } else if (m.role === 'assistant') {
              const parts = []
              if (m.content) parts.push({ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })
              if (Array.isArray(m.tool_calls)) {
                for (const tc of m.tool_calls) {
                  let args = {}
                  try { args = JSON.parse(tc.function?.arguments || '{}') } catch { }
                  parts.push({ functionCall: { name: tc.function?.name || 'unknown', args } })
                }
              }
              if (parts.length === 0) parts.push({ text: '' })
              geminiContents.push({ role: 'model', parts })
            } else {
              geminiContents.push({ role: 'user', parts: toGeminiParts(m.content) })
            }
          }

          const geminiBody = {
            contents: geminiContents,
            generationConfig: { temperature: toolRound > 0 ? 0.45 : temperature, maxOutputTokens: toolRound > 0 ? 1500 : maxTokens }
          }

          if (tools && toolRound === 0) {
            const declarations = []
            const seenNames = new Set()
            for (const tool of tools) {
              const fn = tool.function || tool
              if (!fn.name) continue
              if (seenNames.has(fn.name)) {
                console.warn('[chatWithFallback] Skipping duplicate tool: ' + fn.name)
                continue
              }
              seenNames.add(fn.name)
              let params = fn.parameters || { type: 'object', properties: {} }
              const stripProps = (obj) => {
                if (Array.isArray(obj)) obj.forEach(stripProps)
                else if (typeof obj === 'object' && obj !== null) {
                  delete obj.additionalProperties
                  Object.values(obj).forEach(stripProps)
                }
              }
              params = JSON.parse(JSON.stringify(params))
              stripProps(params)
              declarations.push({ name: fn.name, description: fn.description || '', parameters: params })
            }
            if (declarations.length) {
              geminiBody.tools = geminiBody.tools || []
              geminiBody.tools.push({ functionDeclarations: declarations })
            }
          }

          // Enable Gemini Native Features (Google Search Grounding)
          // Only if no function declarations are present, otherwise it requires tool_config to be valid.
          if (!geminiBody.tools || geminiBody.tools.length === 0) {
            geminiBody.tools = [{ googleSearch: {} }]
          }

          const systemMessages = (messages || []).filter(m => m.role === 'system')
          if (systemMessages.length > 0) {
            const joinedSystem = systemMessages.map(m =>
              typeof m.content === 'string' ? m.content :
                Array.isArray(m.content) ? m.content.map(p => p.text || '').join('\n') :
                  String(m.content || '')
            ).join('\n')
            geminiBody.systemInstruction = { parts: [{ text: joinedSystem }] }
          }
          // Resolve fictitious UI model names to real API model IDs before calling
          let apiModel = resolveGeminiModelName(model)
          const headers = { 'X-goog-api-key': provider.apiKey, 'Content-Type': 'application/json' }
          response = await fetch(`${provider.baseUrl}/models/${apiModel}:generateContent`, {
            method: 'POST', headers, body: JSON.stringify(geminiBody), signal: AbortSignal.timeout(60000)
          })
          if (response.ok) {
            const geminiData = await response.json()
            const candidate = geminiData?.candidates?.[0]
            const parts = candidate?.content?.parts || []
            const text = parts.filter(p => p.text).map(p => p.text).join('') || ''
            const functionCalls = parts.filter(p => p.functionCall).map(p => ({
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'function',
              function: {
                name: p.functionCall.name,
                arguments: JSON.stringify(p.functionCall.args || {}),
              },
            }))
            const data = {
              choices: [{
                message: {
                  role: 'assistant',
                  content: text,
                  tool_calls: functionCalls.length > 0 ? functionCalls : undefined,
                },
                finish_reason: functionCalls.length > 0 ? 'tool_calls' : (candidate?.finishReason === 'STOP' ? 'stop' : 'length'),
              }]
            }
            return { ok: true, data, model, provider: provider.name, providerLabel: provider.label, usedFallback: triedModelSet.size > 1 }
          }
        } else {
          // OpenAI-compatible API: Authorization Bearer + /chat/completions
          const body = { model, messages, temperature: toolRound > 0 ? 0.45 : temperature, max_tokens: toolRound > 0 ? 1500 : maxTokens }
          if (tools && toolRound === 0) { body.tools = tools; body.tool_choice = "auto"; }
          const headers = { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" }
          response = await fetch(`${provider.baseUrl}/chat/completions`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) })
        }
        console.log(`[chatWithFallback] Response for ${model}: ${response.status}`);
        if (response.ok) {
          const data = await response.json()
          return { ok: true, data, model: data.model || model, provider: provider.name, providerLabel: provider.label, usedFallback: triedModelSet.size > 1 }
        }
        lastError = `HTTP ${response.status}`
        const errorBody = await response.text().catch(() => "")
        console.error(`[chatWithFallback] Provider error body: ${errorBody}`);
        errors.push(`[${provider.label}:${model}] ${lastError}`)
      } catch (err) {
        lastError = err.message || String(err)
        errors.push(`[${provider.label}:${model}] ${lastError}`)
      }
    }
  }
  return { ok: false, error: "Todos os provedores falharam.", errors, lastError }
}

export function getConfiguredProviders() { return providerOrder.map(p => p.name) }
export function hasAnyProvider() { return true }
