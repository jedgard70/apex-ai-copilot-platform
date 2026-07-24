import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const ALERTS_FILE = path.join(process.cwd(), '.system_generated', 'alerts.json')
let ALERTS = []
let IS_SUPABASE = false
let supabaseClient = null

function initSupabase() {
  if (supabaseClient) return true
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      IS_SUPABASE = true
      return true
    } catch (e) {
      console.warn('[notifications] Error init Supabase:', e.message)
    }
  }
  return false
}

export async function loadAlerts() {
  if (initSupabase()) {
    try {
      const { data, error } = await supabaseClient.from('notifications').select('*')
      if (!error && data) {
        ALERTS = data
        return ALERTS
      }
    } catch (e) {}
  }
  
  // Fallback
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      ALERTS = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'))
    } else {
      ALERTS = []
    }
  } catch (err) {}
  return ALERTS
}

export async function saveAlerts(newAlerts) {
  ALERTS = newAlerts
  if (IS_SUPABASE && supabaseClient) {
    try {
      // Upsert
      await supabaseClient.from('notifications').upsert(ALERTS)
    } catch (e) {}
  }
  try {
    fs.mkdirSync(path.dirname(ALERTS_FILE), { recursive: true })
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(ALERTS, null, 2))
  } catch (err) {}
}

export async function addAlert(alert) {
  await loadAlerts()
  ALERTS.push(alert)
  await saveAlerts(ALERTS)
  return alert
}

export function generateAlertFromGoal(goal) {
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
  
  return {
    id: `alert-${Date.now()}`,
    type,
    title: goal || 'Apex AI Alert',
    description: goal || 'Alert created from chat intent.',
    severity,
    dueDate: new Date().toISOString().slice(0, 10),
    assignedTo: 'Owner/Admin',
    status: 'Open',
    sourceModule: 'Apex Copilot',
    evidence: 'USER_ENTERED',
  }
}
