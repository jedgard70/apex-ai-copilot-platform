import { createClient } from '@supabase/supabase-js';

let IS_SUPABASE = false;
let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return true;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      IS_SUPABASE = true;
      return true;
    } catch (e) {
      console.warn('[Legal] Error init Supabase:', e.message);
    }
  }
  return false;
}

export async function fetchContracts(tenantId = 'default_tenant') {
  if (!initSupabase()) {
    return { error: 'Database Not Configured: Supabase credentials missing.', data: [] };
  }
  
  try {
    const { data, error } = await supabaseClient.from('legal_contracts').select('*').eq('tenantId', tenantId);
    if (error) {
      if (error.code === '42P01') {
        // relation does not exist - fallback return empty array gracefully
        return { data: [], warning: 'Table legal_contracts does not exist yet.' };
      }
      throw error;
    }
    return { data };
  } catch (e) {
    return { error: e.message, data: [] };
  }
}

export async function fetchDueDiligenceStatus(tenantId = 'default_tenant') {
  if (!initSupabase()) {
    return { error: 'Database Not Configured.', data: [] };
  }
  
  try {
    const { data, error } = await supabaseClient.from('due_diligence').select('*').eq('tenantId', tenantId);
    if (error) {
      if (error.code === '42P01') {
        return { data: [], warning: 'Table due_diligence does not exist yet.' };
      }
      throw error;
    }
    return { data };
  } catch (e) {
    return { error: e.message, data: [] };
  }
}

export async function recordContract(payload) {
  if (!initSupabase()) {
    return { error: 'Database Not Configured: Supabase credentials missing.' };
  }
  
  const newRecord = {
    id: `contract-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    tenantId: payload.tenantId || 'default_tenant',
    title: payload.title,
    type: payload.type || 'NDA',
    status: payload.status || 'PENDING_REVIEW',
    parties: payload.parties || [],
    created_at: new Date().toISOString()
  };
  
  try {
    const { error } = await supabaseClient.from('legal_contracts').insert([newRecord]);
    if (error) {
       // Just return the memory object if table is missing for demo/fallback purposes
       if (error.code === '42P01') return { record: newRecord, warning: 'Simulated memory persistence. Table missing.' };
       throw error;
    }
    return { record: newRecord };
  } catch (e) {
    return { error: e.message };
  }
}

export async function getGlobalLegalDashboard(tenantId = 'default_tenant') {
  const contractsRes = await fetchContracts(tenantId);
  const dueDiligenceRes = await fetchDueDiligenceStatus(tenantId);
  
  const contracts = contractsRes.data || [];
  const dueDiligence = dueDiligenceRes.data || [];
  
  const metrics = {
    totalContracts: contracts.length,
    activeNDAs: contracts.filter(c => c.type === 'NDA' && c.status === 'ACTIVE').length,
    pendingReviews: contracts.filter(c => c.status === 'PENDING_REVIEW').length,
    criticalAudits: dueDiligence.filter(d => d.riskLevel === 'CRITICAL').length
  };

  return {
    providerStatus: IS_SUPABASE ? 'connected' : 'not_configured',
    warnings: [contractsRes.warning, dueDiligenceRes.warning].filter(Boolean),
    errors: [contractsRes.error, dueDiligenceRes.error].filter(Boolean),
    metrics,
    recentContracts: contracts.slice(0, 5),
    dueDiligenceFlags: dueDiligence
  };
}
