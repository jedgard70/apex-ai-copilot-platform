import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, X, Search, BarChart3, Bot, Settings, AlertTriangle, ShieldCheck, PlayCircle, StopCircle } from 'lucide-react'

type Quote = { symbol: string; name: string; price: number | null; change: number | null; changePercent: number | null; currency: string; error?: string }

export function StockMarketPanel({ onClear }: { onClear: () => void }) {
  const [activeTab, setActiveTab] = useState<'market'|'bot'>('bot')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Bot State
  const [botStatus, setBotStatus] = useState<any>(null)
  const [setupCapital, setSetupCapital] = useState(10000)
  const [setupEquityGuard, setSetupEquityGuard] = useState(30)

  async function fetchBotStatus() {
    try {
      const res = await fetch('/api/stock/autotrader/status')
      if (res.ok) {
        const d = await res.json()
        setBotStatus(d.data)
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchWatchlist()
    fetchBotStatus()
    const interval = setInterval(fetchBotStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchWatchlist() {
    setLoading(true)
    try {
      const res = await fetch('/api/stock/watchlist')
      const d = await res.json()
      if (d.quotes) setQuotes(d.quotes)
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function handleSetup() {
    setLoading(true)
    try {
      await fetch('/api/stock/autotrader/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: setupCapital, balance: setupCapital, equityGuardPercent: setupEquityGuard })
      })
      await fetchBotStatus()
      alert('Configuração Quick Setup concluída com sucesso.')
    } catch (e) { alert('Erro: ' + e) }
    finally { setLoading(false) }
  }

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/stock/autotrader/start', { method: 'POST' })
      const d = await res.json()
      if (d.error) alert('Erro: ' + d.error)
      await fetchBotStatus()
    } catch (e) {}
    finally { setLoading(false) }
  }

  async function handleStop() {
    setLoading(true)
    try {
      await fetch('/api/stock/autotrader/stop', { method: 'POST' })
      await fetchBotStatus()
    } catch (e) {}
    finally { setLoading(false) }
  }

  function formatMoney(val: number) {
    return val?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'
  }

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
        <button className="text-slate-400 hover:text-white transition-colors" onClick={onClear}><X size={20} /></button>
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
                  <div className="text-4xl font-bold font-mono text-white mt-1">
                    {formatMoney(botStatus?.equity || 0)}
                  </div>
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
                  <p className="text-xs text-slate-400">Status do Motor</p>
                  <p className={`text-sm font-bold ${botStatus?.status === 'RUNNING' ? 'text-[#10b981]' : botStatus?.status === 'STOPPED_BY_EQUITY_GUARD' ? 'text-[#ef4444]' : 'text-[#eab308]'}`}>
                    {botStatus?.status || 'OFFLINE'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#f59e0b] flex items-center gap-1"><ShieldCheck size={12}/> Equity Guard (Cut Loss)</p>
                  <p className="font-mono text-sm text-[#f59e0b]">{botStatus?.equityGuardPercent}% (Max Loss: {formatMoney((botStatus?.startingCapital || 0) * ((botStatus?.equityGuardPercent || 0)/100))})</p>
                </div>
              </div>
            </div>

            {/* Quick Setup (Só mostra se parado) */}
            {(botStatus?.status === 'IDLE' || botStatus?.status === 'READY') && (
              <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings size={18}/> Quick Setup (IA Config)</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Capital Inicial (USDT)</label>
                    <input type="number" value={setupCapital} onChange={e => setSetupCapital(Number(e.target.value))} className="w-full bg-[#0f172a] border border-[#334155] rounded p-2 text-white font-mono outline-none focus:border-[#38bdf8]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Cut Loss Percentage (%)</label>
                    <input type="number" value={setupEquityGuard} onChange={e => setSetupEquityGuard(Number(e.target.value))} className="w-full bg-[#0f172a] border border-[#334155] rounded p-2 text-white font-mono outline-none focus:border-[#38bdf8]" />
                  </div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded text-sm text-slate-300 mb-6 border border-[#334155]">
                  <AlertTriangle size={16} className="inline mr-2 text-[#f59e0b]"/>
                  Se o seu Equity cair para <strong>{formatMoney(setupCapital - (setupCapital * (setupEquityGuard/100)))}</strong>, a IA fechará todas as posições automaticamente para prevenir liquidação total (Proteção de Capital).
                </div>

                <div className="flex gap-4">
                  <button onClick={handleSetup} disabled={loading} className="flex-1 bg-[#334155] hover:bg-[#475569] text-white font-bold py-3 rounded transition-colors">
                    Aplicar Configurações
                  </button>
                  <button onClick={handleStart} disabled={loading || botStatus?.status !== 'READY'} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <PlayCircle size={18}/> Iniciar Algo Trader
                  </button>
                </div>
              </div>
            )}

            {botStatus?.status === 'RUNNING' && (
              <div className="flex justify-end">
                <button onClick={handleStop} disabled={loading} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-2 px-6 rounded transition-colors flex items-center gap-2">
                  <StopCircle size={18}/> Parar Robô
                </button>
              </div>
            )}

            {/* Live Positions */}
            <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
              <div className="p-4 bg-[#0f172a] border-b border-[#334155]">
                <h3 className="text-white font-bold text-sm">Live Positions (AI Managed)</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1e293b] border-b border-[#334155] text-slate-400">
                  <tr>
                    <th className="p-3 font-normal">Coin</th>
                    <th className="p-3 font-normal">Side</th>
                    <th className="p-3 font-normal text-right">Entry Price</th>
                    <th className="p-3 font-normal text-right">Current Price</th>
                    <th className="p-3 font-normal text-right">PNL (USDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {(!botStatus?.livePositions || botStatus.livePositions.length === 0) && (
                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nenhuma posição aberta no momento.</td></tr>
                  )}
                  {botStatus?.livePositions?.map((pos: any) => (
                    <tr key={pos.id} className="hover:bg-[#334155]/30">
                      <td className="p-3 font-bold">{pos.symbol}</td>
                      <td className="p-3"><span className="bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded text-xs font-bold">{pos.side}</span></td>
                      <td className="p-3 font-mono text-right">{formatMoney(pos.entryPrice)}</td>
                      <td className="p-3 font-mono text-right">{formatMoney(pos.currentPrice)}</td>
                      <td className={`p-3 font-mono text-right font-bold ${pos.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{formatMoney(pos.pnl)} ({pos.pnlPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
           <div className="contracts-table max-w-4xl mx-auto">
             <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">Watchlist Yahoo Finance</h3>
                <button onClick={fetchWatchlist} className="text-slate-400 hover:text-white"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-[#1e293b] border-b border-[#334155] text-slate-400">
                  <tr><th className="p-3">Ticker</th><th className="p-3">Company/Token</th><th className="p-3">Price</th><th className="p-3">24h Change</th></tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {quotes.map(q => (
                    <tr key={q.symbol} className="hover:bg-[#334155]/30">
                      <td className="p-3 font-bold">{q.symbol}</td>
                      <td className="p-3 text-slate-400">{q.name}</td>
                      <td className="p-3 font-mono">{q.price ? q.price.toLocaleString('en-US', { style: 'currency', currency: 'USD'}) : '---'}</td>
                      <td className={`p-3 font-mono font-bold ${(q.change || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {(q.changePercent || 0) >= 0 ? '+' : ''}{q.changePercent?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )}
      </div>
    </section>
  )
}
