/**
 * server/service/stockMarket.mjs
 *
 * Bolsa de Valores — consulta cotações via Yahoo Finance API (gratuita).
 * Apenas para usuários internos (Owner).
 * Suporte: B3 ( .SA), NYSE, NASDAQ
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const QUOTE_CACHE = new Map()
const CACHE_TTL = 60_000 // 1 minuto

/**
 * Buscar cotação atual de um ou mais tickers.
 * @param {string[]} symbols - Ex: ['PETR4.SA', 'VALE3.SA', 'AAPL', 'BTC-USD']
 * @returns {Promise<Object[]>}
 */
export async function fetchQuotes(symbols) {
  const results = []
  for (const symbol of symbols) {
    const clean = String(symbol || '').trim().toUpperCase()
    if (!clean) continue

    // Check cache
    const cached = QUOTE_CACHE.get(clean)
    if (cached && cached.expiresAt > Date.now()) {
      results.push(cached.data)
      continue
    }

    try {
      const url = `${YAHOO_BASE}/${encodeURIComponent(clean)}?range=1d&interval=1d`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        results.push({ symbol: clean, error: `HTTP ${res.status}`, price: null, change: null, changePercent: null })
        continue
      }
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      const meta = result?.meta
      const quote = result?.indicators?.quote?.[0]
      const close = quote?.close?.filter(c => c !== null) || []
      const lastPrice = close[close.length - 1] || meta?.regularMarketPrice || null
      const prevClose = meta?.chartPreviousClose || meta?.previousClose || null
      const change = lastPrice !== null && prevClose !== null ? lastPrice - prevClose : null
      const changePercent = change !== null && prevClose !== null && prevClose !== 0 ? (change / prevClose) * 100 : null

      const entry = {
        symbol: clean,
        name: meta?.shortName || meta?.longName || clean,
        price: lastPrice,
        change: change !== null ? Math.round(change * 100) / 100 : null,
        changePercent: changePercent !== null ? Math.round(changePercent * 100) / 100 : null,
        currency: meta?.currency || 'USD',
        exchange: meta?.exchangeName || '',
        marketTime: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
        marketState: meta?.marketState || 'UNKNOWN',
      }

      QUOTE_CACHE.set(clean, { data: entry, expiresAt: Date.now() + CACHE_TTL })
      results.push(entry)
    } catch (err) {
      results.push({ symbol: clean, error: err.message, price: null, change: null, changePercent: null })
    }
  }
  return results
}

/**
 * Lista de tickers padrão da B3 (Bolsa Brasileira) e Internacionais.
 */
export const DEFAULT_WATCHLIST = [
  // B3 - Brasil
  { symbol: 'PETR4.SA', name: 'Petrobras PN' },
  { symbol: 'VALE3.SA', name: 'Vale ON' },
  { symbol: 'ITUB4.SA', name: 'Itaú PN' },
  { symbol: 'BBDC4.SA', name: 'Bradesco PN' },
  { symbol: 'ABEV3.SA', name: 'Ambev ON' },
  { symbol: 'WEGE3.SA', name: 'WEG ON' },
  { symbol: 'BBAS3.SA', name: 'Banco do Brasil' },
  { symbol: 'ELET3.SA', name: 'Eletrobras ON' },
  { symbol: 'RENT3.SA', name: 'Localiza' },
  { symbol: 'MGLU3.SA', name: 'Magazine Luiza' },
  { symbol: 'BOVA11.SA', name: 'iShares Ibovespa' },
  { symbol: 'HGLG11.SA', name: 'CSHG Logística FII' },
  // Internacionais
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta (Facebook)' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD' },
  { symbol: 'ETH-USD', name: 'Ethereum USD' },
]

/**
 * Buscar histórico de um ticker.
 * @param {string} symbol
 * @param {string} range - 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
 * @param {string} interval - 1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo
 */
export async function fetchHistory(symbol, range = '1mo', interval = '1d') {
  const clean = String(symbol || '').trim().toUpperCase()
  if (!clean) return { error: 'Symbol required' }

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(clean)}?range=${range}&interval=${interval}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }

    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return { error: 'No data' }

    const timestamps = result.timestamp || []
    const quote = result?.indicators?.quote?.[0]
    const closes = quote?.close || []
    const opens = quote?.open || []
    const highs = quote?.high || []
    const lows = quote?.low || []
    const volumes = quote?.volume || []

    const history = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString(),
      open: opens[i] || null,
      high: highs[i] || null,
      low: lows[i] || null,
      close: closes[i] || null,
      volume: volumes[i] || null,
    })).filter(h => h.close !== null)

    return { symbol: clean, history, count: history.length }
  } catch (err) {
    return { error: err.message }
  }
}

// ─── Indicadores básicos ──────────────────────────────────────────────────────

export function calculateGainers(quotes) {
  return quotes.filter(q => q.changePercent !== null).sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
}

export function calculateLosers(quotes) {
  return quotes.filter(q => q.changePercent !== null).sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
}
