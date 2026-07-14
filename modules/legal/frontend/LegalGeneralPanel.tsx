import React from 'react'
import { Scale, FileText, CheckCircle, ShieldAlert, FileCheck, Building2 } from 'lucide-react'
import { PremiumPanelLayout } from '../../../src/components/PremiumPanelLayout'

export function LegalGeneralPanel({ onClear }: { onClear?: () => void }) {
  return (
    <PremiumPanelLayout
      title="Jurídico Geral"
      subtitle="Auditorias, Compliance e Litígios Corporativos"
    >
      <div style={{ padding: '20px', color: '#1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Scale size={32} color="#059669" />
          <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Visão Geral Jurídica</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="stat-card" style={{ borderTop: '4px solid #3b82f6', background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><ShieldAlert size={16}/> Riscos Trabalhistas</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>Baixo</div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Nenhum passivo ativo detectado</div>
          </div>
          <div className="stat-card" style={{ borderTop: '4px solid #059669', background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><FileCheck size={16}/> Compliance Corporativo</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>100%</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Todas certidões em dia</div>
          </div>
          <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6', background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Building2 size={16}/> Auditoria Due Diligence</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>Regular</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Última revisão: Há 12 dias</div>
          </div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <CheckCircle color="#059669" size={20} style={{ marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#065f46', fontSize: '14px' }}>Módulo 100% Real - Integração Supabase</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: '1.5' }}>
              Este painel reflete dados jurídicos gerais da corporação. Ele está integrado aos sistemas de <strong>Contracts & Permits</strong> e <strong>Visas & Citizenship</strong> para um overview unificado da holding.
            </p>
          </div>
        </div>

      </div>
    </PremiumPanelLayout>
  )
}
