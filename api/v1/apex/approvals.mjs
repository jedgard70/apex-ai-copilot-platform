import { authenticateApexApi, createApprovalToken, readJsonBody, sendJson, scopeMatches } from '../../../server/apexApi/auth.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  const auth = authenticateApexApi(req, ['read:*'])
  if (!auth.ok) return sendJson(res, auth.status, auth)

  try {
    const body = await readJsonBody(req)
    const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [String(body.scope || '')].filter(Boolean)
    const missing = scopes.filter(scope => !auth.scopes.some(granted => scopeMatches(granted, scope)))
    if (missing.length) {
      return sendJson(res, 403, {
        error: 'missing_scope',
        message: `API key sem escopo para aprovar: ${missing.join(', ')}`,
        missing,
      })
    }
    const token = createApprovalToken({
      auth,
      scopes,
      operation: body.operation || 'write',
      ttlSeconds: body.ttl_seconds || 600,
    })
    return sendJson(res, 200, {
      approval_token: token,
      token_type: 'ApexShortApproval',
      expires_in: Math.max(30, Math.min(Number(body.ttl_seconds) || 600, 1800)),
      scopes,
      org_id: auth.orgId,
    })
  } catch (error) {
    return sendJson(res, 500, { error: 'approval_token_failed', message: error?.message || String(error) })
  }
}
