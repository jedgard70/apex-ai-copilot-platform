/**
 * interactionsConnector.mjs
 * Conector para a API Gemini Interactions (/v1beta/interactions)
 *
 * Autorizado pelo Owner Dr. Edgard em 2026-07-08 como EXCEÇÃO À REGRA 12.
 * Uso exclusivo para modelos que não suportam generateContent:
 *   - deep-research-preview-04-2026, deep-research-max-preview-04-2026
 *   - antigravity-preview-05-2026, veo-3.1, nano-banana-2, nano-banana-pro
 *   - lyria-3-pro-preview, lyria-3-clip-preview, gemini-robotics
 *
 * Header obrigatório: x-goog-api-key (nunca Authorization: Bearer)
 */

const INTERACTIONS_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Models that require the Interactions API (cannot use generateContent)
const INTERACTIONS_ONLY_MODELS = new Set([
  'deep-research-preview-04-2026',
  'deep-research-max-preview-04-2026',
  'antigravity-preview-05-2026',
  'veo-3.1',
  'nano-banana-2',
  'nano-banana-pro',
  'lyria-3-pro-preview',
  'lyria-3-clip-preview',
  'gemini-robotics',
])

/**
 * Returns true if the model must use the Interactions API
 * @param {string} modelId
 */
export function requiresInteractionsAPI(modelId) {
  return INTERACTIONS_ONLY_MODELS.has(modelId)
}

/**
 * Call the Gemini Interactions API.
 * Rule 12 exception: uses /v1beta/interactions instead of /v1beta/models/{model}:generateContent
 * but still uses x-goog-api-key header (never OpenAI-compatible format).
 *
 * @param {object} params
 * @param {string} params.model - The model ID
 * @param {Array}  params.messages - Conversation messages [{role, content}]
 * @param {string} params.systemPrompt - Optional system prompt text
 * @param {string} [params.conversationId] - For multi-turn interactions
 * @param {boolean} [params.enableSearch] - Enable grounding with search
 * @param {number}  [params.temperature]
 * @param {number}  [params.maxOutputTokens]
 * @returns {Promise<{ok: boolean, text: string, interactionId: string, citations: Array, usage: object, providerStatus: string}>}
 */
export async function callInteractionsAPI({
  model,
  messages = [],
  systemPrompt = '',
  conversationId = null,
  enableSearch = false,
  temperature = 0.72,
  maxOutputTokens = 1500,
}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '')
  if (!apiKey) {
    return { ok: false, text: '', interactionId: null, citations: [], usage: {}, providerStatus: 'no-api-key' }
  }

  // Build the contents array from messages
  const contents = messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'model')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: String(m.content || m.text || '') }],
    }))
    .filter(m => m.parts[0].text.trim().length > 0)

  // Add the last user message if not already included
  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    const lastUser = messages.filter(m => m.role === 'user').pop()
    if (lastUser) {
      contents.push({ role: 'user', parts: [{ text: String(lastUser.content || lastUser.text || '') }] })
    }
  }

  const requestBody = {
    model: `models/${model}`,
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  }

  if (systemPrompt) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  if (enableSearch) {
    requestBody.tools = [{ googleSearch: {} }]
  }

  if (conversationId) {
    requestBody.conversationId = conversationId
  }

  try {
    const response = await fetch(`${INTERACTIONS_BASE}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000), // 2 min for long-running agents like Deep Research
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const errMsg = errData?.error?.message || `HTTP ${response.status}`
      console.error(`[interactionsConnector] ${model} failed: ${errMsg}`)
      return { ok: false, text: '', interactionId: null, citations: [], usage: {}, providerStatus: `error-${response.status}` }
    }

    const data = await response.json().catch(() => ({}))

    // Extract text from candidates
    const candidate = data?.candidates?.[0]
    const parts = candidate?.content?.parts || []
    const text = parts.filter(p => p.text).map(p => p.text).join('') || ''

    // Extract citations from groundingMetadata
    const groundingMetadata = candidate?.groundingMetadata || {}
    const citations = (groundingMetadata.groundingChunks || [])
      .filter(c => c.web?.uri)
      .map(c => ({ url: c.web.uri, title: c.web.title || c.web.uri }))

    const usage = {
      promptTokens: data?.usageMetadata?.promptTokenCount || 0,
      completionTokens: data?.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data?.usageMetadata?.totalTokenCount || 0,
    }

    const interactionId = data?.interactionId || data?.name || null

    return {
      ok: true,
      text,
      interactionId,
      citations,
      usage,
      providerStatus: 'connected',
    }
  } catch (err) {
    console.error(`[interactionsConnector] Exception for ${model}:`, err.message)
    return { ok: false, text: '', interactionId: null, citations: [], usage: {}, providerStatus: `error-exception` }
  }
}

/**
 * Helper: check if interaction API is configured
 */
export function isInteractionsConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}
