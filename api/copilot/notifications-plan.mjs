function sendJson(res, status, body) {
  res.status(status).json(body)
}

function createNotificationsPlan(goal = '') {
  const lower = String(goal || '').toLowerCase()
  const type = /pagamento|fatura|payment|invoice|cobran/.test(lower)
    ? 'Payment overdue'
    : /fornecedor|supplier|material|entrega/.test(lower)
      ? 'Supplier delay'
      : /seguran|safety|nr-/.test(lower)
        ? 'Safety risk'
        : /custo|cost|budget|or[cç]amento/.test(lower)
          ? 'Cost deviation'
          : /cliente|follow/.test(lower)
            ? 'Client follow-up'
            : 'Deadline'
  const severity = /cr[ií]tico|critical|urgente|alto risco/.test(lower) ? 'Critical' : 'High'
  const alert = {
    id: `alert-${Date.now()}`,
    type,
    title: goal || 'Apex local alert',
    description: goal || 'Local reminder created from chat intent.',
    severity,
    dueDate: '',
    assignedTo: 'Owner/Admin',
    status: 'Open',
    sourceModule: 'Apex Copilot',
    evidence: 'USER_ENTERED',
  }
  const followUp = {
    id: `alert-followup-${Date.now()}`,
    type: 'Client follow-up',
    title: 'Follow up with client',
    description: 'Suggested local follow-up. No email/SMS/push connector is connected.',
    severity: 'Medium',
    dueDate: '',
    assignedTo: 'Sales / Owner',
    status: 'Open',
    sourceModule: 'CRM',
    evidence: 'SYSTEM_SUGGESTED',
  }
  return {
    providerStatus: 'local-alerts-only',
    alerts: [alert],
    suggestedAlerts: [alert, followUp],
    message: 'Local alert only — notification connector not connected yet.',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'local-alerts-only' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, { plan: createNotificationsPlan(String(body.goal || '')) })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'notifications_plan_failed', providerStatus: 'local-alerts-only' })
  }
}
