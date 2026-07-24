/**
 * GET /api/fal/models
 * Returns the full fal.ai model catalog grouped by category.
 */
import '../../server/env.mjs'
import { FAL_MODELS, getVideoModels, getImageModels, getTtsModels, getFirstLastFrameModels } from '../../server/agent/falModelRegistry.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const hasFal = Boolean(process.env.FAL_KEY)

  const grouped = {
    'video-t2v': FAL_MODELS.filter(m => m.category === 'video-t2v'),
    'video-i2v': FAL_MODELS.filter(m => m.category === 'video-i2v'),
    'video-i2v-firstlast': FAL_MODELS.filter(m => m.category === 'video-i2v-firstlast'),
    'image-t2i': FAL_MODELS.filter(m => m.category === 'image-t2i'),
    'image-i2i': FAL_MODELS.filter(m => m.category === 'image-i2i'),
    'tts': FAL_MODELS.filter(m => m.category === 'tts'),
  }

  const labs = [...new Set(FAL_MODELS.map(m => m.lab))].sort()

  return res.status(200).json({
    ok: true,
    providerConfigured: hasFal,
    total: FAL_MODELS.length,
    labs,
    grouped,
    all: FAL_MODELS,
  })
}

export const config = { api: { bodyParser: false } }
