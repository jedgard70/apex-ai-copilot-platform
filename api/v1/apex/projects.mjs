import { authenticateApexApi, recordUsage, readJsonBody, sendJson, verifyApprovalToken } from '../../../server/apexApi/auth.mjs'

const inMemoryProjects = new Map()

export default async function handler(req, res) {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  const requiredScope = isWrite ? 'write:files' : 'read:*'
  const auth = authenticateApexApi(req, [requiredScope])
  if (!auth.ok) return sendJson(res, auth.status, auth)
  const approval = verifyApprovalToken(req, auth, [requiredScope])
  if (!approval.ok) return sendJson(res, approval.status, approval)

  try {
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readJsonBody(req) : {}
    const projectId = String(body.project_id || req.query?.project_id || 'default')
    const key = `${auth.orgId}:${projectId}`
    if (req.method === 'GET') {
      const project = inMemoryProjects.get(key) || { project_id: projectId, org_id: auth.orgId, files: [], metadata: {}, source: 'memory_meter' }
      const usage = recordUsage({ auth, service: 'projects.read', projectId })
      return sendJson(res, 200, { ok: true, project, apex_usage: usage }, usage)
    }
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const project = {
        project_id: projectId,
        org_id: auth.orgId,
        metadata: body.metadata || {},
        files: Array.isArray(body.files) ? body.files : [],
        updated_at: new Date().toISOString(),
        source: 'memory_meter',
      }
      inMemoryProjects.set(key, project)
      const usage = recordUsage({ auth, service: 'projects.write', projectId, unit: 'write:files' })
      return sendJson(res, 200, { ok: true, project, approval: { accepted: approval.required }, apex_usage: usage }, usage)
    }
    res.setHeader('Allow', 'GET, POST, PUT, PATCH')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  } catch (error) {
    return sendJson(res, 500, { error: 'projects_api_failed', message: error?.message || String(error) })
  }
}
