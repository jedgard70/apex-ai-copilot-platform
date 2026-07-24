// POST /api/aps/complete-upload
// Body: { objectKey, uploadKey }
// Finalises the signed S3 upload and returns { objectId, urn } ready for Model Derivative translation.

import { getToken, ensureBucket, OSS_BASE, toUrn, sendJson } from './_aps-helpers.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const { objectKey, uploadKey, eTags } = req.body || {}
  if (!objectKey || !uploadKey) return sendJson(res, 400, { error: 'objectKey and uploadKey are required' })

  try {
    const token  = await getToken()
    const bucket = await ensureBucket(token)

    const body = { uploadKey }
    if (Array.isArray(eTags) && eTags.length > 0) body.eTags = eTags

    const r = await fetch(
      `${OSS_BASE}/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}/signeds3upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    const data = await r.json()
    if (!r.ok) return sendJson(res, r.status, { error: data.reason || data.errorMessage || 'Complete upload failed' })

    const urn = toUrn(data.objectId)
    return sendJson(res, 200, {
      objectId:  data.objectId,
      objectKey: data.objectKey,
      bucketKey: data.bucketKey,
      urn,
      size:      data.size,
    })
  } catch (err) {
    console.error('[aps/complete-upload]', err.message)
    return sendJson(res, 500, { error: err.message })
  }
}
