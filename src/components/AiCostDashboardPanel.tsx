import { useEffect, useState, useCallback } from 'react'
import { Activity, Clipboard, Download, Plus, Save, X, RefreshCw } from 'lucide-react'
import { AiCostPlan, AiCostRecord, AiCostSourceConfidence, aiCostModules } from '../lib/aiCostKnowledge'

type AiCostDashboardPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: AiCostPlan) => void
  onCreateThresholdAlert?: (summary: string) => void
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

function emptyRecord(): AiCostRecord {
  return {
    id: `ai-cost-manual-${Date.now()}`,
    module: 'Chat',
    requestCount: 1,
    estimatedTokens: 0,
    estimatedCost: 0,
    model: 'manual / unknown',
    timestamp: new Date().toISOString(),
    userProject: 'Apex Project',
    sourceConfidence: 'ESTIMATED_LOCAL',
  }
}

export function AiCostDashboardPanel({ goal, conversationContext, onSaveToProject, onCreateThresholdAlert, onClear }: AiCostDashboardPanelProps) {
  const [plan, setPlan] = useState<AiCostPlan>({
    providerStatus: 'estimated-local',
    usageSummary: { totalRequests: 0, totalEstimatedTokens: 0, totalEstimatedCost: 0, sourceConfidence: 'ESTIMATED_LOCAL', warning: '' },
    moduleBreakdown: [],
    costWarnings: [],
    message: 'Loading...'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchCostData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/copilot/ai-cost-plan')
      if (res.ok) {
        const data = await res.json()
        if (data.plan) setPlan(data.plan)
      }
    } catch (e) {
      console.warn('Failed to load AI cost', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCostData()
  }, [fetchCostData])

  async function saveManualRecord() {
    // optional logic to save manually if needed
  }

  const snapshot = plan

  function updateRecord(index: number, patch: Partial<AiCostRecord>) {
    const moduleBreakdown = snapshot.moduleBreakdown.map((record, recordIndex) => recordIndex === index ? { ...record, ...patch } : record)
    const totalRequests = moduleBreakdown.reduce((sum, item) => sum + Number(item.requestCount || 0), 0)
    const totalEstimatedTokens = moduleBreakdown.reduce((sum, item) => sum + Number(item.estimatedTokens || 0), 0)
    const totalEstimatedCost = Number(moduleBreakdown.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0).toFixed(4))
    setPlan({ ...snapshot, moduleBreakdown, usageSummary: { ...snapshot.usageSummary, totalRequests, totalEstimatedTokens, totalEstimatedCost } })
  }

  return (
    <section className="contracts-studio" aria-label="AI Cost Dashboard">
      <div className="contracts-heading">
        <div>
          <span><Activity size={16} /> AI Cost / Observability</span>
          <h2>Consumo Real (Supabase Backend)</h2>
          <p>Valores extraídos das rotas interceptadas do Gemini no servidor (engine.mjs).</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close AI Cost Dashboard"><X size={16} /></button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Usage summary</strong>
            <p>Status: {snapshot.providerStatus}</p>
            <p>Requests: {snapshot.usageSummary.totalRequests}</p>
            <p>Estimated tokens: {snapshot.usageSummary.totalEstimatedTokens}</p>
            <p>Estimated cost: ${snapshot.usageSummary.totalEstimatedCost.toFixed(4)}</p>
            <small>{snapshot.usageSummary.warning}</small>
            <button className="contracts-primary" type="button" onClick={fetchCostData} disabled={loading}>{loading ? 'Estimating...' : 'Refresh API Usage'}</button>
          </div>
          <div className="contracts-card">
            <strong>Actions</strong>
            <button type="button" onClick={() => setPlan({ ...snapshot, moduleBreakdown: [...snapshot.moduleBreakdown, emptyRecord()] })}><Plus size={15} /> Add manual usage record</button>
            <button type="button" onClick={() => copyText(JSON.stringify(snapshot, null, 2))}><Clipboard size={15} /> Export AI cost report</button>
            <button type="button" onClick={() => downloadTextFile('apex-ai-cost-report.json', JSON.stringify(snapshot, null, 2))}><Download size={15} /> Download JSON</button>
            <button type="button" onClick={() => onCreateThresholdAlert?.('AI cost threshold alert — local only, notification connector not connected yet.')}><Plus size={15} /> Set cost threshold alert</button>
            <button type="button" onClick={() => onSaveToProject?.(snapshot)}><Save size={15} /> Save to Project Workspace</button>
            {message && <p className="contracts-message">{message}</p>}
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div><span>Total estimated cost</span><strong>${snapshot.usageSummary.totalEstimatedCost.toFixed(4)}</strong><p>{snapshot.usageSummary.sourceConfidence}</p></div>
            <div><span>Billing source</span><strong>{snapshot.usageSummary.sourceConfidence}</strong><p>Integrated with agent actions.</p></div>
          </div>
          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head"><strong>Cost by module / model</strong><span>{snapshot.moduleBreakdown.length} records</span></div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead><tr><th>Module</th><th>Requests</th><th>Tokens</th><th>Cost</th><th>Model</th><th>Project</th><th>Confidence</th></tr></thead>
                <tbody>
                  {snapshot.moduleBreakdown.map((record, index) => (
                    <tr key={record.id}>
                      <td><select value={record.module} onChange={event => updateRecord(index, { module: event.target.value })}>{aiCostModules.map(module => <option key={module}>{module}</option>)}</select></td>
                      <td><input type="number" value={record.requestCount} onChange={event => updateRecord(index, { requestCount: Number(event.target.value) })} /></td>
                      <td><input type="number" value={record.estimatedTokens} onChange={event => updateRecord(index, { estimatedTokens: Number(event.target.value) })} /></td>
                      <td><input type="number" value={record.estimatedCost} onChange={event => updateRecord(index, { estimatedCost: Number(event.target.value) })} /></td>
                      <td><input value={record.model} onChange={event => updateRecord(index, { model: event.target.value })} /></td>
                      <td><input value={record.userProject} onChange={event => updateRecord(index, { userProject: event.target.value })} /></td>
                      <td><select value={record.sourceConfidence} onChange={event => updateRecord(index, { sourceConfidence: event.target.value as AiCostSourceConfidence })}><option>ESTIMATED_LOCAL</option><option>USER_ENTERED</option><option>PROVIDER_BILLING_SOURCE</option></select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="contracts-grid">
            <OutputCard title="High usage warnings" items={snapshot.costWarnings} />
            <OutputCard title="Cost by project/model note" items={['Group by project/model is local UI state only until usage records are connected to auth/database.', 'Set alerts locally; notification connector is not connected.']} />
          </div>
        </div>
      </div>
    </section>
  )
}

function OutputCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="contracts-card">
      <strong>{title}</strong>
      <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
  )
}
