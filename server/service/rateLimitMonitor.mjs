/**
 * server/service/rateLimitMonitor.mjs
 *
 * Rate Limit Monitoring + Alerting.
 * Tracks HTTP 429 responses per provider and issues alerts.
 * Ring buffer: last 200 rate limit events.
 * Alert methods: console.warn (always), webhook (if configured).
 */

const MAX_EVENTS = 200
const events = []

// Track consecutive rate limit hits per provider to avoid alert fatigue
const CONSECUTIVE_RESET_MS = 5 * 60 * 1000 // 5 min
const consecutiveHits = new Map()

/**
 * Record a rate limit event for a provider.
 * @param {{ provider: string, model?: string, endpoint?: string, statusCode?: number, message?: string }} entry
 */
export function recordRateLimit({ provider, model, endpoint, statusCode = 429, message }) {
  const now = Date.now()
  events.push({
    provider: String(provider || 'unknown'),
    model: String(model || 'unknown'),
    endpoint: String(endpoint || 'unknown'),
    statusCode,
    message: message ? String(message).slice(0, 200) : null,
    timestamp: now,
  })
  while (events.length > MAX_EVENTS) events.shift()

  // Track consecutive hits
  const key = `${provider}|${model || 'default'}`
  const last = consecutiveHits.get(key)
  if (last && (now - last.lastHit) < CONSECUTIVE_RESET_MS) {
    consecutiveHits.set(key, { count: last.count + 1, lastHit: now, alerted: last.alerted })
  } else {
    consecutiveHits.set(key, { count: 1, lastHit: now, alerted: false })
  }

  const hitInfo = consecutiveHits.get(key)

  // Alert if this is the 1st, 3rd, or 10th consecutive hit
  if (hitInfo.count === 1 || hitInfo.count === 3 || hitInfo.count === 10 || hitInfo.count % 20 === 0) {
    hitInfo.alerted = true
    const providers = getAlertProviders()
    const alertMsg = `[RATE LIMIT ALERT] ${provider}${model ? '/' + model : ''}: ${hitInfo.count}x consecutive 429 in 5min window. ${message || ''}`
    console.warn(alertMsg)

    // Webhook alert if configured
    if (providers.webhookUrl && providers.enabled) {
      sendWebhookAlert({ type: 'rate_limit', provider, model, consecutive: hitInfo.count, message, timestamp: now })
        .catch(() => {}) // fire-and-forget
    }
  }
}

/**
 * Get recent rate limit events.
 * @param {number} windowMinutes
 * @returns {{ events: Array, stats: Object }}
 */
export function getRateLimitEvents(windowMinutes = 60) {
  const cutoff = Date.now() - windowMinutes * 60_000
  const recent = events.filter(e => e.timestamp >= cutoff)

  const byProvider = {}
  for (const e of recent) {
    byProvider[e.provider] = (byProvider[e.provider] || 0) + 1
  }

  return {
    events: recent.slice(-50), // last 50 in window
    stats: {
      totalEvents: recent.length,
      windowMinutes,
      byProvider: Object.entries(byProvider)
        .map(([provider, count]) => ({ provider, count }))
        .sort((a, b) => b.count - a.count),
      recentConsecutive: [...consecutiveHits.entries()]
        .filter(([, v]) => v.count > 0 && (Date.now() - v.lastHit) < CONSECUTIVE_RESET_MS)
        .map(([key, val]) => {
          const [provider, model] = key.split('|')
          return { provider, model: model === 'default' ? null : model, consecutiveHits: val.count }
        }),
    },
    rawCount: events.length,
  }
}

// ─── Webhook alert ───────────────────────────────────────────────────────────

function getAlertProviders() {
  return {
    webhookUrl: process.env.RATE_LIMIT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || null,
    enabled: String(process.env.RATE_LIMIT_ALERTS ?? '1') !== '0',
  }
}

async function sendWebhookAlert(payload) {
  const url = getAlertProviders().webhookUrl
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, source: 'apex-rate-limit-monitor', timestamp: new Date().toISOString() }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
}
