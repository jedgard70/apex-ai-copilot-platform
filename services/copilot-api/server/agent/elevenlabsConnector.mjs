/**
 * server/agent/elevenlabsConnector.mjs
 *
 * ElevenLabs API — Text-to-Speech via ElevenLabs REST API.
 */

/**
 * Verifica se a chave do ElevenLabs está configurada.
 */
export function isElevenLabsAvailable() {
  return Boolean(process.env.ELEVENLABS_API_KEY)
}

/**
 * Gera áudio TTS usando ElevenLabs API.
 * @param {string} text - Texto para converter em fala
 * @param {Object} [options]
 * @param {string} [options.model] - Modelo TTS (default: eleven_multilingual_v2)
 * @param {string} [options.voice] - ID da voz (default: JBFqnCBcs611MxpwweFS)
 * @returns {Promise<{ ok: boolean, audioBase64?: string, mimeType?: string, error?: string }>}
 */
export async function generateSpeech(text, { model = 'eleven_multilingual_v2', voice = 'JBFqnCBcs611MxpwweFS' } = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'ElevenLabs API key not configured', requiresConfig: true }
  }

  if (!text || text.length === 0) return { ok: false, error: 'Text is required' }
  // Limitar texto se for muito grande
  if (text.length > 5000) text = text.slice(0, 5000) + '...'

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { ok: false, error: `ElevenLabs TTS HTTP ${response.status}: ${errorData?.detail?.message || 'Unknown error'}`, providerStatus: 'error' }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const audioBase64 = buffer.toString('base64')

    return {
      ok: true,
      audioBase64,
      mimeType: 'audio/mpeg',
      provider: 'elevenlabs',
    }
  } catch (err) {
    return { ok: false, error: `ElevenLabs TTS: ${err.message || err}`, providerStatus: 'error' }
  }
}
