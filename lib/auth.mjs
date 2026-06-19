// Internal authentication middleware for sensitive endpoints
// Verifies owner_admin role via Supabase session or internal token

export async function verifyOwnerAdmin(req) {
  // Check for internal Apex admin token (for server-to-server calls)
  const internalToken = req.headers['x-apex-admin-token']
  const expectedToken = process.env.APEX_ADMIN_TOKEN
  
  if (internalToken && expectedToken && internalToken === expectedToken) {
    return { authorized: true, method: 'internal-token', role: 'owner_admin' }
  }

  // Check for Supabase session
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
        
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (error || !user) {
          return { authorized: false, reason: 'Invalid or expired session' }
        }
        
        // Check user metadata for role
        const userRole = user.user_metadata?.role || user.app_metadata?.role
        
        if (userRole === 'owner_admin') {
          return { 
            authorized: true, 
            method: 'supabase-session', 
            role: 'owner_admin',
            userId: user.id,
            email: user.email
          }
        }
        
        return { 
          authorized: false, 
          reason: 'Insufficient permissions. Owner admin role required.',
          userId: user.id,
          role: userRole || 'unknown'
        }
      }
    } catch (error) {
      console.error('[auth] Supabase verification failed:', error.message)
      return { authorized: false, reason: 'Authentication service unavailable' }
    }
  }
  
  return { authorized: false, reason: 'No valid authentication provided' }
}

export function requireOwnerAdmin(handler) {
  return async (req, res) => {
    const auth = await verifyOwnerAdmin(req)
    
    if (!auth.authorized) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: auth.reason,
        required: 'owner_admin role',
      })
    }
    
    // Attach auth info to request for downstream use
    req.auth = auth
    return handler(req, res)
  }
}
