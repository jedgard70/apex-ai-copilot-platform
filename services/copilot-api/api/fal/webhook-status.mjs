/**
 * GET /api/fal/webhook-status?request_id=xxx
 *
 * Client polls this endpoint to check if a fal.ai async job is complete.
 * Returns the stored webhook payload when available, or { status: 'pending' }.
 */

import '../../server/env.mjs'

async function getFromStore(requestId) {
  // Try Supabase first
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && key && key !== 'server-only-do-not-expose') {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)
      const { data, error } = await supabase
        .from('fal_webhook_results')
        .select('payload, created_at')
        .eq('request_id', requestId)
        .maybeSingle()
      if (!error && data) return data.payload
    } catch (err) {
      console.error('[fal/webhook-status] Supabase lookup error:', err.message)
    }
  }

  // Fallback: in-memory store (local dev)
  if (globalThis._falWebhookStore) {
    return globalThis._falWebhookStore.get(requestId) || null
  }

  return null
}

function extractVideoUrl(payload) {
  if (!payload) return null
  // fal.ai video result shapes
  const video = payload?.payload?.video || payload?.video
  if (video?.url) return video.url
  // Kling returns payload.payload.video.url
  const nested = payload?.payload?.video?.url
  if (nested) return nested
  return null
}

function extractImageUrl(payload) {
  if (!payload) return null
  const images = payload?.payload?.images || payload?.images
  if (Array.isArray(images) && images[0]?.url) return images[0].url
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const requestId = (req.query?.request_id || '').toString().trim()
  if (!requestId) {
    return res.status(400).json({ error: 'request_id is required' })
  }

  const stored = await getFromStore(requestId)

  if (!stored) {
    return res.status(200).json({ status: 'pending', request_id: requestId })
  }

  const falStatus = stored.status || 'UNKNOWN'

  if (falStatus === 'ERROR') {
    return res.status(200).json({
      status: 'error',
      request_id: requestId,
      error: stored.error || 'fal.ai returned ERROR status.',
      payload: stored.payload || null,
    })
  }

  if (falStatus === 'OK') {
    const videoUrl = extractVideoUrl(stored)
    const imageUrl = extractImageUrl(stored)
    return res.status(200).json({
      status: 'completed',
      request_id: requestId,
      videoUrl: videoUrl || null,
      imageUrl: imageUrl || null,
      payload: stored.payload || null,
      model: stored.payload?.model || 'fal-ai',
    })
  }

  // IN_QUEUE, IN_PROGRESS, etc.
  return res.status(200).json({ status: 'pending', request_id: requestId, falStatus })
}

export const config = { api: { bodyParser: true } }
