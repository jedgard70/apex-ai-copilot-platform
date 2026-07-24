import { useEffect, useState } from 'react'
import { Activity, Clipboard, Download, Save, X } from 'lucide-react'
import { createMetricsPlan, MetricsPlan } from '../lib/metricsKnowledge'
import { ProjectWorkspace } from '../lib/projectWorkspace'

type Props = {
  goal: string
  conversationContext: string[]
  project: ProjectWorkspace
  runtimeSummary: {
    selectedModel: string
    modelState: string
    lastResponseMode: string
    persistenceMode: string
  }
  onSaveToProject?: (plan: MetricsPlan) => void
  onClear: () => void
}
function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function download(name: string, text: string) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url) }

export function MetricsDashboardPanel({ goal, conversationContext, project, runtimeSummary, onSaveToProject, onClear }: Props) {
  const [plan, setPlan] = useState<MetricsPlan>(() => createMetricsPlan(goal))
  async function refresh() {
    const projectSummary = {
      name: project.name,
      files: project.files.length,
      messages: project.chatMessages.length,
      exports: project.exports.length,
      activeStudio: project.activeStudio || 'none',
      generationHistory: project.generationHistory.length,
    }
    const r = await fetch('/api/copilot/metrics-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, conversationContext, projectSummary, runtimeSummary }),
    })
    const d = await r.json().catch(() => ({}))
    if (d.plan) setPlan(d.plan)
  }
  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 30000)
    return () => window.clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, project.name, project.files.length, project.chatMessages.length, project.exports.length, project.activeStudio, project.generationHistory.length, runtimeSummary.selectedModel, runtimeSummary.modelState, runtimeSummary.lastResponseMode, runtimeSummary.persistenceMode])
  return <section className="contracts-studio"><div className="contracts-heading"><div><span><Activity size={16}/> Platform Status</span><h2>General platform status</h2><p>Current shared runtime view for app and web. Provider status: {plan.providerStatus}.</p></div><button className="ghost-action" onClick={onClear}><X size={16}/></button></div><div className="contracts-layout"><aside className="contracts-controls"><div className="contracts-card"><strong>Runtime status</strong><ul>{plan.runtimeStatus.map(i => <li key={i}>{i}</li>)}</ul></div><div className="contracts-card"><strong>Connector status</strong><ul>{plan.connectorStatus.map(i => <li key={i}>{i}</li>)}</ul><button className="contracts-primary" onClick={refresh}>Refresh status</button></div><div className="contracts-card"><strong>Actions</strong><button onClick={() => copy(plan.metricsReport)}><Clipboard size={15}/> Copy report</button><button onClick={() => download('apex-platform-status.json', JSON.stringify(plan, null, 2))}><Download size={15}/> Export report</button><button onClick={() => onSaveToProject?.(plan)}><Save size={15}/> Save to Project Workspace</button></div></aside><div className="contracts-main"><div className="contracts-card contracts-table-card"><div className="contracts-section-head"><strong>Endpoint status</strong><span>{plan.apiMetrics.length}</span></div><div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Endpoint</th><th>Health</th><th>Source</th></tr></thead><tbody>{plan.apiMetrics.map(m => <tr key={m.endpoint}><td>{m.endpoint}</td><td>{m.health}</td><td>{m.source}</td></tr>)}</tbody></table></div></div><div className="contracts-card contracts-table-card"><div className="contracts-section-head"><strong>Module activity</strong><span>ESTIMATED_LOCAL</span></div><div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Module</th><th>Activity</th><th>Source</th></tr></thead><tbody>{plan.moduleUsage.map(m => <tr key={m.module}><td>{m.module}</td><td>{m.activity}</td><td>{m.source}</td></tr>)}</tbody></table></div></div><Grid title="Project status" items={plan.projectActivity}/></div></div></section>
}
function Grid({ title, items }: { title: string; items: string[] }) { return <div className="contracts-card"><strong>{title}</strong><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div> }
