/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * ORDEM EXATA (definida pelo Owner):
 *   1. Gemini FREE — TODOS os modelos free disponiveis
 *   2. OpenRouter — TODOS os modelos disponiveis na API
 *   3. OpenCode Go — TODOS os modelos da assinatura
 *   4. FAL.ai — TODOS os modelos de chat disponiveis
 *   5. OpenAI direct (fallback)
 *   6. AI Gateway (ultimo recurso)
 *
 * O usuario final NUNCA ve erro. Cada provedor tenta TODOS
 * os seus modelos em sequencia antes de passar ao proximo.
 */

export function getProviderChain(options = {}) {
  const chain = []

  // ══════════════════════════════════════════════════════════════════
  // 1. GEMINI FREE — TODOS OS MODELOS FREE (15+)
  // ══════════════════════════════════════════════════════════════════
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim()
  if (geminiKey) {
    const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta/openai"
    chain.push({ name: "gemini", baseUrl: base, apiKey: geminiKey, model: "gemini-3.1-flash-lite", label: "Gemini", models: [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3-flash",
      "gemini-3.5-flash",
      "gemma-4-26b",
      "gemma-4-31b",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
      "gemini-3.1-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2-flash",
      "gemini-2-flash-lite",
      "gemini-1.0-pro",
    ]})
  }

  // ══════════════════════════════════════════════════════════════════
  // 2. OPENROUTER — TODOS OS MODELOS DISPONIVEIS
  // ══════════════════════════════════════════════════════════════════
  const orKey = (process.env.OPENAI_API_KEYROUTER || process.env.OPENAI_API_KEY || "").trim()
  if (orKey) {
    const orBase = (process.env.OPENAI_API_BASEROUTER || process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1").trim()
    if (orBase.includes("openrouter.ai")) {
      chain.push({ name: "openrouter", baseUrl: orBase, apiKey: orKey, model: "openai/gpt-4o-mini", label: "OpenRouter", models: [
        // OpenAI
        "openai/gpt-4o-mini", "openai/gpt-4o", "openai/gpt-4o-audio-preview",
        "openai/gpt-4.1", "openai/gpt-4.1-mini", "openai/gpt-4.1-nano",
        "openai/gpt-4.5-preview",
        "openai/gpt-5", "openai/gpt-5-chat", "openai/gpt-5-mini",
        "openai/gpt-5-nano", "openai/gpt-5-pro",
        "openai/gpt-5.1-codex", "openai/gpt-5.1-codex-max", "openai/gpt-5.1-codex-mini",
        "openai/gpt-5.1-instant", "openai/gpt-5.1-thinking",
        "openai/gpt-5.2", "openai/gpt-5.2-chat", "openai/gpt-5.2-codex", "openai/gpt-5.2-pro",
        "openai/o1", "openai/o3", "openai/o3-mini", "openai/o3-pro", "openai/o4-mini", "openai/o4-mini-high",
        // Google
        "google/gemini-2.5-flash", "google/gemini-2.5-pro",
        "google/gemini-2.0-flash", "google/gemini-2.0-pro",
        "google/gemini-1.5-flash", "google/gemini-1.5-pro",
        // Anthropic
        "anthropic/claude-3.5-sonnet", "anthropic/claude-3.5-haiku",
        "anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6",
        "anthropic/claude-3-opus", "anthropic/claude-3-sonnet", "anthropic/claude-3-haiku",
        // Meta
        "meta-llama/llama-4-scout", "meta-llama/llama-4-maverick",
        "meta-llama/llama-3.3-70b-instruct", "meta-llama/llama-3.2-3b-instruct",
        "meta-llama/llama-3.1-405b-instruct",
        // DeepSeek
        "deepseek/deepseek-chat", "deepseek/deepseek-r1", "deepseek/deepseek-v3",
        // Mistral
        "mistralai/mistral-large", "mistralai/mistral-small",
        // Qwen
        "qwen/qwen-2.5-72b", "qwen/qwq-32b",
        // Outros
        "cohere/command-r-plus", "cohere/command-r",
        "perplexity/sonar-pro", "perplexity/sonar",
      ]})
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 3. OPENCODE GO — TODOS OS MODELOS DA ASSINATURA
  // ══════════════════════════════════════════════════════════════════
  const ocKey = (process.env.OPENCODE_GO_API_KEY || "").trim()
  if (ocKey) {
    chain.push({ name: "opencode", baseUrl: "https://opencode.ai/zen/go/v1", apiKey: ocKey, model: "deepseek-v4-flash", label: "OpenCode Go", models: [
      "deepseek-v4-flash", "deepseek-v4-pro",
      "glm-5.2", "glm-5.1",
      "kimi-k2.7", "kimi-k2.7-code",
      "mimo-v2.5", "mimo-v2.5-pro",
      "minimax-m3", "minimax-m2.7",
      "qwen3.7-max", "qwen3.7-plus", "qwen3.6-plus",
    ]})
  }

  // ══════════════════════════════════════════════════════════════════
  // 4. FAL.AI — TODOS OS MODELOS DE CHAT DISPONIVEIS
  // ══════════════════════════════════════════════════════════════════
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim()
  if (falKey) {
    chain.push({ name: "fal", baseUrl: "https://api.fal.ai/v1", apiKey: falKey, model: "fal-ai/mistral-large", label: "FAL.ai", models: [
      "fal-ai/mistral-large",
      "fal-ai/llama-3.3-70b",
      "fal-ai/llama-4-scout", "fal-ai/llama-4-maverick",
      "fal-ai/deepseek-r1", "fal-ai/deepseek-v3",
      "fal-ai/qwen-2.5-72b",
      "fal-ai/mixtral-8x22b",
      "fal-ai/phi-4",
    ]})
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. OPENAI DIRECT (fallback)
  // ══════════════════════════════════════════════════════════════════
  if (!chain.some(p => p.name === "openrouter")) {
    const openaiKey = (process.env.OPENAI_API_KEY || "").trim()
    const openaiBase = (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").trim()
    if (openaiKey && !openaiBase.includes("openrouter.ai")) {
      chain.push({ name: "openai", baseUrl: openaiBase, apiKey: openaiKey, model: "gpt-4o-mini", label: "OpenAI" })
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. AI GATEWAY — ultimo recurso
  // ══════════════════════════════════════════════════════════════════
  const gwKey = (process.env.AI_GATEWAY_API_KEY || "").trim()
  if (gwKey) {
    chain.push({ name: "gateway", baseUrl: process.env.AI_GATEWAY_API_BASE || "https://gateway.ai.vercel.ai/v1", apiKey: gwKey, model: "openai/gpt-4o-mini", label: "AI Gateway" })
  }

  return chain
}
