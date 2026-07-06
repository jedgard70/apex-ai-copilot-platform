import '../../server/env.mjs'
import { generateEmbedding } from '../../server/agent/embeddings.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed' }))
  try {
    const body = []
    for await (const chunk of req) body.push(chunk)
    const { text } = JSON.parse(Buffer.concat(body).toString())
    if (!text) return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'text is required' }))
    const embedding = await generateEmbedding(text)
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, embedding }))
  } catch (error) {
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message }))
  }
}
