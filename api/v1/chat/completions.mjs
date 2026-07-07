import { authenticateApexApi, recordUsage, readJsonBody, sendJson } from '../../../server/apexApi/auth.mjs'
import { countMessageTokens, runApexFirstCompletion } from '../../../server/apexApi/engine.mjs'
import { runApexOperatorProductionSafe } from '../../../server/agent/apexOperatorRuntime.mjs'
import { classifyToolExecutionRequest, routeToolExecution, routeH6ActionRequest } from '../../../server/agent/toolExecutionRouter.mjs'

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
    
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''
    let resultText = ''
    let provider = 'apex-agent'

    if (lastUserMsg) {
      // 1. Check Tool Execution (Agent Squads / Connections)
      const h5ToolIds = classifyToolExecutionRequest(lastUserMsg)
      if (h5ToolIds.length) {
        const toolExecution = await routeToolExecution({ userMessage: lastUserMsg, requestedToolIds: h5ToolIds })
        resultText = toolExecution.finalReply || JSON.stringify(toolExecution)
      } 
      // 2. Check H6 Route
      else {
        const h6Route = routeH6ActionRequest({ userMessage: lastUserMsg })
        if (h6Route) {
          resultText = "H6 Action Routed. " + (h6Route.action || "Ação em processamento pelo agente.")
        } 
        // 3. Fallback to Operator Safe (Executions)
        else {
          const opResult = await runApexOperatorProductionSafe({
            userMessage: lastUserMsg,
            identityContext: { email: 'v1_api_user', role: 'owner_admin' },
            workspaceContext: {},
            repoPath: process.cwd(),
            permissions: { isVerifiedOwner: true },
            productionStatus: [],
            clientMemory: {},
            messages: messages.slice(-10),
          })
          
          if (opResult.intent === 'controlled_execution' || opResult.intent === 'production_h7_confirmation' || opResult.intent === 'tool_execution' || (opResult.executedActions && opResult.executedActions.length > 0)) {
             resultText = opResult.finalReply
          }
        }
      }
    }

    if (!resultText) {
       // fallback to engine if no specific agent tool was triggered
       const allowGeminiFallback = body.allow_gemini_fallback !== false
       const result = await runApexFirstCompletion({ messages, model, allowGeminiFallback })
       resultText = result.text
       provider = result.provider
    }

    const outputTokens = Math.max(1, Math.ceil(String(resultText || '').length / 4))
    const inputTokensCount = countMessageTokens(messages)

    const usage = recordUsage({
      auth,
      service: 'chat.completions.agent',
      projectId: body.project_id || 'default',
      inputTokens: inputTokensCount,
      outputTokens: outputTokens,
    })

    return sendJson(res, 200, {
      id: `chatcmpl_apex_${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      provider: provider,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: resultText },
        finish_reason: 'stop',
      }],
      usage: {
         prompt_tokens: inputTokensCount,
         completion_tokens: outputTokens,
         total_tokens: inputTokensCount + outputTokens
      },
      apex_usage: usage,
    }, usage)
  } catch (error) {
    return sendJson(res, 500, { error: 'chat_completion_failed', message: error?.message || String(error) })
  }
}
