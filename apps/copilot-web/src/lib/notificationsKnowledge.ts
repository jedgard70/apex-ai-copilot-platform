export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type AlertStatus = 'Open' | 'Snoozed' | 'Done'

export type AlertType =
  | 'Deadline'
  | 'Cost deviation'
  | 'Safety risk'
  | 'Quality issue'
  | 'Permit/document pending'
  | 'Payment overdue'
  | 'Client follow-up'
  | 'Supplier delay'
  | 'AI cost threshold'
  | 'Custom'

export type AlertRecord = {
  id: string
  type: AlertType
  title: string
  description: string
  severity: AlertSeverity
  dueDate: string
  assignedTo: string
  status: AlertStatus
  sourceModule: string
  evidence: 'USER_ENTERED' | 'SYSTEM_SUGGESTED' | 'UNKNOWN'
}

export type NotificationsPlan = {
  providerStatus: 'local-alerts-only'
  alerts: AlertRecord[]
  suggestedAlerts: AlertRecord[]
  message: string
}

export const alertTypes: AlertType[] = [
  'Deadline',
  'Cost deviation',
  'Safety risk',
  'Quality issue',
  'Permit/document pending',
  'Payment overdue',
  'Client follow-up',
  'Supplier delay',
  'AI cost threshold',
  'Custom',
]

export function isNotificationsIntent(text: string) {
  return /\b(alerta|alertas|notifica[cç][aã]o|notificacoes|notificações|prazo|lembrete|pend[eê]ncia|vencimento|atraso cr[ií]tico|reminder|notification|deadline|overdue|snooze)\b/i.test(text)
}

export function createLocalNotificationsPlan(goal: string): NotificationsPlan {
  const lower = goal.toLowerCase()
  const type: AlertType = /pagamento|fatura|payment|invoice|cobran/.test(lower)
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
  const severity: AlertSeverity = /cr[ií]tico|critical|urgente|alto risco/.test(lower) ? 'Critical' : 'High'
  const alert: AlertRecord = {
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
  return {
    providerStatus: 'local-alerts-only',
    alerts: [alert],
    suggestedAlerts: [
      alert,
      {
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
      },
    ],
    message: 'Local alert only — notification connector not connected yet.',
  }
}
