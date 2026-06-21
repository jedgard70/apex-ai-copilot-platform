/// <reference types="vite/client" />

declare module 'lucide-react';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_VSL_PRIMARY_CTA_URL?: string
  readonly GOOGLE_OAUTH_STATUS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
