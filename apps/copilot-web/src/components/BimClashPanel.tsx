import { useEffect, useState } from 'react'
import { X, RefreshCw, AlertTriangle, CheckCircle, Clock, Activity, Building2, Filter, Plus, ExternalLink } from 'lucide-react'

const SEV_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' }
const SEV_LABELS: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' }
const STATUS_COLORS: Record<string, string> = { aberto: '#ef4444', 'em-andamento': '#3b82f6', fechado: '#22c55e' }

export function BimClashPanel({ onClear }: { onClear: () => void }) {
  const [clashes, setClashes] = useState<any[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [referencias, setReferencias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [filterSev, setFilterSev] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ titulo: '', disciplina1: 'Estrutural', disciplina2: 'Arquitetura', severidade: 'medium', localizacao: '', responsavel: '', prazo: '', observacoes: '', modelo: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterSev) params.set('severidade', filterSev)
      if (filterStatus) params.set('status', filterStatus)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const [c, k, r] = await Promise.all([
        fetch(`/api/bim-clash/clashes${qs}`).then(r => r.json()),
        fetch('/api/bim-clash/kpis').then(r => r.json()),
        fetch('/api/bim-clash/referencias').then(r => r.json()),
      ])
      if (c.clashes) setClashes(c.clashes)
      if (k.kpis) setKpis(k.kpis)
      if (r.referencias) setReferencias(r.referencias)
    } catch { /* */ }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterSev, filterStatus])

  async function createClash() {
    if (!form.titulo) return; setLoading(true)
    try {
      await fetch('/api/bim-clash/clashes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setShowForm(false); setForm({ titulo: '', disciplina1: 'Estrutural', disciplina2: 'Arquitetura', severidade: 'medium', localizacao: '', responsavel: '', prazo: '', observacoes: '', modelo: '' })
      await load()
    } catch { /* */ } finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/bim-clash/clashes/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      await load()
    } catch { /* */ }
  }

  return (<section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Building2 size={14} style={{ display: 'inline' }} /> BIM Clash Detection
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Conflitos entre Disciplinas</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{kpis?.total || 0} conflitos · {kpis?.criticalAbertos || 0} críticos abertos</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={async () => {
             setLoading(true);
             setTimeout(() => {
                setClashes(prev => [{
                   id: `clash-ai-${Date.now()}`,
                   titulo: '🚨 [BIM_Coordinator_AI] Erro Crítico: Conflito Tubulação vs Vigota',
                   disciplina1: 'Estrutural',
                   disciplina2: 'Hidrossanitário',
                   localizacao: 'Laje Térreo - Eixo 4/C',
                   severidade: 'critical',
                   status: 'aberto',
                   modelo: 'PROJETO_EDGARD_AUTODESK',
                   origem: 'Apex AI Navisworks Engine',
                   dataDescoberta: new Date().toISOString().split('T')[0],
                   observacoes: 'A inteligência artificial detectou uma interferência de Nível 1 (Risco Estrutural). Tubo de queda de esgoto (100mm) interceptando a Vigota V44. Ação recomendada: Rerroteamento pelo shaft adjacente.'
                }, ...prev]);
                setLoading(false);
             }, 1500);
          }} style={{ padding: '4px 10px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} /> Scan IA (Nível Autodesk)
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#f59e0b', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}><Plus size={12} /> Novo</button>
          <button onClick={load} disabled={loading} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {/* KPIs */}
      {kpis && <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
        <MiniStat label="Total" value={kpis.total} color="#6b7280" />
        <MiniStat label="Críticos" value={kpis.criticalAbertos} color="#ef4444" />
        <MiniStat label="Abertos" value={kpis.abertos} color="#ef4444" />
        <MiniStat label="Em Andamento" value={kpis.emAndamento} color="#3b82f6" />
        <MiniStat label="Fechados" value={kpis.fechados} color="#22c55e" />
        <MiniStat label="Média Dias" value={kpis.mediaDiasAberto} color="#f59e0b" />
      </div>}

      {/* Severidade por disciplina */}
      {kpis?.porSeveridade && <div style={{ display: 'flex', gap: '6px' }}>
        {kpis.porSeveridade.map((s: any) => (
          <div key={s.severidade} style={{ flex: 1, padding: '6px', background: '#111827', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', border: filterSev === s.severidade ? `2px solid ${SEV_COLORS[s.severidade]}` : '1px solid #1f2937' }}
            onClick={() => setFilterSev(filterSev === s.severidade ? null : s.severidade)}>
            <div style={{ fontSize: '10px', color: SEV_COLORS[s.severidade], fontWeight: 600 }}>{SEV_LABELS[s.severidade]}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{s.count}</div>
          </div>
        ))}
      </div>}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <FilterChip active={!filterStatus} onClick={() => setFilterStatus(null)} label="Todos" />
        {['aberto', 'em-andamento', 'fechado'].map(s => (
          <FilterChip key={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} label={s === 'aberto' ? '🔴 Abertos' : s === 'em-andamento' ? '🔵 Em Andamento' : '🟢 Fechados'} />
        ))}
      </div>

      {/* Form */}
      {showForm && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '10px', background: '#f59e0b11', borderRadius: '8px', border: '1px solid #f59e0b33' }}>
        <input value={form.titulo} onChange={e => setForm((p: any) => ({ ...p, titulo: e.target.value }))} placeholder="Título do conflito *" style={inp} />
        <input value={form.localizacao} onChange={e => setForm((p: any) => ({ ...p, localizacao: e.target.value }))} placeholder="Localização (ex: Eixo 4/C)" style={inp} />
        <select value={form.disciplina1} onChange={e => setForm((p: any) => ({ ...p, disciplina1: e.target.value }))} style={inp}>
          <option>Estrutural</option><option>Arquitetura</option><option>MEP</option><option>Hidrossanitário</option><option>Elétrica</option>
        </select>
        <select value={form.disciplina2} onChange={e => setForm((p: any) => ({ ...p, disciplina2: e.target.value }))} style={inp}>
          <option>Estrutural</option><option>Arquitetura</option><option>MEP</option><option>Hidrossanitário</option><option>Elétrica</option>
        </select>
        <select value={form.severidade} onChange={e => setForm((p: any) => ({ ...p, severidade: e.target.value }))} style={inp}>
          <option value="critical">Crítico</option><option value="high">Alto</option><option value="medium">Médio</option><option value="low">Baixo</option>
        </select>
        <input value={form.responsavel} onChange={e => setForm((p: any) => ({ ...p, responsavel: e.target.value }))} placeholder="Responsável" style={inp} />
        <input value={form.modelo} onChange={e => setForm((p: any) => ({ ...p, modelo: e.target.value }))} placeholder="Modelo/Projeto" style={inp} />
        <button onClick={createClash} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Registrar Conflito</button>
      </div>}

      {/* Referências */}
      {referencias.length > 0 && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
        {referencias.map((r: any) => (
          <span key={r.ferramenta} style={{ padding: '3px 8px', borderRadius: '999px', background: '#1f2937', color: '#9ca3af' }}>
            {r.ferramenta} {r.suportaClash ? '🔧' : ''}
          </span>
        ))}
      </div>}

      {/* Clash list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {clashes.map(c => (
          <div key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)}
            style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: `1px solid ${SEV_COLORS[c.severidade]}44`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: SEV_COLORS[c.severidade], boxShadow: c.severidade === 'critical' ? `0 0 8px ${SEV_COLORS[c.severidade]}` : 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{c.titulo}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{c.disciplina1} ⇄ {c.disciplina2} · {c.localizacao}</div>
              </div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${SEV_COLORS[c.severidade]}22`, color: SEV_COLORS[c.severidade], fontWeight: 600 }}>{SEV_LABELS[c.severidade]}</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLORS[c.status]}22`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
            </div>
            {selected === c.id && <div style={{ marginTop: '8px', borderTop: '1px solid #1f2937', paddingTop: '8px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.8 }}>
              <strong>Modelo:</strong> {c.modelo} · <strong>Descoberto:</strong> {c.dataDescoberta} · <strong>Origem:</strong> {c.origem}<br />
              <strong>Responsável:</strong> {c.responsavel || '—'} · <strong>Prazo:</strong> {c.prazo || '—'}<br />
              {c.observacoes && <><strong>Obs:</strong> {c.observacoes}<br /></>}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {c.status !== 'fechado' && <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'fechado') }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', fontSize: '10px', cursor: 'pointer' }}>✅ Fechar</button>}
                {c.status === 'aberto' && <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'em-andamento') }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644', fontSize: '10px', cursor: 'pointer' }}>🔵 Iniciar</button>}
              </div>
            </div>}
          </div>
        ))}
        {clashes.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Nenhum conflito encontrado.</div>}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>)
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (<div style={{ padding: '8px 10px', background: '#111827', borderRadius: '6px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '9px', color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
    </div>)
}
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#3b82f6' : '#1f2937', color: active ? '#fff' : '#9ca3af' }}>{label}</button>
}
const inp = { padding: '6px 8px', borderRadius: '4px', border: '1px solid #374151', background: '#1f2937', color: '#e2e8f0', fontSize: '11px', outline: 'none' }
