/**
 * Apex AI Copilot — Local & Remote Embeddings Generator
 * Connects to process.env.OPENAI_API_BASE/embeddings or local Ollama embeddings
 */

export async function generateEmbedding(text = '') {
  const apiKey = process.env.OPENAI_API_KEY || ''
  const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small' // nomic-embed-text or all-minilm for local Ollama

  if (!text.trim()) {
    const dimension = model.includes('384') || model.includes('minilm') ? 384 : 1536
    return new Array(dimension).fill(0)
  }

  try {
    const response = await fetch(`${apiBase}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text.trim(),
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Embedding endpoint returned HTTP ${response.status}: ${errText}`)
    }

    const data = await response.json()
    if (data && data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
      return data.data[0].embedding
    }

    throw new Error('Invalid response structure from embedding endpoint.')
  } catch (error) {
    console.error('[embeddings] Failed to generate embedding:', error.message)
    const dimension = model.includes('384') || model.includes('minilm') ? 384 : 1536
    return new Array(dimension).fill(0)
  }
}
