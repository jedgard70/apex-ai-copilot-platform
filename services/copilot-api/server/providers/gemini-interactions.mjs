import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let genaiClient = null

function getClient() {
  if (genaiClient) return genaiClient
  try {
    const { GoogleGenAI } = require('@google/genai')
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return null
    genaiClient = new GoogleGenAI({ apiKey })
    return genaiClient
  } catch {
    return null
  }
}

const INTERACTION_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Interactions)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Interactions)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Interactions)' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image (Interactions)' },
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS (Interactions)' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image (Interactions)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Interactions)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Interactions)' },
  // ═══ NOVOS AGENTES (autorizado Owner 2026-07-08) ═══
  { id: 'deep-research-preview-04-2026', name: 'Deep Research Preview (Interactions)' },
  { id: 'deep-research-max-preview-04-2026', name: 'Deep Research Max (Interactions)' },
  { id: 'antigravity-preview-05-2026', name: 'Antigravity Preview (Interactions)' },
  { id: 'veo-3.1', name: 'Veo 3.1 (Interactions)' },
  { id: 'nano-banana-2', name: 'Nano Banana 2 (Interactions)' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro (Interactions)' },
  { id: 'lyria-3-pro-preview', name: 'Lyria 3 Pro (Interactions)' },
  { id: 'lyria-3-clip-preview', name: 'Lyria 3 Clip (Interactions)' },
  { id: 'gemini-robotics', name: 'Gemini Robotics (Interactions)' },
]

// Models that REQUIRE Interactions API (cannot use generateContent)
const INTERACTIONS_ONLY_IDS = new Set([
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

function isInteractionModel(model) {
  return INTERACTION_MODELS.some(m => model?.startsWith(m.id))
}

function splitModelValue(value) {
  const raw = String(value || '')
  const sep = raw.indexOf('|')
  if (sep === -1) return { provider: null, modelId: raw, raw }
  return { provider: raw.slice(0, sep), modelId: raw.slice(sep + 1), raw }
}

const conversationState = new Map()

function getConversationState(conversationId) {
  if (!conversationId) return null
  let state = conversationState.get(conversationId)
  if (!state) {
    state = { previousInteractionId: null, interactionCount: 0 }
    conversationState.set(conversationId, state)
  }
  return state
}

function buildContentsFromMessages(messages, file) {
  const contents = []
  for (const msg of messages) {
    if (msg.role === 'system') continue
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const text = msg.text || msg.content || ''
    if (text.trim()) contents.push({ role, parts: [{ text }] })
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] })
  }

  const attachment = file || messages.find(m => m.file || m.attachment)?.file || messages.find(m => m.file || m.attachment)?.attachment
  if (attachment?.dataUrl) {
    const [header, base64 = ''] = attachment.dataUrl.split(',')
    const mimeType = attachment.type || header.match(/data:([^;]+)/)?.[1] || ''
    if (mimeType.startsWith('image/') && contents.length > 0) {
      contents[contents.length - 1].parts.push({ inlineData: { mimeType, data: base64 } })
    }
  }

  return contents
}

/**
 * Fallback: call via native fetch when @google/genai SDK fails or is unavailable.
 * Compliant with Rule 12: uses x-goog-api-key, never Authorization: Bearer
 */
async function callViaFetch({ model, contents, systemPrompt, enableSearch, temperature, maxOutputTokens }) {
  const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '')
  if (!apiKey) return null

  const geminiBase = 'https://generativelanguage.googleapis.com/v1beta'

  // For Interactions-only models, use /interactions endpoint
  if (INTERACTIONS_ONLY_IDS.has(model)) {
    const requestBody = {
      model: `models/${model}`,
      contents,
      generationConfig: { temperature: temperature ?? 0.72, maxOutputTokens: maxOutputTokens ?? 1500 },
    }
    if (systemPrompt) requestBody.systemInstruction = { parts: [{ text: systemPrompt }] }
    if (enableSearch) requestBody.tools = [{ googleSearch: {} }]

    try {
      const response = await fetch(`${geminiBase}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000),
      })
      if (!response.ok) return null
      const data = await response.json().catch(() => ({}))
      const parts = data?.candidates?.[0]?.content?.parts || []
      const text = parts.filter(p => p.text).map(p => p.text).join('')
      const usage = data?.usageMetadata || {}
      return {
        ok: !!text,
        text,
        interactionId: data?.interactionId || null,
        usage,
        providerStatus: text ? 'gemini-interactions-fetch' : 'error',
      }
    } catch { return null }
  }

  // Standard generateContent for other models
  const FALLBACK_MODELS = [model, 'gemini-2.5-flash', 'gemini-2.5-pro']
  for (const m of FALLBACK_MODELS) {
    try {
      const body = {
        contents,
        generationConfig: { temperature: temperature ?? 0.72, maxOutputTokens: maxOutputTokens ?? 900 },
      }
      if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] }
      if (enableSearch) body.tools = [{ googleSearch: {} }]

      const response = await fetch(`${geminiBase}/models/${m}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      })
      if (!response.ok) {
        if (response.status === 400 || response.status === 401) break
        continue
      }
      const data = await response.json().catch(() => ({}))
      const parts = data?.candidates?.[0]?.content?.parts || []
      const text = parts.filter(p => p.text).map(p => p.text).join('')
      if (!text) continue
      return {
        ok: true,
        text,
        usage: data?.usageMetadata || {},
        providerStatus: 'gemini-fetch',
      }
    } catch { continue }
  }
  return null
}

export async function generateWithInteractions({
  model,
  messages,
  systemPrompt,
  conversationId,
  enableSearch = false,
  temperature,
  maxOutputTokens,
  file,
}) {
  const client = getClient()
  const modelId = model?.includes('|') ? splitModelValue(model).modelId : model || 'gemini-2.5-flash'
  const contents = buildContentsFromMessages(messages, file)

  // ─── Handle Interactions-only models via SDK or fetch ───
  if (INTERACTIONS_ONLY_IDS.has(modelId)) {
    if (client) {
      const input = []
      const lastMsg = [...messages].reverse().find(m => m.role === 'user')
      input.push({ type: 'text', text: lastMsg?.text || lastMsg?.content || 'Hello' })
      const state = getConversationState(conversationId)
      const body = { model: modelId, input }
      if (state?.previousInteractionId) body.previous_interaction_id = state.previousInteractionId
      if (enableSearch) body.tools = [{ type: 'google_search' }]
      try {
        const interaction = await client.interactions.create(body)
        if (state && interaction?.id) state.previousInteractionId = interaction.id
        const outputText = interaction?.output_text || ''
        if (outputText) {
          return { ok: true, text: outputText, interactionId: interaction?.id, status: interaction?.status, usage: interaction?.usage, providerStatus: 'gemini-interactions-sdk' }
        }
      } catch (error) {
        console.warn('[Gemini Interactions SDK]:', error.message, '— trying fetch fallback...')
      }
    }
    // Fallback via fetch
    const fetchResult = await callViaFetch({ model: modelId, contents, systemPrompt, enableSearch, temperature, maxOutputTokens })
    if (fetchResult?.ok) return fetchResult
    return { ok: false, error: 'Interactions API failed', providerStatus: 'error' }
  }

  // ─── Standard models: use @google/genai SDK first, then fetch fallback ───
  if (client) {
    const generationConfig = {}
    if (temperature !== undefined) generationConfig.temperature = temperature
    if (maxOutputTokens !== undefined) generationConfig.maxOutputTokens = maxOutputTokens

    const body = { model: modelId, contents, generationConfig }
    if (systemPrompt) body.systemInstruction = { role: 'user', parts: [{ text: systemPrompt }] }
    if (enableSearch) body.tools = [{ googleSearch: {} }]

    try {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), 60000)
      const response = await client.models.generateContent(body)
      clearTimeout(timer)
      const candidate = response?.candidates?.[0]
      const finishReason = candidate?.finishReason
      const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || ''
      if (finishReason === 'SAFETY') {
        return { ok: false, text: '', error: 'Response rejected by Gemini safety filters', providerStatus: 'error' }
      }
      if (text) {
        return { ok: true, text, usage: response?.usageMetadata, providerStatus: 'gemini-gencontent', finishReason }
      }
    } catch (error) {
      console.warn('[Gemini generateContent SDK]:', error.message, '— trying fetch fallback...')
    }
  }

  // Final fallback: native fetch with model chain
  const fetchResult = await callViaFetch({ model: modelId, contents, systemPrompt, enableSearch, temperature, maxOutputTokens })
  if (fetchResult?.ok) return fetchResult

  return { ok: false, error: 'All Gemini providers failed', providerStatus: 'error' }
}

export { INTERACTION_MODELS, isInteractionModel, getClient }
