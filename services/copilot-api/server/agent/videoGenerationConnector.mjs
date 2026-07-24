import { experimental_generateVideo as generateGatewayVideo } from 'ai'
import { FAL_MODELS, getModelById, getDefaultVideoT2VModel, getDefaultVideoI2VModel, buildFalPayload } from './falModelRegistry.mjs'

/**
 * Build the public webhook URL for this deployment.
 * Production: https://apexglobalai.com/api/fal/webhook
 * Local: null → falls back to polling
 */
function buildWebhookUrl() {
  const domain = process.env.APEX_PRODUCTION_DOMAIN || process.env.VERCEL_URL
  if (!domain) return null
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  return `${base}/api/fal/webhook`
}

/**
 * Submit a job to fal.ai queue (async-first).
 * Returns { ok, requestId, statusUrl, responseUrl }
 */
async function submitFalJob({ modelId, payload, webhookUrl }) {
  const falKey = process.env.FAL_KEY
  if (!falKey) return { ok: false, reason: 'FAL_KEY não configurado.', requiresConfig: true }

  const queueUrl = `https://queue.fal.run/${modelId}`
  const body = webhookUrl ? { ...payload, webhook_url: webhookUrl } : payload

  const res = await fetch(queueUrl, {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    return { ok: false, reason: `fal.ai ${res.status}: ${errText.slice(0, 300)}` }
  }

  const data = await res.json()
  const requestId = data?.request_id
  if (!requestId) return { ok: false, reason: 'fal.ai não retornou request_id.' }

  const base = `https://queue.fal.run/${modelId}/requests/${requestId}`
  return {
    ok: true,
    requestId,
    statusUrl: data?.status_url || `${base}/status`,
    responseUrl: data?.response_url || base,
    webhookMode: !!webhookUrl,
  }
}

/**
 * Poll fal.ai queue until job completes or timeout.
 * Max attempts × 3s interval.
 */
async function pollFalResult(statusUrl, responseUrl, falKey, maxAttempts = 90) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${falKey}` },
        signal: AbortSignal.timeout(8000),
      })
      if (!statusRes.ok) continue
      const status = await statusRes.json()

      if (status?.status === 'COMPLETED') {
        const resultRes = await fetch(responseUrl, {
          headers: { Authorization: `Key ${falKey}` },
          signal: AbortSignal.timeout(15000),
        })
        const result = await resultRes.json()
        const videoUrl = result?.video?.url || result?.video_url || result?.payload?.video?.url
        const imageUrl = result?.images?.[0]?.url || result?.image?.url
        const audioUrl = result?.audio?.url || result?.audio_url
        return { ok: true, videoUrl: videoUrl || null, imageUrl: imageUrl || null, audioUrl: audioUrl || null, result }
      }

      if (status?.status === 'FAILED') {
        return { ok: false, reason: `fal.ai FAILED: ${status?.error || JSON.stringify(status).slice(0, 200)}` }
      }
    } catch (err) {
      if (err.name === 'TimeoutError') continue
      throw err
    }
  }
  return { ok: false, reason: `fal.ai polling timeout após ${maxAttempts * 3}s.` }
}

/**
 * Main unified fal.ai generation function.
 *
 * Modes:
 *   - async (production with webhookUrl): submit → return { async: true, requestId }
 *   - sync (local/no-webhook): submit → poll → return result
 *
 * @param {Object} opts
 * @param {string} opts.modelId  - fal.ai model path (e.g. 'kling-video/v3/pro/text-to-video')
 * @param {string} opts.prompt
 * @param {string} [opts.aspectRatio]
 * @param {number} [opts.duration]
 * @param {string} [opts.imageUrl] - base64 data URL or https URL
 * @param {string} [opts.finalImageUrl] - end frame (for first+last frame models)
 * @param {Object} [opts.extraFields] - additional model-specific fields
 */
export async function generateWithFal({ modelId, prompt, aspectRatio = '16:9', duration = 5, imageUrl, finalImageUrl, extraFields = {} } = {}) {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return { ok: false, reason: 'FAL_KEY não configurado.', requiresConfig: true, secretsExposed: false }
  }

  // Resolve model — auto-select if not specified
  const resolvedModelId = modelId || (imageUrl ? getDefaultVideoI2VModel()?.id : getDefaultVideoT2VModel()?.id) || 'kling-video/v1.6/standard/text-to-video'
  const model = getModelById(resolvedModelId)

  // Build payload using registry schema
  const payload = buildFalPayload(resolvedModelId, {
    prompt, aspectRatio, duration, imageUrl, finalImageUrl, extraFields,
  })

  const webhookUrl = buildWebhookUrl()

  try {
    const submitted = await submitFalJob({ modelId: resolvedModelId, payload, webhookUrl })
    if (!submitted.ok) return { ok: false, reason: submitted.reason, secretsExposed: false }

    if (submitted.webhookMode) {
      // Async — client polls /api/fal/webhook-status
      return {
        ok: true,
        async: true,
        requestId: submitted.requestId,
        modelId: resolvedModelId,
        modelLabel: model?.label || resolvedModelId,
        aspectRatio,
        duration,
        message: `Vídeo em geração. request_id: ${submitted.requestId}`,
        secretsExposed: false,
      }
    }

    // Sync polling (local dev)
    const polled = await pollFalResult(submitted.statusUrl, submitted.responseUrl, falKey)
    if (!polled.ok) return { ok: false, reason: polled.reason, secretsExposed: false }

    return {
      ok: true,
      async: false,
      videoUrl: polled.videoUrl,
      imageUrl: polled.imageUrl,
      audioUrl: polled.audioUrl,
      modelId: resolvedModelId,
      modelLabel: model?.label || resolvedModelId,
      aspectRatio,
      duration,
      secretsExposed: false,
    }
  } catch (err) {
    return { ok: false, reason: `fal.ai: ${err?.message || err}`, secretsExposed: false }
  }
}

// ─── Legacy wrappers (backward compat with existing chat.mjs calls) ───────────

export function classifyVideoGenRequest(message = '') {
  const text = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const hasVideo = /\b(video|videos|directcut|reels|tour|animacao|cinematic|cinematografico|walkthrough)\b/.test(text)
  const hasAction = /\b(gera|gerar|cria|criar|faz|faca|produz|produzir|transforma|transformar|animate|animar)\b/.test(text)
  return hasVideo && hasAction ? 'video_generation' : null
}

export async function generateVideo({ prompt, aspectRatio = '16:9', duration = 8, model, sourceImageDataUrl } = {}) {
  if (process.env.FAL_KEY) {
    return generateWithFal({
      modelId: model || (sourceImageDataUrl ? getDefaultVideoI2VModel()?.id : getDefaultVideoT2VModel()?.id),
      prompt, aspectRatio, duration,
      imageUrl: sourceImageDataUrl || undefined,
    })
  }

  // AI Gateway (Google Veo) fallback
  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      ok: false,
      reason: 'Nenhum provedor de vídeo configurado. Configure FAL_KEY (fal.ai) ou AI_GATEWAY_API_KEY (Google Veo).',
      requiresConfig: true,
      secretsExposed: false,
    }
  }

  try {
    const gatewayModel = model || process.env.AI_GATEWAY_VIDEO_MODEL || 'google/veo-3.1-generate-001'
    const result = await generateGatewayVideo({ model: gatewayModel, prompt, aspectRatio, duration })
    const video = result.videos?.[0]
    if (!video?.uint8Array) return { ok: false, reason: 'AI Gateway não retornou vídeo.', secretsExposed: false }
    return {
      ok: true, async: false,
      videoUrl: `data:video/mp4;base64,${Buffer.from(video.uint8Array).toString('base64')}`,
      model: gatewayModel, aspectRatio, duration, secretsExposed: false,
    }
  } catch (err) {
    return { ok: false, reason: `AI Gateway: ${err?.message || err}`, secretsExposed: false }
  }
}

export function buildVideoResultReply(result) {
  if (!result.ok) {
    return [
      `Não foi possível gerar o vídeo: ${result.reason}`,
      result.requiresConfig ? 'Configure `FAL_KEY` (fal.ai) para habilitar geração de vídeo.' : '',
    ].filter(Boolean).join('\n')
  }

  if (result.async) {
    return [
      `**Vídeo enviado para geração — ${result.modelLabel || result.modelId}**`,
      '',
      `request_id: \`${result.requestId}\``,
      `Acompanhe: \`/api/fal/webhook-status?request_id=${result.requestId}\``,
    ].join('\n')
  }

  const media = result.videoUrl
    ? `<video controls src="${result.videoUrl}"></video>`
    : result.imageUrl ? `<img src="${result.imageUrl}" />` : ''

  return ['**Gerado com sucesso.**', '', media, '', `Modelo: ${result.modelLabel || result.modelId} | ${result.aspectRatio} | ${result.duration}s`].filter(Boolean).join('\n')
}
