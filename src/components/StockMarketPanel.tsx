import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, X, Search, BarChart3, Bot, Settings, AlertTriangle, ShieldCheck, PlayCircle, StopCircle } from 'lucide-react';

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  error?: string;
};

export function StockMarketPanel({ onClear }: { onClear: () => void }) {
  const [activeTab, setActiveTab] = useState<'market' | 'bot'>('bot');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Bot State
  const [botStatus, setBotStatus] = useState<any>(null);
  const [setupCapital, setSetupCapital] = useState(10000);
  const [setupEquityGuard, setSetupEquityGuard] = useState(30);

  async function fetchBotStatus() {
    try {
      const res = await fetch('/api/stock/autotrader/status');
      if (res.ok) {
        const d = await res.json();
        setBotStatus(d.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchWatchlist() {
    setLoading(true);
    try {
      const res = await fetch('/api/stock/watchlist');
      const d = await res.json();
      if (d.quotes) setQuotes(d.quotes);
    } catch (err) {
      setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
    setLoading(true);
    try {
      await fetch('/api/stock/autotrader/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: setupCapital, balance: setupCapital, equityGuardPercent: setupEquityGuard })
      });
      await fetchBotStatus();
      alert('Configuração Quick Setup concluída com sucesso.');
    } catch (e) {
      alert('Erro: ' + e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/stock/autotrader/start', { method: 'POST' });
      const d = await res.json();
      if (d.error) alert('Erro: ' + d.error);
      await fetchBotStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await fetch('/api/stock/autotrader/stop', { method: 'POST' });
      await fetchBotStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(val: number) {
    return val?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00';
  }

  useEffect(() => {
    fetchWatchlist();
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex flex-col h-full bg-[#0a0f1c] text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#1e293b] bg-[#0f172a]">
        <div>
          <span className="text-[#38bdf8] text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
            <Bot size={14} /> Apex Algo Trader (Live)
          </span>
          <h2 className="text-lg font-bold mt-1">Terminal XP/Binance Pro</h2>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors" onClick={onClear}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b] bg-[#0f172a]">
        <button onClick={() => setActiveTab('bot')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'bot' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8]' : 'text-slate-500 hover:text-slate-300'}`}>
          🤖 AI Auto-Trader Bot
        </button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'market' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8]' : 'text-slate-500 hover:text-slate-300'}`}>
          📈 Market Watch
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'bot' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Status Panel */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase">Total Equity (Wallet Balance)</h3>
                  <div className="text-4xl font-bold font-mono text-white mt-1">{formatMoney(botStatus?.equity || 0)}</div>
                </div>
                <div className="text-right">
                  <h3 className="text-slate-400 text-xs font-bold uppercase">Unrealized PNL</h3>
                  <div className={`text-2xl font-bold font-mono mt-1 ${(botStatus?.pnl || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {(botStatus?.pnl || 0) >= 0 ? '+' : ''}{formatMoney(botStatus?.pnl || 0)} ({(botStatus?.pnlPercent || 0).toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-[#334155] pt-4">
                <div>
                  <p className="text-xs text-slate-400">Available Balance</p>
                  <p className="font-mono text-sm">{formatMoney(botStatus?.balance || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Starting Capital</p>
                  <p className="font-mono text-sm">{formatMoney(setupCapital)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Equity Guard %</p>
                  <p className="font-mono text-sm">{setupEquityGuard}%</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex space-x-4">
              <button onClick={handleSetup} disabled={loading} className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white font-bold py-2 px-4 rounded">
                Quick Setup
              </button>
              <button onClick={handleStart} disabled={loading} className="bg-[#10b981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded">
                Start Bot
              </button>
              <button onClick={handleStop} disabled={loading} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-2 px-4 rounded">
                Stop Bot
              </button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="contracts-table max-w-4xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Watchlist Yahoo Finance</h3>
              <button onClick={fetchWatchlist} className="text-slate-400 hover:text-white">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1e293b] border-b border-[#334155] text-slate-400">
                <tr>
                  <th className="p-3">Ticker</th>
                  <th className="p-3">Company/Token</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">24h Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {quotes.map(q => (
                  <tr key={q.symbol} className="hover:bg-[#334155]/30">
                    <td className="p-3 font-bold">{q.symbol}</td>
                    <td className="p-3 text-slate-400">{q.name}</td>
                    <td className="p-3 font-mono">
                      {q.price !== null ? q.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '---'}
                    </td>
                    <td className={`p-3 font-mono font-bold ${(q.change || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {(q.change || 0) >= 0 ? '+' : ''}{q.change?.toFixed(2)}% ({q.changePercent?.toFixed(2)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
