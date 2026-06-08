import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  FileJson,
  FileText,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'
import {
  ContractContext,
  ContractDocumentType,
  ContractEvidence,
  ContractReviewMode,
  ContractRiskItem,
  ContractsPlan,
  ContractSeverity,
  ContractStatus,
  contractDocumentTypes,
  contractReviewModes,
  emptyContractsPlan,
  legalDisclaimer,
  permitCategories,
} from '../lib/contractsKnowledge'

type ContractsPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  onSendToBudget?: (summary: string) => void
  onSaveToProject?: (payload: ContractsPlan) => void
  onClear: () => void
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function initialContext(): ContractContext {
  return {
    documentType: 'Contract',
    projectName: '',
    parties: '',
    location: '',
    language: navigator.language?.toLowerCase().startsWith('pt') ? 'PT' : 'EN',
    reviewMode: 'Draft',
  }
}

function downloadTextFile(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function planText(plan: ContractsPlan) {
  return [
    legalDisclaimer,
    '',
    'Document summary:',
    plan.documentSummary,
    '',
    'Client-facing summary:',
    plan.clientFacingSummary,
    '',
    'Lawyer review summary:',
    plan.lawyerReviewSummary,
    '',
    'Pending questions:',
    ...plan.pendingQuestions.map(item => `- ${item}`),
  ].join('\n')
}

export function ContractsPanel({ source, goal, conversationContext, onSendToBudget, onSaveToProject, onClear }: ContractsPanelProps) {
  const [context, setContext] = useState<ContractContext>(() => initialContext())
  const [plan, setPlan] = useState<ContractsPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [draftClause, setDraftClause] = useState('Payment schedule and scope clarity')

  function updateContext<K extends keyof ContractContext>(key: K, value: ContractContext[K]) {
    setContext(prev => ({ ...prev, [key]: value }))
  }

  async function generatePlan(action: 'draft' | 'review' | 'permits') {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/contracts-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          source: source ? {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            kind: source.kind,
          } : null,
          goal,
          conversationContext,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Contracts planner failed.')
      setPlan(data.plan)
      setMessage(data.plan.message || 'Contracts Studio draft generated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Contracts planner failed.')
    } finally {
      setLoading(false)
    }
  }

  function updateRisk(index: number, patch: Partial<ContractRiskItem>) {
    const current = plan || emptyContractsPlan(context)
    const riskItems = current.riskItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    setPlan({ ...current, riskItems })
  }

  function addClause() {
    const current = plan || emptyContractsPlan(context)
    const item: ContractRiskItem = {
      id: id(),
      clause: draftClause || 'New clause',
      issue: 'Manual clause added for review.',
      severity: 'Medium',
      evidence: 'ASSUMPTION',
      recommendation: 'Review wording, scope, responsibility and acceptance criteria.',
      ownerAction: 'Confirm whether this clause belongs in the client-facing draft.',
      status: 'Open',
    }
    setPlan({ ...current, riskItems: [...current.riskItems, item] })
    setDraftClause('')
  }

  function exportJson() {
    const snapshot = plan || emptyContractsPlan(context)
    downloadTextFile('apex-contracts-review.json', JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8')
  }

  return (
    <section className="contracts-studio" aria-label="Contracts Permits Studio">
      <div className="contracts-heading">
        <div>
          <span>Contracts / Permits Studio</span>
          <h2>Contracts, permits and compliance workspace</h2>
          <p>{legalDisclaimer}</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Contracts Studio">
          <X size={16} />
        </button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Document context</strong>
            <label>Document type
              <select value={context.documentType} onChange={event => updateContext('documentType', event.target.value as ContractDocumentType)}>
                {contractDocumentTypes.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>Project name
              <input value={context.projectName} onChange={event => updateContext('projectName', event.target.value)} />
            </label>
            <label>Parties
              <input value={context.parties} placeholder="Owner, client, contractor" onChange={event => updateContext('parties', event.target.value)} />
            </label>
            <label>Location / jurisdiction
              <input value={context.location} placeholder="city, state, country" onChange={event => updateContext('location', event.target.value)} />
            </label>
            <div className="contracts-two">
              <label>Language
                <select value={context.language} onChange={event => updateContext('language', event.target.value)}>
                  <option value="EN">EN</option>
                  <option value="PT">PT</option>
                  <option value="Bilingual">Bilingual</option>
                </select>
              </label>
              <label>Review mode
                <select value={context.reviewMode} onChange={event => updateContext('reviewMode', event.target.value as ContractReviewMode)}>
                  {contractReviewModes.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="contracts-card">
            <strong>Source document</strong>
            {source ? (
              <div className="contracts-source">
                <FileText size={18} />
                <div>
                  <span>{source.file.name}</span>
                  <small>{source.kind} · {formatSize(source.file.size)}</small>
                </div>
              </div>
            ) : (
              <p>No uploaded document. Apex will draft from typed project context and assumptions.</p>
            )}
            <button className="contracts-primary" type="button" onClick={() => generatePlan('draft')} disabled={loading}><ShieldCheck size={16} /> Generate contract draft</button>
            <button type="button" onClick={() => generatePlan('review')} disabled={loading}><AlertTriangle size={16} /> Review uploaded document</button>
            <button type="button" onClick={() => generatePlan('permits')} disabled={loading}><Clipboard size={16} /> Permit checklist report</button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>Add clause / risk</strong>
            <input value={draftClause} onChange={event => setDraftClause(event.target.value)} />
            <button type="button" onClick={addClause}><Plus size={15} /> Add clause</button>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div>
              <span>Provider status</span>
              <strong>{plan?.providerStatus || 'planning-only'}</strong>
              <p>{plan?.documentSummary || 'Generate a draft/review first.'}</p>
            </div>
            <div>
              <span>Jurisdiction status</span>
              <strong>{plan?.jurisdictionStatus || (context.location ? 'ASSUMPTION' : 'UNKNOWN')}</strong>
              <p>Permit/legal requirements are general guidance until confirmed by jurisdiction source or lawyer review.</p>
            </div>
          </div>

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Clause / risk review</strong>
              <span>{plan?.riskItems.length || 0} items</span>
            </div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead>
                  <tr>
                    <th>Clause</th>
                    <th>Issue / risk</th>
                    <th>Severity</th>
                    <th>Evidence</th>
                    <th>Recommendation</th>
                    <th>Owner action</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(plan?.riskItems || []).map((item, index) => (
                    <tr key={item.id}>
                      <td><input value={item.clause} onChange={event => updateRisk(index, { clause: event.target.value })} /></td>
                      <td><input value={item.issue} onChange={event => updateRisk(index, { issue: event.target.value })} /></td>
                      <td>
                        <select value={item.severity} onChange={event => updateRisk(index, { severity: event.target.value as ContractSeverity })}>
                          {['Low', 'Medium', 'High', 'Critical'].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={item.evidence} onChange={event => updateRisk(index, { evidence: event.target.value as ContractEvidence })}>
                          {['CONFIRMED', 'ASSUMPTION', 'UNKNOWN', 'NEEDS LAWYER REVIEW'].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td><input value={item.recommendation} onChange={event => updateRisk(index, { recommendation: event.target.value })} /></td>
                      <td><input value={item.ownerAction} onChange={event => updateRisk(index, { ownerAction: event.target.value })} /></td>
                      <td>
                        <select value={item.status} onChange={event => updateRisk(index, { status: event.target.value as ContractStatus })}>
                          {['Open', 'In Review', 'Resolved'].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="contracts-mini-actions">
                          <button type="button" title="Needs lawyer review" onClick={() => updateRisk(index, { evidence: 'NEEDS LAWYER REVIEW', severity: item.severity === 'Critical' ? 'Critical' : 'High' })}><AlertTriangle size={14} /></button>
                          <button type="button" title="Resolved" onClick={() => updateRisk(index, { status: 'Resolved' })}><CheckCircle2 size={14} /></button>
                          <button type="button" title="Remove" onClick={() => plan && setPlan({ ...plan, riskItems: plan.riskItems.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!plan?.riskItems.length && <tr><td colSpan={8}>No risk items yet. Generate a review or add a clause manually.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-grid">
            <div className="contracts-card">
              <strong>Permits / compliance checklist</strong>
              {(plan?.permitChecklist || permitCategories.map((category, index) => ({
                id: `permit-${index}`,
                category,
                requirement: 'General planning checklist item; confirm locally.',
                evidence: 'UNKNOWN' as ContractEvidence,
                status: 'Open' as ContractStatus,
              }))).map(item => (
                <article className="contracts-check-item" key={item.id}>
                  <span>{item.category}</span>
                  <p>{item.requirement}</p>
                  <small>{item.evidence} · {item.status}</small>
                </article>
              ))}
            </div>
            <div className="contracts-card">
              <strong>Memorial / descriptive scope</strong>
              <ScopeBlock title="Services included" items={plan?.scopeDraft.servicesIncluded || []} />
              <ScopeBlock title="Materials/specs" items={plan?.scopeDraft.materialsSpecs || []} />
              <ScopeBlock title="Exclusions" items={plan?.scopeDraft.exclusions || []} />
              <ScopeBlock title="Owner supplied" items={plan?.scopeDraft.ownerSuppliedItems || []} />
              <ScopeBlock title="Quality standards" items={plan?.scopeDraft.qualityStandards || []} />
              <ScopeBlock title="Deliverables" items={plan?.scopeDraft.deliverables || []} />
              <ScopeBlock title="Change order rules" items={plan?.scopeDraft.changeOrderRules || []} />
              <ScopeBlock title="Acceptance criteria" items={plan?.scopeDraft.acceptanceCriteria || []} />
            </div>
          </div>

          <div className="contracts-card">
            <div className="contracts-section-head">
              <strong>Draft generator</strong>
              <span>not legal approval</span>
            </div>
            <pre className="contracts-draft">{plan?.contractDraft || 'Generate a contract draft, risk review or permit checklist first.'}</pre>
          </div>

          <div className="contracts-actions">
            <button type="button" onClick={exportJson}><FileJson size={15} /> Export risk report JSON</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(plan.clientFacingSummary)}><Clipboard size={15} /> Copy client-facing version</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(plan.lawyerReviewSummary)}><FileText size={15} /> Copy lawyer review summary</button>
            <button type="button" disabled={!plan} onClick={() => plan && onSendToBudget?.(planText(plan))}><Send size={15} /> Send scope to Budget</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(planText(plan))}><Download size={15} /> Copy full report</button>
            <button type="button" disabled={!plan} onClick={() => plan && onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScopeBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="contracts-scope-block">
      <span>{title}</span>
      {items.length ? items.map(item => <p key={item}>{item}</p>) : <p>Pending.</p>}
    </div>
  )
}

