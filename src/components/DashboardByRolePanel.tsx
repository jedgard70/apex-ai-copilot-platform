import { useEffect, useState } from 'react'
import { X, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Users, FileText, BarChart3, Target } from 'lucide-react'

const ROLE_META: Record<string, { label: string; color: string }> = {
  'diretor-executivo': { label: 'Diretor Executivo', color: '#a855f7' },
  'engenheiro': { label: 'Engenheiro', color: '#3b82f6' },
  'arquiteto': { label: 'Arquiteto', color: '#8b5cf6' },
  'investidor': { label: 'Investidor', color: '#22c55e' },
  'gestor-obra': { label: 'Gestor de Obra', color: '#10b981' },
  'vendas': { label: 'Agente de Vendas', color: '#f59e0b' },
  'compliance': { label: 'Compliance Officer', color: '#ef4444' },
}

export function DashboardByRolePanel({ onClear }: { onClear: () => void }) {
  const [roles, setRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState('diretor-executivo')
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/roles').then(r => r.json()).then(d => {
      if (d.roles) setRoles(d.roles)
    })
  }, [])

  useEffect(() => { loadDashboard() }, [selectedRole])

  async function loadDashboard() {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRole }),
      })
      const d = await r.json()
      if (d.dashboard) setDashboard(d.dashboard)
    } catch { /* */ }
    finally { setLoading(false) }
  }

  const meta = ROLE_META[selectedRole] || { label: 'Dashboard', color: '#6b7280' }

  return (
    <section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: meta.color, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <BarChart3 size={14} style={{ display: 'inline' }} /> Dashboard Executivo ACIP
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>{dashboard?.icon || '📊'} {meta.label}</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Visão personalizada para seu perfil</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={loadDashboard} disabled={loading} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {/* Role selector */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
        {roles.map((r: any) => (
          <button key={r.id} onClick={() => setSelectedRole(r.id)}
            style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
              background: selectedRole === r.id ? (ROLE_META[r.id]?.color || '#3b82f6') + '33' : '#111827',
              color: selectedRole === r.id ? (ROLE_META[r.id]?.color || '#3b82f6') : '#9ca3af',
              borderBottom: selectedRole === r.id ? `2px solid ${ROLE_META[r.id]?.color || '#3b82f6'}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >{r.icon} {r.name}</button>
        ))}
      </div>

      {loading && !dashboard && <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Carregando dashboard...</div>}

      {dashboard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {dashboard.cards?.map((card: any, i: number) => (
              <div key={i} style={{ padding: '12px', background: '#111827', borderRadius: '8px', border: `1px solid ${card.color}22` }}>
                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: card.color }}>{card.value}</div>
                {card.trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: card.trend.startsWith('+') ? '#22c55e' : '#ef4444', marginTop: '2px' }}>
                    {card.trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {card.trend}
                  </div>
                )}
                {card.detail && <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{card.detail}</div>}
              </div>
            ))}
          </div>

          {/* Alerts */}
          {dashboard.alerts && dashboard.alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Alertas</span>
              {dashboard.alerts.map((a: any, i: number) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: '6px', fontSize: '11px',
                  background: a.severity === 'critical' ? '#ef444411' : a.severity === 'warning' ? '#f59e0b11' : '#3b82f611',
                  border: `1px solid ${a.severity === 'critical' ? '#ef444433' : a.severity === 'warning' ? '#f59e0b33' : '#3b82f633'}`,
                  color: a.severity === 'critical' ? '#fca5a5' : a.severity === 'warning' ? '#fde68a' : '#93c5fd',
                }}>
                  {a.text}
                </div>
              ))}
            </div>
          )}

          {/* Projects table */}
          {dashboard.projects && dashboard.projects.length > 0 && (
            <div style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Projetos</span>
              {dashboard.projects.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1f2937', fontSize: '12px' }}>
                  <span style={{ color: '#e2e8f0', flex: 1 }}>{p.name}</span>
                  <span style={{
                    padding: '1px 8px', borderRadius: '999px', fontSize: '10px',
                    background: p.status === 'concluido' ? '#22c55e22' : p.status === 'em-andamento' ? '#3b82f622' : '#f59e0b22',
                    color: p.status === 'concluido' ? '#22c55e' : p.status === 'em-andamento' ? '#3b82f6' : '#f59e0b',
                  }}>{p.status}</span>
                  {p.progresso != null && (
                    <div style={{ width: 80, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${p.progresso}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                    </div>
                  )}
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>{p.progresso}%</span>
                  {p.vgv && <span style={{ color: '#22c55e', fontSize: '11px' }}>{p.vgv}</span>}
                  {p.responsavel && <span style={{ color: '#6b7280', fontSize: '10px' }}>{p.responsavel}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Leads table (for vendas) */}
          {dashboard.leads && dashboard.leads.length > 0 && (
            <div style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Leads / Pipeline</span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {dashboard.vglPorStage?.map((s: any, i: number) => (
                  <div key={i} style={{ flex: 1, padding: '8px', background: '#1a1a2e', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#6b7280' }}>{s.stage}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{toShort(s.valor)}</div>
                  </div>
                ))}
              </div>
              {dashboard.leads.map((l: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: '1px solid #1f2937', fontSize: '11px' }}>
                  <span style={{ color: '#e2e8f0', minWidth: 120 }}>{l.name}</span>
                  <span style={{ color: '#6b7280', flex: 1 }}>{l.empresa}</span>
                  <span style={{ color: '#22c55e' }}>{l.valor}</span>
                  <span style={{ color: '#f59e0b' }}>{l.probabilidade}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: '999px', fontSize: '9px',
                    background: l.status === 'quente' ? '#ef444422' : l.status === 'morno' ? '#f59e0b22' : '#6b728022',
                    color: l.status === 'quente' ? '#ef4444' : l.status === 'morno' ? '#f59e0b' : '#6b7280',
                  }}>{l.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* NCIs (for engenheiro / compliance) */}
          {dashboard.ncis && dashboard.ncis.length > 0 && (
            <div style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Não-Conformidades (NCIs)</span>
              {dashboard.ncis.map((n: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: '1px solid #1f2937', fontSize: '11px' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: n.severidade === 'alta' ? '#ef4444' : n.severidade === 'media' ? '#f59e0b' : '#3b82f6',
                  }} />
                  <span style={{ color: '#e2e8f0', flex: 1 }}>{n.descricao}</span>
                  <span style={{ color: '#6b7280' }}>{n.projeto}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: '999px', fontSize: '9px',
                    background: n.status === 'fechada' ? '#22c55e22' : n.status === 'em-tratamento' ? '#3b82f622' : '#ef444422',
                    color: n.status === 'fechada' ? '#22c55e' : n.status === 'em-tratamento' ? '#3b82f6' : '#ef4444',
                  }}>{n.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Compliance Checklist */}
          {dashboard.checklist && dashboard.checklist.length > 0 && (
            <div style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Checklist de Conformidade</span>
              {dashboard.checklist.map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: '1px solid #1f2937', fontSize: '11px' }}>
                  {c.status === 'ok' ? <CheckCircle size={12} color="#22c55e" /> : c.status === 'pendente' ? <AlertTriangle size={12} color="#ef4444" /> : <Activity size={12} color="#f59e0b" />}
                  <span style={{ color: '#e2e8f0', flex: 1 }}>{c.item}</span>
                  <span style={{ color: '#6b7280' }}>{c.orgao}</span>
                  <span style={{ color: '#9ca3af' }}>{c.prazo}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: '999px', fontSize: '9px',
                    background: c.status === 'ok' ? '#22c55e22' : c.status === 'pendente' ? '#ef444422' : '#f59e0b22',
                    color: c.status === 'ok' ? '#22c55e' : c.status === 'pendente' ? '#ef4444' : '#f59e0b',
                  }}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>
  )
}

function toShort(value: any) {
  const str = String(value || '')
  const num = parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.'))
  if (isNaN(num)) return value
  if (num >= 1000) return `R$ ${(num / 1000).toFixed(1)}B`
  if (num >= 1) return `R$ ${num.toFixed(0)}K`
  return value
}
