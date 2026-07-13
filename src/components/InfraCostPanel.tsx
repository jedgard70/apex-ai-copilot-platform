import React, { useEffect, useState } from 'react';
import { Server, Activity, Database, CloudLightning, DollarSign, ActivitySquare } from 'lucide-react';

export function InfraCostPanel() {
  const session = { tenant_id: 'demo-tenant', role: 'admin' };
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      const identity = {
        tenantId: session?.tenant_id || 'demo-tenant',
        role: session?.role || 'user'
      };

      const res = await fetch('http://localhost:3000/api/copilot/infra', {
        headers: {
          'x-apex-identity': JSON.stringify(identity)
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to load infra metrics');
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error loading infra metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="flex-1 bg-black text-slate-100 flex flex-col relative min-h-0 overflow-hidden font-sans pt-16">
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10" />

      <div className="flex items-center gap-3 px-8 py-6 border-b border-white/10 shrink-0 bg-black/50 backdrop-blur-md">
        <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <Server className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            IT Cost & Infra Orchestrator
          </h1>
          <p className="text-sm text-slate-400">
            Monitoramento de custos de IA e orquestração de recursos (Módulo 66)
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-medium">Custo Total de IA (SaaS)</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            {loading && !metrics ? (
              <div className="animate-pulse h-8 bg-slate-800 rounded w-1/2"></div>
            ) : (
              <div className="text-3xl font-bold text-white">
                ${metrics?.total_usd?.toFixed(4) || '0.0000'}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Mês Atual</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-medium">Uso de Tokens (Gemini)</span>
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            {loading && !metrics ? (
              <div className="animate-pulse h-8 bg-slate-800 rounded w-1/2"></div>
            ) : (
              <div className="text-3xl font-bold text-white">
                {metrics?.providers?.gemini?.tokens?.toLocaleString() || 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Processados no período</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-medium">Chamadas de API</span>
              <CloudLightning className="w-5 h-5 text-cyan-400" />
            </div>
            {loading && !metrics ? (
              <div className="animate-pulse h-8 bg-slate-800 rounded w-1/2"></div>
            ) : (
              <div className="text-3xl font-bold text-white">
                {((metrics?.providers?.gemini?.calls || 0) + (metrics?.providers?.fal?.calls || 0))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Requisições bem-sucedidas</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <ActivitySquare className="w-4 h-4 text-blue-400" />
              Detalhamento por Provedor
            </h2>
            <button 
              onClick={fetchMetrics}
              disabled={loading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Provedor</th>
                  <th className="px-6 py-3 font-medium">Consumo (Tokens/Unids)</th>
                  <th className="px-6 py-3 font-medium">Custo Estimado</th>
                  <th className="px-6 py-3 font-medium">Requisições</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {error && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-red-400 bg-red-500/5">
                      {error}
                    </td>
                  </tr>
                )}
                {!error && metrics?.providers && Object.entries(metrics.providers).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Nenhum dado de uso registrado para este tenant.
                    </td>
                  </tr>
                )}
                {!error && metrics?.providers && Object.entries(metrics.providers).map(([provider, data]: [string, any]) => (
                  <tr key={provider} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium capitalize text-white flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${provider === 'gemini' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                      {provider}
                    </td>
                    <td className="px-6 py-4 font-mono">{data.tokens?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400">${data.usd?.toFixed(4)}</td>
                    <td className="px-6 py-4">{data.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
