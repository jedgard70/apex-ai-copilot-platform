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

  // 1. Gemini (direct) — free, 1M tokens/min
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim()
  if (geminiKey) {
    chain.push({
      name: 'gemini',
      baseUrl: process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: geminiKey,
      model: 'gemini-2.0-flash',
      label: 'Gemini (Free)',
    })
  }

  // 2. OpenRouter FREE — Llama 3.3 70B, Qwen3, Nemotron (grátis)
  const orKey = (process.env.OPENAI_API_KEYROUTER || process.env.OPENAI_API_KEY || '').trim()
  if (orKey) {
    const orFreeBase = (process.env.OPENAI_API_BASEROUTER || process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1').trim()
    chain.push({
      name: 'openrouter-free',
      baseUrl: orFreeBase,
      apiKey: orKey,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      label: 'OpenRouter Free (Llama 3.3)',
    })
    chain.push({
      name: 'openrouter-free',
      baseUrl: orFreeBase,
      apiKey: orKey,
      model: 'qwen/qwen3-next-80b-a3b:free',
      label: 'OpenRouter Free (Qwen3)',
    })
  }

  // 3. OpenRouter PAID — seus créditos pagos
  const orBase = (process.env.OPENAI_API_BASEROUTER || '').trim()
  if (orBase && orBase.includes('openrouter.ai') && orKey) {
    chain.push({
      name: 'openrouter',
      baseUrl: orBase,
      apiKey: orKey,
      model: 'openai/gpt-4o-mini',
      label: 'OpenRouter (Pago)',
    })
  }
  if (!chain.some(p => p.name === 'openrouter')) {
    const apiBase = (process.env.OPENAI_API_BASE || '').trim()
    if (apiBase && apiBase.includes('openrouter.ai') && orKey) {
      chain.push({
        name: 'openrouter',
        baseUrl: apiBase,
        apiKey: orKey,
        model: 'openai/gpt-4o-mini',
        label: 'OpenRouter (Pago)',
      })
    }
  }

  // 4. OpenCode Go — assinatura US$10/mês
  const ocKey = (process.env.OPENCODE_GO_API_KEY || '').trim()
  if (ocKey) {
    chain.push({
      name: 'opencode',
      baseUrl: 'https://opencode.ai/zen/go/v1',
      apiKey: ocKey,
      model: 'deepseek-v4-flash',
      label: 'OpenCode Go (DeepSeek V4)',
    })
  }

  // 4. FAL.ai — pago mensal
  const falKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || '').trim()
  if (falKey) {
    chain.push({
      name: 'fal',
      baseUrl: 'https://api.fal.ai/v1',
      apiKey: falKey,
      model: 'fal-ai/mistral-large',
      label: 'FAL.ai',
    })
  }

  // 5. DeepSeek via OpenRouter — barato/gratuito
  if (chain.some(p => p.name === 'openrouter')) {
    const or = chain.find(p => p.name === 'openrouter')
    chain.push({
      name: 'deepseek',
      baseUrl: or.baseUrl,
      apiKey: or.apiKey,
      model: 'deepseek/deepseek-chat',
      label: 'DeepSeek',
    })
  }

  // 6. Anthropic (direct) — pago
  const anthKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (anthKey) {
    chain.push({
      name: 'anthropic',
      baseUrl: process.env.ANTHROPIC_API_BASE || 'https://api.anthropic.com/v1',
      apiKey: anthKey,
      model: 'claude-sonnet-4-6',
      label: 'Anthropic',
    })
  }

  // 7. OpenAI (direct) — pago
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim()
  const openaiBase = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').trim()
  if (openaiKey && !openaiBase.includes('openrouter.ai') && !openaiBase.includes('generativelanguage') && !openaiBase.includes('anthropic')) {
    chain.push({
      name: 'openai',
      baseUrl: openaiBase,
      apiKey: openaiKey,
      model: 'gpt-4o-mini',
      label: 'OpenAI',
    })
  }

  // 8. AI Gateway — último recurso
  const gwKey = (process.env.AI_GATEWAY_API_KEY || '').trim()
  if (gwKey) {
    chain.push({
      name: 'gateway',
      baseUrl: process.env.AI_GATEWAY_API_BASE || 'https://gateway.ai.vercel.ai/v1',
      apiKey: gwKey,
      model: 'openai/gpt-4o-mini',
      label: 'AI Gateway',
    })
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

  for (const provider of chain) {
    try {
      const body = {
        model: provider.model,
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
          model: data.model || provider.model,
          provider: provider.name,
          providerLabel: provider.label,
          usedFallback: chain.indexOf(provider) > 0,
          usedProviderIndex: chain.indexOf(provider),
        }
      }

      lastError = `HTTP ${response.status}`
      const errorBody = await response.text().catch(() => '')
        .catch(() => '')
      errors.push(`[${provider.label}] ${lastError}: ${errorBody.slice(0, 100)}`)
      console.error(`[provider-router] ${provider.label} failed: ${lastError}`)
    } catch (err) {
      lastError = err.message || String(err)
      errors.push(`[${provider.label}] ${lastError}`)
      console.error(`[provider-router] ${provider.label} error: ${lastError}`)
    }
  }

  // All providers failed
  return {
    ok: false,
    error: `Todos os provedores falharam.`,
    errors,
    lastError,
  }
}
