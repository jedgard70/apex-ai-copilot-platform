import { useMemo, useState } from 'react'
import {
  Calculator,
  CheckCircle2,
  Clipboard,
  Download,
  FileJson,
  FileText,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'
import {
  BudgetAssumptions,
  BudgetConfidence,
  BudgetCurrency,
  BudgetEstimateItem,
  BudgetPlan,
  BudgetSource,
  BudgetStandard,
  BudgetUnitSystem,
  calculateSubtotal,
  defaultBudgetAssumptions,
  formatMoney,
  quantitySections,
} from '../lib/budgetKnowledge'

type BudgetPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: BudgetPlan) => void
  onSendToDirectCut?: (summary: string) => void
  onClear: () => void
}

type DraftItem = Omit<BudgetEstimateItem, 'id' | 'subtotal'>

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function initialAssumptions(source?: IntakeFile): BudgetAssumptions {
  return {
    ...defaultBudgetAssumptions,
    projectType: source?.kind === 'bim-cad' ? 'BIM / 3D model estimate' : 'Residential preliminary estimate',
    currency: navigator.language?.toLowerCase().startsWith('pt') ? 'BRL' : 'USD',
  }
}

function emptyDraft(): DraftItem {
  return {
    section: 'finishes',
    item: 'New estimate item',
    unit: 'item',
    quantity: 1,
    unitPrice: 0,
    confidence: 'UNKNOWN',
    source: 'assumption',
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

function planTotal(items: BudgetEstimateItem[]) {
  return items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
}

function planAsTable(plan: BudgetPlan) {
  return [
    ['Section', 'Item', 'Unit', 'Quantity', 'Unit price', 'Subtotal', 'Confidence', 'Source'].join('\t'),
    ...plan.estimateItems.map(item => [
      item.section,
      item.item,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.subtotal,
      item.confidence,
      item.source,
    ].join('\t')),
  ].join('\n')
}

function proposalFromPlan(plan: BudgetPlan) {
  const total = formatMoney(planTotal(plan.estimateItems), plan.assumptions.currency)
  return [
    plan.proposalDraft,
    '',
    `Preliminary estimate total: ${total}`,
    `Confidence: ${plan.confidenceSummary}`,
    '',
    'Included scope:',
    ...plan.scopeIncluded.map(item => `- ${item}`),
    '',
    'Excluded scope:',
    ...plan.scopeExcluded.map(item => `- ${item}`),
    '',
    'Pending clarifications:',
    ...plan.pendingQuestions.map(item => `- ${item}`),
  ].join('\n')
}

export function BudgetPanel({
  source,
  goal,
  conversationContext,
  onSaveToProject,
  onSendToDirectCut,
  onClear,
}: BudgetPanelProps) {
  const [assumptions, setAssumptions] = useState<BudgetAssumptions>(() => initialAssumptions(source))
  const [plan, setPlan] = useState<BudgetPlan | null>(null)
  const [draftItem, setDraftItem] = useState<DraftItem>(() => emptyDraft())
  const [scopeIncluded, setScopeIncluded] = useState<string[]>(['Preliminary quantity and budget review'])
  const [scopeExcluded, setScopeExcluded] = useState<string[]>(['Permit fees', 'taxes', 'supplier final quote', 'engineering stamps'])
  const [ownerSupplied, setOwnerSupplied] = useState<string[]>([])
  const [pendingClarification, setPendingClarification] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const currentItems = plan?.estimateItems || []
  const total = useMemo(() => planTotal(currentItems), [currentItems])

  function updateAssumption<K extends keyof BudgetAssumptions>(key: K, value: BudgetAssumptions[K]) {
    setAssumptions(prev => ({ ...prev, [key]: value }))
  }

  function updateItem(index: number, patch: Partial<BudgetEstimateItem>) {
    if (!plan) return
    const estimateItems = plan.estimateItems.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, ...patch }
      return { ...next, subtotal: calculateSubtotal(next.quantity, next.unitPrice) }
    })
    setPlan({ ...plan, estimateItems })
  }

  function removeItem(index: number) {
    if (!plan) return
    setPlan({ ...plan, estimateItems: plan.estimateItems.filter((_, itemIndex) => itemIndex !== index) })
  }

  function addItem() {
    const item: BudgetEstimateItem = {
      ...draftItem,
      id: id(),
      subtotal: calculateSubtotal(draftItem.quantity, draftItem.unitPrice),
    }
    const nextPlan: BudgetPlan = plan || {
      providerStatus: 'estimate-draft',
      assumptions,
      estimateItems: [],
      scopeIncluded,
      scopeExcluded,
      ownerSupplied,
      pendingQuestions: ['Confirm area, scale and local unit prices before final proposal.'],
      proposalDraft: 'Preliminary proposal draft will be generated after estimate items are reviewed.',
      confidenceSummary: 'Manual item added; confidence depends on item source.',
      message: 'Budget draft started from manual item.',
    }
    setPlan({ ...nextPlan, estimateItems: [...nextPlan.estimateItems, item] })
    setDraftItem(emptyDraft())
  }

  async function generateEstimate() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/budget-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assumptions,
          source: source ? {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            kind: source.kind,
            dimensions: source.dimensions,
          } : null,
          goal,
          conversationContext,
          scopeIncluded,
          scopeExcluded,
          ownerSupplied,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Budget planner failed.')
      setPlan(data.plan)
      setScopeIncluded(data.plan.scopeIncluded || scopeIncluded)
      setScopeExcluded(data.plan.scopeExcluded || scopeExcluded)
      setOwnerSupplied(data.plan.ownerSupplied || ownerSupplied)
      setMessage(data.plan.message || 'Preliminary estimate draft created.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Budget planner failed.')
    } finally {
      setLoading(false)
    }
  }

  function markConfirmed(index: number) {
    updateItem(index, { confidence: 'CONFIRMED', source: 'user input' })
  }

  function exportJson() {
    const snapshot = plan || {
      providerStatus: 'planning-only',
      assumptions,
      estimateItems: [],
      scopeIncluded,
      scopeExcluded,
      ownerSupplied,
      pendingQuestions: ['Generate a preliminary estimate first.'],
      proposalDraft: '',
      confidenceSummary: 'No estimate generated yet.',
      message: 'Budget Studio snapshot.',
    }
    downloadTextFile('apex-budget-estimate.json', JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8')
  }

  function exportProposal() {
    if (!plan) return
    downloadTextFile('apex-budget-proposal.txt', proposalFromPlan(plan))
  }

  return (
    <section className="budget-studio" aria-label="Budget Quantity Studio">
      <div className="budget-heading">
        <div>
          <span>Budget / Quantity Studio</span>
          <h2>Preliminary estimate workspace</h2>
          <p>No fake precision. Every quantity and price shows confidence and source.</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Budget Studio">
          <X size={16} />
        </button>
      </div>

      <div className="budget-layout">
        <aside className="budget-controls">
          <div className="budget-card">
            <strong>Project assumptions</strong>
            <label>
              Project type
              <input value={assumptions.projectType} onChange={event => updateAssumption('projectType', event.target.value)} />
            </label>
            <label>
              Area / scale
              <input value={assumptions.area} placeholder="ex: 180 m2 or scale 1:100" onChange={event => updateAssumption('area', event.target.value)} />
            </label>
            <label>
              Location
              <input value={assumptions.location} placeholder="city, state, country" onChange={event => updateAssumption('location', event.target.value)} />
            </label>
            <label>
              Standard level
              <select value={assumptions.standardLevel} onChange={event => updateAssumption('standardLevel', event.target.value as BudgetStandard)}>
                <option value="economical">economical</option>
                <option value="medium">medium</option>
                <option value="high-end">high-end</option>
                <option value="luxury">luxury</option>
              </select>
            </label>
            <div className="budget-two">
              <label>
                Currency
                <select value={assumptions.currency} onChange={event => updateAssumption('currency', event.target.value as BudgetCurrency)}>
                  <option value="USD">USD</option>
                  <option value="BRL">BRL</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
              <label>
                Units
                <select value={assumptions.unitSystem} onChange={event => updateAssumption('unitSystem', event.target.value as BudgetUnitSystem)}>
                  <option value="metric">metric</option>
                  <option value="imperial">imperial</option>
                </select>
              </label>
            </div>
          </div>

          <div className="budget-card">
            <strong>Reference input</strong>
            {source ? (
              <div className="budget-source">
                <FileText size={18} />
                <div>
                  <span>{source.file.name}</span>
                  <small>{source.kind} · {formatSize(source.file.size)}</small>
                </div>
              </div>
            ) : (
              <p>Manual description only. Ask Apex for an estimate and add area/scale for better confidence.</p>
            )}
            <button className="budget-primary" type="button" onClick={generateEstimate} disabled={loading}>
              <Calculator size={16} />
              {loading ? 'Generating draft...' : 'Generate preliminary estimate'}
            </button>
            {message && <p className="budget-message">{message}</p>}
          </div>

          <div className="budget-card">
            <strong>Add item</strong>
            <label>
              Section
              <select value={draftItem.section} onChange={event => setDraftItem(prev => ({ ...prev, section: event.target.value }))}>
                {quantitySections.map(section => <option key={section} value={section}>{section}</option>)}
              </select>
            </label>
            <label>
              Item
              <input value={draftItem.item} onChange={event => setDraftItem(prev => ({ ...prev, item: event.target.value }))} />
            </label>
            <div className="budget-two">
              <label>
                Unit
                <input value={draftItem.unit} onChange={event => setDraftItem(prev => ({ ...prev, unit: event.target.value }))} />
              </label>
              <label>
                Quantity
                <input type="number" value={draftItem.quantity} onChange={event => setDraftItem(prev => ({ ...prev, quantity: Number(event.target.value) }))} />
              </label>
            </div>
            <div className="budget-two">
              <label>
                Unit price
                <input type="number" value={draftItem.unitPrice} onChange={event => setDraftItem(prev => ({ ...prev, unitPrice: Number(event.target.value) }))} />
              </label>
              <label>
                Confidence
                <select value={draftItem.confidence} onChange={event => setDraftItem(prev => ({ ...prev, confidence: event.target.value as BudgetConfidence }))}>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ESTIMATED">ESTIMATED</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </label>
            </div>
            <label>
              Source
              <select value={draftItem.source} onChange={event => setDraftItem(prev => ({ ...prev, source: event.target.value as BudgetSource }))}>
                <option value="drawing">drawing</option>
                <option value="user input">user input</option>
                <option value="BIM metadata">BIM metadata</option>
                <option value="assumption">assumption</option>
              </select>
            </label>
            <button type="button" onClick={addItem}><Plus size={15} /> Add item</button>
          </div>
        </aside>

        <div className="budget-main">
          <div className="budget-card budget-estimate-head">
            <div>
              <span>Provider status</span>
              <strong>{plan?.providerStatus || 'planning-only'}</strong>
              <p>{plan?.confidenceSummary || 'Generate a draft first. Prices are placeholders or user-provided assumptions until a pricing database is connected.'}</p>
            </div>
            <div>
              <span>Total draft</span>
              <strong>{formatMoney(total, assumptions.currency)}</strong>
              <p>SINAPI/price database is not connected yet.</p>
            </div>
          </div>

          <div className="budget-card">
            <div className="budget-section-head">
              <strong>Quantity sections</strong>
              <span>{quantitySections.length} scopes</span>
            </div>
            <div className="budget-section-grid">
              {quantitySections.map(section => <span key={section}>{section}</span>)}
            </div>
          </div>

          <div className="budget-card budget-table-card">
            <div className="budget-section-head">
              <strong>Estimate table</strong>
              <span>{currentItems.length} items</span>
            </div>
            <div className="budget-table-wrap">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Subtotal</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={item.id}>
                      <td><input value={item.item} onChange={event => updateItem(index, { item: event.target.value })} /><small>{item.section}</small></td>
                      <td><input value={item.unit} onChange={event => updateItem(index, { unit: event.target.value })} /></td>
                      <td><input type="number" value={item.quantity} onChange={event => updateItem(index, { quantity: Number(event.target.value) })} /></td>
                      <td><input type="number" value={item.unitPrice} onChange={event => updateItem(index, { unitPrice: Number(event.target.value) })} /></td>
                      <td>{formatMoney(item.subtotal, assumptions.currency)}</td>
                      <td>
                        <select value={item.confidence} onChange={event => updateItem(index, { confidence: event.target.value as BudgetConfidence })}>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="ESTIMATED">ESTIMATED</option>
                          <option value="UNKNOWN">UNKNOWN</option>
                        </select>
                      </td>
                      <td>{item.source}</td>
                      <td>
                        <div className="budget-mini-actions">
                          <button type="button" title="Mark confirmed" onClick={() => markConfirmed(index)}><CheckCircle2 size={14} /></button>
                          <button type="button" title="Remove item" onClick={() => removeItem(index)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!currentItems.length && (
                    <tr>
                      <td colSpan={8}>No estimate items yet. Generate a draft or add an item manually.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="budget-scope-grid">
            <ScopeCard title="Included" items={scopeIncluded} setItems={setScopeIncluded} />
            <ScopeCard title="Excluded" items={scopeExcluded} setItems={setScopeExcluded} />
            <ScopeCard title="Owner supplied" items={ownerSupplied} setItems={setOwnerSupplied} />
            <div className="budget-card">
              <strong>Pending clarification</strong>
              {(plan?.pendingQuestions || []).map(item => <p key={item}>{item}</p>)}
              <div className="budget-inline-add">
                <input value={pendingClarification} onChange={event => setPendingClarification(event.target.value)} placeholder="Add pending question" />
                <button type="button" onClick={() => {
                  if (!pendingClarification.trim()) return
                  const nextPlan = plan || {
                    providerStatus: 'planning-only',
                    assumptions,
                    estimateItems: [],
                    scopeIncluded,
                    scopeExcluded,
                    ownerSupplied,
                    pendingQuestions: [],
                    proposalDraft: '',
                    confidenceSummary: 'Pending questions added manually.',
                    message: 'Manual budget clarification.',
                  } satisfies BudgetPlan
                  setPlan({ ...nextPlan, pendingQuestions: [...nextPlan.pendingQuestions, pendingClarification.trim()] })
                  setPendingClarification('')
                }}>Add</button>
              </div>
            </div>
          </div>

          <div className="budget-card">
            <div className="budget-section-head">
              <strong>Proposal generator</strong>
              <span>draft only</span>
            </div>
            <pre className="budget-proposal">{plan ? proposalFromPlan(plan) : 'Generate an estimate to create proposal text.'}</pre>
          </div>

          <div className="budget-actions">
            <button type="button" onClick={exportJson}><FileJson size={15} /> Export estimate JSON</button>
            <button type="button" disabled={!plan} onClick={exportProposal}><Download size={15} /> Export proposal text</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(planAsTable(plan))}><Clipboard size={15} /> Copy table</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(proposalFromPlan(plan))}><FileText size={15} /> Copy proposal</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(`Contract scope draft:\n${proposalFromPlan(plan)}`)}><Send size={15} /> Send scope to Contracts</button>
            <button type="button" disabled={!plan} onClick={() => plan && onSendToDirectCut?.(proposalFromPlan(plan))}><Send size={15} /> Send project summary to DirectCut</button>
            <button type="button" disabled={!plan} onClick={() => plan && onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScopeCard({ title, items, setItems }: { title: string; items: string[]; setItems: (items: string[]) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="budget-card">
      <strong>{title}</strong>
      <ul>
        {items.map(item => (
          <li key={item}>
            {item}
            <button type="button" onClick={() => setItems(items.filter(value => value !== item))}><X size={12} /></button>
          </li>
        ))}
      </ul>
      <div className="budget-inline-add">
        <input value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Add ${title.toLowerCase()}`} />
        <button type="button" onClick={() => {
          if (!draft.trim()) return
          setItems([...items, draft.trim()])
          setDraft('')
        }}>Add</button>
      </div>
    </div>
  )
}

