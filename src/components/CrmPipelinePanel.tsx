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

// Stitch design tokens
const S = {
  bg: '#0B1221',
  surface: 'rgba(22,33,62,0.7)',
  card: 'rgba(22,33,62,0.7)',
  accent: '#6C47FF',
  text: '#e2e2e2',
  textDim: '#c6c6ce',
  border: 'rgba(255,255,255,0.1)',
}

export function CrmPipelinePanel({ onClear, onSendToMarketing }: { onClear: () => void; onSendToMarketing?: (count: number) => void }) {
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

  const cardStyle = {
    background: S.card,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${S.border}`,
    borderTop: '1px solid rgba(255,255,255,0.15)',
  }

  return (
    <section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: S.bg }}>

      {/* Header - Stitch style */}
      <div style={{ ...cardStyle, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span className="material-symbols-outlined" style={{ color: S.accent, fontSize: 18 }}>group</span>
            <span style={{ color: S.accent, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CRM Pipeline</span>
          </div>
          <h2 style={{ margin: '2px 0', fontSize: 18, fontWeight: 600, color: S.text }}>Pipeline de Vendas</h2>
          <p style={{ fontSize: 11, color: S.textDim, margin: 0 }}>{kpis?.totalLeads || 0} leads · R$ {((kpis?.vglTotal || 0) / 1000).toFixed(0)}K VGL</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '6px 14px', borderRadius: 8, background: S.accent, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserPlus size={12} /> Novo Lead
          </button>
          <button onClick={load} disabled={loading}
            style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, color: S.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          </button>
          <button onClick={onClear} style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, color: S.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
          {onSendToMarketing && leads.length > 0 && (
            <button onClick={() => onSendToMarketing(leads.length)}
              style={{ padding: '6px 14px', borderRadius: 8, background: '#f59e0b', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              🎯 Leads p/ Marketing ({leads.length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards - Stitch bento style */}
      {kpis && (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
          {[
            { label: 'Total Leads', value: kpis.totalLeads, color: '#6C47FF', icon: 'group' },
            { label: 'VGL Total', value: `R$${(kpis.vglTotal / 1000).toFixed(0)}K`, color: '#22c55e', icon: 'payments' },
            { label: 'Ticket Médio', value: `R$${(kpis.ticketMedio / 1000).toFixed(0)}K`, color: '#f59e0b', icon: 'account_balance_wallet' },
            { label: 'Conversão', value: `${kpis.taxaConversao}%`, color: '#a855f7', icon: 'trending_up' },
            { label: 'Leads Quentes', value: kpis.leadsQuentes, color: '#ef4444', icon: 'local_fire_department' },
            { label: 'VGL Ponderado', value: `R$${(kpis.vglPorStage?.reduce((s: number, st: any) => s + st.vglPonderado, 0) / 1000).toFixed(0)}K`, color: '#10b981', icon: 'account_balance' },
          ].map(k => (
            <div key={k.label} style={{ ...cardStyle, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="material-symbols-outlined" style={{ color: k.color, fontSize: 14 }}>{k.icon}</span>
                <span style={{ fontSize: 9, color: S.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* VGL Pipeline by Stage - Stitch style */}
      {kpis?.vglPorStage && (
        <div style={{ display: 'flex', gap: 6 }}>
          {kpis.vglPorStage.map((s: any) => (
            <div key={s.stageId} style={{ ...cardStyle, flex: 1, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: STAGE_COLORS[s.stageId] || S.textDim, fontWeight: 600 }}>{s.stage}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.text, marginTop: 2 }}>{s.count}</div>
              <div style={{ fontSize: 9, color: S.textDim }}>R${(s.valor / 1000).toFixed(0)}K</div>
              <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(s.valor / 100, 100)}%`, background: STAGE_COLORS[s.stageId] || S.accent, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Lead Form - Stitch glass */}
      {showForm && (
        <div style={{ ...cardStyle, borderRadius: 10, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome *"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <input value={form.empresa} onChange={e => setForm((p: any) => ({ ...p, empresa: e.target.value }))} placeholder="Empresa"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="Email"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <input value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Telefone"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <input value={form.valor} onChange={e => setForm((p: any) => ({ ...p, valor: e.target.value }))} placeholder="Valor (R$) *"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <input value={form.observacoes} onChange={e => setForm((p: any) => ({ ...p, observacoes: e.target.value }))} placeholder="Observações"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, color: S.text }} />
          <button onClick={createLead} disabled={loading}
            style={{ gridColumn: '1 / -1', padding: '8px', background: S.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Criar Lead
          </button>
        </div>
      )}

      {/* Stage filter - Stitch chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedStage(null)}
          style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: !selectedStage ? S.accent : 'rgba(255,255,255,0.05)', color: !selectedStage ? '#fff' : S.textDim }}>Todos</button>
        {stages.map(s => (
          <button key={s.id} onClick={() => setSelectedStage(selectedStage === s.id ? null : s.id)}
            style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: selectedStage === s.id ? s.color : 'rgba(255,255,255,0.05)', color: selectedStage === s.id ? '#fff' : S.textDim }}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Leads Table - Stitch cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredLeads.map(lead => (
          <div key={lead.id} onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
            style={{ ...cardStyle, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: lead.status === 'quente' || lead.status === 'ganho' ? '#ef4444' : lead.status === 'morno' ? '#f59e0b' : '#6b7280',
                boxShadow: lead.status === 'quente' ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{lead.name}</div>
                <div style={{ fontSize: 10, color: S.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.empresa} · {lead.email} · {lead.phone || '—'}</div>
              </div>
              <span style={{ fontSize: 10, color: STAGE_COLORS[lead.stage] || S.textDim, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: `${STAGE_COLORS[lead.stage] || S.border}22`, whiteSpace: 'nowrap' }}>
                {STAGE_NAMES[lead.stage]}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>R${(lead.valor / 1000).toFixed(0)}K</span>
              <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{lead.probabilidade}%</span>
            </div>

            {selectedLead === lead.id && (
              <div style={{ marginTop: 10, borderTop: `1px solid ${S.border}`, paddingTop: 10, fontSize: 12, color: S.textDim }}>
                <div style={{ lineHeight: 1.8 }}>
                  <strong style={{ color: S.text }}>Responsável:</strong> {lead.responsavel} · <strong style={{ color: S.text }}>Origem:</strong> {lead.origem} · <strong style={{ color: S.text }}>Contato:</strong> {lead.dataContato}<br />
                  <strong style={{ color: S.text }}>Propostas:</strong> {lead.propostasEnviadas} · <strong style={{ color: S.text }}>Reuniões:</strong> {lead.reunioes} · <strong style={{ color: S.text }}>Tags:</strong> {lead.tags?.join(', ') || '—'}<br />
                  {lead.observacoes && <><strong style={{ color: S.text }}>Obs:</strong> {lead.observacoes}<br /></>}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {stages.map(s => {
                    const currentIdx = stageIndex(lead.stage)
                    const stageIdx = stageIndex(s.id)
                    if (stageIdx <= currentIdx) return null
                    return (
                      <button key={s.id} onClick={(e) => { e.stopPropagation(); moveStage(lead.id, s.id) }}
                        style={{ padding: '3px 10px', borderRadius: 6, background: `${STAGE_COLORS[s.id]}22`, color: STAGE_COLORS[s.id], border: `1px solid ${STAGE_COLORS[s.id]}44`, fontSize: 10, cursor: 'pointer' }}>
                        {s.icon} Avançar
                      </button>
                    )
                  })}
                  <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id) }}
                    style={{ padding: '3px 10px', borderRadius: 6, background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', fontSize: 10, cursor: 'pointer', marginLeft: 'auto' }}>
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: S.textDim, fontSize: 13 }}>Nenhum lead encontrado. Crie um novo lead para começar.</div>
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
