import { useEffect, useState } from 'react'
import { X, RefreshCw, CheckCircle, Clock, AlertTriangle, Plus, User, Calendar } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
const PRIO_COLORS: Record<string,string> = { alta:'#ef4444', media:'#f59e0b', baixa:'#3b82f6' }
export function WorkflowTasksPanel({ onClear }: { onClear: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]); const [kpis, setKpis] = useState<any>(null); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string|null>(null); const [filterStatus, setFilterStatus] = useState<string|null>(null); const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ titulo:'', descricao:'', projeto:'', assignee:'', prioridade:'media', dataVencimento:'', categoria:'geral', horasEstimadas:'' })
  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams(); if (filterStatus) params.set('status', filterStatus)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const [t, k] = await Promise.all([ fetch(`/api/workflow/tasks${qs}`).then(r=>r.json()), fetch('/api/workflow/kpis').then(r=>r.json()) ])
      if (t.tasks) setTasks(t.tasks); if (k.kpis) setKpis(k.kpis)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterStatus])
  async function createTask() { if (!form.titulo) return; setLoading(true); try { await fetch('/api/workflow/tasks',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, horasEstimadas:Number(form.horasEstimadas)}) }); setShowForm(false); setForm({ titulo:'', descricao:'', projeto:'', assignee:'', prioridade:'media', dataVencimento:'', categoria:'geral', horasEstimadas:'' }); await load() } catch {} finally { setLoading(false) } }
  async function updateStatus(id:string, status:string) { try { await fetch(`/api/workflow/tasks/${id}/status`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) }); await load() } catch {} }
  const isAtrasada = (t:any) => t.status !== 'concluida' && t.dataVencimento && t.dataVencimento < new Date().toISOString().slice(0,10)
  return (
    <PremiumPanelLayout 
      title="Workflow Tasks" 
      subtitle="Ações e configurações operacionais"
      headerActions={
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <button onClick={()=>setShowForm(!showForm)} style={{ padding:'4px 10px', borderRadius:'6px', background:'#3b82f6', color:'#fff', border:'none', fontSize:'11px', fontWeight:600, cursor:'pointer' }}><Plus size={12} /> Nova Tarefa</button>
          <button onClick={load} disabled={loading} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      }
    >
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex: 1 }}>
        <p style={{ fontSize:'11px', color:'#6b7280', margin:0 }}>{kpis?.total||0} tarefas · {kpis?.atrasadas||0} atrasadas · {kpis?.pendentes||0} pendentes</p>
    {kpis && <div style={{ display:'grid', gap:'6px', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))' }}>
      <MiniStat label="Total" value={kpis.total} color="#6b7280" />
      <MiniStat label="Atrasadas" value={kpis.atrasadas} color="#ef4444" />
      <MiniStat label="Pendentes" value={kpis.pendentes} color="#f59e0b" />
      <MiniStat label="Em Andamento" value={kpis.emAndamento} color="#3b82f6" />
      <MiniStat label="Alta Prioridade" value={kpis.altaPrioridade} color="#ef4444" />
      <MiniStat label="Horas" value={`${kpis.horasGastas}h/${kpis.horasEstimadas}h`} color="#22c55e" />
    </div>}
    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
      <FilterChip active={!filterStatus} onClick={()=>setFilterStatus(null)} label="Todas" />
      {['pendente','em-andamento','concluida'].map(s => <FilterChip key={s} active={filterStatus===s} onClick={()=>setFilterStatus(filterStatus===s?null:s)} label={s==='pendente'?'🟡 Pendente':s==='em-andamento'?'🔵 Em Andamento':'✅ Concluída'} />)}
    </div>
    {showForm && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', padding:'10px', background:'#3b82f611', borderRadius:'8px', border:'1px solid #3b82f633' }}>
      <input value={form.titulo} onChange={e=>setForm((p:any)=>({...p, titulo:e.target.value}))} placeholder="Título *" style={inp} />
      <input value={form.projeto} onChange={e=>setForm((p:any)=>({...p, projeto:e.target.value}))} placeholder="Projeto" style={inp} />
      <input value={form.assignee} onChange={e=>setForm((p:any)=>({...p, assignee:e.target.value}))} placeholder="Responsável" style={inp} />
      <input value={form.dataVencimento} onChange={e=>setForm((p:any)=>({...p, dataVencimento:e.target.value}))} placeholder="Vencimento" style={inp} />
      <select value={form.prioridade} onChange={e=>setForm((p:any)=>({...p, prioridade:e.target.value}))} style={inp}><option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🔵 Baixa</option></select>
      <input value={form.horasEstimadas} onChange={e=>setForm((p:any)=>({...p, horasEstimadas:e.target.value}))} placeholder="Horas est." style={inp} />
      <button onClick={createTask} disabled={loading} style={{ gridColumn:'1 / -1', padding:'8px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', fontWeight:600, cursor:'pointer' }}>Criar Tarefa</button>
    </div>}
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      {tasks.map(t => (<div key={t.id} onClick={()=>setSelected(selected===t.id?null:t.id)} style={{ padding:'10px', background:'#111827', borderRadius:'8px', border:`1px solid ${isAtrasada(t)?'#ef444444':PRIO_COLORS[t.prioridade]}44`, cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {t.status==='concluida'?<CheckCircle size={14} color="#22c55e" />:isAtrasada(t)?<AlertTriangle size={14} color="#ef4444" />:<Clock size={14} color={PRIO_COLORS[t.prioridade]} />}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#e2e8f0' }}>{t.titulo}</div>
            <div style={{ fontSize:'10px', color:'#6b7280' }}>{t.projeto} · {t.categoria} · {t.assignee}</div>
          </div>
          <StatusBadge status={t.status} color={t.status==='concluida'?'#22c55e':'#3b82f6'} />
          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'999px', background:`${PRIO_COLORS[t.prioridade]}22`, color:PRIO_COLORS[t.prioridade] }}>{t.prioridade}</span>
          {t.dataVencimento && <span style={{ fontSize:'10px', color:isAtrasada(t)?'#ef4444':'#6b7280' }}>{t.dataVencimento}</span>}
        </div>
        {selected===t.id && <div style={{ marginTop:'8px', borderTop:'1px solid #1f2937', paddingTop:'8px', fontSize:'12px', color:'#9ca3af', lineHeight:1.8 }}>
          {t.descricao}<br />
          <strong>Criado:</strong> {t.dataCriacao} · <strong>Estimado:</strong> {t.horasEstimadas}h · <strong>Gasto:</strong> {t.horasGastas}h
          <div style={{ display:'flex', gap:'4px', marginTop:'6px' }}>
            {t.status!=='concluida' && <button onClick={e=>{e.stopPropagation();updateStatus(t.id,'concluida')}} style={{ padding:'3px 8px', borderRadius:'4px', background:'#22c55e22', color:'#22c55e', border:'1px solid #22c55e44', fontSize:'10px', cursor:'pointer' }}>✅ Concluir</button>}
            {t.status==='pendente' && <button onClick={e=>{e.stopPropagation();updateStatus(t.id,'em-andamento')}} style={{ padding:'3px 8px', borderRadius:'4px', background:'#3b82f622', color:'#3b82f6', border:'1px solid #3b82f644', fontSize:'10px', cursor:'pointer' }}>🔵 Iniciar</button>}
          </div>
        </div>}
      </div>))}
      {tasks.length===0 && <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>Nenhuma tarefa encontrada.</div>}
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
      </div>
    </PremiumPanelLayout>
  )
}
function MiniStat({label,value,color}:{label:string;value:string|number;color:string}){return(<div style={{padding:'8px 10px',background:'#111827',borderRadius:'6px',border:`1px solid ${color}22`}}><div style={{fontSize:'9px',color:'#6b7280'}}>{label}</div><div style={{fontSize:'16px',fontWeight:700,color}}>{value}</div></div>)}
function FilterChip({active,onClick,label}:{active:boolean;onClick:()=>void;label:string}){return<button onClick={onClick} style={{padding:'3px 10px',borderRadius:'999px',fontSize:'10px',fontWeight:600,border:'none',cursor:'pointer',background:active?'#3b82f6':'#1f2937',color:active?'#fff':'#9ca3af'}}>{label}</button>}
function StatusBadge({status,color}:{status:string;color:string}){return<span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'999px',background:`${color}22`,color}}>{status}</span>}
const inp={padding:'6px 8px',borderRadius:'4px',border:'1px solid #374151',background:'#1f2937',color:'#e2e8f0',fontSize:'11px',outline:'none'}
