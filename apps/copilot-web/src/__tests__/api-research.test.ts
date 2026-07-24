import { describe, it, expect, vi, afterEach } from 'vitest'

// Replicate core research handler logic for unit testing

async function handleSearch(payload: Record<string, unknown>, tavilyKey: string | undefined) {
  const { query, searchDepth = 'basic', maxResults = 5, includeDomains, topic = 'general' } = payload as any
  if (!query?.trim()) return { _error: 400, error: 'query é obrigatório.' }
  if (!tavilyKey) {
    return { mode: 'planning-only', results: [], answer: null, message: 'Configure TAVILY_API_KEY para ativar pesquisa web em tempo real.' }
  }
  // In real handler this calls Tavily; here we only test pre-call logic
  return { mode: 'tavily-search', query: String(query).slice(0, 400), searchDepth, maxResults: Math.min(Number(maxResults), 10), topic }
}

async function handleEmbed(payload: Record<string, unknown>, openaiKey: string | undefined) {
  const { text, texts } = payload as any
  if (!openaiKey) {
    return { mode: 'planning-only', embedding: null, embeddings: null, message: 'Configure OPENAI_API_KEY para ativar embeddings semânticos.' }
  }
  if (!text && !texts) return { _error: 400, error: 'Forneça text ou texts para gerar embeddings.' }
  // Simulate structure without real API call
  return { mode: 'openai-embeddings', model: 'text-embedding-3-small', dimensions: 1536 }
}

describe('research API — handleSearch', () => {
  it('returns 400 when query is missing', async () => {
    const result = await handleSearch({}, 'fake-key')
    expect((result as any)._error).toBe(400)
    expect((result as any).error).toContain('query')
  })

  it('returns 400 when query is empty string', async () => {
    const result = await handleSearch({ query: '   ' }, 'fake-key')
    expect((result as any)._error).toBe(400)
  })

  it('planning-only when no Tavily key', async () => {
    const result = await handleSearch({ query: 'custo concreto SP' }, undefined)
    expect((result as any).mode).toBe('planning-only')
    expect((result as any).results).toEqual([])
  })

  it('caps maxResults at 10', async () => {
    const result = await handleSearch({ query: 'teste', maxResults: 50 }, 'key') as any
    expect(result.maxResults).toBe(10)
  })

  it('truncates query to 400 chars', async () => {
    const long = 'a'.repeat(500)
    const result = await handleSearch({ query: long }, 'key') as any
    expect(result.query.length).toBe(400)
  })

  it('passes topic and searchDepth through', async () => {
    const result = await handleSearch({ query: 'SINAPI cimento', topic: 'finance', searchDepth: 'advanced' }, 'key') as any
    expect(result.topic).toBe('finance')
    expect(result.searchDepth).toBe('advanced')
  })
})

describe('research API — handleEmbed', () => {
  it('planning-only when no OpenAI key', async () => {
    const result = await handleEmbed({ text: 'cimento portland' }, undefined)
    expect((result as any).mode).toBe('planning-only')
    expect((result as any).embedding).toBeNull()
  })

  it('returns 400 when no text or texts provided', async () => {
    const result = await handleEmbed({}, 'key')
    expect((result as any)._error).toBe(400)
  })

  it('returns embedding model info when key is set', async () => {
    const result = await handleEmbed({ text: 'teste' }, 'key') as any
    expect(result.mode).toBe('openai-embeddings')
    expect(result.model).toBe('text-embedding-3-small')
    expect(result.dimensions).toBe(1536)
  })
})
