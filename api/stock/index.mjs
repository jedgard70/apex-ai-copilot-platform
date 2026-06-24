/**
 * api/stock/index.mjs — Vercel serverless
 *
 * POST /api/stock/quotes   → Buscar cotações de tickers
 * GET  /api/stock/watchlist → Lista padrão de tickers
 * POST /api/stock/history   → Histórico de um ticker
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import('../../server/service/stockMarket.mjs')

    if (path === '/api/stock/quotes' && req.method === 'POST') {
      const symbols = Array.isArray(body.symbols) ? body.symbols : (body.symbols || '').split(',').map(s => s.trim()).filter(Boolean)
      if (symbols.length === 0) return res.status(400).json({ error: 'symbols required' })
      const quotes = await mod.fetchQuotes(symbols)
      const gainers = mod.calculateGainers(quotes).slice(0, 5)
      const losers = mod.calculateLosers(quotes).slice(0, 5)
      return res.status(200).json({ providerStatus: 'connected', quotes, gainers, losers })
    }

    if (path === '/api/stock/watchlist' && req.method === 'GET') {
      const symbols = mod.DEFAULT_WATCHLIST.map(s => s.symbol)
      const quotes = await mod.fetchQuotes(symbols)
      return res.status(200).json({ providerStatus: 'connected', watchlist: mod.DEFAULT_WATCHLIST, quotes })
    }

    if (path === '/api/stock/history' && req.method === 'POST') {
      const { symbol, range, interval } = body
      if (!symbol) return res.status(400).json({ error: 'symbol required' })
      const data = await mod.fetchHistory(symbol, range, interval)
      return res.status(200).json({ providerStatus: 'connected', ...data })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[stock] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
