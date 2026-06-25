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
]

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
  if (!client) {
    return { ok: false, error: 'Gemini API key not configured', providerStatus: 'not-configured' }
  }

  const modelId = model?.includes('|') ? splitModelValue(model).modelId : model || 'gemini-2.5-flash'

  if (isInteractionModel(modelId)) {
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
      return { ok: interaction?.status === 'completed', text: outputText, interactionId: interaction?.id, status: interaction?.status, usage: interaction?.usage, providerStatus: outputText ? 'gemini-interactions' : 'error' }
    } catch (error) {
      console.error('[Gemini Interactions Error]:', error.message || error)
      return { ok: false, error: error.message || 'Interactions API failed', providerStatus: 'error' }
    }
  }

  const contents = buildContentsFromMessages(messages, file)

  const generationConfig = {}
  if (temperature !== undefined) generationConfig.temperature = temperature
  if (maxOutputTokens !== undefined) generationConfig.maxOutputTokens = maxOutputTokens

  const body = { model: modelId, contents, generationConfig }
  if (systemPrompt) body.systemInstruction = { role: 'user', parts: [{ text: systemPrompt }] }
  if (enableSearch) body.tools = [{ googleSearch: {} }]

  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 25000)
    const response = await client.models.generateContent(body)
    clearTimeout(timer)

    const candidate = response?.candidates?.[0]
    const finishReason = candidate?.finishReason
    const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || ''
    const usage = response?.usageMetadata

    if (finishReason === 'SAFETY') {
      return { ok: false, text: '', error: 'Blocked by safety filters', providerStatus: 'blocked' }
    }

    return {
      ok: true,
      text,
      usage,
      providerStatus: text ? 'gemini-gencontent' : 'error',
      finishReason,
    }
  } catch (error) {
    console.error('[Gemini generateContent Error]:', error.message || error)
    if (error?.name === 'AbortError') {
      return { ok: false, error: 'Request timed out', providerStatus: 'timeout' }
    }
    if (error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE')) {
      return { ok: false, error: 'Model temporarily unavailable', providerStatus: 'unavailable' }
    }
    return { ok: false, error: error.message || 'generateContent failed', providerStatus: 'error' }
  }
}

export { INTERACTION_MODELS, isInteractionModel, getClient }
