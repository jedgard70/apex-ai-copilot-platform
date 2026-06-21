// ArchVis real image generation endpoint
// Provider priority: 1) OpenAI gpt-image-1 → 2) fal.ai flux → 3) not-configured message

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function scrubProviderError(value) {
  return String(value || 'Provider request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[redacted-image-data]')
    .slice(0, 1200)
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/)
  if (!match) return null
  const [, mimeType, base64] = match
  return {
    mimeType,
    base64,
    buffer: Buffer.from(base64, 'base64'),
  }
}

function buildArchVisServerStylePrompt(promptStyle) {
  const style = String(promptStyle || 'humanized-floor-plan')
  const styles = {
    'humanized-floor-plan': [
      'Prompt style: Humanized floor plan.',
      'Strict image-to-image, top-down orthographic, preserve layout, walls, openings, room positions, labels where possible, no geometry change, no extra rooms, no invented gardens, high realism.',
    ].join('\n'),
    'photorealistic-facade': 'Prompt style: Photorealistic facade. Minimalist residence, realistic facade, accurate shadows, refined materials, urban or residential architecture, premium real estate presentation.',
    'interior-design': 'Prompt style: Interior design. Use coherent room function, furniture, materials, palette, lighting and realistic construction detail.',
    'futuristic-interior': 'Prompt style: Futuristic interior. Include budget/room intent, polished concrete, porcelain, dark matte walls, metal, leather, teak/freijo wood, LED linear lighting 4000-6500K, indirect lighting and minimal objects.',
    'cinematic-real-estate': 'Prompt style: Cinematic real estate. Include eye-level, low angle, high angle, bird eye/top-down, 3/4 angle, dolly in/out, orbit, flyover, top reveal, wide angle or telephoto camera language.',
    'technical-bim-mep': 'Prompt style: Technical BIM/MEP. Clean documentation style, BIM/MEP comparison, wireframe/hologram architecture, precise systems, readable technical overlays.',
    'topographic-hologram': 'Prompt style: Topographic hologram. Topographic terrain, GIS/neon linework, holographic contours, site levels and technical depth.',
    'masterplan-overlay': 'Prompt style: Masterplan overlay. Site planning, zones, circulation, roads, access logic, landscape areas and clean 3D text placement where useful.',
    'video-camera-movement': 'Prompt style: Video / camera movement. Shot sequence, dolly in/out, orbit, flyover, top reveal and cinematic presentation language.',
  }
  return styles[style] || styles['humanized-floor-plan']
}

function buildSafePrompt({ prompt, negativePrompt, outputType, promptStyle, fidelityRules, boundaryRules, outputTypeRules, autoFloorPlanConstraints, revisionConstraints, cameraPreset, referenceMode, strength, file }) {
  return [
    prompt.slice(0, 8000),
    '',
    autoFloorPlanConstraints.length || revisionConstraints.length
      ? ['User correction constraints from previous failed outputs:', ...[...autoFloorPlanConstraints, ...revisionConstraints].map((c, i) => `${i + 1}. ${c}`)].join('\n')
      : '',
    '',
    outputTypeRules[outputType] || outputTypeRules['creative-concept'],
    fidelityRules,
    buildArchVisServerStylePrompt(promptStyle),
    boundaryRules,
    cameraPreset && cameraPreset !== 'auto' ? `Selected camera/movement preset: ${cameraPreset}.` : '',
    negativePrompt ? `Negative prompt: ${[
      negativePrompt.slice(0, 2000),
      outputType === 'humanized-floor-plan'
        ? 'eye-level view, side view, perspective room render, facade, interior photograph, camera inside room, 3D walkthrough, changed viewpoint'
        : '',
    ].filter(Boolean).join(', ')}` : '',
    '',
    'Apex ArchVis production intent: generate a polished, client-ready architectural visualization. Preserve the uploaded project logic where a source image is supplied. Do not add fake labels or unreadable text.',
    `Reference mode: ${referenceMode}.`,
    `Fidelity strength requested: ${strength}%.`,
    file?.name ? `Source file name: ${String(file.name).slice(0, 180)}` : '',
  ].filter(s => s !== undefined && s !== null && s !== '').join('\n')
}

// ─── Provider 1: OpenAI gpt-image-1 ─────────────────────────────────────────
async function generateWithOpenAI({ apiKey, apiBase, safePrompt, sourceImage, outputCount, size, quality, model, mode, file }) {
  let response
  const requiresSourceImage = mode === 'preserve-layout' || mode === 'image-edit-plan'
  if (sourceImage && requiresSourceImage) {
    const form = new FormData()
    form.append('model', model)
    form.append('prompt', safePrompt)
    form.append('size', size)
    form.append('quality', quality)
    form.append('n', String(outputCount))
    form.append('image', new Blob([sourceImage.buffer], { type: sourceImage.mimeType }), file?.name || 'source-image.png')
    response = await fetch(`${apiBase}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })
  } else {
    response = await fetch(`${apiBase}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: safePrompt, size, quality, n: outputCount }),
    })
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw Object.assign(new Error(scrubProviderError(data?.error?.message || `OpenAI HTTP ${response.status}`)), { status: response.status })
  }
  const images = Array.isArray(data?.data)
    ? data.data.map(item => ({
        image: item?.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined,
        imageUrl: item?.url,
        revisedPrompt: item?.revised_prompt,
      })).filter(item => item.image || item.imageUrl)
    : []
  const first = data?.data?.[0] || {}
  const b64 = first.b64_json
  const url = first.url
  if (!b64 && !url) throw new Error('OpenAI returned no image payload.')
  return {
    providerStatus: 'connected',
    provider: 'openai',
    message: 'Image generated by OpenAI gpt-image-1.',
    image: b64 ? `data:image/png;base64,${b64}` : undefined,
    imageUrl: url,
    images,
    revisedPrompt: first.revised_prompt,
    model: data?.model || model,
    mode,
  }
}

// ─── Provider 2: fal.ai ──────────────────────────────────────────────────────
async function generateWithFal({ falKey, safePrompt, sourceImage, outputCount, mode, size }) {
  // fal.ai REST API — no SDK needed
  const requiresSourceImage = mode === 'preserve-layout'
  const imgSize = size === '1024x1024' ? 'square_hd' : size === '1024x1792' ? 'portrait_4_3' : 'landscape_4_3'

  let endpoint, payload
  if (requiresSourceImage && sourceImage) {
    endpoint = 'https://fal.run/fal-ai/flux/dev/image-to-image'
    payload = {
      prompt: safePrompt,
      image_url: `data:${sourceImage.mimeType};base64,${sourceImage.base64}`,
      strength: 0.85,
      num_images: outputCount,
      image_size: imgSize,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    }
  } else {
    endpoint = 'https://fal.run/fal-ai/flux/schnell'
    payload = {
      prompt: safePrompt,
      num_images: outputCount,
      image_size: imgSize,
      num_inference_steps: 4,
      enable_safety_checker: true,
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw Object.assign(new Error(scrubProviderError(data?.detail || data?.error || `fal.ai HTTP ${response.status}`)), { status: response.status })
  }

  const falImages = Array.isArray(data?.images)
    ? data.images.map(item => ({
        imageUrl: item?.url,
        image: undefined,
      })).filter(item => item.imageUrl)
    : []

  if (!falImages.length) throw new Error('fal.ai returned no image payload.')
  return {
    providerStatus: 'connected',
    provider: 'fal.ai',
    message: `Image generated by fal.ai ${requiresSourceImage ? 'flux/dev/image-to-image' : 'flux/schnell'}.`,
    imageUrl: falImages[0].imageUrl,
    image: undefined,
    images: falImages,
    model: endpoint.split('/').slice(-1)[0],
    mode,
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'not-connected' })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY

  if (!openaiKey && !falKey) {
    return sendJson(res, 200, {
      providerStatus: 'not-configured',
      message: 'No image provider configured. Add OPENAI_API_KEY (recommended) or FAL_KEY to your Vercel environment variables to enable real ArchVis image generation.',
    })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const prompt = String(body.prompt || '').trim()
    if (!prompt) {
      return sendJson(res, 400, { providerStatus: 'not-connected', message: 'prompt is required.' })
    }

    const mode = String(body.mode || 'preserve-layout')
    const file = body.file || {}
    const sourceImage = parseDataUrl(body.sourceImageDataUrl)
    const negativePrompt = String(body.negativePrompt || '').trim()
    const lockBoundaries = body.lockBoundaries === true
    const preserveLabels = body.preserveLabels !== false
    const noInventedAreas = body.noInventedAreas !== false
    const referenceMode = String(body.referenceMode || 'original')
    const revisionConstraints = Array.isArray(body.revisionConstraints)
      ? body.revisionConstraints.map(c => String(c).slice(0, 600)).filter(Boolean).slice(0, 20)
      : []
    const outputType = String(body.outputType || (mode === 'preserve-layout' ? 'humanized-floor-plan' : 'creative-concept'))
    const promptStyle = String(body.promptStyle || 'humanized-floor-plan')
    const cameraPreset = String(body.cameraPreset || 'auto')
    const strength = Math.max(30, Math.min(100, Number(body.strength || 85)))
    const outputCount = Math.max(1, Math.min(4, Number(body.outputCount || 1)))
    const requiresSourceImage = mode === 'preserve-layout'

    const maxSourceBytes = 8 * 1024 * 1024
    if (sourceImage && sourceImage.buffer.length > maxSourceBytes) {
      return sendJson(res, 413, {
        providerStatus: 'not-connected',
        message: `Source image is too large. Max ${maxSourceBytes / 1024 / 1024}MB.`,
      })
    }
    if (requiresSourceImage && !sourceImage) {
      return sendJson(res, 400, {
        providerStatus: 'not-connected',
        message: 'A source image is required for layout-preserving ArchVis generation. Upload or paste the plan first.',
      })
    }

    const fidelityRules = mode === 'preserve-layout'
      ? [
          'STRICT FIDELITY MODE:',
          'Use the uploaded image as the strict reference/base image.',
          'Transform this exact uploaded architectural floor plan into a high-quality humanized floor plan visualization.',
          outputType === 'humanized-floor-plan' ? 'Keep strict top-down orthographic view. Do not convert into eye-level, side-view, room perspective, facade, or 3D interior camera. This is a floor plan humanization, not a perspective render.' : '',
          'Preserve the original geometry, walls, room positions, labels where possible, pool location, garage location, road/access, lot shape, proportions and top-down camera.',
          'Do not redesign the plan. Do not add/remove rooms. Do not change layout. Do not crop important parts.',
          preserveLabels ? 'Preserve labels where possible and avoid misspelled labels.' : '',
          'Only improve materials, floor textures, furniture, landscaping, shadows, water, lighting and presentation quality.',
          'The output should look like a humanized/rendered version of the same uploaded top-down floor plan.',
        ].filter(Boolean).join('\n')
      : 'Creative variation mode: use the uploaded plan as source context, but allow more visual interpretation while keeping the project recognizable.'

    const outputTypeRules = {
      'humanized-floor-plan': 'Output type: Humanized floor plan / Top-down. Force top-down orthographic floor plan humanization. No side camera, no eye-level view, no 3D perspective room render, no facade/interior camera.',
      '3d-perspective': 'Output type: 3D perspective render. Perspective is allowed because the user explicitly requested 3D/perspective.',
      'facade-render': 'Output type: Facade render. Exterior facade camera is allowed.',
      'interior-render': 'Output type: Interior render. Interior camera is allowed.',
      'creative-concept': 'Output type: Creative concept. Redesign may be imaginative and must not be presented as faithful plan.',
    }

    const autoFloorPlanConstraints = outputType === 'humanized-floor-plan'
      ? [
          'Preserve 1 bathroom and 1 laundry/service room, do not create two bathrooms.',
          'Keep grass/green area only where it appears in the original plan.',
          'Do not extend grass beyond the original left strip/half.',
          'Keep all walls, openings and layout positions.',
        ]
      : []

    const boundaryRules = mode === 'preserve-layout' && (lockBoundaries || noInventedAreas)
      ? [
          'STRICT BOUNDARY LOCK:',
          lockBoundaries ? 'Preserve exact lot boundary.' : '',
          lockBoundaries ? 'Preserve exact building footprint.' : '',
          noInventedAreas ? 'Do not extend garden/landscaping beyond the original garden/patio areas.' : '',
          noInventedAreas ? 'Do not create garden behind sauna, lavanderia, suite, pool, garage, or any area where it is not shown in the source image.' : '',
          noInventedAreas ? 'Do not fill blank/white/technical areas with invented landscaping.' : '',
          noInventedAreas ? 'Treat unknown/blank areas as unchanged neutral surfaces.' : '',
          noInventedAreas ? 'No garden continuation, invented garden, extra landscaping, added patio, added deck, extended vegetation or random plants outside original garden.' : '',
        ].filter(Boolean).join('\n')
      : ''

    const safePrompt = buildSafePrompt({
      prompt, negativePrompt, outputType, promptStyle, fidelityRules, boundaryRules, outputTypeRules,
      autoFloorPlanConstraints, revisionConstraints, cameraPreset, referenceMode, strength, file,
    })

    const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
    const size = process.env.OPENAI_IMAGE_SIZE || '1024x1024'
    const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium'

    // Try primary provider
    if (openaiKey) {
      const result = await generateWithOpenAI({ apiKey: openaiKey, apiBase, safePrompt, sourceImage, outputCount, size, quality, model, mode, file })
      return sendJson(res, 200, result)
    }

    // Try secondary provider: fal.ai
    if (falKey) {
      const result = await generateWithFal({ falKey, safePrompt, sourceImage, outputCount, mode, size })
      return sendJson(res, 200, result)
    }

    return sendJson(res, 200, {
      providerStatus: 'not-configured',
      message: 'No image provider configured. Add OPENAI_API_KEY or FAL_KEY to Vercel environment variables.',
    })
  } catch (error) {
    return sendJson(res, error.status || 500, {
      providerStatus: 'error',
      message: scrubProviderError(error.message || 'Image generation failed.'),
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
