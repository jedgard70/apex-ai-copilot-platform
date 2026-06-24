/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * Tenta múltiplos provedores em sequência quando um falha.
 * O usuário final nunca vê erro de provedor — só se TODOS falharem.
 */

// ─── Provider chain (ordem de fallback) ───────────────────────────────────────

/**
 * Returns ordered list of provider configs that can be tried.
 * Uses env vars at call time so config changes take effect immediately.
 * @param {Object} [options]
 * @param {string} [options.preferredProvider] - If set, tries this first
 * @param {string} [options.preferredModel] - Model ID for the preferred provider
 * @returns {Array<{name: string, baseUrl: string, apiKey: string, model: string, label: string}>}
 */
export function getProviderChain(options = {}) {
  const chain = []

  // 1. OpenRouter (API Base Router)
  const orBase = (process.env.OPENAI_API_BASEROUTER || '').trim()
  const orKey = (process.env.OPENAI_API_KEYROUTER || '').trim()
  if (orBase && orKey && orBase.includes('openrouter.ai')) {
    chain.push({
      name: 'openrouter',
      baseUrl: orBase,
      apiKey: orKey,
      model: options.preferredModel || 'openai/gpt-4o-mini',
      label: 'OpenRouter',
    })
  }

  // 2. Gemini (direct)
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim()
  if (geminiKey) {
    chain.push({
      name: 'gemini',
      baseUrl: process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: geminiKey,
      model: 'gemini-2.0-flash',
      label: 'Gemini',
    })
  }

  // 3. OpenAI (direct)
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim()
  const openaiBase = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').trim()
  if (openaiKey && !openaiBase.includes('openrouter.ai')) {
    chain.push({
      name: 'openai',
      baseUrl: openaiBase,
      apiKey: openaiKey,
      model: 'gpt-4o-mini',
      label: 'OpenAI',
    })
  }

  // 4. OpenRouter (fallback via API_BASE)
  if (!chain.some(p => p.name === 'openrouter')) {
    const apiBase = (process.env.OPENAI_API_BASE || '').trim()
    const apiKey = (process.env.OPENAI_API_KEY || '').trim()
    if (apiBase && apiKey && apiBase.includes('openrouter.ai')) {
      chain.push({
        name: 'openrouter',
        baseUrl: apiBase,
        apiKey,
        model: 'openai/gpt-4o-mini',
        label: 'OpenRouter',
      })
    }
  }

  // 5. AI Gateway (as last resort before giving up)
  const gwKey = (process.env.AI_GATEWAY_API_KEY || '').trim()
  if (gwKey) {
    chain.push({
      name: 'gateway',
      baseUrl: process.env.AI_GATEWAY_API_BASE || 'https://gateway.ai.vercel.ai/v1',
      apiKey: gwKey,
      model: options.preferredModel || 'openai/gpt-4o-mini',
      label: 'AI Gateway',
    })
  }

  // 6. OpenCode Go
  const ocKey = (process.env.OPENCODE_GO_API_KEY || '').trim()
  if (ocKey) {
    chain.push({
      name: 'opencode',
      baseUrl: 'https://opencode.ai/zen/go/v1',
      apiKey: ocKey,
      model: 'go-code',
      label: 'OpenCode Go',
    })
  }

  return chain
}

// ─── Check which providers are configured ─────────────────────────────────────

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
