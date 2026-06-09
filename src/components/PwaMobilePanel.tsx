import { useState } from 'react'
import { Clipboard, Download, Smartphone, Save, X } from 'lucide-react'
import { createPwaMobilePlan, PwaMobilePlan } from '../lib/pwaMobileKnowledge'

type Props = { goal: string; conversationContext: string[]; onSaveToProject?: (plan: PwaMobilePlan) => void; onClear: () => void }
function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function download(name: string, text: string) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url) }

export function PwaMobilePanel({ goal, conversationContext, onSaveToProject, onClear }: Props) {
  const [plan, setPlan] = useState<PwaMobilePlan>(() => createPwaMobilePlan(goal))
  async function refresh() { const r = await fetch('/api/copilot/pwa-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, conversationContext }) }); const d = await r.json().catch(() => ({})); if (d.plan) setPlan(d.plan) }
  return <section className="contracts-studio"><div className="contracts-heading"><div><span><Smartphone size={16}/> PWA / Mobile field mode</span><h2>Mobile field workflow planner</h2><p>No fake installed PWA. This is a planning/checklist workspace until manifest/service worker are implemented and validated.</p></div><button className="ghost-action" onClick={onClear}><X size={16}/></button></div><div className="contracts-layout"><aside className="contracts-controls"><div className="contracts-card"><strong>Status</strong><p>{plan.providerStatus}</p><button className="contracts-primary" onClick={refresh}>Generate PWA checklist</button></div><div className="contracts-card"><strong>Actions</strong><button onClick={() => copy(plan.exportChecklist)}><Clipboard size={15}/> Copy checklist</button><button onClick={() => download('apex-pwa-mobile-checklist.json', JSON.stringify(plan, null, 2))}><Download size={15}/> Export PWA checklist</button><button onClick={() => onSaveToProject?.(plan)}><Save size={15}/> Save to Project Workspace</button></div></aside><div className="contracts-main"><Grid title="Mobile field workflow" items={plan.mobileFieldWorkflow}/><Grid title="Offline-first plan" items={plan.offlineFirstPlan}/><Grid title="Installability checklist" items={plan.installabilityChecklist}/><Grid title="Sync queue plan" items={plan.syncQueuePlan}/><Grid title="Field user UX" items={plan.fieldUserUx}/></div></div></section>
}
function Grid({ title, items }: { title: string; items: string[] }) { return <div className="contracts-card"><strong>{title}</strong><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div> }
