import { authenticateApexApi, recordUsage, readJsonBody, sendJson } from '../../../../server/apexApi/auth.mjs'
import { generateImage } from '../../../../server/agent/imageGenerationConnector.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }
  const auth = authenticateApexApi(req, ['operate:images'])
  if (!auth.ok) return sendJson(res, auth.status, auth)

  try {
    const body = await readJsonBody(req)
    const prompt = String(body.prompt || '').trim()
    if (!prompt) return sendJson(res, 400, { error: 'prompt_required' })
    const result = await generateImage({
      prompt,
      size: body.size || '1024x1024',
      quality: body.quality || 'standard',
    })
    const usage = recordUsage({
      auth,
      service: 'images.generate',
      projectId: body.project_id || 'default',
      unit: 'image',
    })
    return sendJson(res, result.ok ? 200 : 502, {
      ok: result.ok,
      provider: result.model || result.provider || 'image-generation',
      image: result,
      apex_usage: usage,
    }, usage)
  } catch (error) {
    return sendJson(res, 500, { error: 'image_generation_failed', message: error?.message || String(error) })
  }
}
