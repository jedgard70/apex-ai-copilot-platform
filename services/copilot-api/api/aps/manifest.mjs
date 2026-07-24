// GET /api/aps/manifest?urn=xxx
// Polls the Model Derivative translation status for a given URN.
// Also returns a fresh viewer token so the front-end can initialise the Autodesk Viewer.

import { getToken, MD_BASE, SCOPES_VIEW, sendJson } from './_aps-helpers.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' })

  const { urn } = req.query || {}
  if (!urn) return sendJson(res, 400, { error: 'urn query parameter is required' })

  try {
    const [fullToken, viewToken] = await Promise.all([
      getToken(),
      getToken(SCOPES_VIEW),
    ])

    const r = await fetch(`${MD_BASE}/designdata/${encodeURIComponent(urn)}/manifest`, {
      headers: { Authorization: `Bearer ${fullToken}` },
    })
    const data = await r.json()
    if (!r.ok) return sendJson(res, r.status, { error: data.diagnostic || data.reason || 'Manifest fetch failed' })

    const isReady    = data.status === 'success'
    const hasFailed  = data.status === 'failed'
    const inProgress = !isReady && !hasFailed

    return sendJson(res, 200, {
      urn:         data.urn,
      status:      data.status,       // 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'
      progress:    data.progress,     // '0%', '42%', 'complete'
      region:      data.region,
      derivatives: data.derivatives || [],
      isReady,
      hasFailed,
      inProgress,
      // Fresh viewer token (viewables:read scope only — safe to pass to browser)
      viewerToken:  isReady ? viewToken : undefined,
    })
  } catch (err) {
    console.error('[aps/manifest]', err.message)
    return sendJson(res, 500, { error: err.message })
  }
}
