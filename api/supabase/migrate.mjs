import { requireOwnerAdmin } from '../../../lib/auth.mjs'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = process.env.SUPABASE_PROJECT_REF
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const dbUrl = process.env.SUPABASE_DB_URL

  if (!accessToken || !projectRef) {
    return res.status(500).json({ 
      error: 'SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF not configured' 
    })
  }

  try {
    const { sql, migrationName } = req.body || {}

    if (!sql) {
      return res.status(400).json({ error: 'SQL content is required' })
    }

    // Primary: Supabase Management API (most reliable for DDL/DML)
    const mgmtResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    )

    if (mgmtResponse.ok) {
      const result = await mgmtResponse.json()
      return res.status(200).json({
        success: true,
        migrationName: migrationName || 'unnamed',
        method: 'management-api',
        projectRef,
        result,
        authenticatedAs: req.auth.email || req.auth.userId || 'internal',
      })
    }

    // Fallback: try via REST API with anon key if management API fails
    if (supabaseUrl) {
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      if (anonKey) {
        const restResponse = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({ query: sql }),
        })

        if (restResponse.ok) {
          const result = await restResponse.json()
          return res.status(200).json({
            success: true,
            migrationName: migrationName || 'unnamed',
            method: 'rest-api',
            result,
            authenticatedAs: req.auth.email || req.auth.userId || 'internal',
          })
        }
      }
    }

    // All methods failed — return the management API error
    const errorText = await mgmtResponse.text()
    return res.status(mgmtResponse.status).json({ 
      error: 'Migration failed',
      method: 'management-api',
      projectRef,
      details: errorText,
    })

  } catch (error) {
    console.error('Supabase migration error:', error)
    return res.status(500).json({ 
      error: 'Migration failed', 
      message: error.message 
    })
  }
}

export default requireOwnerAdmin(handler)
