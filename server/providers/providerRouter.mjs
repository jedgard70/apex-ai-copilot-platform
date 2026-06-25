/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * Apenas provedores autorizados: Gemini e FAL.ai
 * NUNCA mostra erro para o usuario final.
 */

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

async function getFalModels() {
  // FAL nao tem endpoint de modelos de chat publico via API
  // Usamos lista estatica dos mais conhecidos
  return [
    { id: "fal-ai/mistral-large", name: "Mistral Large" },
    { id: "fal-ai/llama-3.3-70b", name: "Llama 3.3 70B" },
    { id: "fal-ai/llama-4-scout", name: "Llama 4 Scout" },
    { id: "fal-ai/llama-4-maverick", name: "Llama 4 Maverick" },
    { id: "fal-ai/deepseek-r1", name: "DeepSeek R1" },
    { id: "fal-ai/deepseek-v3", name: "DeepSeek V3" },
    { id: "fal-ai/qwen-2.5-72b", name: "Qwen 2.5 72B" },
  ]
}

const providerOrder = [
  { name: "gemini", label: "Gemini FREE" },
  { name: "fal", label: "FAL.ai" },
]

export async function getProviderChain(options = {}) {
  const chain = []
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim()
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim()

  // Gemini — usa /openai para compatibilidade com chat/completions
  if (geminiKey) {
    const chatBase = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta/openai"
    const models = await getGeminiModels(geminiKey)
    if (models.length > 0) {
      chain.push({ name: "gemini", baseUrl: chatBase, apiKey: geminiKey, model: models[0].id, label: "Gemini FREE", models: models.map(m => m.id) })
    } else {
      chain.push({ name: "gemini", baseUrl: chatBase, apiKey: geminiKey, model: "gemini-3.1-flash-lite", label: "Gemini FREE" })
    }
  }

  // FAL.ai
  if (falKey) {
    const models = await getFalModels()
    chain.push({ name: "fal", baseUrl: "https://api.fal.ai/v1", apiKey: falKey, model: "fal-ai/mistral-large", label: "FAL.ai", models: models.map(m => m.id) })
  }

  return chain
}

export async function chatWithFallback(params) {
  const { messages, tools, preferredProvider, preferredModel, temperature = 0.72, maxTokens = 900, toolRound = 0 } = params
  const chain = await getProviderChain({ preferredProvider, preferredModel })
  if (chain.length === 0) return { ok: false, error: "Nenhum provedor configurado." }

  const errors = []
  let lastError = ""

  if (preferredProvider) {
    const idx = chain.findIndex(p => p.name === preferredProvider)
    if (idx > 0) { const [item] = chain.splice(idx, 1); chain.unshift(item) }
  }

  const triedModelSet = new Set()
  for (const provider of chain) {
    const modelsToTry = provider.models || [provider.model]
    for (const model of modelsToTry) {
      const modelKey = `${provider.name}|${model}`
      if (triedModelSet.has(modelKey)) continue
      triedModelSet.add(modelKey)
      try {
        const body = { model, messages, temperature: toolRound > 0 ? 0.45 : temperature, max_tokens: toolRound > 0 ? 1500 : maxTokens }
        if (tools && toolRound === 0) { body.tools = tools; body.tool_choice = "auto"; body.frequency_penalty = 0.2 }
        const headers = { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" }
        const response = await fetch(`${provider.baseUrl}/chat/completions`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(35000) })
        if (response.ok) {
          const data = await response.json()
          return { ok: true, data, model: data.model || model, provider: provider.name, providerLabel: provider.label, usedFallback: triedModelSet.size > 1 }
        }
        lastError = `HTTP ${response.status}`
        const errorBody = await response.text().catch(() => "").catch(() => "")
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
