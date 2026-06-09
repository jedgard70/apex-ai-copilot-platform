import { useState } from 'react'
import { Clipboard, Download, GitBranch, Save, X } from 'lucide-react'
import { createDigitalTwinPlan, DigitalTwinPlan } from '../lib/digitalTwinKnowledge'

type Props = { goal: string; conversationContext: string[]; onSaveToProject?: (plan: DigitalTwinPlan) => void; onClear: () => void }
function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function download(name: string, text: string) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url) }

export function DigitalTwinPanel({ goal, conversationContext, onSaveToProject, onClear }: Props) {
  const [plan, setPlan] = useState<DigitalTwinPlan>(() => createDigitalTwinPlan(goal))
  async function refresh() { const r = await fetch('/api/copilot/digital-twin-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, conversationContext }) }); const d = await r.json().catch(() => ({})); if (d.plan) setPlan(d.plan) }
  return <section className="contracts-studio"><div className="contracts-heading"><div><span><GitBranch size={16}/> Digital Twin UI</span><h2>Local model-state workspace</h2><p>No fake real-time IoT, no fake live model sync. Provider status: {plan.providerStatus}.</p></div><button className="ghost-action" onClick={onClear}><X size={16}/></button></div><div className="contracts-layout"><aside className="contracts-controls"><div className="contracts-card"><strong>Connector status</strong><p>Sensor/IoT: {plan.sensorConnectorStatus}</p><button className="contracts-primary" onClick={refresh}>Generate twin plan</button></div><div className="contracts-card"><strong>Actions</strong><button onClick={() => copy(plan.digitalTwinReport)}><Clipboard size={15}/> Copy digital twin report</button><button onClick={() => download('apex-digital-twin-report.json', JSON.stringify(plan, null, 2))}><Download size={15}/> Export report</button><button onClick={() => onSaveToProject?.(plan)}><Save size={15}/> Save to Project Workspace</button></div></aside><div className="contracts-main"><Grid title="Asset/model state" items={plan.assetModelState}/><Grid title="Linked sources" items={plan.linkedSources}/><Grid title="Status timeline" items={plan.statusTimeline}/><Grid title="Issue overlay plan" items={plan.issueOverlayPlan}/><Grid title="Twin health indicators" items={plan.twinHealthIndicators}/></div></div></section>
}
function Grid({ title, items }: { title: string; items: string[] }) { return <div className="contracts-card"><strong>{title}</strong><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div> }
