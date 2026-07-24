import { useEffect, useState } from 'react'
import { X, RefreshCw, CheckCircle, Clock, AlertCircle, ExternalLink, Cpu, Database, Globe, Workflow, Users } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
const TYPE_ICONS: Record<string, any> = { BIM: Cpu, ERP: Database, CRM: Users, Automação: Workflow, 'Multi-Agent': Globe }
const STATUS_ICONS: Record<string, any> = { conectado: CheckCircle, disponivel: Clock, planejado: AlertCircle }
const STATUS_COLORS: Record<string, string> = { conectado: '#22c55e', disponivel: '#3b82f6', planejado: '#6b7280' }

export function EnterpriseIntegrationsPanel({ onClear }: { onClear: () => void }) {
  const [integrations, setIntegrations] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  async function load() { setLoading(true); try { const r=await fetch('/api/enterprise/integrations'); const d=await r.json(); if(d.integrations) setIntegrations(d.integrations) }catch{}finally{setLoading(false)} }
  useEffect(()=>{load()},[])
  const tipos = [...new Set(integrations.map(i=>i.tipo))]
  return (<PremiumPanelLayout title="Conectores Enterprise" subtitle="Configurações e monitoramento" onClose={onClear}>
    <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
      <button onClick={load} disabled={loading} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer'}}><RefreshCw size={15} className={loading?'spin-icon':''} /> Refresh</button>
    </div>
    {tipos.map(tipo => (<div key={tipo} style={{padding:'10px',background:'#111827',borderRadius:'8px',border:'1px solid #1f2937',marginBottom:'8px'}}>
      <span style={{fontSize:'12px',fontWeight:600,color:'#6366f1',marginBottom:'6px',display:'block'}}>{tipo}</span>
      {integrations.filter(i=>i.tipo===tipo).map((inv:any) => {
        const Icon = TYPE_ICONS[inv.tipo] || Cpu; const StatIcon = STATUS_ICONS[inv.status] || Clock
        return (<div key={inv.nome} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid #1f2937',fontSize:'12px'}}>
          <Icon size={14} color={STATUS_COLORS[inv.status]||'#6b7280'} />
          <div style={{flex:1}}><span style={{color:'#e2e8f0',fontWeight:600}}>{inv.nome}</span><span style={{color:'#6b7280',fontSize:'10px',marginLeft:'8px'}}>{inv.descricao}</span></div>
          <StatIcon size={12} color={STATUS_COLORS[inv.status]||'#6b7280'} />
          <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'999px',background:`${(STATUS_COLORS[inv.status]||'#6b7280')}22`,color:STATUS_COLORS[inv.status]||'#6b7280'}}>{inv.status}</span>
        </div>)
      })}
    </div>))}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
  </PremiumPanelLayout>)
}
