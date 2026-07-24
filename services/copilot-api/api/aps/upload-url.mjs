// GET /api/aps/upload-url?objectKey=file.rvt&parts=1
// Returns signed S3 upload URL(s) from APS OSS v2.
// Browser PUTs file directly to the signed URL — keeps APS token server-side and bypasses Vercel body limit.

import { getToken, ensureBucket, OSS_BASE, sendJson } from './_aps-helpers.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' })

  const { objectKey, parts = '1' } = req.query || {}
  if (!objectKey) return sendJson(res, 400, { error: 'objectKey query parameter is required' })

  const safeKey = String(objectKey).replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 200)
  const numParts = Math.max(1, Math.min(25, parseInt(String(parts), 10) || 1))

  try {
    const token  = await getToken()
    const bucket = await ensureBucket(token)

    const r = await fetch(
      `${OSS_BASE}/buckets/${bucket}/objects/${encodeURIComponent(safeKey)}/signeds3upload?parts=${numParts}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = await r.json()
    if (!r.ok) return sendJson(res, r.status, { error: data.reason || data.errorMessage || 'Failed to get upload URL' })

    return sendJson(res, 200, {
      uploadKey: data.uploadKey,
      urls:      data.urls,          // array of signed S3 URLs (one per part)
      objectKey: safeKey,
      bucketKey: bucket,
    })
  } catch (err) {
    console.error('[aps/upload-url]', err.message)
    return sendJson(res, 500, { error: err.message })
  }
}
