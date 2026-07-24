/**
 * api/copilot/generation-history.mjs — Vercel serverless
 *
 * Generation history — recupera historico de geracoes do projeto
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = typeof req.body === 'object' ? req.body : {}
    const project = body.project || {}
    const { buildGenerationHistory } = await import('../../server/service/generationHistory.mjs')
    const result = buildGenerationHistory(project)
    if (result.error) return res.status(400).json({ error: result.error })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
