import React, { useState } from 'react'
import { FileText, Globe, CheckCircle2, Clock, AlertCircle, Plus, Search, Filter } from 'lucide-react'

type PermitStatus = 'approved' | 'pending' | 'rejected' | 'in_review'
type PermitRegion = 'Brazil' | 'USA' | 'Europe' | 'Other'

interface Permit {
  id: string
  name: string
  type: string
  region: PermitRegion
  status: PermitStatus
  authority: string
  submittedAt: string
  expiresAt?: string
  notes?: string
}

const STATUS_CONFIG: Record<PermitStatus, { label: string; color: string; icon: React.FC<any> }> = {
  approved:  { label: 'Aprovado',    color: '#10b981', icon: CheckCircle2 },
  pending:   { label: 'Pendente',    color: '#f59e0b', icon: Clock },
  in_review: { label: 'Em Análise', color: '#3b82f6', icon: Clock },
  rejected:  { label: 'Reprovado',  color: '#ef4444', icon: AlertCircle },
}

const MOCK_PERMITS: Permit[] = [
  { id: 'p1', name: 'Alvará de Construção – Edifício Alpha', type: 'Construction Permit', region: 'Brazil', status: 'approved', authority: 'PMSP', submittedAt: '2026-03-10', expiresAt: '2027-03-10' },
  { id: 'p2', name: 'Licença Ambiental – Fase 2', type: 'Environmental', region: 'Brazil', status: 'in_review', authority: 'CETESB', submittedAt: '2026-05-20' },
  { id: 'p3', name: 'Occupancy Permit – Miami Project', type: 'Occupancy', region: 'USA', status: 'pending', authority: 'Miami-Dade Building Dept.', submittedAt: '2026-06-01' },
  { id: 'p4', name: 'CE Marking – Equipment Export', type: 'Regulatory', region: 'Europe', status: 'approved', authority: 'EU Notified Body', submittedAt: '2026-01-15', expiresAt: '2028-01-15' },
]

export function GlobalPermitsPanel() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PermitStatus | 'all'>('all')

  const filtered = MOCK_PERMITS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.authority.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0b1326', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px' }}>
                <Globe size={28} color="#818cf8" />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                Global Permits
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
              Gestão de alvarás, licenças e permissões regulatórias globais
            </p>
          </div>
          <button style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}>
            <Plus size={16} /> Novo Permit
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {(['approved', 'in_review', 'pending', 'rejected'] as PermitStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s]
            const count = MOCK_PERMITS.filter(p => p.status === s).length
            const Icon = cfg.icon
            return (
              <div key={s} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cfg.label}</span>
                  <Icon size={16} color={cfg.color} />
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: cfg.color }}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 12px' }}>
            <Search size={16} color="#64748b" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar permits..."
              style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '13px', padding: '10px 0', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'approved', 'in_review', 'pending', 'rejected'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter === s ? '#818cf8' : '#94a3b8',
              }}>
                {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Nenhum permit encontrado.</p>
            </div>
          ) : filtered.map((permit, idx) => {
            const cfg = STATUS_CONFIG[permit.status]
            const Icon = cfg.icon
            return (
              <div key={permit.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                alignItems: 'center', padding: '16px 24px',
                borderBottom: idx !== filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>{permit.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{permit.type} · {permit.authority}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{permit.region}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <div>Enviado: {permit.submittedAt}</div>
                  {permit.expiresAt && <div>Expira: {permit.expiresAt}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                  <span style={{ fontSize: '12px', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GlobalPermitsPanel
