import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-apex-identity');

  if (req.method === 'OPTIONS') {
    return res.writeHead(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const identity = JSON.parse(req.headers['x-apex-identity'] || '{}');
  const tenantId = identity.tenantId;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required for infrastructure metrics.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Supabase credentials not configured.',
      demo_mode: true,
      metrics: {
        total_usd: 0.05,
        providers: { gemini: { usd: 0.05, tokens: 450 } }
      }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Only return data for the requested tenant
    const { data, error } = await supabase
      .from('tenant_ai_costs')
      .select('provider, model, cost_usd, tokens_used, duration_secs')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    let totalUsd = 0;
    const providers = {};

    for (const row of data || []) {
      totalUsd += Number(row.cost_usd || 0);
      
      if (!providers[row.provider]) {
        providers[row.provider] = { usd: 0, tokens: 0, calls: 0 };
      }
      
      providers[row.provider].usd += Number(row.cost_usd || 0);
      providers[row.provider].tokens += Number(row.tokens_used || 0);
      providers[row.provider].calls += 1;
    }

    return res.status(200).json({
      metrics: {
        total_usd: totalUsd,
        providers
      }
    });
  } catch (err) {
    console.error('Error fetching infra metrics:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
