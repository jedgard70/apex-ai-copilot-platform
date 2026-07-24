import React from 'react';
import { Play, Activity, Link as LinkIcon, Settings, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export function N8nPanel() {
  const workflows = [
    { id: 1, name: 'Lead para CRM', status: 'active', triggers: 142, lastRun: '2 mins atrás' },
    { id: 2, name: 'Sincronização ERP (SAP)', status: 'active', triggers: 89, lastRun: '15 mins atrás' },
    { id: 3, name: 'Onboarding de Fornecedor', status: 'idle', triggers: 12, lastRun: '5 horas atrás' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#0b1326', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(234, 88, 12, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <Zap size={28} color="#ea580c" />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>Automação n8n</h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', maxWidth: '500px' }}>
              Orquestração de workflows empresariais, webhooks e pipelines de dados com alta disponibilidade.
            </p>
          </div>
          <button style={{ 
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', 
            color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', 
            fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)'
          }}>
            <Plus size={18} /> Novo Workflow
          </button>
        </div>

        {/* Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#a78bfa' }}>
              <Activity size={20} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Execuções Hoje</h3>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>1,248</div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowRight size={14} style={{ transform: 'rotate(-45deg)' }} /> +14% vs ontem
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#38bdf8' }}>
              <LinkIcon size={20} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Webhooks Ativos</h3>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>24</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Tempo de resposta médio: 140ms
            </div>
          </div>

        </div>

        {/* Workflows Table */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#e2e8f0' }}>Workflows Recentes</h2>
            <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              n8n Instância Conectada
            </div>
          </div>
          
          <div style={{ padding: '0' }}>
            {workflows.map((wf, idx) => (
              <div key={wf.id} style={{ 
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', alignItems: 'center',
                padding: '16px 24px', borderBottom: idx !== workflows.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                transition: 'background 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={18} color="#94a3b8" />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: '#e2e8f0' }}>{wf.name}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {wf.status === 'active' ? (
                    <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span> <span style={{ fontSize: '12px', color: '#10b981' }}>Ativo</span></>
                  ) : (
                    <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }}></span> <span style={{ fontSize: '12px', color: '#64748b' }}>Inativo</span></>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {wf.triggers} triggers
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {wf.lastRun}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Play size={12} /> Executar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
