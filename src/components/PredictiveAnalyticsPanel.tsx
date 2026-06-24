import { useEffect, useState } from 'react'
import { X, RefreshCw, AlertTriangle, TrendingDown, Zap, TrendingUp, Shield, BarChart3, Lightbulb } from 'lucide-react'

export function PredictiveAnalyticsPanel({ onClear }: { onClear: () => void }) {
  const [report, setReport] = useState<any>(null); const [loading, setLoading] = useState(false)
  async function load() { setLoading(true); try { const r=await fetch('/api/predictive/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projeto:'Geral'})}); const d=await r.json(); if(d.report) setReport(d.report) }catch{}finally{setLoading(false)} }
  useEffect(()=>{load()},[])
  const scoreColor = report?.scoreGeral >= 70 ? '#22c55e' : report?.scoreGeral >= 50 ? '#f59e0b' : '#ef4444'

  return (<section style={{padding:'12px',height:'100%',overflow:'auto',display:'flex',flexDirection:'column',gap:'8px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div><span style={{color:'#a855f7',fontSize:'11px',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.05em'}}><TrendingDown size={14} style={{display:'inline'}} /> Predictive Analytics</span>
        <h2 style={{margin:'4px 0',fontSize:'16px'}}>Inteligência Preditiva</h2>
        <p style={{fontSize:'11px',color:'#6b7280',margin:0}}>Atrasos, riscos financeiros, gargalos e retrabalho</p>
      </div>
      <div style={{display:'flex',gap:'4px'}}>
        <button onClick={load} disabled={loading} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer'}}><RefreshCw size={15} className={loading?'spin-icon':''} /></button>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>
    </div>

    {report && <><div style={{display:'flex',alignItems:'center',gap:'12px',padding:'16px',background:'#111827',borderRadius:'8px',border:`1px solid ${scoreColor}33`}}>
      <div style={{width:64,height:64,borderRadius:'50%',border:`4px solid ${scoreColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:700,color:scoreColor}}>{report.scoreGeral}</div>
      <div><div style={{fontSize:'14px',fontWeight:600,color:'#e2e8f0'}}>Score de Risco Geral</div>
        <div style={{fontSize:'12px',color:'#9ca3af',marginTop:2}}>{report.resumo}</div></div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'8px'}}>
      {/* Delay Risk */}
      <div style={{padding:'12px',background:'#111827',borderRadius:'8px',border:'1px solid #f59e0b33'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}><Zap size={14} color="#f59e0b" /><span style={{fontSize:'13px',fontWeight:600,color:'#e2e8f0'}}>Risco de Atraso</span></div>
        <div style={{fontSize:'24px',fontWeight:700,color:'#f59e0b',marginBottom:'4px'}}>{Math.round(report.delays.probAtrasoGeral*100)}%</div>
        <div style={{fontSize:'11px',color:'#6b7280'}}>~{report.delays.diasAtrasoEstimado} dias estimados</div>
      </div>
      {/* Finance Risk */}
      <div style={{padding:'12px',background:'#111827',borderRadius:'8px',border:'1px solid #ef444433'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}><BarChart3 size={14} color="#ef4444" /><span style={{fontSize:'13px',fontWeight:600,color:'#e2e8f0'}}>Risco Financeiro</span></div>
        <div style={{fontSize:'24px',fontWeight:700,color:'#ef4444',marginBottom:'4px'}}>R$ {(report.finance.valorEmRisco/1000).toFixed(0)}K</div>
        <div style={{fontSize:'11px',color:'#6b7280'}}>em risco</div>
      </div>
      {/* Bottlenecks */}
      <div style={{padding:'12px',background:'#111827',borderRadius:'8px',border:'1px solid #3b82f633'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}><AlertTriangle size={14} color="#3b82f6" /><span style={{fontSize:'13px',fontWeight:600,color:'#e2e8f0'}}>Gargalos</span></div>
        <div style={{fontSize:'24px',fontWeight:700,color:'#3b82f6',marginBottom:'4px'}}>{report.bottlenecks.gargalos.length}</div>
        <div style={{fontSize:'11px',color:'#6b7280'}}>detectados</div>
      </div>
    </div>

    {/* Risk Factors */}
    {report.delays.delayRisk.length > 0 && <div style={{padding:'12px',background:'#111827',borderRadius:'8px',border:'1px solid #1f2937'}}>
      <span style={{fontSize:'12px',fontWeight:600,color:'#e2e8f0',marginBottom:'6px',display:'block'}}>🔴 Fatores de Risco - Atraso</span>
      {report.delays.delayRisk.map((r:any,i:number) => (<div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid #1f2937',fontSize:'12px'}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:r.cor}} />
        <span style={{color:'#e2e8f0',flex:1}}>{r.fator}</span>
        <span style={{padding:'2px 8px',borderRadius:'999px',fontSize:'10px',background:`${r.cor}22`,color:r.cor}}>{Math.round(r.impacto*100)}%</span>
        <span style={{fontSize:'10px',color:'#6b7280'}}>{r.descricao}</span>
      </div>))}
    </div>}

    {/* Recommends */}
    {report.delays.recomendacoes.length > 0 && <div style={{padding:'12px',background:'#fffbeb11',borderRadius:'8px',border:'1px solid #f59e0b33'}}>
      <span style={{fontSize:'12px',fontWeight:600,color:'#f59e0b',marginBottom:'6px',display:'block'}}><Lightbulb size={14} style={{display:'inline'}} /> Recomendações</span>
      {[...report.delays.recomendacoes,...report.finance.recomendacoes,...report.bottlenecks.recomendacoes].map((r:any,i:number) => (
        <div key={i} style={{padding:'4px 0',fontSize:'12px',color:'#9ca3af'}}>• {typeof r === 'string' ? r : r}</div>
      ))}
    </div>}
    </>}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
  </section>)
}
