import { authenticateApexApi, recordUsage, readJsonBody, sendJson } from '../../../../server/apexApi/auth.mjs'
import { runApexFirstCompletion } from '../../../../server/apexApi/engine.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }
  const auth = authenticateApexApi(req, ['read:*'])
  if (!auth.ok) return sendJson(res, auth.status, auth)

  try {
    const body = await readJsonBody(req)
    const prompt = [
      'Você é a Apex Engineering Copilot API. Analise engenharia/arquitetura/BIM com linguagem profissional.',
      'Não assuma aprovação oficial. Diferencie evidência enviada, inferência e pendência.',
      `Tipo de análise: ${body.analysis_type || 'general'}`,
      `Projeto: ${body.project_id || 'default'}`,
      `Conteúdo: ${JSON.stringify(body.input || body, null, 2).slice(0, 12000)}`,
    ].join('\n\n')
    const result = await runApexFirstCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: body.model || 'apex-ai',
      allowGeminiFallback: body.allow_gemini_fallback !== false,
    })
    const usage = recordUsage({
      auth,
      service: 'engineering.analyze',
      projectId: body.project_id || 'default',
      inputTokens: result.usage?.prompt_tokens || 0,
      outputTokens: result.usage?.completion_tokens || 0,
    })
    return sendJson(res, 200, {
      ok: true,
      provider: result.provider,
      project_id: body.project_id || 'default',
      analysis_type: body.analysis_type || 'general',
      result: result.text,
      usage: result.usage,
      apex_usage: usage,
    }, usage)
  } catch (error) {
    return sendJson(res, 500, { error: 'engineering_analyze_failed', message: error?.message || String(error) })
  }
}
