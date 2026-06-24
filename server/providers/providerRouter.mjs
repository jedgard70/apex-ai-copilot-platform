export function getProviderChain(options = {}) {
  const chain = []

  // 1. Gemini (FREE) — sempre primeiro, 15 modelos em sequencia
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim()
  if (geminiKey) {
    const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta/openai"
    chain.push({ name: "gemini", baseUrl: base, apiKey: geminiKey, model: "gemini-3.1-flash-lite", label: "Gemini", models: [
      "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash",
      "gemini-3-flash", "gemini-3.5-flash", "gemma-4-26b", "gemma-4-31b",
      "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-pro",
      "gemini-3.1-pro", "gemini-1.5-flash", "gemini-1.5-pro",
      "gemini-2-flash", "gemini-2-flash-lite",
    ]})
  }

  // 2. OpenRouter (pago) — GPT, Claude, Gemini, Llama, DeepSeek, Qwen
  const orKey = (process.env.OPENAI_API_KEYROUTER || process.env.OPENAI_API_KEY || "").trim()
  if (orKey) {
    const orBase = (process.env.OPENAI_API_BASEROUTER || process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1").trim()
    if (orBase.includes("openrouter.ai")) {
      chain.push({ name: "openrouter", baseUrl: orBase, apiKey: orKey, model: "openai/gpt-4o-mini", label: "OpenRouter", models: [
        "openai/gpt-4o-mini", "openai/gpt-4o", "google/gemini-2.5-flash",
        "anthropic/claude-3.5-sonnet", "meta-llama/llama-3.3-70b-instruct",
        "deepseek/deepseek-chat", "qwen/qwen-2.5-72b", "mistralai/mistral-large",
      ]})
    }
  }

  // 3. OpenCode Go (assinatura US$10/mês) — DeepSeek V4, Qwen, GLM, Kimi, MiMo
  const ocKey = (process.env.OPENCODE_GO_API_KEY || "").trim()
  if (ocKey) {
    chain.push({ name: "opencode", baseUrl: "https://opencode.ai/zen/go/v1", apiKey: ocKey, model: "deepseek-v4-flash", label: "OpenCode Go", models: [
      "deepseek-v4-flash", "deepseek-v4-pro", "qwen3.7-plus", "glm-5.2",
      "kimi-k2.7", "mimo-v2.5", "minimax-m3",
    ]})
  }

  // 4. FAL.ai (créditos) — Mistral, Llama, DeepSeek, Qwen
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim()
  if (falKey) {
    chain.push({ name: "fal", baseUrl: "https://api.fal.ai/v1", apiKey: falKey, model: "fal-ai/mistral-large", label: "FAL.ai", models: [
      "fal-ai/mistral-large", "fal-ai/llama-3.3-70b", "fal-ai/deepseek-v3",
      "fal-ai/qwen-2.5-72b",
    ]})
  }

  // 5. OpenAI direct (fallback)
  if (!chain.some(p => p.name === "openrouter")) {
    const openaiKey = (process.env.OPENAI_API_KEY || "").trim()
    const openaiBase = (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").trim()
    if (openaiKey && !openaiBase.includes("openrouter.ai")) {
      chain.push({ name: "openai", baseUrl: openaiBase, apiKey: openaiKey, model: "gpt-4o-mini", label: "OpenAI" })
    }
  }

  // 6. AI Gateway — ultimo recurso
  const gwKey = (process.env.AI_GATEWAY_API_KEY || "").trim()
  if (gwKey) {
    chain.push({ name: "gateway", baseUrl: process.env.AI_GATEWAY_API_BASE || "https://gateway.ai.vercel.ai/v1", apiKey: gwKey, model: "openai/gpt-4o-mini", label: "AI Gateway" })
  }

  return chain
}
