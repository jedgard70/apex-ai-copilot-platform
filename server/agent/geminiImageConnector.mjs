/**
 * server/agent/geminiImageConnector.mjs
 *
 * Gemini Interactions API — Image Generation via Imagen 4.
 * Fallback nativo para geracao de imagens sem depender de DALL-E.
 * Modelos: gemini-3-pro-image, gemini-3.1-flash-image, gemini-3.5-flash
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

const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-3.5-flash']

/**
 * Gera imagem usando Gemini Interactions API (Imagen 4).
 * @param {string} prompt - Descricao da imagem
 * @param {Object} [options]
 * @param {string} [options.model] - Modelo (default: gemini-3.1-flash-image)
 * @param {string} [options.size] - Tamanho (se suportado pelo modelo)
 * @returns {Promise<{ ok: boolean, imageBase64?: string, mimeType?: string, revisedPrompt?: string, error?: string }>}
 */
export async function generateImage(prompt, { model = 'gemini-3.1-flash-image', size = '' } = {}) {
  const client = getClient()
  if (!client) {
    return { ok: false, error: 'Gemini API key not configured', requiresConfig: true }
  }

  if (!prompt || prompt.length === 0) return { ok: false, error: 'Prompt is required' }

  try {
    const input = [{ type: 'text', text: prompt }]

    const interaction = await client.interactions.create({
      model,
      input,
    })

    const image = interaction?.output_image
    if (image?.data && image?.mime_type) {
      return {
        ok: true,
        imageBase64: image.data,
        mimeType: image.mime_type || 'image/png',
        revisedPrompt: prompt,
        interactionId: interaction.id,
        provider: 'gemini-imagen',
        imageUrl: `data:${image.mime_type || 'image/png'};base64,${image.data}`,
      }
    }

    // Fallback: try output_text for description-based response
    const outputText = interaction?.output_text || ''
    if (outputText) {
      return {
        ok: true,
        description: outputText.slice(0, 2000),
        revisedPrompt: prompt,
        provider: 'gemini-imagen-description',
        note: 'Modelo nao retornou imagem como binario. Use gemini-3-pro-image ou gemini-3.1-flash-image para geracao direta.',
      }
    }

    return { ok: false, error: 'Gemini Image Generation did not return an image', providerStatus: 'no-image-output' }
  } catch (err) {
    return { ok: false, error: `Gemini Imagen: ${err.message || err}`, providerStatus: 'error' }
  }
}

export function isGeminiImageAvailable() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export { IMAGE_MODELS }
