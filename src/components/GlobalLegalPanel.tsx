import { useEffect, useState } from 'react';
import { Scale, FileText, AlertTriangle, RefreshCw, CheckCircle, Plus } from 'lucide-react';
import { PremiumPanelLayout } from './PremiumPanelLayout';

type GlobalLegalPanelProps = {
  onClear: () => void;
};

export function GlobalLegalPanel({ onClear }: GlobalLegalPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/copilot/legal');
      if (!res.ok) {
        throw new Error(`Erro na API: ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      }
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSimulateNDA = async () => {
    try {
      const res = await fetch('/api/copilot/legal', {
        method: 'POST',
        body: JSON.stringify({
          action: 'record_contract',
          title: `NDA Parceiro ${Math.floor(Math.random() * 1000)}`,
          type: 'NDA',
          status: 'PENDING_REVIEW'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchDashboard();
      } else {
        alert('Erro ao criar NDA: ' + json.error);
      }
    } catch (e) {
      alert('Erro de rede.');
    }
  };

  return (
    <PremiumPanelLayout
      icon={<Scale className="w-5 h-5 text-indigo-400" />}
      title="Global Legal & Due Diligence"
      onClose={onClear}
      gradient="from-indigo-500/20 to-purple-500/10"
    >
      <div className="flex flex-col gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Compliance Hub</p>
          <div className="flex gap-2">
            <button
              onClick={handleSimulateNDA}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              New NDA
            </button>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Scale className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        )}

        {!loading && data && (
          <div className="flex flex-col gap-4">
            
            {data.providerStatus === 'not_configured' && (
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-md text-xs flex items-center gap-2 text-slate-300">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Supabase credentials missing. Operating in read-only / simulation mode.
              </div>
            )}
            
            {data.warnings && data.warnings.length > 0 && data.warnings.map((warn: string, i: number) => (
              <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-200/90 text-xs flex flex-col gap-1">
                 <span className="font-semibold text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Hybrid Fallback Warning</span>
                 {warn}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg flex flex-col gap-1">
                <span className="text-xs text-slate-400">Total Contracts</span>
                <span className="text-xl font-bold text-white">{data.metrics?.totalContracts || 0}</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg flex flex-col gap-1">
                <span className="text-xs text-slate-400">Pending Reviews</span>
                <span className="text-xl font-bold text-yellow-400">{data.metrics?.pendingReviews || 0}</span>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400"/> Recent Contracts</h4>
              {data.recentContracts && data.recentContracts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {data.recentContracts.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800 text-xs">
                      <span className="text-slate-300 font-medium">{c.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No contracts found.</p>
              )}
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Due Diligence Alerts</h4>
              <div className="text-xs text-slate-400">
                {data.metrics?.criticalAudits > 0 
                  ? <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {data.metrics.criticalAudits} Critical audits require attention.</span>
                  : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> All clear. No critical risks detected.</span>
                }
              </div>
            </div>

          </div>
        )}
      </div>
    </PremiumPanelLayout>
  );
}
