import * as Sentry from '@sentry/react'

declare global {
  interface Window {
    __APEX_OBSERVABILITY_INITIALIZED__?: boolean
  }
}

const dsn = import.meta.env.VITE_SENTRY_DSN || ''
const enabled = Boolean(dsn) && import.meta.env.MODE !== 'test'
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.2')

if (enabled && typeof window !== 'undefined' && !window.__APEX_OBSERVABILITY_INITIALIZED__) {
  Sentry.init({
    dsn,
    enabled,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.2,
    sendDefaultPii: false,
  })

  window.__APEX_OBSERVABILITY_INITIALIZED__ = true
}

export function isFrontendObservabilityEnabled() {
  return enabled
}
