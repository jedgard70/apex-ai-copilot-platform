// POST /api/aps/translate
// Body: { urn, rootFilename? }
// Submits a Model Derivative SVF2 translation job for any APS-supported format.

import { getToken, MD_BASE, sendJson } from './_aps-helpers.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const { urn, rootFilename } = req.body || {}
  if (!urn) return sendJson(res, 400, { error: 'urn is required' })

  try {
    const token = await getToken()

    const input = { urn }
    if (rootFilename) {
      // Required for multi-file formats like Revit (zip), IFC, etc.
      input.compressedUrn = true
      input.rootFilename   = rootFilename
    }

    const job = {
      input,
      output: {
        destination: { region: 'us' },
        formats: [
          {
            type: 'svf2',
            views: ['2d', '3d'],
            advanced: { generateMasterViews: true },
          },
        ],
      },
    }

    const r = await fetch(`${MD_BASE}/designdata/job`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true', // re-translate even if already translated
      },
      body: JSON.stringify(job),
    })
    const data = await r.json()
    if (!r.ok) return sendJson(res, r.status, { error: data.diagnostic || data.reason || 'Translation job failed' })

    return sendJson(res, 200, {
      urn:    data.urn,
      result: data.result,   // 'created' or 'success'
    })
  } catch (err) {
    console.error('[aps/translate]', err.message)
    return sendJson(res, 500, { error: err.message })
  }
}
