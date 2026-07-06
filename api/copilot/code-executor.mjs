/**
 * api/copilot/code-executor.mjs — Vercel serverless
 *
 * Owner Code Executor — plan/validate/status/log
 */

export default async function handler(req, res) {
  const body = typeof req.body === 'object' ? req.body : {}
  const path = req.url?.split('?')[0] || ''

  if (path === '/api/copilot/code-executor/plan' && req.method === 'POST') {
    try {
      const { buildOwnerCodeExecutionPlan } = await import('../../server/service/ownerCodeExecutor.mjs')
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(buildOwnerCodeExecutionPlan(body || {})))
    } catch (error) {
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message, providerStatus: 'error' }))
    }
  }

  if (path === '/api/copilot/code-executor/validate-command' && req.method === 'POST') {
    try {
      const { validateOwnerCodeCommand } = await import('../../server/service/ownerCodeExecutor.mjs')
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(validateOwnerCodeCommand(String(body.command || ''))))
    } catch (error) {
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message, providerStatus: 'error' }))
    }
  }

  if (path === '/api/copilot/code-executor/status' && (req.method === 'POST' || req.method === 'GET')) {
    try {
      const { getOwnerCodeExecutorStatus } = await import('../../server/service/ownerCodeExecutor.mjs')
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(getOwnerCodeExecutorStatus()))
    } catch (error) {
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message, providerStatus: 'error' }))
    }
  }

  if (path === '/api/copilot/code-executor/log' && req.method === 'POST') {
    try {
      const { appendExecutionLog } = await import('../../server/service/ownerCodeExecutor.mjs')
      const result = appendExecutionLog(body)
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result))
    } catch (error) {
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message, providerStatus: 'error' }))
    }
  }

  return res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Not found' }))
}
