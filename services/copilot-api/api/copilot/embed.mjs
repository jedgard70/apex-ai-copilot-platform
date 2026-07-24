import '../../server/env.mjs'
import { generateEmbedding } from '../../server/agent/embeddings.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const body = []
    for await (const chunk of req) body.push(chunk)
    const { text } = JSON.parse(Buffer.concat(body).toString())
    if (!text) return res.status(400).json({ error: 'text is required' })
    const embedding = await generateEmbedding(text)
    return res.status(200).json({ ok: true, embedding })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
