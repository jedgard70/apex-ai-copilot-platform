import { useEffect, useState, useCallback } from 'react'
import { DollarSign, RefreshCw, X, Plus, Trash2, Download, Copy } from 'lucide-react'
import { localDemoModeNotice } from '../../../../apps/copilot-web/src/lib/saasBusinessModel'

// ─── Types ───────────────────────────────────────────────────────────────────

type FinancialSummary = {
  totalRevenue: number; totalExpenses: number; netProfit: number
  pendingRevenue: number; overdueRevenue: number; paidRevenue: number
  mrr: number; arr: number; expenseRatio: number
  revenueCount: number; expenseCount: number; period: string
  expensesByCategory: Record<string, number>
}

type MonthlyBreakdown = { month: string; revenue: number; expenses: number; pending: number }

type ExpenseEntry = { id: string; description: string; category: string; amount: number; currency: string; date: string; supplier: string; project: string; notes: string; evidence: string }

type RevenueEntry = { id: string; description: string; source: string; amount: number; currency: string; date: string; clientName: string; status: string; evidence: string }

type FinancePanelProps = { goal?: string; conversationContext?: string[]; onSaveToProject?: (p: any) => void; onClear?: () => void }

const EXPENSE_CATEGORIES = ['Software', 'Marketing', 'Freelancer', 'Salaries', 'Tax', 'Office', 'Travel', 'Hosting', 'Tools', 'Consulting', 'Other']
const REVENUE_STATUSES = ['pending', 'paid', 'overdue', 'cancelled']

function currencySymbol(c: string) { return c === 'BRL' ? 'R$' : c === 'EUR' ? '€' : '$' }
function fmt(n: number, c = 'USD') { return `${currencySymbol(c)} ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function today() { return new Date().toISOString().slice(0, 10) }

const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }

function badgeStyle(category: string): React.CSSProperties {
  const colors: Record<string, string> = { Software: '#3b82f6', Marketing: '#f59e0b', Freelancer: '#8b5cf6', Salaries: '#10b981', Tax: '#ef4444', Office: '#6b7280', Travel: '#ec4899', Hosting: '#06b6d4', Tools: '#f97316', Consulting: '#14b8a6' }
  return { background: `${colors[category] || '#6b7280'}20`, color: colors[category] || '#6b7280', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }
}

function statusStyle(status: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = { paid: { background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }, pending: { background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }, overdue: { background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }, cancelled: { background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 } }
  return m[status] || m.pending
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FinancePanel({ onClear }: FinancePanelProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyBreakdown[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [revenues, setRevenues] = useState<RevenueEntry[]>([])
  const [tab, setTab] = useState<'dashboard' | 'expenses' | 'revenues' | 'accounting'>('dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expForm, setExpForm] = useState({ description: '', category: 'Other', amount: '', currency: 'USD', date: today(), supplier: '', project: '', notes: '' })
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [revForm, setRevForm] = useState({ description: '', amount: '', currency: 'USD', date: today(), clientName: '', status: 'paid' })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, expRes, revRes, monRes] = await Promise.all([
        fetch('/api/finance/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
        fetch('/api/finance/expenses'),
        fetch('/api/finance/revenues'),
        fetch('/api/finance/monthly?months=6'),
      ])
      if (sumRes.ok) { const d = await sumRes.json(); setSummary(d.summary); setMonthly(d.monthly || []) }
      if (expRes.ok) { const d = await expRes.json(); setExpenses(d.expenses || []) }
      if (revRes.ok) { const d = await revRes.json(); setRevenues(d.revenues || []) }
      if (monRes.ok) { const d = await monRes.json(); setMonthly(d.monthly || []) }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addExpense() {
    if (!expForm.description || !expForm.amount) return
    setLoading(true)
    try {
      const res = await fetch('/api/finance/expense', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expForm, amount: Number(expForm.amount) }) })
      if (res.ok) { setShowExpenseForm(false); setExpForm({ description: '', category: 'Other', amount: '', currency: 'USD', date: today(), supplier: '', project: '', notes: '' }); await fetchAll() }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function deleteExpense(id: string) { setLoading(true); try { await fetch('/api/finance/expense', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); await fetchAll() } finally { setLoading(false) } }

  async function addRevenue() {
    if (!revForm.description || !revForm.amount) return
    setLoading(true)
    try {
      const res = await fetch('/api/finance/revenue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...revForm, amount: Number(revForm.amount) }) })
      if (res.ok) { setShowRevenueForm(false); setRevForm({ description: '', amount: '', currency: 'USD', date: today(), clientName: '', status: 'paid' }); await fetchAll() }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function deleteRevenue(id: string) { setLoading(true); try { await fetch('/api/finance/revenue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); await fetchAll() } finally { setLoading(false) } }

  function exportCSV() {
    if (!revenues.length && !expenses.length) { setMessage('Nada para exportar'); return }
    const lines = ['type,date,description,amount,currency,status,category,client/supplier']
    for (const r of revenues) lines.push(`revenue,${r.date},${r.description},${r.amount},${r.currency},${r.status},,${r.clientName}`)
    for (const e of expenses) lines.push(`expense,${e.date},${e.description},${e.amount},${e.currency},paid,${e.category},${e.supplier}`)
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `apex-finance-${today()}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'expenses' as const, label: 'Despesas' },
    { id: 'revenues' as const, label: 'Receitas' },
    { id: 'accounting' as const, label: 'Contabilidade' },
  ]

  return (
    <section className="business-studio contracts-studio" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 60px)' }}>
      {/* Premium Hero Header (Mirror Effect from VSL) */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '32px 24px', borderRadius: '12px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          backgroundImage: 'url(/assets/vsl/vsl_accounting_dashboard.png), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4,
          filter: 'blur(2px) brightness(0.8)'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 100%)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} /> Controle Financeiro Corporativo
            </span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(16, 185, 129, 0.3)' }}>ATIVO</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Receitas, despesas, MRR e contabilidade</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '600px', lineHeight: 1.5 }}>
            {localDemoModeNotice}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, background: 'rgba(15, 23, 42, 0.6)', padding: '8px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={exportCSV} disabled={loading} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}><Download size={14} /> Exportar CSV</button>
          <button onClick={fetchAll} disabled={loading} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}><RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> {loading ? 'Calculando...' : 'Atualizar Dados'}</button>
          {onClear && <button type="button" onClick={onClear} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>}
        </div>
      </div>

      {message && <div className="business-alert"><strong>Info</strong><span>{message}</span></div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: tab === t.id ? '#07183f' : 'transparent', color: tab === t.id ? '#fff' : '#374151' }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <>
          {summary && (
            <div className="contracts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginBottom: '16px' }}>
              <div className="contracts-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Receita (paga)</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669' }}>{fmt(summary.paidRevenue)}</div>
              </div>
              <div className="contracts-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Despesas</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626' }}>{fmt(summary.totalExpenses)}</div>
              </div>
              <div className="contracts-card" style={{ borderLeft: `4px solid ${summary.netProfit >= 0 ? '#10b981' : '#ef4444'}` }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Lucro Líquido</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: summary.netProfit >= 0 ? '#059669' : '#dc2626' }}>{summary.netProfit >= 0 ? '' : '-'}{fmt(Math.abs(summary.netProfit))}</div>
              </div>
              <div className="contracts-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>MRR</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb' }}>{fmt(summary.mrr)}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>ARR: {fmt(summary.arr)}</div>
              </div>
              <div className="contracts-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>A Receber</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706' }}>{fmt(summary.pendingRevenue)}</div>
              </div>
              <div className="contracts-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Custo/Receita</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#7c3aed' }}>{summary.expenseRatio}%</div>
              </div>
            </div>
          )}

          {/* Monthly bars */}
          {monthly.length > 0 && (
            <div className="contracts-card">
              <h3>Últimos {monthly.length} meses</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', minHeight: '120px', padding: '8px 0' }}>
                {monthly.map(m => {
                  const maxVal = Math.max(...monthly.map(x => Math.max(x.revenue, x.expenses, 1)))
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100px' }}>
                        <div style={{ width: '16px', background: '#10b981', borderRadius: '3px 3px 0 0', height: `${Math.max((m.revenue / maxVal) * 100, 2)}px` }} title={`Receita: ${fmt(m.revenue)}`} />
                        <div style={{ width: '16px', background: '#ef4444', borderRadius: '3px 3px 0 0', height: `${Math.max((m.expenses / maxVal) * 100, 2)}px` }} title={`Despesa: ${fmt(m.expenses)}`} />
                      </div>
                      <span style={{ fontSize: '9px', color: '#6b7280' }}>{m.month.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6b7280' }}><span style={{ color: '#10b981' }}>■</span> Receita <span style={{ color: '#ef4444' }}>■</span> Despesa</div>
            </div>
          )}

          {/* Category breakdown */}
          {summary?.expensesByCategory && Object.keys(summary.expensesByCategory).length > 0 && (
            <div className="contracts-card">
              <h3>Despesas por Categoria</h3>
              {Object.entries(summary.expensesByCategory).sort(([, a], [, b]) => b - a).map(([cat, val]) => {
                const pct = summary!.totalExpenses > 0 ? (val / summary!.totalExpenses) * 100 : 0
                return (
                  <div key={cat} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                      <span>{cat}</span><span style={{ fontWeight: 600 }}>{fmt(val)} ({Math.round(pct)}%)</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: '#3b82f6', height: '100%', borderRadius: '4px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── EXPENSES ── */}
      {tab === 'expenses' && (
        <div className="contracts-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Despesas {expenses.length > 0 && <span style={{ fontWeight: 400, color: '#6b7280' }}>({expenses.length})</span>}</h3>
            <button onClick={() => setShowExpenseForm(!showExpenseForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> {showExpenseForm ? 'Cancelar' : 'Nova Despesa'}
            </button>
          </div>

          {showExpenseForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
              <input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição *" style={inputStyle} />
              <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} placeholder="Valor *" type="number" step="0.01" style={inputStyle} />
              <select value={expForm.currency} onChange={e => setExpForm(p => ({ ...p, currency: e.target.value }))} style={inputStyle}>
                <option value="USD">USD</option><option value="BRL">BRL</option><option value="EUR">EUR</option>
              </select>
              <input value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} type="date" style={inputStyle} />
              <input value={expForm.supplier} onChange={e => setExpForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Fornecedor" style={inputStyle} />
              <input value={expForm.project} onChange={e => setExpForm(p => ({ ...p, project: e.target.value }))} placeholder="Projeto" style={inputStyle} />
              <button onClick={addExpense} disabled={loading || !expForm.description || !expForm.amount}
                style={{ gridColumn: '1 / -1', padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Salvando...' : 'Adicionar Despesa'}
              </button>
            </div>
          )}

          <div className="contracts-table" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table>
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Fornecedor</th><th></th></tr></thead>
              <tbody>
                {expenses.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Nenhuma despesa registrada.</td></tr>}
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>{e.date}</td>
                    <td><strong>{e.description}</strong>{e.project ? <><br /><small style={{ color: '#6b7280' }}>{e.project}</small></> : null}</td>
                    <td><span style={badgeStyle(e.category)}>{e.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{fmt(e.amount, e.currency)}</td>
                    <td style={{ fontSize: '12px' }}>{e.supplier || '-'}</td>
                    <td><button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REVENUES ── */}
      {tab === 'revenues' && (
        <div className="contracts-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Receitas {revenues.length > 0 && <span style={{ fontWeight: 400, color: '#6b7280' }}>({revenues.length})</span>}</h3>
            <button onClick={() => setShowRevenueForm(!showRevenueForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> {showRevenueForm ? 'Cancelar' : 'Nova Receita'}
            </button>
          </div>

          {showRevenueForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '12px', border: '1px solid #bbf7d0' }}>
              <input value={revForm.description} onChange={e => setRevForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição *" style={inputStyle} />
              <input value={revForm.amount} onChange={e => setRevForm(p => ({ ...p, amount: e.target.value }))} placeholder="Valor *" type="number" step="0.01" style={inputStyle} />
              <select value={revForm.currency} onChange={e => setRevForm(p => ({ ...p, currency: e.target.value }))} style={inputStyle}>
                <option value="USD">USD</option><option value="BRL">BRL</option><option value="EUR">EUR</option>
              </select>
              <input value={revForm.date} onChange={e => setRevForm(p => ({ ...p, date: e.target.value }))} type="date" style={inputStyle} />
              <input value={revForm.clientName} onChange={e => setRevForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Cliente" style={inputStyle} />
              <select value={revForm.status} onChange={e => setRevForm(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                {REVENUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={addRevenue} disabled={loading || !revForm.description || !revForm.amount}
                style={{ gridColumn: '1 / -1', padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Salvando...' : 'Adicionar Receita'}
              </button>
            </div>
          )}

          <div className="contracts-table" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table>
              <thead><tr><th>Data</th><th>Descrição</th><th>Cliente</th><th>Valor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {revenues.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Nenhuma receita registrada.</td></tr>}
                {revenues.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>{r.date}</td>
                    <td><strong>{r.description}</strong><br /><small style={{ color: '#6b7280' }}>Fonte: {r.source}</small></td>
                    <td style={{ fontSize: '12px' }}>{r.clientName || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(r.amount, r.currency)}</td>
                    <td><span style={statusStyle(r.status)}>{r.status}</span></td>
                    <td><button onClick={() => deleteRevenue(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACCOUNTING ── */}
      {tab === 'accounting' && (
        <>
          <div className="contracts-grid">
            <div className="contracts-card">
              <h3>Resumo Contábil</h3>
              {summary ? (
                <ul style={{ lineHeight: '2', fontSize: '13px' }}>
                  <li><strong>Receita (paga):</strong> {fmt(summary.paidRevenue)}</li>
                  <li><strong>Despesas:</strong> {fmt(summary.totalExpenses)}</li>
                  <li><strong>Lucro Líquido:</strong> {fmt(summary.netProfit)}</li>
                  <li><strong>A Receber:</strong> {fmt(summary.pendingRevenue)}</li>
                  <li><strong>Vencidos:</strong> <span style={{ color: '#dc2626' }}>{fmt(summary.overdueRevenue)}</span></li>
                  <li><strong>MRR:</strong> {fmt(summary.mrr)} / <strong>ARR:</strong> {fmt(summary.arr)}</li>
                  <li><strong>Custo/Receita:</strong> {summary.expenseRatio}%</li>
                  <li><strong>Total transações:</strong> {summary.revenueCount + summary.expenseCount}</li>
                </ul>
              ) : <p style={{ color: '#9ca3af' }}>Carregando...</p>}
            </div>
            <div className="contracts-card">
              <h3>Exportar / Contador</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                Níveis de evidência:<br />
                <strong>USER_ENTERED</strong> — lançamento manual<br />
                <strong>SYSTEM_GENERATED</strong> — service order / invoice<br />
                <strong>NEEDS_ACCOUNTANT_REVIEW</strong> — precisa validação
              </p>
              <div className="contracts-actions" style={{ marginTop: '12px' }}>
                <button onClick={exportCSV}><Download size={15} /> Exportar CSV</button>
                <button onClick={() => {
                  const text = [`# Relatório Financeiro Apex AI`, `# Gerado: ${new Date().toLocaleString('pt-BR')}`, '', summary ? `Receita: ${fmt(summary.paidRevenue)}\nDespesas: ${fmt(summary.totalExpenses)}\nLucro: ${fmt(summary.netProfit)}\nMRR: ${fmt(summary.mrr)}\nA Receber: ${fmt(summary.pendingRevenue)}` : '', '', '## Despesas', ...expenses.map(e => `- ${e.date} | ${e.description} | ${e.category} | ${fmt(e.amount, e.currency)} | ${e.supplier}`), '', '## Receitas', ...revenues.map(r => `- ${r.date} | ${r.description} | ${r.status} | ${fmt(r.amount, r.currency)} | ${r.clientName}`)].join('\n')
                  navigator.clipboard?.writeText(text).catch(() => {})
                  setMessage('Relatório copiado!')
                }}><Copy size={15} /> Copiar Relatório</button>
              </div>
            </div>
          </div>

          {monthly.length > 0 && (
            <div className="contracts-card" style={{ marginTop: '12px' }}>
              <h3>Detalhamento Mensal</h3>
              <div className="contracts-table">
                <table>
                  <thead><tr><th>Mês</th><th>Receita</th><th>Despesa</th><th>Resultado</th><th>Pendente</th></tr></thead>
                  <tbody>
                    {monthly.map(m => {
                      const result = m.revenue - m.expenses
                      return (
                        <tr key={m.month}>
                          <td style={{ fontWeight: 600 }}>{m.month}</td>
                          <td style={{ color: '#059669' }}>{fmt(m.revenue)}</td>
                          <td style={{ color: '#dc2626' }}>{fmt(m.expenses)}</td>
                          <td style={{ fontWeight: 600, color: result >= 0 ? '#059669' : '#dc2626' }}>{fmt(result)}</td>
                          <td style={{ color: '#d97706' }}>{fmt(m.pending)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
    </section>
  )
}
