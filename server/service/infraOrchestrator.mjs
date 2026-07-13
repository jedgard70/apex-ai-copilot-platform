import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Orchestrator to aggregate AI and Infrastructure costs for a tenant.
 */
export async function getTenantInfraCosts(tenantId) {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const result = {
    tenantId,
    totalAiUsd: 0,
    totalInfraUsd: 0,
    grandTotalUsd: 0,
    aiProviders: {},
    infraMetrics: {
      vercel: { bandwidthGb: 0, requests: 0, costUsd: 0 },
      supabase: { databaseGb: 0, egressGb: 0, costUsd: 0 }
    }
  };

  // 1. Fetch AI Costs from DB
  if (supabase) {
    const { data, error } = await supabase
      .from('tenant_ai_costs')
      .select('provider, cost_usd, tokens_used')
      .eq('tenant_id', tenantId);

    if (!error && data) {
      for (const row of data) {
        result.totalAiUsd += Number(row.cost_usd || 0);
        
        if (!result.aiProviders[row.provider]) {
          result.aiProviders[row.provider] = { usd: 0, tokens: 0, calls: 0 };
        }
        
        result.aiProviders[row.provider].usd += Number(row.cost_usd || 0);
        result.aiProviders[row.provider].tokens += Number(row.tokens_used || 0);
        result.aiProviders[row.provider].calls += 1;
      }
    }
  }

  // 2. Fetch Infra Costs (Vercel/Supabase Management APIs)
  // In a real multi-tenant SaaS, infra usage per tenant is either measured by custom telemetry 
  // or estimated based on proportional AI/app usage if resources are shared.
  // Here we allocate a baseline infra cost + proportional AI cost.
  
  // Example baseline allocation
  const baseVercelCost = 0.50; // $0.50 per active tenant
  const baseSupabaseCost = 0.20; // $0.20 per active tenant
  
  // Proportional allocation based on AI calls (more AI calls = more bandwidth/db ops)
  const totalCalls = Object.values(result.aiProviders).reduce((sum, p) => sum + p.calls, 0);
  
  result.infraMetrics.vercel.costUsd = baseVercelCost + (totalCalls * 0.001);
  result.infraMetrics.vercel.bandwidthGb = totalCalls * 0.005;
  result.infraMetrics.vercel.requests = totalCalls * 5;

  result.infraMetrics.supabase.costUsd = baseSupabaseCost + (totalCalls * 0.002);
  result.infraMetrics.supabase.databaseGb = 0.1 + (totalCalls * 0.001);
  
  result.totalInfraUsd = result.infraMetrics.vercel.costUsd + result.infraMetrics.supabase.costUsd;
  result.grandTotalUsd = result.totalAiUsd + result.totalInfraUsd;

  return result;
}
