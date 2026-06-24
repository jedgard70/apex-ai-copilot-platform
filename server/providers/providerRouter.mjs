/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * Ordem de prioridade:
 *   1. Gemini (direct) — free (1M tokens/min)
 *   2. OpenRouter — acesso pago a 300+ modelos
 *   3. OpenCode Go — assinatura US$10/mês (DeepSeek V4, Qwen, GLM, etc.)
 *   4. FAL.ai — pago mensal
 *   5. DeepSeek via OpenRouter — barato
 *   6. Anthropic (direct) — pago
 *   7. OpenAI (direct) — pago
 *   8. AI Gateway — último recurso
 *
 * O usuário final nunca vê erro de provedor. Todos os provedores
 * configurados são tentados automaticamente em ordem.
 */

// ─── Provider chain ───────────────────────────────────────────────────────────

export function getProviderChain(options = {}) {
  const chain = []

  // 1. OpenRouter — TUDO numa API (GPT, Claude, Gemini, Llama, DeepSeek)
  const orKey = (process.env.OPENAI_API_KEYROUTER || process.env.OPENAI_API_KEY || '').trim()
  if (orKey) {
    const orBase = (process.env.OPENAI_API_BASEROUTER || process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1').trim()
    if (orBase.includes('openrouter.ai')) {
      chain.push({ name: 'openrouter', baseUrl: orBase, apiKey: orKey, model: 'openai/gpt-4o-mini', label: 'OpenRouter', models: [
        'openai/gpt-4o-mini', 'openai/gpt-4o', 'google/gemini-2.5-flash',
        'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct',
        'deepseek/deepseek-chat', 'qwen/qwen-2.5-72b', 'mistralai/mistral-large',
      ]})
    }
  }

  // 2. Gemini (direct) — FREE, 15+ modelos com folga no free tier
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim()
  if (geminiKey) {
    const base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai'
    chain.push({ name: 'gemini', baseUrl: base, apiKey: geminiKey, model: 'gemini-3.1-flash-lite', label: 'Gemini', models: [
      'gemini-3.1-flash-lite',      // 150 RPM, 500 RPD — folga total
      'gemini-2.5-flash-lite',      // 100 RPM, 20 RPD
      'gemini-2.5-flash',           // 5 RPM, 5/20 usado
      'gemini-3-flash',             // 5 RPM — pouco usado
      'gemini-3.5-flash',           // 7 RPM, 23/20 RPD — quase cheio
      'gemma-4-26b',                // 150 RPM, 1500 RPD — folga total
      'gemma-4-31b',                // 150 RPM, 1500 RPD — folga total
      'gemini-2.0-flash',           // sem uso
      'gemini-2.0-flash-lite',      // sem uso
      'gemini-2.5-pro',             // sem uso
      'gemini-3.1-pro',             // sem uso
      'gemini-1.5-flash',           // sem uso
      'gemini-1.5-pro',             // sem uso
      'gemini-2-flash',             // sem uso
      'gemini-2-flash-lite',        // sem uso
    ]})
  }

  // 3. OpenCode Go — DeepSeek, Qwen, GLM, Kimi, MiMo
  const ocKey = (process.env.OPENCODE_GO_API_KEY || '').trim()
  if (ocKey) {
    chain.push({ name: 'opencode', baseUrl: 'https://opencode.ai/zen/go/v1', apiKey: ocKey, model: 'deepseek-v4-flash', label: 'OpenCode Go', models: [
      'deepseek-v4-flash', 'deepseek-v4-pro', 'qwen3.7-plus', 'glm-5.2',
      'kimi-k2.7', 'mimo-v2.5', 'minimax-m3',
    ]})
  }

  // 4. FAL.ai — créditos
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || '').trim()
  if (falKey) {
    chain.push({ name: 'fal', baseUrl: 'https://api.fal.ai/v1', apiKey: falKey, model: 'fal-ai/mistral-large', label: 'FAL.ai', models: [
      'fal-ai/mistral-large', 'fal-ai/llama-3.3-70b', 'fal-ai/deepseek-v3',
      'fal-ai/qwen-2.5-72b',
    ]})
  }

  // 5. OpenAI direct (fallback se OpenRouter não configurado)
  if (!chain.some(p => p.name === 'openrouter')) {
    const openaiKey = (process.env.OPENAI_API_KEY || '').trim()
    const openaiBase = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').trim()
    if (openaiKey && !openaiBase.includes('openrouter.ai')) {
      chain.push({ name: 'openai', baseUrl: openaiBase, apiKey: openaiKey, model: 'gpt-4o-mini', label: 'OpenAI' })
    }
  }

  // 6. AI Gateway — último recurso
  const gwKey = (process.env.AI_GATEWAY_API_KEY || '').trim()
  if (gwKey) {
    chain.push({ name: 'gateway', baseUrl: process.env.AI_GATEWAY_API_BASE || 'https://gateway.ai.vercel.ai/v1', apiKey: gwKey, model: 'openai/gpt-4o-mini', label: 'AI Gateway' })
  }

  return chain
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getConfiguredProviders() {
  return getProviderChain().map(p => p.name)
}

export function hasAnyProvider() {
  return getProviderChain().length > 0
}

// ─── Fallback chat call ──────────────────────────────────────────────────────

/**
 * Try to call chat completion with automatic provider fallback.
 * @param {Object} params
 * @param {Object[]} params.messages - The messages array
 * @param {Object[]} [params.tools] - Tool definitions
 * @param {string} [params.preferredProvider] - Preferred provider name
 * @param {string} [params.preferredModel] - Preferred model ID
 * @param {number} [params.temperature] - Temperature (default 0.72)
 * @param {number} [params.maxTokens] - Max tokens (default 900)
 * @param {number} [params.toolRound] - Current tool calling round (0 = first)
 * @returns {Promise<{ok: boolean, data?: Object, model?: string, provider?: string, error?: string, usedFallback?: boolean}>}
 */
export async function chatWithFallback(params) {
  const {
    messages,
    tools,
    preferredProvider,
    preferredModel,
    temperature = 0.72,
    maxTokens = 900,
    toolRound = 0,
  } = params

  const chain = getProviderChain({ preferredProvider, preferredModel })

  if (chain.length === 0) {
    return { ok: false, error: 'Nenhum provedor de IA configurado.' }
  }

  const errors = []
  let lastError = ''

  // Put preferred provider first if specified and exists
  if (preferredProvider) {
    const idx = chain.findIndex(p => p.name === preferredProvider)
    if (idx > 0) {
      const [item] = chain.splice(idx, 1)
      chain.unshift(item)
    }
  }

  const triedModelSet = new Set()

  // Try each provider, and within each provider try each model
  for (const provider of chain) {
    const modelsToTry = provider.models || [provider.model]
    for (const model of modelsToTry) {
      const modelKey = `${provider.name}|${model}`
      if (triedModelSet.has(modelKey)) continue
      triedModelSet.add(modelKey)

      try {
        const body = {
          model,
          messages,
          temperature: toolRound > 0 ? 0.45 : temperature,
          max_tokens: toolRound > 0 ? 1500 : maxTokens,
        }

        if (tools && toolRound === 0) {
          body.tools = tools
          body.tool_choice = 'auto'
          body.frequency_penalty = 0.2
        }

        const headers = {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        }
        if (provider.baseUrl.includes('openrouter.ai')) {
          headers['HTTP-Referer'] = 'https://apex-ai-copilot-platform.vercel.app'
          headers['X-Title'] = 'Apex AI Copilot'
        }

        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(35000),
        })

        if (response.ok) {
          const data = await response.json()
          return {
            ok: true,
            data,
            model: data.model || model,
            provider: provider.name,
            providerLabel: provider.label,
            usedFallback: triedModelSet.size > 1,
          }
        }

        // Rate limit or server error — try next model
        lastError = `HTTP ${response.status}`
        const errorBody = await response.text().catch(() => '').catch(() => '')
        errors.push(`[${provider.label}:${model}] ${lastError}: ${errorBody.slice(0, 100)}`)
        console.error(`[provider-router] ${provider.label}:${model} failed: ${lastError}`)
      } catch (err) {
        lastError = err.message || String(err)
        errors.push(`[${provider.label}:${model}] ${lastError}`)
        console.error(`[provider-router] ${provider.label}:${model} error: ${lastError}`)
      }
    }
  }

  // All providers and all models failed
  return {
    ok: false,
    error: `Todos os provedores falharam.`,
    errors,
    lastError,
  }
}
