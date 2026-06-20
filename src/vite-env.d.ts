/// <reference types="vite/client" />

declare module 'lucide-react';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly GOOGLE_OAUTH_STATUS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
