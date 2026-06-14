/**
 * Apex AI Copilot — H14 Image Generation Connector
 * Calls OpenAI DALL-E (or compatible API) when OPENAI_API_KEY is configured.
 * Falls back to curated prompt-engineering guidance when API is unavailable.
 */

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations'
const CONNECTOR_TIMEOUT_MS = 30000

function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY)
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
  if (!hasOpenAIConfig()) {
    return {
      ok: false,
      reason: 'OPENAI_API_KEY não configurado. Para gerar imagens, adicione a variável no Vercel.',
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

    return {
      ok: true,
      imageUrl,
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
    hasOpenAIConfig()
      ? 'Posso gerar a imagem agora com DALL-E 3. Confirma? (sim / ajustar prompt)'
      : '_Para geração direta, configure `OPENAI_API_KEY` no Vercel. Por enquanto, use o prompt acima no Midjourney, DALL-E ou Stable Diffusion._',
  ].join('\n')
}

export function buildImageResultReply(result, prompt) {
  if (!result.ok) {
    return [
      `Não foi possível gerar a imagem: ${result.reason}`,
      result.requiresConfig ? 'Configure `OPENAI_API_KEY` no Vercel para habilitar geração direta.' : '',
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
    'Nenhum segredo foi exposto. A URL da imagem expira em 60 minutos.',
  ].filter(Boolean).join('\n')
}

export function getImageGenConnectorStatus() {
  return {
    id: 'image_generation',
    label: 'Image generation (DALL-E)',
    status: hasOpenAIConfig() ? 'configured' : 'prompt_only',
    configured: hasOpenAIConfig(),
    detail: hasOpenAIConfig()
      ? 'OpenAI DALL-E configurado — geração direta disponível.'
      : 'Modo prompt: gera prompts profissionais para Midjourney/DALL-E/SD. Configure OPENAI_API_KEY para geração direta.',
  }
}
