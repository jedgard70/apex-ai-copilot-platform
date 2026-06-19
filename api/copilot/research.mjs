// Dispatcher for research-search and knowledge-embed
// Consolidates 2 functions into 1 to stay within Vercel Hobby 12-function limit.
// POST { action: 'search'|'embed', ...payload }

// Auto-detect and fix swapped router variables
if (process.env.OPENAI_API_BASEROUTER && process.env.OPENAI_API_KEYROUTER) {
  const baseVal = String(process.env.OPENAI_API_BASEROUTER).trim()
  const keyVal = String(process.env.OPENAI_API_KEYROUTER).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASEROUTER = keyVal
    process.env.OPENAI_API_KEYROUTER = baseVal
  }
}
if (process.env.OPENAI_API_BASE && process.env.OPENAI_API_KEY) {
  const baseVal = String(process.env.OPENAI_API_BASE).trim()
  const keyVal = String(process.env.OPENAI_API_KEY).trim()
  if (!baseVal.startsWith('http') && keyVal.startsWith('http')) {
    process.env.OPENAI_API_BASE = keyVal
    process.env.OPENAI_API_KEY = baseVal
  }
}

// Normalize custom router variable casing/names
if (process.env.OPENAI_API_BASEROUTER && !process.env.OPENAI_API_BASE) {
  process.env.OPENAI_API_BASE = process.env.OPENAI_API_BASEROUTER
}
if (process.env.OPENAI_API_KEYROUTER && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEYROUTER
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

async function handleSearch(payload) {
  const { query, searchDepth = 'basic', maxResults = 5, includeDomains, topic = 'general' } = payload
  if (!query?.trim()) return { _error: 400, error: 'query é obrigatório.' }

  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) {
    return { mode: 'planning-only', results: [], answer: null, message: 'Configure TAVILY_API_KEY para ativar pesquisa web em tempo real.' }
  }

  const reqBody = { query: query.slice(0, 400), search_depth: searchDepth, max_results: Math.min(maxResults, 10), topic, include_answer: true, include_raw_content: false }
  if (Array.isArray(includeDomains) && includeDomains.length) reqBody.include_domains = includeDomains

  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavilyKey}` },
    body: JSON.stringify(reqBody),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) return { mode: 'error', results: [], answer: null, error: 'Falha ao pesquisar.' }

  return {
    mode: 'tavily-search',
    answer: data.answer || null,
    results: (data.results || []).map(r => ({ title: r.title, url: r.url, content: r.content, score: r.score, publishedDate: r.published_date })),
  }
}

async function handleEmbed(payload) {
  const { text, texts } = payload
  const openaiKey = process.env.OPENAI_API_KEY

  if (!openaiKey) {
    return { mode: 'planning-only', embedding: null, embeddings: null, message: 'Configure OPENAI_API_KEY para ativar embeddings semânticos.' }
  }

  async function getEmbedding(t) {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: String(t).slice(0, 8000) }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error?.message || 'Embedding failed')
    return data.data[0].embedding
  }

  if (Array.isArray(texts) && texts.length) {
    const embeddings = await Promise.all(texts.map(t => getEmbedding(t)))
    return { mode: 'openai-embeddings', embeddings, model: 'text-embedding-3-small', dimensions: 1536 }
  }
  if (text) {
    const embedding = await getEmbedding(text)
    return { mode: 'openai-embeddings', embedding, model: 'text-embedding-3-small', dimensions: 1536 }
  }
  return { _error: 400, error: 'Forneça text ou texts para gerar embeddings.' }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end()
    return
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  let body = {}
  try {
    const raw = await new Promise((resolve, reject) => {
      let d = ''
      req.on('data', c => { d += c })
      req.on('end', () => resolve(d))
      req.on('error', reject)
    })
    body = JSON.parse(raw || '{}')
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' })
  }

  const { action, ...payload } = body
  if (!['search', 'embed'].includes(action)) return sendJson(res, 400, { error: 'action must be "search" or "embed"' })

  try {
    const result = action === 'search' ? await handleSearch(payload) : await handleEmbed(payload)
    if (result._error) {
      const status = result._error
      delete result._error
      return sendJson(res, status, result)
    }
    return sendJson(res, 200, result)
  } catch (err) {
    console.error('[research] error', err)
    return sendJson(res, 500, { error: `Erro interno: ${err.message}` })
  }
}
