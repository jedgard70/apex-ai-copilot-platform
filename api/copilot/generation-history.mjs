/**
 * api/copilot/generation-history.mjs — Vercel serverless
 *
 * Generation history — recupera historico de geracoes do projeto
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed' }))

  try {
    const body = typeof req.body === 'object' ? req.body : {}
    const project = body.project || {}
    const { buildGenerationHistory } = await import('../../server/service/generationHistory.mjs')
    const result = buildGenerationHistory(project)
    if (result.error) return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: result.error }))
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result))
  } catch (error) {
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message }))
  }
}
