import { useState, useMemo } from 'react'
import { Clipboard, Download, PackageSearch, Plus, Save, Send, X, TrendingUp, Users, AlertTriangle, CheckCircle, Truck, DollarSign, Clock } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import {
  ProcurementItem,
  SupplierRecord,
  SupplyChainPlan,
  SupplySourceConfidence,
  createLocalSupplyChainPlan,
  supplierCategories,
} from '../lib/supplyChainKnowledge'

const D = {
  outlineVariant: 'var(--border, #e2e8f0)',
  primary: 'var(--primary, #2563eb)',
  surfaceContainerHighest: 'var(--surface-high, #f8fafc)',
  onSurface: 'var(--text-main, #1e293b)',
  onSurfaceVariant: 'var(--text-muted, #64748b)',
  surfaceContainerHigh: 'var(--surface-mid, #f1f5f9)',
  onPrimary: '#ffffff',
  secondary: 'var(--secondary, #475569)',
  primaryContainer: 'var(--primary-light, #dbeafe)',
  onPrimaryContainer: 'var(--primary-dark, #1e3a8a)',
  surfaceContainer: 'var(--surface, #ffffff)',
}

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
    sourceConfidence: 'NEEDS_VERIFICATION',
  }
}

function emptyProcurement(): ProcurementItem {
  return {
    id: `procurement-${Date.now()}`,
    item: 'New item',
    quantity: 1,
    unit: 'un',
    requiredDate: '',
    supplier: '',
    quoteStatus: 'Not requested',
    deliveryStatus: 'Not scheduled',
    costPlaceholder: 0,
    sourceConfidence: 'NEEDS_VERIFICATION',
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
    setPlan({ ...next, suppliers: next.suppliers.map((supplier, i) => i === index ? { ...supplier, ...patch } : supplier) })
  }

  function updateProcurement(index: number, patch: Partial<ProcurementItem>) {
    const next = ensurePlan()
    setPlan({ ...next, procurementItems: next.procurementItems.map((item, i) => i === index ? { ...item, ...patch } : item) })
  }

  const snapshot = ensurePlan()

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalCost = snapshot.procurementItems.reduce((acc, item) => acc + (item.costPlaceholder * item.quantity), 0)
    const verifiedSuppliers = snapshot.suppliers.filter(s => s.status.toLowerCase().includes('verified') || s.sourceConfidence === 'USER_ENTERED').length
    const quotedItems = snapshot.procurementItems.filter(i => i.quoteStatus.toLowerCase().includes('received') || i.quoteStatus.toLowerCase().includes('approved')).length
    return { totalCost, verifiedSuppliers, quotedItems }
  }, [snapshot])

  const getConfidenceBadge = (confidence: SupplySourceConfidence) => {
    const colors = {
      'USER_ENTERED': '#22c55e',
      'PLACEHOLDER': '#eab308',
      'NEEDS_VERIFICATION': '#ef4444'
    }
    const color = colors[confidence] || '#999'
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: `${color}15`, color, fontSize: 10, fontWeight: 600, border: `1px solid ${color}30` }}>
        {confidence === 'USER_ENTERED' && <CheckCircle size={10} />}
        {confidence === 'PLACEHOLDER' && <Clock size={10} />}
        {confidence === 'NEEDS_VERIFICATION' && <AlertTriangle size={10} />}
        {confidence.replace('_', ' ')}
      </span>
    )
  }

  return (
    <PremiumPanelLayout 
      title="Gestão de Cotações e Suprimentos" 
      subtitle="Ações e configurações operacionais"
      headerActions={<button className="ghost-action" type="button" onClick={onClear} aria-label="Close Supply Chain Studio" style={{ background: D.surfaceContainerHighest, border: `1px solid ${D.outlineVariant}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>}
    >

      <div className="contracts-layout">
        <aside className="contracts-controls" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dashboard Summary Widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: D.surfaceContainerHighest, padding: 16, borderRadius: 12, border: `1px solid ${D.outlineVariant}` }}>
              <Users size={16} color={D.primary} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: D.onSurface }}>{snapshot.suppliers.length}</div>
              <div style={{ fontSize: 11, color: D.onSurfaceVariant }}>Fornecedores ({metrics.verifiedSuppliers} validados)</div>
            </div>
            <div style={{ background: D.surfaceContainerHighest, padding: 16, borderRadius: 12, border: `1px solid ${D.outlineVariant}` }}>
              <TrendingUp size={16} color="#22c55e" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: D.onSurface }}>{snapshot.procurementItems.length}</div>
              <div style={{ fontSize: 11, color: D.onSurfaceVariant }}>Itens Cotados ({metrics.quotedItems} aprovados)</div>
            </div>
          </div>

          <div style={{ background: D.surfaceContainerHighest, padding: 16, borderRadius: 12, border: `1px solid ${D.outlineVariant}` }}>
            <DollarSign size={16} color="#eab308" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: D.onSurface }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalCost)}</div>
            <div style={{ fontSize: 11, color: D.onSurfaceVariant }}>Custo Total Estimado de Suprimentos</div>
          </div>

          <div className="contracts-card" style={{ padding: 16, borderRadius: 12, background: D.surfaceContainerHigh }}>
            <strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Status do Conector ERP/Procurement</strong>
            <p style={{ fontSize: 12, color: D.onSurfaceVariant, marginBottom: 16 }}>Modo atual: <b>{snapshot.providerStatus}</b>. Os dados de preço são estimativas locais (placeholder) até a integração final do módulo B2B.</p>
            <button className="contracts-primary" type="button" onClick={generatePlan} disabled={loading} style={{ width: '100%', padding: 10, borderRadius: 8, background: D.primary, color: D.onPrimary, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Sincronizando IA...' : 'Analisar e Otimizar com IA'}
            </button>
            {message && <p style={{ fontSize: 11, color: D.secondary, marginTop: 10, padding: 8, background: D.surfaceContainerHighest, borderRadius: 6 }}>{message}</p>}
          </div>

          <div className="contracts-card" style={{ padding: 16, borderRadius: 12, background: D.surfaceContainerHigh }}>
            <strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Ações Rápidas</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button type="button" onClick={() => setPlan({ ...snapshot, suppliers: [...snapshot.suppliers, emptySupplier()] })} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${D.outlineVariant}`, color: D.onSurface, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={14} /> Novo Fornecedor</button>
              <button type="button" onClick={() => setPlan({ ...snapshot, procurementItems: [...snapshot.procurementItems, emptyProcurement()] })} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${D.outlineVariant}`, color: D.onSurface, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={14} /> Novo Item de Compra</button>
              <hr style={{ border: 'none', borderTop: `1px solid ${D.outlineVariant}`, margin: '4px 0' }} />
              <button type="button" onClick={() => copyText(snapshot.rfqDraft)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: 'transparent', border: 'none', color: D.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Clipboard size={14} /> Copiar RFQ Draft</button>
              <button type="button" onClick={() => downloadTextFile('apex-supply-chain.json', JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8')} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: 'transparent', border: 'none', color: D.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Download size={14} /> Exportar Matriz JSON</button>
              <button type="button" onClick={() => onSaveToProject?.(snapshot)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: D.primaryContainer, color: D.onPrimaryContainer, border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}><Save size={14} /> Salvar no Projeto</button>
            </div>
          </div>
        </aside>

        <div className="contracts-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* PROCUREMENT ITEMS TABLE */}
          <div className="contracts-card contracts-table-card" style={{ background: D.surfaceContainer, borderRadius: 12, overflow: 'hidden', border: `1px solid ${D.outlineVariant}` }}>
            <div className="contracts-section-head" style={{ padding: '16px 20px', background: D.surfaceContainerHigh, borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><Truck size={16} color={D.primary} /> Cotações & Suprimentos</strong>
              <span style={{ fontSize: 11, background: D.surfaceContainerHighest, padding: '2px 8px', borderRadius: 12 }}>{snapshot.procurementItems.length} itens</span>
            </div>
            <div className="contracts-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="contracts-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead style={{ background: D.surfaceContainerHighest, color: D.onSurfaceVariant, fontSize: 11, textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Qtd / Unid</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Custo (Est.)</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Fornecedor</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status Cotação</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Entrega (Prazo)</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.procurementItems.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${D.outlineVariant}`, transition: 'background 0.2s' }}>
                      <td style={{ padding: '8px 16px' }}><input value={item.item} onChange={e => updateProcurement(index, { item: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, fontWeight: 500, outline: 'none' }} /></td>
                      <td style={{ padding: '8px 16px', display: 'flex', gap: 4 }}>
                        <input type="number" value={item.quantity} onChange={e => updateProcurement(index, { quantity: Number(e.target.value) })} style={{ width: 50, background: D.surfaceContainerHighest, border: `1px solid ${D.outlineVariant}`, color: D.onSurface, borderRadius: 4, padding: '4px 6px', fontSize: 11 }} />
                        <input value={item.unit} onChange={e => updateProcurement(index, { unit: e.target.value })} style={{ width: 40, background: 'transparent', border: 'none', color: D.onSurfaceVariant, fontSize: 11 }} />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: D.onSurfaceVariant }}>R$</span>
                          <input type="number" value={item.costPlaceholder} onChange={e => updateProcurement(index, { costPlaceholder: Number(e.target.value) })} style={{ width: 70, background: D.surfaceContainerHighest, border: `1px solid ${D.outlineVariant}`, color: D.onSurface, borderRadius: 4, padding: '4px 6px', fontSize: 11 }} />
                        </div>
                      </td>
                      <td style={{ padding: '8px 16px' }}><input value={item.supplier} onChange={e => updateProcurement(index, { supplier: e.target.value })} placeholder="Ex: Votorantim" style={{ width: '100%', background: 'transparent', border: 'none', color: D.primary, outline: 'none', fontSize: 12 }} /></td>
                      <td style={{ padding: '8px 16px' }}><input value={item.quoteStatus} onChange={e => updateProcurement(index, { quoteStatus: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, outline: 'none', fontSize: 12 }} /></td>
                      <td style={{ padding: '8px 16px' }}>
                        <input value={item.deliveryStatus} onChange={e => updateProcurement(index, { deliveryStatus: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, outline: 'none', fontSize: 12, marginBottom: 2 }} />
                        <input type="date" value={item.requiredDate} onChange={e => updateProcurement(index, { requiredDate: e.target.value })} style={{ width: '100%', background: D.surfaceContainerHighest, border: 'none', color: D.onSurfaceVariant, borderRadius: 4, padding: '2px 4px', fontSize: 10 }} />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <select value={item.sourceConfidence} onChange={e => updateProcurement(index, { sourceConfidence: e.target.value as SupplySourceConfidence })} style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', opacity: 0 }}>
                          <option>USER_ENTERED</option><option>PLACEHOLDER</option><option>NEEDS_VERIFICATION</option>
                        </select>
                        <div style={{ marginTop: -20, pointerEvents: 'none' }}>{getConfidenceBadge(item.sourceConfidence)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SUPPLIERS TABLE */}
          <div className="contracts-card contracts-table-card" style={{ background: D.surfaceContainer, borderRadius: 12, overflow: 'hidden', border: `1px solid ${D.outlineVariant}` }}>
            <div className="contracts-section-head" style={{ padding: '16px 20px', background: D.surfaceContainerHigh, borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><PackageSearch size={16} color={D.primary} /> Base de Fornecedores Homologados</strong>
              <span style={{ fontSize: 11, background: D.surfaceContainerHighest, padding: '2px 8px', borderRadius: 12 }}>{snapshot.suppliers.length} cadastros</span>
            </div>
            <div className="contracts-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="contracts-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead style={{ background: D.surfaceContainerHighest, color: D.onSurfaceVariant, fontSize: 11, textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Empresa / Contato</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Categoria</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Região</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Avaliação</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status Compliance</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.suppliers.map((supplier, index) => (
                    <tr key={supplier.id} style={{ borderBottom: `1px solid ${D.outlineVariant}` }}>
                      <td style={{ padding: '10px 16px' }}>
                        <input value={supplier.name} onChange={e => updateSupplier(index, { name: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, fontWeight: 600, outline: 'none' }} />
                        <input value={supplier.contact} onChange={e => updateSupplier(index, { contact: e.target.value })} placeholder="Contato / Email" style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurfaceVariant, fontSize: 10, outline: 'none', marginTop: 2 }} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <select value={supplier.category} onChange={e => updateSupplier(index, { category: e.target.value as SupplierRecord['category'] })} style={{ background: D.surfaceContainerHighest, border: `1px solid ${D.outlineVariant}`, color: D.onSurface, borderRadius: 6, padding: '4px 8px', fontSize: 11, outline: 'none' }}>
                          {supplierCategories.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 16px' }}><input value={supplier.region} onChange={e => updateSupplier(index, { region: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, outline: 'none' }} /></td>
                      <td style={{ padding: '10px 16px' }}><input value={supplier.rating} onChange={e => updateSupplier(index, { rating: e.target.value })} placeholder="Ex: 4.8 / A+" style={{ width: '80%', background: 'transparent', border: 'none', color: '#eab308', fontWeight: 600, outline: 'none' }} /></td>
                      <td style={{ padding: '10px 16px' }}>
                        <input value={supplier.status} onChange={e => updateSupplier(index, { status: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: D.onSurface, outline: 'none', marginBottom: 2 }} />
                        <div style={{ fontSize: 9, color: D.onSurfaceVariant }}>Doc: <input value={supplier.complianceDocs} onChange={e => updateSupplier(index, { complianceDocs: e.target.value })} style={{ background: 'transparent', border: 'none', color: D.primary, width: 80, outline: 'none' }} /></div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <select value={supplier.sourceConfidence} onChange={e => updateSupplier(index, { sourceConfidence: e.target.value as SupplySourceConfidence })} style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', opacity: 0 }}>
                          <option>USER_ENTERED</option><option>PLACEHOLDER</option><option>NEEDS_VERIFICATION</option>
                        </select>
                        <div style={{ marginTop: -20, pointerEvents: 'none' }}>{getConfidenceBadge(supplier.sourceConfidence)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <OutputCard title="Comparativo de Fornecedores" items={snapshot.supplierComparison.map(item => `${item.supplier} - Preço: ${item.price} | Risco: ${item.risk}`)} icon={<TrendingUp size={14} color={D.primary} />} />
            <OutputCard title="Riscos Logísticos e de Preço" items={snapshot.risks} icon={<AlertTriangle size={14} color="#eab308" />} />
          </div>
          
          <div className="contracts-card" style={{ background: D.surfaceContainer, borderRadius: 12, border: `1px solid ${D.outlineVariant}` }}>
            <div className="contracts-section-head" style={{ padding: '12px 16px', background: D.surfaceContainerHigh, borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clipboard size={14} /> <strong>Draft de RFQ (Request for Quotation)</strong>
            </div>
            <pre className="contracts-draft" style={{ margin: 0, padding: 16, fontSize: 11, color: D.onSurfaceVariant, background: '#00000020', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {snapshot.rfqDraft}
            </pre>
          </div>
        </div>
      </div>
    </PremiumPanelLayout>
  )
}

function OutputCard({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <div className="contracts-card" style={{ background: D.surfaceContainer, borderRadius: 12, border: `1px solid ${D.outlineVariant}`, padding: 16 }}>
      <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>{icon} {title}</strong>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: D.onSurfaceVariant, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

