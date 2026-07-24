import { useEffect, useState, useCallback } from 'react'
import { Bell, Clipboard, Download, Plus, Save, X, RefreshCw } from 'lucide-react'
import { AlertRecord, AlertSeverity, AlertStatus, AlertType, NotificationsPlan, alertTypes } from '../lib/notificationsKnowledge'
import { PremiumPanelLayout } from './PremiumPanelLayout'
type NotificationsPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: NotificationsPlan) => void
  onClear: () => void
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function downloadTextFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function emptyAlert(): AlertRecord {
  return {
    id: `alert-${Date.now()}`,
    type: 'Custom',
    title: 'New local alert',
    description: '',
    severity: 'Medium',
    dueDate: '',
    assignedTo: 'Owner/Admin',
    status: 'Open',
    sourceModule: 'Apex Copilot',
    evidence: 'USER_ENTERED',
  }
}

export function NotificationsPanel({ goal, conversationContext, onSaveToProject, onClear }: NotificationsPanelProps) {
  const [plan, setPlan] = useState<NotificationsPlan>({ providerStatus: 'local-alerts-only', alerts: [], suggestedAlerts: [], message: 'Loading...' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setPlan(prev => ({ ...prev, providerStatus: data.providerStatus || 'connected', alerts: data.alerts || [], message: 'Alerts loaded' }))
      }
    } catch (e) {
      console.warn('Failed to load alerts', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  async function saveAlerts(newAlerts: AlertRecord[]) {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: newAlerts })
      })
      if (res.ok) setMessage('Alerts saved successfully.')
    } catch (e) {
      setMessage('Failed to save alerts.')
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/notifications-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Notifications planner failed.')
      setMessage(data.plan?.message || 'Generated')
      await fetchAlerts()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const snapshot = plan

  function updateAlert(index: number, patch: Partial<AlertRecord>) {
    const updatedAlerts = snapshot.alerts.map((alert, alertIndex) => alertIndex === index ? { ...alert, ...patch } : alert)
    setPlan({ ...snapshot, alerts: updatedAlerts })
  }
  
  function saveChanges() {
    saveAlerts(snapshot.alerts)
  }

  return (
    <PremiumPanelLayout title="Central de Alarmes Integrada" subtitle="Configurações e monitoramento" onClose={onClear}>
      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Status</strong>
            <p>{snapshot.providerStatus}</p>
            <p>{snapshot.message}</p>
            <button className="contracts-primary" type="button" onClick={generatePlan} disabled={loading}>{loading ? 'Creating...' : 'Create alert plan'}</button>
          </div>
          <div className="contracts-card">
            <strong>Actions</strong>
            <button type="button" onClick={() => setPlan({ ...snapshot, alerts: [...snapshot.alerts, emptyAlert()] })}><Plus size={15} /> Create alert</button>
            <button type="button" onClick={saveChanges}><Save size={15} /> Save Changes</button>
            <button type="button" onClick={fetchAlerts}><RefreshCw size={15} /> Refresh</button>
            <button type="button" onClick={() => copyText(JSON.stringify(snapshot.alerts, null, 2))}><Clipboard size={15} /> Export alerts</button>
            <button type="button" onClick={() => downloadTextFile('apex-alerts.json', JSON.stringify(snapshot, null, 2))}><Download size={15} /> Download JSON</button>
            {message && <p className="contracts-message">{message}</p>}
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head"><strong>Alert center</strong><span>{snapshot.alerts.length} alerts</span></div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead><tr><th>Type</th><th>Title</th><th>Severity</th><th>Due date</th><th>Assigned</th><th>Status</th><th>Source</th><th>Evidence</th></tr></thead>
                <tbody>
                  {snapshot.alerts.map((alert, index) => (
                    <tr key={alert.id}>
                      <td><select value={alert.type} onChange={event => updateAlert(index, { type: event.target.value as AlertType })}>{alertTypes.map(type => <option key={type}>{type}</option>)}</select></td>
                      <td><input value={alert.title} onChange={event => updateAlert(index, { title: event.target.value })} /><small>{alert.description}</small></td>
                      <td><select value={alert.severity} onChange={event => updateAlert(index, { severity: event.target.value as AlertSeverity })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></td>
                      <td><input value={alert.dueDate} onChange={event => updateAlert(index, { dueDate: event.target.value })} /></td>
                      <td><input value={alert.assignedTo} onChange={event => updateAlert(index, { assignedTo: event.target.value })} /></td>
                      <td><select value={alert.status} onChange={event => updateAlert(index, { status: event.target.value as AlertStatus })}><option>Open</option><option>Snoozed</option><option>Done</option></select></td>
                      <td>{alert.sourceModule}</td>
                      <td>{alert.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="contracts-card">
            <strong>Suggested alerts</strong>
            <ul>{snapshot.suggestedAlerts.map(alert => <li key={alert.id}>{alert.severity}: {alert.title} — {alert.evidence}</li>)}</ul>
          </div>
        </div>
      </div>
    </PremiumPanelLayout>
  )
}
