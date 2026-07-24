import * as Sentry from '@sentry/node'

const sentryDsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ''
const observabilityEnvironment = process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2')
const enabled = Boolean(sentryDsn) && !/^test$/i.test(String(observabilityEnvironment || ''))

if (enabled && !globalThis.__APEX_SERVER_OBSERVABILITY__) {
  Sentry.init({
    dsn: sentryDsn,
    enabled,
    environment: observabilityEnvironment,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.2,
    sendDefaultPii: false,
  })
  globalThis.__APEX_SERVER_OBSERVABILITY__ = true
}

function normalizeError(error) {
  if (error instanceof Error) return error
  return new Error(typeof error === 'string' ? error : JSON.stringify(error))
}

export function captureServerException(error, context = {}) {
  const normalized = normalizeError(error)
  if (enabled) {
    Sentry.captureException(normalized, {
      extra: context,
    })
  }
  return normalized
}

export async function flushObservability(timeout = 2000) {
  if (!enabled) return true
  return Sentry.flush(timeout)
}

export function isServerObservabilityEnabled() {
  return enabled
}

if (!globalThis.__APEX_SERVER_OBSERVABILITY_HANDLERS__) {
  process.on('unhandledRejection', reason => {
    console.error('UNHANDLED REJECTION:', reason)
    captureServerException(reason, { source: 'process.unhandledRejection' })
    process.exit(1)
  })

  process.on('uncaughtException', error => {
    console.error('UNCAUGHT EXCEPTION:', error)
    captureServerException(error, { source: 'process.uncaughtException' })
    process.exit(1)
  })

  globalThis.__APEX_SERVER_OBSERVABILITY_HANDLERS__ = true
}
