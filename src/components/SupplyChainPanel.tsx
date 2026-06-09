import { useState } from 'react'
import { Clipboard, Download, PackageSearch, Plus, Save, Send, X } from 'lucide-react'
import {
  ProcurementItem,
  SupplierRecord,
  SupplyChainPlan,
  SupplySourceConfidence,
  createLocalSupplyChainPlan,
  supplierCategories,
} from '../lib/supplyChainKnowledge'

type SupplyChainPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: SupplyChainPlan) => void
  onClear: () => void
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
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

function emptySupplier(): SupplierRecord {
  return {
    id: `supplier-${Date.now()}`,
    name: 'New supplier',
    category: 'Materials',
    contact: '',
    region: '',
    rating: 'Not rated',
    status: 'Needs verification',
    paymentTerms: 'To confirm',
    leadTime: 'To confirm',
    complianceDocs: 'Pending',
    contractLink: '',
    notes: '',
    sourceConfidence: 'USER_ENTERED',
  }
}

function emptyProcurement(): ProcurementItem {
  return {
    id: `procurement-${Date.now()}`,
    item: 'New procurement item',
    quantity: 1,
    unit: 'item',
    requiredDate: '',
    supplier: '',
    quoteStatus: 'Not requested',
    deliveryStatus: 'Not scheduled',
    costPlaceholder: 0,
    sourceConfidence: 'PLACEHOLDER',
  }
}

export function SupplyChainPanel({ goal, conversationContext, onSaveToProject, onClear }: SupplyChainPanelProps) {
  const [plan, setPlan] = useState<SupplyChainPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generatePlan() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/supply-chain-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Supply Chain planner failed.')
      setPlan(data.plan)
      setMessage(data.plan.message)
    } catch (error) {
      const fallback = createLocalSupplyChainPlan(goal)
      setPlan(fallback)
      setMessage(error instanceof Error ? error.message : fallback.message)
    } finally {
      setLoading(false)
    }
  }

  function ensurePlan() {
    return plan || createLocalSupplyChainPlan(goal)
  }

  function updateSupplier(index: number, patch: Partial<SupplierRecord>) {
    const next = ensurePlan()
    setPlan({ ...next, suppliers: next.suppliers.map((supplier, supplierIndex) => supplierIndex === index ? { ...supplier, ...patch } : supplier) })
  }

  function updateProcurement(index: number, patch: Partial<ProcurementItem>) {
    const next = ensurePlan()
    setPlan({ ...next, procurementItems: next.procurementItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  const snapshot = ensurePlan()

  return (
    <section className="contracts-studio" aria-label="Supply Chain Studio">
      <div className="contracts-heading">
        <div>
          <span><PackageSearch size={16} /> Supply Chain / Suppliers</span>
          <h2>Supplier and procurement workspace</h2>
          <p>No fake supplier price, availability or verification. Use USER_ENTERED, PLACEHOLDER or NEEDS_VERIFICATION.</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Supply Chain Studio"><X size={16} /></button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Connector status</strong>
            <p>Provider status: {snapshot.providerStatus}</p>
            <p>No ERP, supplier marketplace or live quote connector is connected yet.</p>
            <button className="contracts-primary" type="button" onClick={generatePlan} disabled={loading}>
              {loading ? 'Planning...' : 'Generate supplier plan'}
            </button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>Actions</strong>
            <button type="button" onClick={() => setPlan({ ...snapshot, suppliers: [...snapshot.suppliers, emptySupplier()] })}><Plus size={15} /> Add supplier</button>
            <button type="button" onClick={() => setPlan({ ...snapshot, procurementItems: [...snapshot.procurementItems, emptyProcurement()] })}><Plus size={15} /> Add procurement item</button>
            <button type="button" onClick={() => copyText(snapshot.rfqDraft)}><Clipboard size={15} /> Copy RFQ</button>
            <button type="button" onClick={() => downloadTextFile('apex-supply-chain.json', JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8')}><Download size={15} /> Export supplier list</button>
            <button type="button" onClick={() => copyText(JSON.stringify(snapshot.procurementItems, null, 2))}><Send size={15} /> Send cost items to Budget</button>
            <button type="button" onClick={() => copyText(snapshot.suppliers.map(supplier => `${supplier.name}: ${supplier.complianceDocs}`).join('\n'))}><Send size={15} /> Send contract docs to Contracts</button>
            <button type="button" onClick={() => onSaveToProject?.(snapshot)}><Save size={15} /> Save to Project Workspace</button>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Supplier registry</strong>
              <span>{snapshot.suppliers.length} suppliers</span>
            </div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead><tr><th>Name</th><th>Category</th><th>Region</th><th>Rating</th><th>Status</th><th>Terms</th><th>Lead time</th><th>Confidence</th></tr></thead>
                <tbody>
                  {snapshot.suppliers.map((supplier, index) => (
                    <tr key={supplier.id}>
                      <td><input value={supplier.name} onChange={event => updateSupplier(index, { name: event.target.value })} /><small>{supplier.contact || 'no contact'}</small></td>
                      <td><select value={supplier.category} onChange={event => updateSupplier(index, { category: event.target.value as SupplierRecord['category'] })}>{supplierCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></td>
                      <td><input value={supplier.region} onChange={event => updateSupplier(index, { region: event.target.value })} /></td>
                      <td><input value={supplier.rating} onChange={event => updateSupplier(index, { rating: event.target.value })} /></td>
                      <td><input value={supplier.status} onChange={event => updateSupplier(index, { status: event.target.value })} /></td>
                      <td><input value={supplier.paymentTerms} onChange={event => updateSupplier(index, { paymentTerms: event.target.value })} /></td>
                      <td><input value={supplier.leadTime} onChange={event => updateSupplier(index, { leadTime: event.target.value })} /></td>
                      <td><select value={supplier.sourceConfidence} onChange={event => updateSupplier(index, { sourceConfidence: event.target.value as SupplySourceConfidence })}><option>USER_ENTERED</option><option>PLACEHOLDER</option><option>NEEDS_VERIFICATION</option></select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Procurement items</strong>
              <span>{snapshot.procurementItems.length} items</span>
            </div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Required</th><th>Supplier</th><th>Quote</th><th>Delivery</th><th>Cost placeholder</th><th>Confidence</th></tr></thead>
                <tbody>
                  {snapshot.procurementItems.map((item, index) => (
                    <tr key={item.id}>
                      <td><input value={item.item} onChange={event => updateProcurement(index, { item: event.target.value })} /></td>
                      <td><input type="number" value={item.quantity} onChange={event => updateProcurement(index, { quantity: Number(event.target.value) })} /><small>{item.unit}</small></td>
                      <td><input value={item.requiredDate} onChange={event => updateProcurement(index, { requiredDate: event.target.value })} /></td>
                      <td><input value={item.supplier} onChange={event => updateProcurement(index, { supplier: event.target.value })} /></td>
                      <td><input value={item.quoteStatus} onChange={event => updateProcurement(index, { quoteStatus: event.target.value })} /></td>
                      <td><input value={item.deliveryStatus} onChange={event => updateProcurement(index, { deliveryStatus: event.target.value })} /></td>
                      <td><input type="number" value={item.costPlaceholder} onChange={event => updateProcurement(index, { costPlaceholder: Number(event.target.value) })} /></td>
                      <td><select value={item.sourceConfidence} onChange={event => updateProcurement(index, { sourceConfidence: event.target.value as SupplySourceConfidence })}><option>USER_ENTERED</option><option>PLACEHOLDER</option><option>NEEDS_VERIFICATION</option></select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-grid">
            <OutputCard title="Supplier comparison" items={snapshot.supplierComparison.map(item => `${item.supplier}: price ${item.price}, quality ${item.quality}, deadline ${item.deadline}, risk ${item.risk}`)} />
            <OutputCard title="Risks" items={snapshot.risks} />
          </div>
          <div className="contracts-card">
            <div className="contracts-section-head"><strong>RFQ draft</strong><span>local only</span></div>
            <pre className="contracts-draft">{snapshot.rfqDraft}</pre>
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
