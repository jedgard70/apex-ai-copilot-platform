import { authenticateApexApi, recordUsage, readJsonBody, sendJson, verifyApprovalToken } from '../../../../server/apexApi/auth.mjs'
import { getRevitConnectorStatus } from '../../../../server/agent/revitBimConnector.mjs'

function operationScope(operation = '') {
  const op = String(operation || '').toLowerCase()
  if (/\b(write|modify|create|delete|update|alter|set|mutate|salvar|criar|alterar|apagar)\b/.test(op)) return 'write:revit'
  return 'operate:revit'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const body = await readJsonBody(req)
    const requiredScope = operationScope(body.operation || body.action)
    const auth = authenticateApexApi(req, [requiredScope])
    if (!auth.ok) return sendJson(res, auth.status, auth)
    const approval = verifyApprovalToken(req, auth, [requiredScope])
    if (!approval.ok) return sendJson(res, approval.status, approval)

    const status = getRevitConnectorStatus()
    const usage = recordUsage({
      auth,
      service: 'revit.operate',
      projectId: body.project_id || 'default',
      unit: requiredScope,
    })

    return sendJson(res, 200, {
      ok: Boolean(status.configured),
      mode: status.configured ? 'operational_connected' : 'connector_unavailable',
      required_scope: requiredScope,
      confirmation_required_for_write: requiredScope.startsWith('write:'),
      approval: approval.required ? { accepted: true, operation: approval.payload?.operation || '' } : { accepted: true, required: false },
      connector: {
        configured: status.configured,
        status: status.status,
        label: status.label,
        detail: status.detail,
      },
      result: status.configured
        ? {
            accepted: true,
            queued: true,
            message: 'Operação Revit/BIM aceita pela API Apex. Escritas exigem execução pelo conector APS/MCP/local configurado e ficam auditáveis.',
            operation: body.operation || body.action || 'status',
          }
        : {
            accepted: false,
            message: 'Revit APS/MCP não está disponível neste runtime. A API não finge alteração de modelo.',
          },
      apex_usage: usage,
    }, usage)
  } catch (error) {
    return sendJson(res, 500, { error: 'revit_operate_failed', message: error?.message || String(error) })
  }
}
