import { useState } from 'react'
import { Building2, Clipboard, Download, Save, X } from 'lucide-react'
import { createMultiTenantPlan, MultiTenantPlan } from '../lib/multiTenantKnowledge'

type Props = { goal: string; conversationContext: string[]; onSaveToProject?: (plan: MultiTenantPlan) => void; onClear: () => void }

function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

export function MultiTenantPanel({ goal, conversationContext, onSaveToProject, onClear }: Props) {
  const [plan, setPlan] = useState<MultiTenantPlan>(() => createMultiTenantPlan(goal))
  const [message, setMessage] = useState('')
  async function refresh() {
    const response = await fetch('/api/copilot/multitenant-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, conversationContext }) })
    const data = await response.json().catch(() => ({}))
    if (data.plan) setPlan(data.plan)
    setMessage(data.plan?.providerStatus || 'connected')
  }
  return (
    <section className="contracts-studio">
      <div className="contracts-heading"><div><span><Building2 size={16}/> Multi-tenant readiness</span><h2>Tenant architecture planner</h2><p>No fake Supabase tenant isolation. Multi-tenant ready.</p></div><button className="ghost-action" onClick={onClear}><X size={16}/></button></div>
      <div className="contracts-layout">
        <aside className="contracts-controls"><div className="contracts-card"><strong>Status</strong><p>{plan.providerStatus}</p><button className="contracts-primary" onClick={refresh}>Generate tenant plan</button>{message && <p className="contracts-message">{message}</p>}</div><Actions plan={plan} onSaveToProject={onSaveToProject}/></aside>
        <div className="contracts-main">
          <div className="contracts-card contracts-table-card"><div className="contracts-section-head"><strong>Tenant list</strong><span>{plan.tenants.length}</span></div><div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Name</th><th>Workspace</th><th>Status</th><th>Boundary</th></tr></thead><tbody>{plan.tenants.map(t => <tr key={t.id}><td>{t.name}</td><td>{t.workspaceType}</td><td>{t.status}</td><td>{t.dataBoundary}</td></tr>)}</tbody></table></div></div>
          <Grid title="Project isolation plan" items={plan.projectIsolationPlan}/><Grid title="RLS readiness checklist" items={plan.rlsReadinessChecklist}/><Grid title="Tenant risk checklist" items={plan.tenantRiskChecklist}/>
        </div>
      </div>
    </section>
  )
}

function Actions({ plan, onSaveToProject }: { plan: MultiTenantPlan; onSaveToProject?: (plan: MultiTenantPlan) => void }) {
  return <div className="contracts-card"><strong>Actions</strong><button onClick={() => copy(plan.exportPlan)}><Clipboard size={15}/> Copy architecture plan</button><button onClick={() => download('apex-tenant-plan.json', JSON.stringify(plan, null, 2))}><Download size={15}/> Export tenant architecture plan</button><button onClick={() => onSaveToProject?.(plan)}><Save size={15}/> Save to Project Workspace</button></div>
}
function Grid({ title, items }: { title: string; items: string[] }) { return <div className="contracts-card"><strong>{title}</strong><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div> }
