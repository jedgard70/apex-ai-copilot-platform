import { renderVideoPayload } from '../../server/videoRenderPipeline.mjs'
import { uploadMediaAndRegister } from '../../server/lib/supabaseMedia.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'error' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const result = await renderVideoPayload(body)
  if (result.providerStatus === 'error') return sendJson(res, 500, result)
  if (result.providerStatus === 'blocked') return sendJson(res, 403, result)

  // Upload to Supabase if videoUrl is present and we have a projectId
  if (body.projectId && result.videoUrl && result.videoUrl.startsWith('http')) {
    try {
      const response = await fetch(result.videoUrl)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const mimeType = result.mimeType || 'video/mp4'
      const fileName = `video_${Date.now()}.mp4`
      
      const uploadRes = await uploadMediaAndRegister(buffer, mimeType, fileName, body.projectId, body.tenantId)
      result.file_id = uploadRes.file_id
      result.videoUrl = uploadRes.url
      result.videoDataUrl = uploadRes.url
    } catch (err) {
      console.error('[video-render] Erro ao fazer upload para o Supabase:', err.message)
    }
  }

  return sendJson(res, 200, result)
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
}
