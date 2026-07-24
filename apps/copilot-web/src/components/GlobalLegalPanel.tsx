import { useEffect, useState } from 'react';
import { Scale, FileText, AlertTriangle, RefreshCw, CheckCircle, Plus, BrainCircuit } from 'lucide-react';
import { PremiumPanelLayout } from './PremiumPanelLayout';

type GlobalLegalPanelProps = {
  onClear: () => void;
};

export function GlobalLegalPanel({ onClear }: GlobalLegalPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for AI test
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

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

  const handleAIGenerate = async (sector: string) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/copilot/contracts-permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'Non-Disclosure Agreement',
          sector: sector,
          context: 'A contractor is going to build a high-end residential project in Miami. We need an NDA to protect the architectural plans and the client\'s identity.'
        })
      });
      const json = await res.json();
      setAiResult(json);
    } catch (e) {
      alert('AI Generation error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PremiumPanelLayout
      icon={<Scale className="w-5 h-5 text-indigo-400" />}
      title="Global Legal & Due Diligence"
      subtitle="Gerenciamento de contratos"
      onClose={onClear}
    >
      <div className="flex flex-col gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Compliance Hub</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAIGenerate('legal-construction')}
              disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs transition-colors disabled:opacity-50"
            >
              <BrainCircuit className={`w-3 h-3 ${aiLoading ? 'animate-pulse' : ''}`} />
              Test AI Gen
            </button>
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

        {!loading && data && !aiResult && (
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

        {/* AI TEST RESULT OVERLAY */}
        {aiResult && (
          <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-amber-400 font-semibold flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" /> AI Generator Result
                </h3>
                <button onClick={() => setAiResult(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
              </div>
              <div className="text-xs text-slate-300">
                <strong>Sector:</strong> {aiResult.sector} <br/>
                <strong>Doc:</strong> {aiResult.documentType}
              </div>
              
              {aiResult.analysis && (
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-sm font-medium text-white">{aiResult.analysis.title}</p>
                  <p className="text-xs text-slate-400">{aiResult.analysis.summary}</p>
                  
                  {aiResult.analysis.riskAnalysis?.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-red-400 text-xs">Risk Analysis:</strong>
                      <ul className="list-disc pl-4 mt-1 text-xs text-slate-300">
                        {aiResult.analysis.riskAnalysis.map((r: any, i: number) => (
                          <li key={i}>[{r.severity}] {r.issue} - {r.recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.analysis.suggestedClauses?.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-indigo-400 text-xs">Suggested Clauses:</strong>
                      <div className="flex flex-col gap-2 mt-1">
                        {aiResult.analysis.suggestedClauses.map((c: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-900 rounded border border-slate-700 text-xs">
                            <strong className="text-white">{c.title}</strong>
                            <p className="mt-1 font-mono text-slate-300">{c.content}</p>
                            <p className="mt-1 text-slate-500 italic">{c.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </PremiumPanelLayout>
  );
}
