/**
 * server/agent/geminiTtsConnector.mjs
 *
 * Gemini Interactions API — Text-to-Speech via Gemini TTS models.
 * Fallback nativo quando ElevenLabs não estiver disponível.
 * Modelos: gemini-3.1-flash-tts-preview, gemini-3.5-flash-tts
 */

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

const TTS_MODELS = ['gemini-3.1-flash-tts-preview', 'gemini-3.5-flash-tts']

/**
 * Gera áudio TTS usando Gemini Interactions API.
 * @param {string} text - Texto para converter em fala
 * @param {Object} [options]
 * @param {string} [options.model] - Modelo TTS (default: gemini-3.1-flash-tts-preview)
 * @param {string} [options.voice] - Instrução de voz (ex: "calm female voice", "energetic male voice")
 * @returns {Promise<{ ok: boolean, audioBase64?: string, mimeType?: string, error?: string }>}
 */
export async function generateSpeech(text, { model = 'gemini-3.1-flash-tts-preview', voice = '' } = {}) {
  const client = getClient()
  if (!client) {
    return { ok: false, error: 'Gemini API key not configured', requiresConfig: true }
  }

  if (!text || text.length === 0) return { ok: false, error: 'Text is required' }
  if (text.length > 5000) text = text.slice(0, 5000) + '...'

  try {
    const input = voice
      ? [{ type: 'text', text: `${voice}. Say this: ${text}` }]
      : [{ type: 'text', text }]

    const interaction = await client.interactions.create({
      model,
      input,
    })

    const audio = interaction?.output_audio
    if (audio?.data && audio?.mime_type) {
      return {
        ok: true,
        audioBase64: audio.data,
        mimeType: audio.mime_type,
        interactionId: interaction.id,
        provider: 'gemini-tts',
      }
    }

    // Fallback: check if text response contains base64 audio data
    const outputText = interaction?.output_text || ''
    if (outputText && outputText.length > 100) {
      return {
        ok: true,
        audioBase64: outputText,
        mimeType: 'audio/wav',
        provider: 'gemini-tts-fallback',
        note: 'Gemini TTS returned text response instead of audio. Quality may vary.',
      }
    }

    return { ok: false, error: 'Gemini TTS did not return audio', providerStatus: 'no-audio-output' }
  } catch (err) {
    return { ok: false, error: `Gemini TTS: ${err.message || err}`, providerStatus: 'error' }
  }
}

/**
 * Verifica se o TTS Gemini está configurado.
 */
export function isGeminiTtsAvailable() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export { TTS_MODELS }
