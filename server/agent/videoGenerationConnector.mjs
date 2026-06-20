import { experimental_generateVideo as generateGatewayVideo } from 'ai'

const DEFAULT_GATEWAY_VIDEO_MODEL = 'google/veo-3.1-generate-001'

export function classifyVideoGenRequest(message = '') {
  const text = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const hasVideo = /\b(video|videos|directcut|reels|tour|animacao|cinematic|cinematografico|walkthrough)\b/.test(text)
  const hasAction = /\b(gera|gerar|cria|criar|faz|faca|produz|produzir|transforma|transformar|animate|animar)\b/.test(text)
  return hasVideo && hasAction ? 'video_generation' : null
}

export async function generateVideo({ prompt, aspectRatio = '16:9', duration = 8, model } = {}) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      ok: false,
      reason: 'AI_GATEWAY_API_KEY não configurado. Geração de vídeo requer AI Gateway.',
      requiresConfig: true,
      secretsExposed: false,
    }
  }

  try {
    const gatewayModel = model || process.env.AI_GATEWAY_VIDEO_MODEL || DEFAULT_GATEWAY_VIDEO_MODEL
    const result = await generateGatewayVideo({
      model: gatewayModel,
      prompt,
      aspectRatio,
      duration,
    })
    const video = result.videos && result.videos[0]
    if (!video?.uint8Array) {
      return { ok: false, reason: 'AI Gateway não retornou vídeo.', secretsExposed: false }
    }
    return {
      ok: true,
      videoUrl: `data:video/mp4;base64,${Buffer.from(video.uint8Array).toString('base64')}`,
      model: gatewayModel,
      aspectRatio,
      duration,
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

export function buildVideoResultReply(result) {
  if (!result.ok) {
    return [
      `Não foi possível gerar o vídeo: ${result.reason}`,
      result.requiresConfig ? 'Configure `AI_GATEWAY_API_KEY` para habilitar geração direta de vídeo.' : '',
    ].filter(Boolean).join('\n')
  }

  return [
    '**Vídeo gerado com sucesso.**',
    '',
    `<video controls src="${result.videoUrl}"></video>`,
    '',
    `Modelo: ${result.model} | Aspect ratio: ${result.aspectRatio} | Duração: ${result.duration}s`,
    'Nenhum segredo foi exposto.',
  ].join('\n')
}
