/**
 * Apex AI Copilot — H14 Image Generation Connector
 * Calls AI Gateway when AI_GATEWAY_API_KEY is configured, otherwise OpenAI DALL-E.
 * Falls back to curated prompt-engineering guidance when API is unavailable.
 */

import { generateImage as generateGatewayImage } from 'ai'

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations'
const CONNECTOR_TIMEOUT_MS = 30000
const DEFAULT_GATEWAY_IMAGE_MODEL = 'bfl/flux-pro-1.1'

function hasGatewayConfig() {
  return Boolean(process.env.AI_GATEWAY_API_KEY)
}

function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY)
}

function hasFalConfig() {
  return Boolean(process.env.FAL_KEY || process.env.FAL_API_KEY)
}

function hasGeminiImageConfig() {
  return Boolean(process.env.GEMINI_API_KEY)
}

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || ''
}

// ─── Intent classifier ────────────────────────────────────────────────────────

export function classifyImageGenRequest(message = '') {
  const text = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const isRequest = /\b(gera|cria|faz|faca|faz|render|renderiza|produz|gere|crie)\b.*\b(imagem|render|visual|foto|perspectiva|visualiz|holograma)\b/.test(text)
    || /\b(gera|cria|faz|faca|faz|render|renderiza|produz|gere|crie)\b/.test(text) && /\b(fachada|interior|planta|masterplan|moodboard|holograma|topografia)\b/.test(text)
    || /\b(imagem|render|visualiz)\b.*\b(gera|cria|faz|do|da|de|para)\b/.test(text)
    || /\bgerar\s+(uma\s+)?imagem\b/.test(text)
    || /\bimage\s+gen(eration)?\b/.test(text)

  if (!isRequest) return null

  if (/\bfachada\b|\bexterior\b/.test(text)) return 'facade_render'
  if (/\binterior\b|\bambiente\b/.test(text)) return 'interior_render'
  if (/\bplanta\b|\bfloor\s*plan\b/.test(text)) return 'floor_plan_visual'
  if (/\baereo\b|\baérea\b|\bdrone\b|\bmasterplan\b/.test(text)) return 'aerial_masterplan'
  if (/\bconceito\b|\bmoodboard\b|\binspira\b/.test(text)) return 'concept_moodboard'
  if (/\bholograma\b|\btopografia\b|\btopografic\b/.test(text)) return 'topo_hologram'
  return 'architectural_render'
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

const STYLE_SUFFIXES = {
  facade_render: 'photorealistic architectural rendering, golden hour lighting, professional photography, ultra-detailed facade, 8K quality',
  interior_render: 'photorealistic interior render, natural daylight, professional architectural photography, warm atmosphere, high detail',
  floor_plan_visual: 'humanized floor plan illustration, soft shadows, furniture layout, plants, warm color palette, top-down architectural view',
  aerial_masterplan: 'aerial masterplan render, drone perspective, urban context, lush landscaping, professional architectural visualization',
  concept_moodboard: 'concept moodboard, architectural mood, atmospheric lighting, professional collage style, modern aesthetic',
  topo_hologram: 'topographic hologram visualization, blue neon glow, dark background, 3D terrain mesh, futuristic projection style',
  architectural_render: 'photorealistic architectural visualization, professional render, high quality, 8K',
}

const NEGATIVE_PROMPTS = [
  'changed geometry', 'altered walls', 'missing rooms', 'extra rooms',
  'perspective distortion', 'cartoon style', 'low quality', 'blurry',
  'watermark', 'text overlay', 'unrealistic scale',
]

export function buildImagePrompt(userMessage = '', renderType = 'architectural_render') {
  const text = String(userMessage || '').trim()
  const styleSuffix = STYLE_SUFFIXES[renderType] || STYLE_SUFFIXES.architectural_render

  // Extract key descriptors from the message
  const descriptors = text
    .replace(/\b(gera|cria|faz|faca|render|renderiza|uma|imagem|visual|foto|perspectiva)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const prompt = descriptors.length > 10
    ? `${descriptors}, ${styleSuffix}`
    : `Architectural project visualization, ${styleSuffix}`

  return {
    prompt,
    negative_prompt: NEGATIVE_PROMPTS.join(', '),
    renderType,
  }
}

// ─── API executor ─────────────────────────────────────────────────────────────

export async function generateImage({ prompt, size = '1024x1024', quality = 'standard', model = 'dall-e-3' } = {}) {
  if (hasGatewayConfig()) {
    try {
      const gatewayModel = process.env.AI_GATEWAY_IMAGE_MODEL || DEFAULT_GATEWAY_IMAGE_MODEL
      const result = await generateGatewayImage({
        model: gatewayModel,
        prompt,
        size,
      })
      const image = result.images && result.images[0]
      if (!image?.base64) {
        return { ok: false, reason: 'AI Gateway não retornou imagem.', secretsExposed: false }
      }
      return {
        ok: true,
        imageUrl: `data:image/png;base64,${image.base64}`,
        revisedPrompt: prompt,
        model: gatewayModel,
        size,
        secretsExposed: false,
      }
    } catch (err) {
      return {
        ok: false,
        reason: `AI Gateway: ${err?.message || err}`,
        secretsExposed: false,
      }
    }
  }

  if (!hasOpenAIConfig()) {
    return {
      ok: false,
      reason: hasFalConfig() || hasGeminiImageConfig()
        ? 'Gemini/FAL está configurado no stack Apex. Este executor direto usa AI Gateway/OpenAI; siga pelo ArchVis/DirectCut ou pelo prompt gerado sem exigir OpenAI.'
        : 'Nenhum executor direto de imagem está configurado. Configure AI_GATEWAY_API_KEY, FAL_KEY ou GEMINI_API_KEY conforme o fluxo desejado.',
      requiresConfig: true,
      secretsExposed: false,
    }
  }

  if (!globalThis.fetch) {
    return { ok: false, reason: 'fetch não disponível no ambiente.', secretsExposed: false }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS)

  try {
    const response = await fetch(OPENAI_IMAGES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getOpenAIKey()}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        response_format: 'url',
      }),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`
      return {
        ok: false,
        reason: `OpenAI DALL-E: ${errMsg}`,
        secretsExposed: false,
      }
    }

    const imageUrl = data?.data?.[0]?.url
    const revisedPrompt = data?.data?.[0]?.revised_prompt

    // Convert OpenAI temporary URL to permanent base64 data URL
    let permanentUrl = imageUrl
    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        const imgRes = await fetch(imageUrl)
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          const b64 = buffer.toString('base64')
          permanentUrl = `data:image/png;base64,${b64}`
        }
      } catch { /* keep original URL if download fails */ }
    }

    return {
      ok: true,
      imageUrl: permanentUrl,
      revisedPrompt: revisedPrompt || prompt,
      model,
      size,
      secretsExposed: false,
    }
  } catch (err) {
    return {
      ok: false,
      reason: err?.name === 'AbortError' ? 'Timeout ao gerar imagem (30s).' : `Erro: ${err?.message}`,
      secretsExposed: false,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Reply builders ───────────────────────────────────────────────────────────

export function buildImageGenPromptReply(userMessage = '') {
  const renderType = classifyImageGenRequest(userMessage) || 'architectural_render'
  const { prompt, negative_prompt } = buildImagePrompt(userMessage, renderType)

  return [
    '**Prompt de imagem gerado:**',
    '',
    `\`\`\``,
    prompt,
    `\`\`\``,
    '',
    `**Tipo de render:** ${renderType.replace(/_/g, ' ')}`,
    '',
    '**Prompt negativo (para SD/Comfy):**',
    `\`${negative_prompt}\``,
    '',
    hasGatewayConfig()
      ? 'Posso gerar a imagem agora com AI Gateway. Confirma? (sim / ajustar prompt)'
      : hasOpenAIConfig()
        ? 'Posso gerar a imagem agora com DALL-E 3. Confirma? (sim / ajustar prompt)'
        : hasFalConfig() || hasGeminiImageConfig()
          ? '_Gemini/FAL está disponível no stack Apex. Posso seguir pelo ArchVis/DirectCut ou usar o prompt acima sem exigir OpenAI._'
          : '_Para geração direta, configure `AI_GATEWAY_API_KEY`, `FAL_KEY` ou `GEMINI_API_KEY`. Por enquanto, use o prompt acima no Gemini/FAL/Stable Diffusion._',
  ].join('\n')
}

export function buildImageResultReply(result, prompt) {
  if (!result.ok) {
    return [
      `Não foi possível gerar a imagem: ${result.reason}`,
      result.requiresConfig ? 'Use `AI_GATEWAY_API_KEY`, `FAL_KEY` ou `GEMINI_API_KEY` conforme o fluxo de imagem escolhido; OpenAI é opcional.' : '',
    ].filter(Boolean).join('\n')
  }

  return [
    '**Imagem gerada com sucesso.**',
    '',
    `![Render gerado pela Apex AI](${result.imageUrl})`,
    '',
    result.revisedPrompt !== prompt ? `_Prompt revisado pelo modelo: ${result.revisedPrompt}_` : '',
    '',
    `Modelo: ${result.model} | Tamanho: ${result.size}`,
    'A imagem é armazenada permanentemente no projeto.',
  ].filter(Boolean).join('\n')
}

export function getImageGenConnectorStatus() {
  const configured = hasGatewayConfig() || hasOpenAIConfig() || hasFalConfig() || hasGeminiImageConfig()
  const detail = hasGatewayConfig()
    ? 'AI Gateway configurado — geração direta disponível.'
    : hasOpenAIConfig()
      ? 'OpenAI DALL-E configurado — geração direta disponível.'
      : hasFalConfig()
        ? 'FAL configurado no stack Apex para geração visual.'
        : hasGeminiImageConfig()
          ? 'Gemini configurado para fluxo multimodal/prompt visual no stack Apex.'
          : 'Modo prompt: gera prompts profissionais para Gemini/FAL/SD. OpenAI é opcional.'

  return {
    id: 'image_generation',
    label: 'Image generation',
    status: configured ? 'configured' : 'prompt_only',
    configured,
    detail,
  }
}
