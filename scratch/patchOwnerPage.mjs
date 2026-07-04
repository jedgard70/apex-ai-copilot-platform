import fs from 'fs';

let c = fs.readFileSync('src/components/OwnerPage.tsx', 'utf8');

const importStr = "import { getBrowserSupabaseClient } from '../lib/supabaseClient';\n";
const lastImportIdx = c.lastIndexOf('import ');
const nextLineIdx = c.indexOf('\n', lastImportIdx) + 1;
c = c.slice(0, nextLineIdx) + importStr + c.slice(nextLineIdx);

const refreshFunctionReplacement = `
  const refresh = useCallback(async () => {
    try {
      const { client: supabase } = getBrowserSupabaseClient();
      
      const [psRes, klRes] = await Promise.all([
        fetch('/api/copilot/provider-status'),
        fetch('/api/copilot/key-lifecycle')
      ]);

      if (psRes.ok) {
        const d = await psRes.json();
        setProviders(d.providers || []);
      }
      if (klRes.ok) {
        const d = await klRes.json();
        setKeyLifecycle(d.keys || []);
      }

      if (supabase) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // Fetch AI Usage
        const { data: usageData } = await supabase
          .from('ai_usage_records')
          .select('*')
          .gte('created_at', oneDayAgo);
          
        if (usageData) {
          const providerMap: Record<string, AnalyticsProvider> = {};
          let totalCalls = 0;
          let successfulCalls = 0;
          let totalLatency = 0;
          let latencyCount = 0;
          
          for (const row of usageData) {
            const p = row.provider || 'unknown';
            if (!providerMap[p]) {
              providerMap[p] = { provider: p, calls: 0, successRate: 0, avgLatencyMs: 0, totalTokensIn: 0, totalTokensOut: 0, estimatedCost: 0, modelCount: 0, models: [] };
            }
            
            providerMap[p].calls++;
            totalCalls++;
            
            if (row.success) {
              providerMap[p].successRate++; // temp store successes
              successfulCalls++;
            }
            
            if (row.duration_ms) {
              providerMap[p].avgLatencyMs += row.duration_ms;
              totalLatency += row.duration_ms;
              latencyCount++;
            }
            
            if (row.tokens_in) providerMap[p].totalTokensIn += row.tokens_in;
            if (row.tokens_out) providerMap[p].totalTokensOut += row.tokens_out;
            if (row.cost_usd) providerMap[p].estimatedCost! += row.cost_usd;
            
            if (row.model && !providerMap[p].models!.includes(row.model)) {
              providerMap[p].models!.push(row.model);
            }
          }
          
          const providersList = Object.values(providerMap).map(p => {
            return {
              ...p,
              successRate: p.calls > 0 ? Math.round((p.successRate / p.calls) * 100) : 0,
              avgLatencyMs: p.calls > 0 ? Math.round(p.avgLatencyMs / p.calls) : 0,
              modelCount: p.models!.length
            };
          });
          
          setAnalytics({
            providers: providersList,
            summary: {
              totalCalls,
              successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
              avgLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
              windowMinutes: 1440
            }
          });
        }
      } else {
        // Mock fallback if supabase not configured
        setAnalytics({
          providers: [],
          summary: { totalCalls: 0, successRate: 0, avgLatencyMs: 0, windowMinutes: 1440 }
        })
      }
    } catch { /* silent */ }
  }, [])
`;

const oldRefreshRegex = /const refresh = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\)/;
c = c.replace(oldRefreshRegex, refreshFunctionReplacement.trim());

fs.writeFileSync('src/components/OwnerPage.tsx', c);
