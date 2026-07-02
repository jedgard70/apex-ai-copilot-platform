import { authenticateApexApi, recordUsage, readJsonBody, sendJson } from '../../../server/apexApi/auth.mjs'
import { countMessageTokens, runApexFirstCompletion } from '../../../server/apexApi/engine.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  const auth = authenticateApexApi(req, ['read:*'])
  if (!auth.ok) return sendJson(res, auth.status, auth)

  try {
    const body = await readJsonBody(req)
    const messages = Array.isArray(body.messages) ? body.messages : [{ role: 'user', content: String(body.prompt || body.message || '') }]
    const model = String(body.model || 'apex-ai')
    const allowGeminiFallback = body.allow_gemini_fallback !== false
    const result = await runApexFirstCompletion({ messages, model, allowGeminiFallback })
    const usage = recordUsage({
      auth,
      service: 'chat.completions',
      projectId: body.project_id || 'default',
      inputTokens: result.usage?.prompt_tokens || countMessageTokens(messages),
      outputTokens: result.usage?.completion_tokens || 0,
    })

    return sendJson(res, 200, {
      id: `chatcmpl_apex_${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      provider: result.provider,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: result.text },
        finish_reason: 'stop',
      }],
      usage: result.usage,
      apex_usage: usage,
    }, usage)
  } catch (error) {
    return sendJson(res, 500, { error: 'chat_completion_failed', message: error?.message || String(error) })
  }
}
