declare module '@auth0/auth0-react' {
  export function useAuth0(): any
  export const Auth0Provider: any
}

declare module '@supabase/supabase-js' {
  export type User = any
  export type SupabaseClient = any
  export function createClient(...args: any[]): any
}

declare module 'firebase/app' {
  export function initializeApp(config: any): any
}

declare module 'firebase/analytics' {
  export function getAnalytics(app: any): any
}

declare module 'firebase/auth' {
  export function getAuth(app: any): any
}

declare module 'firebase/firestore' {
  export function getFirestore(app: any): any
}
