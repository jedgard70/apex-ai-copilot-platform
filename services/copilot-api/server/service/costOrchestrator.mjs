import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Supabase credentials not found. CostOrchestrator will run in dry-run mode.');
}

/**
 * Static pricing definitions for initial version.
 * Prices are in USD per 1M tokens or per unit.
 */
const PRICING = {
  gemini: {
    'gemini-2.0-flash': { prompt: 0.15, completion: 0.60 },
    'gemini-1.5-pro': { prompt: 3.50, completion: 10.50 },
    'default': { prompt: 0.15, completion: 0.60 }
  },
  fal: {
    'fal-ai/flux/schnell': { cost_per_image: 0.003 },
    'fal-ai/kling-video/v1/standard/text-to-video': { cost_per_sec: 0.05 },
    'default': { cost_per_unit: 0.01 }
  },
  elevenlabs: {
    'default': { cost_per_char: 0.00015 }
  }
};

/**
 * Fire-and-forget log function for token/API usage.
 * @param {string} tenantId - The UUID or ID of the tenant.
 * @param {string} provider - 'gemini', 'fal', 'elevenlabs'
 * @param {string} model - Specific model string e.g., 'gemini-2.0-flash'
 * @param {object} usageData - Usage metrics (promptTokens, completionTokens, durationSecs, units)
 */
export async function logUsage(tenantId, provider, model, usageData = {}) {
  try {
    let costUsd = 0;
    let tokensUsed = 0;
    
    const provPricing = PRICING[provider] || {};
    const modPricing = provPricing[model] || provPricing['default'];

    if (provider === 'gemini') {
      const promptTokens = usageData.promptTokens || 0;
      const completionTokens = usageData.completionTokens || 0;
      tokensUsed = promptTokens + completionTokens;
      
      costUsd = (promptTokens / 1000000) * (modPricing.prompt || 0) + 
                (completionTokens / 1000000) * (modPricing.completion || 0);
    } else if (provider === 'fal') {
      if (usageData.units) costUsd = usageData.units * (modPricing.cost_per_image || modPricing.cost_per_unit || 0);
      else if (usageData.durationSecs) costUsd = usageData.durationSecs * (modPricing.cost_per_sec || 0);
    } else if (provider === 'elevenlabs') {
      const chars = usageData.characters || 0;
      costUsd = chars * (modPricing.cost_per_char || 0);
    }

    // Skip extremely small fractions or zero usages if needed, but for tracking let's keep it.
    if (costUsd === 0) return;

    if (!supabase) {
      console.log(`[DRY-RUN] Cost recorded: ${tenantId} | ${provider} | ${model} | $${costUsd.toFixed(6)} | Tokens: ${tokensUsed}`);
      return;
    }

    const { error } = await supabase.from('tenant_ai_costs').insert({
      tenant_id: tenantId,
      provider: provider,
      model: model,
      cost_usd: costUsd,
      tokens_used: tokensUsed > 0 ? tokensUsed : null,
      duration_secs: usageData.durationSecs || null
    });

    if (error) {
      console.error('Erro ao salvar custos no Supabase:', error);
    }

  } catch (err) {
    console.error('Erro no CostOrchestrator:', err);
  }
}
