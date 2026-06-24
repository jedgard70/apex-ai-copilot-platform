/**
 * server/providers/providerRouter.mjs
 *
 * Provider Router with automatic failover.
 * Ordem de prioridade (custo para nós):
 *   1. Gemini (direct) — free (1M tokens/min)
 *   2. OpenRouter — pago (GPT, DeepSeek, Anthropic, etc.)
 *   3. OpenCode Go — pago mensal
 *   4. FAL.ai — pago mensal
 *   5. DeepSeek via OpenRouter — gratuito, modelo grande
 *   6. Anthropic (direct) — pago
 *   7. OpenAI (direct) — pago
 *   8. AI Gateway — último recurso
 *
 * O usuário final nunca vê erro de provedor.
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
      model: options.preferredModel === 'gemini' ? options.preferredModel : 'gemini-2.0-flash',
      label: 'Gemini (Free)',
    })
  }

  // 2. OpenRouter — acesso a todos (DeepSeek, Anthropic, OpenAI, etc.)
  const orBase = (process.env.OPENAI_API_BASEROUTER || '').trim()
  const orKey = (process.env.OPENAI_API_KEYROUTER || '').trim()
  if (orBase && orKey && orBase.includes('openrouter.ai')) {
    chain.push({
      name: 'openrouter',
      baseUrl: orBase,
      apiKey: orKey,
      model: 'openai/gpt-4o-mini',
      label: 'OpenRouter',
    })
  }
  if (!chain.some(p => p.name.startsWith('openrouter'))) {
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

  // 3. OpenCode Go — pago mensal
  const ocKey = (process.env.OPENCODE_GO_API_KEY || '').trim()
  if (ocKey) {
    chain.push({
      name: 'opencode',
      baseUrl: 'https://opencode.ai/zen/go/v1',
      apiKey: ocKey,
      model: 'go-chat',
      label: 'OpenCode Go',
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

  // 5. DeepSeek via OpenRouter — gratuito, modelo grande (só se OpenRouter configurado)
  if (chain.some(p => p.name === 'openrouter')) {
    const or = chain.find(p => p.name === 'openrouter')
    chain.push({
      name: 'deepseek',
      baseUrl: or.baseUrl,
      apiKey: or.apiKey,
      model: 'deepseek/deepseek-chat',
      label: 'DeepSeek (Free)',
    })
    chain.push({
      name: 'deepseek-r1',
      baseUrl: or.baseUrl,
      apiKey: or.apiKey,
      model: 'deepseek/deepseek-r1',
      label: 'DeepSeek R1 (Free)',
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
