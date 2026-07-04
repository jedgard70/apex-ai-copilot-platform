/**
 * server/middleware/keyRestriction.mjs
 *
 * API Key Restriction Middleware — IP/website origin binding.
 * Blocks requests that don't match the configured allowed origins/IPs.
 *
 * Configure via env vars:
 *   ALLOWED_ORIGINS=comma,separated,list   (e.g., https://apexglobalai.com,http://localhost:4173)
 *   ALLOWED_IPS=comma,separated,list        (e.g., 192.168.1.100,10.0.0.0/24)
 *
 * Bypass with header: X-Apex-Internal: <INTERNAL_TOKEN>
 * The internal token is read from env APEX_INTERNAL_TOKEN.
 */

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
)

const ALLOWED_IPS = (process.env.ALLOWED_IPS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const INTERNAL_TOKEN = process.env.APEX_INTERNAL_TOKEN || ''

// Default allowed origins when none configured
const DEFAULT_ORIGINS = new Set([
  'https://www.apexglobalai.com',
  'https://apexglobalai.com',
  'https://apex-ai-copilot-platform.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:4175',
  'http://localhost:4176',
  'http://localhost:4177',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:4175',
  'http://127.0.0.1:5173',
])

function getActiveOrigins() {
  return ALLOWED_ORIGINS.size > 0 ? ALLOWED_ORIGINS : DEFAULT_ORIGINS
}

function ipInCIDR(ip, cidr) {
  if (!cidr.includes('/')) return ip === cidr
  const [range, bits] = cidr.split('/')
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1)
  const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0)
  const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0)
  return (ipNum & mask) === (rangeNum & mask)
}

function isAllowedIP(ip) {
  if (!ip || ALLOWED_IPS.length === 0) return true // no IP restriction = allow all
  return ALLOWED_IPS.some(cidr => ipInCIDR(ip, cidr))
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || ''
}

/**
 * Express-style middleware to validate request origin/IP.
 * Call before processing API requests that use provider keys.
 */
export function keyRestrictionMiddleware(req, res, next) {
  // Internal token bypass
  const reqToken = req.headers['x-apex-internal'] || req.headers['x-internal-token'] || ''
  if (INTERNAL_TOKEN && reqToken === INTERNAL_TOKEN) {
    return next()
  }

  // Check IP
  const clientIP = getClientIP(req)
  if (!isAllowedIP(clientIP)) {
    return res.status(403).json({
      error: 'access_denied',
      message: 'Your IP is not authorized to use this API.',
    })
  }

  // Check Origin (for browser requests)
  const origin = (req.headers['origin'] || req.headers['referer'] || '').toLowerCase().replace(/\/+$/, '')
  if (origin) {
    const allowedOrigins = getActiveOrigins()
    const isAllowed = [...allowedOrigins].some(allowed =>
      origin === allowed.toLowerCase().replace(/\/+$/, '')
      || origin.startsWith(allowed.toLowerCase().replace(/\/+$/, '') + '/')
    )
    if (!isAllowed) {
      return res.status(403).json({
        error: 'origin_denied',
        message: `Origin "${origin}" is not authorized.`,
      })
    }
  }

  next()
}

/**
 * Validate a specific origin against the allowed list.
 * Returns { allowed: boolean, reason?: string }.
 */
export function validateOrigin(origin) {
  if (!origin) return { allowed: true } // no origin = skip check (non-browser)
  const cleaned = origin.toLowerCase().replace(/\/+$/, '')
  const allowedOrigins = getActiveOrigins()
  const isAllowed = [...allowedOrigins].some(allowed =>
    cleaned === allowed.toLowerCase().replace(/\/+$/, '')
    || cleaned.startsWith(allowed.toLowerCase().replace(/\/+$/, '') + '/')
  )
  if (isAllowed) return { allowed: true }
  return { allowed: false, reason: `Origin "${origin}" is not in the allowed list.` }
}

/**
 * Get configuration summary (for status/display purposes).
 */
export function getKeyRestrictionConfig() {
  return {
    allowedOrigins: [...getActiveOrigins()],
    allowedIPs: ALLOWED_IPS.length > 0 ? ALLOWED_IPS : ['all (no IP restriction)'],
    internalTokenConfigured: Boolean(INTERNAL_TOKEN),
    defaultOrigins: ALLOWED_ORIGINS.size === 0,
  }
}