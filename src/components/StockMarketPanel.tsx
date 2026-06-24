import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, X, Search, BarChart3 } from 'lucide-react'

type Quote = { symbol: string; name: string; price: number | null; change: number | null; changePercent: number | null; currency: string; error?: string }

export function StockMarketPanel({ onClear }: { onClear: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [gainers, setGainers] = useState<Quote[]>([])
  const [losers, setLosers] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [customQuote, setCustomQuote] = useState<Quote | null>(null)
  const [message, setMessage] = useState('')

  async function fetchWatchlist() {
    setLoading(true)
    try {
      const res = await fetch('/api/stock/watchlist')
      const d = await res.json()
      if (d.quotes) setQuotes(d.quotes)
      if (d.losers) setLosers(d.losers)
      if (d.gainers) setGainers(d.gainers)
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWatchlist() }, [])

  async function searchSymbol() {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/stock/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [search.trim().toUpperCase()] }),
      })
      const d = await res.json()
      if (d.quotes?.length) setCustomQuote(d.quotes[0])
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  function formatPrice(q: Quote) {
    if (q.error) return <span style={{ color: '#ef4444' }}>Erro</span>
    if (q.price === null) return <span style={{ color: '#9ca3af' }}>---</span>
    const sym = q.currency === 'BRL' ? 'R$' : q.currency === 'EUR' ? '€' : '$'
    return `${sym} ${q.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatChange(q: Quote) {
    if (q.change === null) return null
    const isPositive = q.change >= 0
    return (
      <span style={{ color: isPositive ? '#059669' : '#dc2626', fontSize: '12px', fontWeight: 600 }}>
        {isPositive ? '+' : ''}{q.change.toFixed(2)} ({isPositive ? '+' : ''}{q.changePercent?.toFixed(2)}%)
      </span>
    )
  }

  return (
    <section style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}><BarChart3 size={14} style={{ display: 'inline' }} /> Bolsa de Valores</span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Cotações em tempo real</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchWatchlist} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Atualizar</button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {message && <div className="business-alert"><span>{message}</span></div>}

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchSymbol()}
          placeholder="Buscar ticker ex: PETR4.SA, AAPL, BTC-USD"
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' }} />
        <button onClick={searchSymbol} disabled={loading}><Search size={15} /> Buscar</button>
      </div>

      {/* Custom quote */}
      {customQuote && (
        <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong style={{ fontSize: '14px' }}>{customQuote.symbol}</strong><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>{customQuote.name}</span></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{formatPrice(customQuote)}</div>
              {formatChange(customQuote)}
            </div>
          </div>
        </div>
      )}

      {/* Gainers / Losers */}
      {(gainers.length > 0 || losers.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {gainers.length > 0 && (
            <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>📈 Maiores Altas</div>
              {gainers.slice(0, 5).map(q => (
                <div key={q.symbol} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                  <span>{q.symbol.replace('.SA', '')}</span>
                  <span style={{ color: '#059669' }}>+{q.changePercent?.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
          {losers.length > 0 && (
            <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>📉 Maiores Baixas</div>
              {losers.slice(0, 5).map(q => (
                <div key={q.symbol} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                  <span>{q.symbol.replace('.SA', '')}</span>
                  <span style={{ color: '#dc2626' }}>{q.changePercent?.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist table */}
      <div className="contracts-table" style={{ maxHeight: '500px', overflow: 'auto' }}>
        <table>
          <thead>
            <tr><th>Ticker</th><th>Nome</th><th>Preço</th><th>Variação</th><th>Moeda</th></tr>
          </thead>
          <tbody>
            {quotes.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Carregando...</td></tr>}
            {quotes.map(q => (
              <tr key={q.symbol}>
                <td style={{ fontWeight: 700 }}>{q.symbol.replace('.SA', '')}</td>
                <td style={{ fontSize: '12px' }}>{q.name}</td>
                <td style={{ fontWeight: 600 }}>{formatPrice(q)}</td>
                <td>{formatChange(q)}</td>
                <td style={{ fontSize: '11px' }}>{q.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
    </section>
  )
}
