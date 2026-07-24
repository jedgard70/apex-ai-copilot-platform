/**
 * server/service/securityAudit.mjs
 *
 * Security Audit Logging — records API key access events.
 * Tracks: timestamp, provider, action, origin, IP, identity, success/failure.
 * Ring buffer: last 1000 events.
 * Can be extended to write to a file or external service.
 */

const MAX_RECORDS = 1000
const records = []

/**
 * Record a security audit event.
 * @param {Object} entry
 * @param {string} entry.provider - Provider name (e.g., 'openai', 'gemini', 'supabase')
 * @param {string} entry.action - Action performed (e.g., 'chat', 'models_list', 'image_gen', 'search')
 * @param {boolean} entry.success - Whether the operation succeeded
 * @param {string} [entry.origin] - Request origin header
 * @param {string} [entry.ip] - Client IP
 * @param {string} [entry.identity] - User identity if available
 * @param {string} [entry.model] - Model used
 * @param {string} [entry.error] - Error message if failed
 * @param {number} [entry.latencyMs] - Operation latency
 */
export function recordAuditEvent({ provider, action, success, origin, ip, identity, model, error, latencyMs }) {
  records.push({
    provider: String(provider || 'unknown'),
    action: String(action || 'unknown'),
    success: Boolean(success),
    origin: origin ? String(origin).slice(0, 200) : null,
    ip: ip ? String(ip).slice(0, 45) : null,
    identity: identity ? String(identity).slice(0, 100) : null,
    model: model ? String(model).slice(0, 100) : null,
    error: error ? String(error).slice(0, 300) : null,
    latencyMs: Number(latencyMs) || null,
    timestamp: Date.now(),
  })
  while (records.length > MAX_RECORDS) records.shift()
}

/**
 * Query audit log.
 * @param {Object} filters
 * @param {number} [filters.windowMinutes] - Lookback window
 * @param {string} [filters.provider] - Filter by provider
 * @param {string} [filters.action] - Filter by action
 * @param {boolean} [filters.failuresOnly] - Show only failures
 * @param {number} [filters.limit] - Max results
 * @returns {{ events: Array, stats: Object }}
 */
export function queryAuditLog(filters = {}) {
  const { windowMinutes = 60, provider, action, failuresOnly = false, limit = 100 } = filters
  const cutoff = Date.now() - windowMinutes * 60_000

  let filtered = records.filter(r => r.timestamp >= cutoff)
  if (provider) filtered = filtered.filter(r => r.provider === provider)
  if (action) filtered = filtered.filter(r => r.action === action)
  if (failuresOnly) filtered = filtered.filter(r => !r.success)

  filtered = filtered.slice(-limit)

  // Stats
  const totalInWindow = records.filter(r => r.timestamp >= cutoff).length
  const failures = records.filter(r => r.timestamp >= cutoff && !r.success).length
  const byProvider = {}
  for (const r of filtered) {
    byProvider[r.provider] = (byProvider[r.provider] || 0) + 1
  }

  return {
    events: filtered.map(r => ({ ...r, timestamp: new Date(r.timestamp).toISOString() })),
    stats: {
      totalInWindow,
      failures,
      successRate: totalInWindow > 0 ? Math.round(((totalInWindow - failures) / totalInWindow) * 100) : 100,
      byProvider: Object.entries(byProvider)
        .map(([prov, cnt]) => ({ provider: prov, count: cnt }))
        .sort((a, b) => b.count - a.count),
    },
    rawCount: records.length,
  }
}

/**
 * Get audit config status.
 */
export function getAuditConfig() {
  return {
    enabled: true,
    maxRecords: MAX_RECORDS,
    currentRecords: records.length,
    persistence: 'memory-only', // Data resets on restart
  }
}
