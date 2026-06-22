/**
 * POST /api/fal/webhook
 *
 * Receives async results from fal.ai queue jobs (image, video, etc).
 * Verifies the ED25519 signature using fal's JWKS endpoint.
 * Stores result in Supabase table `fal_webhook_results` for client polling.
 *
 * Signature verification steps (per fal.ai docs):
 *  1. Fetch JWKS from https://rest.fal.ai/.well-known/jwks.json (cache 24h)
 *  2. Extract headers: X-Fal-Webhook-Request-Id, X-Fal-Webhook-User-Id,
 *                      X-Fal-Webhook-Timestamp, X-Fal-Webhook-Signature
 *  3. Verify timestamp is within ±300s
 *  4. message = [requestId, userId, timestamp, sha256(body)].join('\n')
 *  5. Verify ED25519 signature against message using each JWKS public key
 */

import '../../server/env.mjs'
import crypto from 'node:crypto'

// ─── JWKS cache ───────────────────────────────────────────────────────────────

const JWKS_URL = 'https://rest.fal.ai/.well-known/jwks.json'
const JWKS_TTL_MS = 24 * 60 * 60 * 1000 // 24h

let _jwksCache = null
let _jwksCacheAt = 0

async function fetchJwks() {
  if (_jwksCache && Date.now() - _jwksCacheAt < JWKS_TTL_MS) return _jwksCache
  const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`)
  const data = await res.json()
  _jwksCache = data.keys || []
  _jwksCacheAt = Date.now()
  return _jwksCache
}

// ─── Signature verification ───────────────────────────────────────────────────

async function verifyFalSignature(headers, rawBody) {
  const requestId = headers['x-fal-webhook-request-id']
  const userId = headers['x-fal-webhook-user-id']
  const timestamp = headers['x-fal-webhook-timestamp']
  const sigHex = headers['x-fal-webhook-signature']

  if (!requestId || !userId || !timestamp || !sigHex) {
    return { ok: false, reason: 'Missing required fal webhook headers.' }
  }

  // Timestamp within ±5 minutes
  const now = Math.floor(Date.now() / 1000)
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return { ok: false, reason: `Timestamp out of range: ${timestamp}` }
  }

  // Build message: requestId\nuserId\ntimestamp\nsha256hex(body)
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex')
  const message = Buffer.from([requestId, userId, timestamp, bodyHash].join('\n'), 'utf8')

  // Decode signature
  let sigBytes
  try {
    sigBytes = Buffer.from(sigHex, 'hex')
  } catch {
    return { ok: false, reason: 'Invalid signature hex.' }
  }

  // Verify against each JWKS key (ED25519)
  let keys
  try {
    keys = await fetchJwks()
  } catch (err) {
    // If JWKS is unreachable, allow in dev but warn
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[fal/webhook] JWKS unavailable in dev — skipping verification:', err.message)
      return { ok: true, reason: 'dev-skip-jwks' }
    }
    return { ok: false, reason: `JWKS fetch error: ${err.message}` }
  }

  for (const key of keys) {
    try {
      const pubKeyBytes = Buffer.from(key.x, 'base64url')
      // Node 15+ supports ED25519 natively via crypto.verify
      const pubKey = crypto.createPublicKey({
        key: pubKeyBytes,
        format: 'der',
        type: 'spki',
      })
      const valid = crypto.verify(null, message, pubKey, sigBytes)
      if (valid) return { ok: true, reason: 'signature-valid' }
    } catch {
      // Try next key
    }
  }

  return { ok: false, reason: 'Signature verification failed with all JWKS keys.' }
}

// ─── Supabase store ───────────────────────────────────────────────────────────

async function storeResult(requestId, payload) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || key === 'server-only-do-not-expose') {
    // Fallback: store in memory (local dev only — not shared across instances)
    if (!globalThis._falWebhookStore) globalThis._falWebhookStore = new Map()
    globalThis._falWebhookStore.set(requestId, { ...payload, storedAt: Date.now() })
    return { ok: true, store: 'memory' }
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)
    const { error } = await supabase
      .from('fal_webhook_results')
      .upsert({ request_id: requestId, payload, created_at: new Date().toISOString() }, { onConflict: 'request_id' })
    if (error) throw error
    return { ok: true, store: 'supabase' }
  } catch (err) {
    // Fallback to memory on Supabase error
    if (!globalThis._falWebhookStore) globalThis._falWebhookStore = new Map()
    globalThis._falWebhookStore.set(requestId, { ...payload, storedAt: Date.now() })
    console.error('[fal/webhook] Supabase store error (using memory fallback):', err.message)
    return { ok: true, store: 'memory-fallback', error: err.message }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // rawBody must be a Buffer — Vercel gives us req.body as parsed object if bodyParser is on
  // We set bodyParser: false so rawBody = Buffer
  const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body || {}))

  // Parse JSON payload
  let payload
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }

  const requestId = payload.request_id
    || req.headers['x-fal-webhook-request-id']
    || `unknown-${Date.now()}`

  // Verify signature
  const sigResult = await verifyFalSignature(req.headers, rawBody)
  if (!sigResult.ok) {
    console.error('[fal/webhook] Signature verification failed:', sigResult.reason, 'request_id:', requestId)
    return res.status(401).json({ error: `Unauthorized: ${sigResult.reason}` })
  }

  // Store result
  const stored = await storeResult(requestId, payload)

  console.log(`[fal/webhook] Received request_id=${requestId} status=${payload.status} store=${stored.store}`)

  // Always return 200 quickly — fal.ai retries on non-2xx
  return res.status(200).json({ ok: true, request_id: requestId, store: stored.store })
}

export const config = {
  api: {
    bodyParser: false, // need raw body for signature verification
  },
}
