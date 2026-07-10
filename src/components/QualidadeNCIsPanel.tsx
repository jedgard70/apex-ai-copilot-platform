import { useEffect, useState } from 'react'
import { X, RefreshCw, AlertTriangle, FileText, Plus, Filter } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

const SEV_COLORS: Record<string, string> = { alta: '#ef4444', media: '#f59e0b', baixa: '#3b82f6' }

export function QualidadeNCIsPanel({ onClear }: { onClear: () => void }) {
  const [tab, setTab] = useState<'ncis' | 'checklists'>('ncis')
  const [ncis, setNcis] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filterSev, setFilterSev] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ descricao: '', severidade: 'media', projeto: '', responsavel: '', prazo: '', observacoes: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterSev) params.set('severidade', filterSev)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const [n, c, k] = await Promise.all([
        fetch(`/api/qualidade/ncis${qs}`).then(r => r.json()),
        fetch('/api/qualidade/checklists').then(r => r.json()),
        fetch('/api/qualidade/kpis').then(r => r.json()),
      ])
      if (n.ncis) setNcis(n.ncis)
      if (c.checklists) setChecklists(c.checklists)
      if (k.kpis) setKpis(k.kpis)
    } catch { /* */ } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterSev])

  async function createNCI() {
    if (!form.descricao) return; setLoading(true)
    try {
      await fetch('/api/qualidade/ncis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setShowForm(false); setForm({ descricao: '', severidade: 'media', projeto: '', responsavel: '', prazo: '', observacoes: '' })
      await load()
    } catch { /* */ } finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/qualidade/ncis/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      await load()
    } catch { /* */ }
  }

  return (
    <PremiumPanelLayout
      title="Registro de NCIs"
      subtitle="Não Conformidades Internas e Auditorias"
      headerActions={
        <>
          <button onClick={() => setShowForm(!showForm)} className="ghost-action" style={{ border: '1px solid #374151' }}><Plus size={14} /> Nova NCI</button>
          <button onClick={load} disabled={loading} className="ghost-action"><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* KPIs */}
      {kpis && <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
        <MiniStat label="Total NCIs" value={kpis.totalNCIs} color="#6b7280" />
        <MiniStat label="Abertas" value={kpis.ncisAbertas} color="#ef4444" />
        <MiniStat label="Alta Sev." value={kpis.ncisAltas} color="#ef4444" />
        <MiniStat label="Tratamento" value={kpis.nciasEmTratamento} color="#3b82f6" />
        <MiniStat label="Fechadas" value={kpis.ncisFechadas} color="#22c55e" />
        <MiniStat label="Checklists" value={kpis.totalChecklists} color="#f59e0b" />
        <MiniStat label="Conformidade" value={`${kpis.conformidadeGeral}%`} color={kpis.conformidadeGeral >= 80 ? '#22c55e' : '#f59e0b'} />
      </div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #1f2937' }}>
        {[{ id: 'ncis', label: '🔴 NCIs' }, { id: 'checklists', label: '✅ Checklists' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: tab === t.id ? '2px solid #22c55e' : '2px solid transparent', background: 'transparent', color: tab === t.id ? '#e2e8f0' : '#6b7280' }}>{t.label}</button>
        ))}
      </div>

      {/* Severity filter */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <FilterChip active={!filterSev} onClick={() => setFilterSev(null)} label="Todas" />
        {['alta', 'media', 'baixa'].map(s => (
          <FilterChip key={s} active={filterSev === s} onClick={() => setFilterSev(filterSev === s ? null : s)}
            label={s === 'alta' ? '🔴 Alta' : s === 'media' ? '🟡 Média' : '🔵 Baixa'} />
        ))}
      </div>

      {/* NCI Form */}
      {showForm && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '10px', background: '#ef444411', borderRadius: '8px', border: '1px solid #ef444433' }}>
        <input value={form.descricao} onChange={e => setForm((p: any) => ({ ...p, descricao: e.target.value }))} placeholder="Descrição *" style={inp} />
        <select value={form.severidade} onChange={e => setForm((p: any) => ({ ...p, severidade: e.target.value }))} style={inp}>
          <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🔵 Baixa</option>
        </select>
        <input value={form.projeto} onChange={e => setForm((p: any) => ({ ...p, projeto: e.target.value }))} placeholder="Projeto" style={inp} />
        <input value={form.responsavel} onChange={e => setForm((p: any) => ({ ...p, responsavel: e.target.value }))} placeholder="Responsável" style={inp} />
        <input value={form.prazo} onChange={e => setForm((p: any) => ({ ...p, prazo: e.target.value }))} placeholder="Prazo (YYYY-MM-DD)" style={inp} />
        <button onClick={createNCI} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Abrir NCI</button>
      </div>}

      {/* NCI List */}
      {tab === 'ncis' && <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {ncis.map(n => (
          <div key={n.id} onClick={() => setSelected(selected === n.id ? null : n.id)}
            style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: `1px solid ${SEV_COLORS[n.severidade]}44`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color={SEV_COLORS[n.severidade]} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{n.descricao}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{n.projeto} · {n.categoria} · {n.origem}</div>
              </div>
              <StatusBadge status={n.status} color={SEV_COLORS[n.severidade]} />
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${SEV_COLORS[n.severidade]}22`, color: SEV_COLORS[n.severidade] }}>{n.severidade}</span>
            </div>
            {selected === n.id && <div style={{ marginTop: '8px', borderTop: '1px solid #1f2937', paddingTop: '8px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.8 }}>
              <strong>Resp:</strong> {n.responsavel} · <strong>Abertura:</strong> {n.dataAbertura} · <strong>Prazo:</strong> {n.prazo}<br />
              {n.observacoes && <><strong>Obs:</strong> {n.observacoes}<br /></>}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {n.status !== 'fechada' && <button onClick={(e) => { e.stopPropagation(); updateStatus(n.id, 'fechada') }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', fontSize: '10px', cursor: 'pointer' }}>✅ Fechar</button>}
                {n.status === 'aberta' && <button onClick={(e) => { e.stopPropagation(); updateStatus(n.id, 'em-tratamento') }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644', fontSize: '10px', cursor: 'pointer' }}>🔵 Em Tratamento</button>}
              </div>
            </div>}
          </div>
        ))}
        {ncis.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Nenhuma NCI encontrada.</div>}
      </div>}

      {/* Checklists */}
      {tab === 'checklists' && <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {checklists.map(cl => (
          <div key={cl.id} style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={14} color={cl.status === 'conforme' ? '#22c55e' : '#f59e0b'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{cl.nome}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{cl.projeto} · {cl.categoria} · {cl.responsavel}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{cl.conformes}/{cl.itens}</span>
              <div style={{ width: 60, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(cl.conformes / cl.itens) * 100}%`, height: '100%', background: cl.status === 'conforme' ? '#22c55e' : '#f59e0b', borderRadius: 3 }} />
              </div>
              <StatusBadge status={cl.status} color={cl.status === 'conforme' ? '#22c55e' : '#f59e0b'} />
            </div>
          </div>
        ))}
        {checklists.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Nenhum checklist encontrado.</div>}
        </div>
      }

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
      </div>
    </PremiumPanelLayout>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (<div style={{ padding: '8px 10px', background: '#111827', borderRadius: '6px', border: `1px solid ${color}22` }}>
    <div style={{ fontSize: '9px', color: '#6b7280' }}>{label}</div><div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div></div>)
}
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#3b82f6' : '#1f2937', color: active ? '#fff' : '#9ca3af' }}>{label}</button>
}
function StatusBadge({ status, color }: { status: string; color: string }) {
  return <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${color}22`, color }}>{status}</span>
}
const inp = { padding: '6px 8px', borderRadius: '4px', border: '1px solid #374151', background: '#1f2937', color: '#e2e8f0', fontSize: '11px', outline: 'none' }
