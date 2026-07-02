import { APEX_API_PLANS, authenticateApexApi, sendJson } from '../../../server/apexApi/auth.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }
  const auth = authenticateApexApi(req, ['read:*'])
  if (!auth.ok) return sendJson(res, auth.status, auth)
  return sendJson(res, 200, {
    ok: true,
    positioning: 'Engineering Copilot API com operacoes BIM controladas',
    plans: Object.values(APEX_API_PLANS),
    permission_model: {
      read: 'consulta, analise e relatorios',
      operate: 'rotas conectadas seguras, filas e execucoes assistidas',
      write: 'muda arquivo/modelo/projeto e exige X-Apex-Approval-Token curto',
      admin: 'billing, organizacao e governanca',
    },
  })
}
