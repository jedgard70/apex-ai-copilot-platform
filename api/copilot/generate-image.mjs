/**
 * Apex AI Copilot — /api/copilot/generate-image
 * Vercel Serverless Function for image generation.
 *
 * POST body: {
 *   prompt: string,
 *   negativePrompt?: string,
 *   sourceImageDataUrl?: string,   // base64 data URL for img2img
 *   outputCount?: number,          // 1–4
 *   style?: string,
 *   camera?: string,
 * }
 *
 * Priority:
 *   1. FAL_KEY present → fal.ai (supports img2img)
 *   2. OPENAI_API_KEY present → DALL-E 3
 *   3. Neither → planning-only response
 */

// Auto-detect and fix swapped router variables
if (process.env.OPENAI_API_BASEROUTER && process.env.OPENAI_API_KEYROUTER) {
  const baseVal = String(process.env.OPENAI_API_BASEROUTER).trim()
  const keyVal = String(process.env.OPENAI_API_KEYROUTER).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASEROUTER = keyVal
    process.env.OPENAI_API_KEYROUTER = baseVal
  }
}
if (process.env.OPENAI_API_BASE && process.env.OPENAI_API_KEY) {
  const baseVal = String(process.env.OPENAI_API_BASE).trim()
  const keyVal = String(process.env.OPENAI_API_KEY).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASE = keyVal
    process.env.OPENAI_API_KEY = baseVal
  }
}

// Normalize custom router variable casing/names
if (process.env.OPENAI_API_BASEROUTER && !process.env.OPENAI_API_BASE) {
  process.env.OPENAI_API_BASE = process.env.OPENAI_API_BASEROUTER
}
if (process.env.OPENAI_API_KEYROUTER && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEYROUTER
}

const CONNECTOR_TIMEOUT_MS = 45000

function hasFalConfig() {
  return Boolean(process.env.FAL_KEY)
}

function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY)
}

// ─── fal.ai connector ─────────────────────────────────────────────────────────

async function generateWithFal({ prompt, negativePrompt, sourceImageDataUrl, outputCount = 1 }) {
  const FAL_KEY = process.env.FAL_KEY

  // Choose model: flux-lora for img2img when sourceImage is present, otherwise flux/dev
  const hasSource = Boolean(sourceImageDataUrl)
  const modelId = hasSource ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux/dev'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS)

  try {
    const payload = hasSource
      ? {
          image_url: sourceImageDataUrl,
          prompt,
          negative_prompt: negativePrompt || '',
          num_images: Math.min(4, Math.max(1, outputCount || 1)),
          strength: 0.75,
          guidance_scale: 7.5,
        }
      : {
          prompt,
          negative_prompt: negativePrompt || '',
          num_images: Math.min(4, Math.max(1, outputCount || 1)),
          guidance_scale: 7.5,
          num_inference_steps: 28,
        }

    const response = await fetch(`https://fal.run/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errMsg = data?.detail || data?.error || `HTTP ${response.status}`
      return {
        ok: false,
        reason: `fal.ai: ${errMsg}`,
      }
    }

    const images = (data?.images || []).map((img) => ({
      imageUrl: img.url,
      image: img.url,
    }))

    return {
      ok: true,
      images,
      model: modelId,
      mode: hasSource ? 'img2img' : 'text2img',
    }
  } catch (err) {
    return {
      ok: false,
      reason: err?.name === 'AbortError' ? 'Timeout ao gerar imagem via fal.ai (45s).' : `fal.ai error: ${err?.message}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── OpenAI DALL-E 3 connector ────────────────────────────────────────────────

async function generateWithDalle({ prompt, outputCount = 1 }) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS)

  // DALL-E 3 only supports n=1 per request; loop for multiple outputs
  const count = Math.min(4, Math.max(1, outputCount || 1))
  const requests = Array.from({ length: count }, () =>
    fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
      signal: controller.signal,
    }).then(r => r.json()).catch(() => null)
  )

  try {
    const results = await Promise.all(requests)
    const images = results
      .filter(Boolean)
      .map(data => ({
        imageUrl: data?.data?.[0]?.url,
        image: data?.data?.[0]?.url,
        revisedPrompt: data?.data?.[0]?.revised_prompt,
      }))
      .filter(img => img.imageUrl)

    if (!images.length) {
      return { ok: false, reason: 'DALL-E 3 did not return any images.' }
    }

    return {
      ok: true,
      images,
      revisedPrompt: images[0]?.revisedPrompt,
      model: 'dall-e-3',
      mode: 'text2img',
    }
  } catch (err) {
    return {
      ok: false,
      reason: err?.name === 'AbortError' ? 'Timeout ao gerar imagem via DALL-E 3 (45s).' : `DALL-E 3 error: ${err?.message}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }

  const {
    prompt = '',
    negativePrompt = '',
    sourceImageDataUrl,
    outputCount = 1,
    style,
    camera,
  } = body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required.' })
  }

  // No AI key configured → planning-only mode
  if (!hasFalConfig() && !hasOpenAIConfig()) {
    return res.status(200).json({
      mode: 'planning-only',
      message: 'Configure OPENAI_API_KEY ou FAL_KEY para gerar imagens reais.',
      prompt,
      negativePrompt,
      style: style || null,
      camera: camera || null,
    })
  }

  // fal.ai takes priority (better img2img support)
  if (hasFalConfig()) {
    const result = await generateWithFal({ prompt, negativePrompt, sourceImageDataUrl, outputCount })
    if (result.ok) {
      return res.status(200).json({
        mode: result.mode,
        model: result.model,
        images: result.images,
        imageUrl: result.images?.[0]?.imageUrl,
        image: result.images?.[0]?.image,
      })
    }
    // fal.ai failed; fall through to DALL-E if available
    if (!hasOpenAIConfig()) {
      return res.status(502).json({ error: result.reason })
    }
  }

  // DALL-E 3 fallback
  const result = await generateWithDalle({ prompt, outputCount })
  if (result.ok) {
    return res.status(200).json({
      mode: result.mode,
      model: result.model,
      images: result.images,
      imageUrl: result.images?.[0]?.imageUrl,
      image: result.images?.[0]?.image,
      revisedPrompt: result.revisedPrompt,
    })
  }

  return res.status(502).json({ error: result.reason })
}
