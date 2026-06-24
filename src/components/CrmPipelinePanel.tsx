import { useEffect, useState } from 'react'
import { X, RefreshCw, TrendingUp, UserPlus, ChevronRight, DollarSign, Target, Users, BarChart3, Filter } from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  prospeccao: '#6b7280', qualificacao: '#3b82f6', proposta: '#f59e0b',
  negociacao: '#a855f7', fechamento: '#22c55e',
}
const STAGE_NAMES: Record<string, string> = {
  prospeccao: '🔍 Prospecção', qualificacao: '📋 Qualificação', proposta: '📄 Proposta',
  negociacao: '🤝 Negociação', fechamento: '✅ Fechamento',
}

export function CrmPipelinePanel({ onClear }: { onClear: () => void }) {
  const [leads, setLeads] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ name: '', empresa: '', email: '', phone: '', valor: '', observacoes: '', origem: 'manual' })

  async function load() {
    setLoading(true)
    try {
      const [l, s, k] = await Promise.all([
        fetch('/api/crm-pipeline/leads').then(r => r.json()),
        fetch('/api/crm-pipeline/stages').then(r => r.json()),
        fetch('/api/crm-pipeline/kpis').then(r => r.json()),
      ])
      if (l.leads) setLeads(l.leads)
      if (s.stages) setStages(s.stages)
      if (k.kpis) setKpis(k.kpis)
    } catch { /* */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createLead() {
    if (!form.name || !form.valor) return
    setLoading(true)
    try {
      await fetch('/api/crm-pipeline/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, valor: Number(form.valor) }) })
      setShowForm(false); setForm({ name: '', empresa: '', email: '', phone: '', valor: '', observacoes: '', origem: 'manual' })
      await load()
    } catch { /* */ }
    finally { setLoading(false) }
  }

  async function moveStage(id: string, newStage: string) {
    setLoading(true)
    try {
      await fetch(`/api/crm-pipeline/leads/${id}/stage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: newStage }) })
      await load()
    } catch { /* */ }
    finally { setLoading(false) }
  }

  async function deleteLead(id: string) {
    if (!confirm('Remover este lead?')) return
    try {
      await fetch(`/api/crm-pipeline/leads/${id}`, { method: 'DELETE' })
      await load()
    } catch { /* */ }
  }

  const filteredLeads = selectedStage ? leads.filter(l => l.stage === selectedStage) : leads
  const stageIndex = (s: string) => stages.findIndex(st => st.id === s)

  return (
    <section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Target size={14} style={{ display: 'inline' }} /> CRM Pipeline ACIP
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Pipeline de Vendas</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{kpis?.totalLeads || 0} leads · R$ {((kpis?.vglTotal || 0) / 1000).toFixed(0)}K VGL</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#22c55e', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            <UserPlus size={12} style={{ display: 'inline' }} /> Novo Lead
          </button>
          <button onClick={load} disabled={loading} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          <MiniStat label="Leads" value={kpis.totalLeads} color="#3b82f6" />
          <MiniStat label="VGL Total" value={`R$${(kpis.vglTotal / 1000).toFixed(0)}K`} color="#22c55e" />
          <MiniStat label="Ticket Médio" value={`R$${(kpis.ticketMedio / 1000).toFixed(0)}K`} color="#f59e0b" />
          <MiniStat label="Conversão" value={`${kpis.taxaConversao}%`} color="#a855f7" />
          <MiniStat label="Quentes" value={kpis.leadsQuentes} color="#ef4444" />
          <MiniStat label="VGL Ponderado" value={`R$${(kpis.vglPorStage?.reduce((s: number, st: any) => s + st.vglPonderado, 0) / 1000).toFixed(0)}K`} color="#10b981" />
        </div>
      )}

      {/* VGL by Stage */}
      {kpis?.vglPorStage && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {kpis.vglPorStage.map((s: any) => (
            <div key={s.stageId} style={{ flex: 1, padding: '8px', background: '#111827', borderRadius: '6px', textAlign: 'center', border: `1px solid ${STAGE_COLORS[s.stageId]}33` }}>
              <div style={{ fontSize: '9px', color: STAGE_COLORS[s.stageId] }}>{s.stage}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{s.count}</div>
              <div style={{ fontSize: '9px', color: '#6b7280' }}>R${(s.valor / 1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
      )}

      {/* New Lead Form */}
      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '10px', background: '#22c55e11', borderRadius: '8px', border: '1px solid #22c55e33' }}>
          <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome *" style={inp} />
          <input value={form.empresa} onChange={e => setForm((p: any) => ({ ...p, empresa: e.target.value }))} placeholder="Empresa" style={inp} />
          <input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="Email" style={inp} />
          <input value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Telefone" style={inp} />
          <input value={form.valor} onChange={e => setForm((p: any) => ({ ...p, valor: e.target.value }))} placeholder="Valor (R$) *" style={inp} />
          <input value={form.observacoes} onChange={e => setForm((p: any) => ({ ...p, observacoes: e.target.value }))} placeholder="Observações" style={inp} />
          <button onClick={createLead} disabled={loading}
            style={{ gridColumn: '1 / -1', padding: '8px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Criar Lead
          </button>
        </div>
      )}

      {/* Stage filter */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedStage(null)}
          style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: !selectedStage ? '#3b82f6' : '#1f2937', color: !selectedStage ? '#fff' : '#9ca3af' }}>Todos</button>
        {stages.map(s => (
          <button key={s.id} onClick={() => setSelectedStage(selectedStage === s.id ? null : s.id)}
            style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: selectedStage === s.id ? s.color : '#1f2937', color: selectedStage === s.id ? '#fff' : '#9ca3af' }}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredLeads.map(lead => (
          <div key={lead.id} onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
            style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: `1px solid ${STAGE_COLORS[lead.stage] || '#1f2937'}44`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: lead.status === 'quente' || lead.status === 'ganho' ? '#ef4444' : lead.status === 'morno' ? '#f59e0b' : '#6b7280',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{lead.name}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{lead.empresa} · {lead.email} · {lead.phone || '—'}</div>
              </div>
              <span style={{ fontSize: '11px', color: STAGE_COLORS[lead.stage], fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: `${STAGE_COLORS[lead.stage]}22` }}>
                {STAGE_NAMES[lead.stage]}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>R${(lead.valor / 1000).toFixed(0)}K</span>
              <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>{lead.probabilidade}%</span>
            </div>

            {selectedLead === lead.id && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #1f2937', paddingTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                <div style={{ lineHeight: 1.8 }}>
                  <strong>Responsável:</strong> {lead.responsavel} · <strong>Origem:</strong> {lead.origem} · <strong>Contato:</strong> {lead.dataContato}<br />
                  <strong>Propostas:</strong> {lead.propostasEnviadas} · <strong>Reuniões:</strong> {lead.reunioes} · <strong>Tags:</strong> {lead.tags?.join(', ') || '—'}<br />
                  {lead.observacoes && <><strong>Obs:</strong> {lead.observacoes}<br /></>}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {stages.map(s => {
                    const currentIdx = stageIndex(lead.stage)
                    const stageIdx = stageIndex(s.id)
                    if (stageIdx <= currentIdx) return null
                    return (
                      <button key={s.id} onClick={(e) => { e.stopPropagation(); moveStage(lead.id, s.id) }}
                        style={{ padding: '3px 8px', borderRadius: '4px', background: `${STAGE_COLORS[s.id]}22`, color: STAGE_COLORS[s.id], border: `1px solid ${STAGE_COLORS[s.id]}44`, fontSize: '10px', cursor: 'pointer' }}>
                        {s.icon} Avançar
                      </button>
                    )
                  })}
                  <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id) }}
                    style={{ padding: '3px 8px', borderRadius: '4px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', fontSize: '10px', cursor: 'pointer', marginLeft: 'auto' }}>
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Nenhum lead encontrado. Crie um novo lead para começar.</div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: '8px 10px', background: '#111827', borderRadius: '6px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const inp = { padding: '6px 8px', borderRadius: '4px', border: '1px solid #374151', background: '#1f2937', color: '#e2e8f0', fontSize: '11px', outline: 'none' }
