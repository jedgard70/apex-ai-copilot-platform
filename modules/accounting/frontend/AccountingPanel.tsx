// @ts-nocheck
import { useState, useEffect } from 'react'
import { X, Calculator, FileText, Plus, Building2, User, LayoutDashboard, Settings, LogOut, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { PremiumPanelLayout } from '../../../src/components/PremiumPanelLayout'

const inp = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', width: '100%' }
const btnStyle = { padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }

export function AccountingPanel({ onClear }: { onClear: () => void }) {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    const saved = localStorage.getItem('apex_acc_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  if (!user) {
    return <AccountingLogin onLogin={setUser} onClear={onClear} />
  }

  return <AccountingERP user={user} onLogout={() => { localStorage.removeItem('apex_acc_user'); setUser(null) }} onClear={onClear} />
}

function AccountingLogin({ onLogin, onClear }: { onLogin: (u: any) => void, onClear: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounting/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok && data.user) {
        localStorage.setItem('apex_acc_user', JSON.stringify(data.user))
        onLogin(data.user)
      } else {
        setError(data.error || 'Credenciais inválidas')
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    }
    setLoading(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '320px', border: '1px solid #e5e7eb' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', background: '#ecfdf5', color: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Lock size={24} />
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: '#111827' }}>Apex ERP Contábil</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Acesso restrito ao departamento</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{...inp, boxSizing: 'border-box'}} placeholder="maria.eduarda@email.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{...inp, boxSizing: 'border-box'}} placeholder="••••••••" />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '12px', textAlign: 'center', background: '#fef2f2', padding: '6px', borderRadius: '4px', border: '1px solid #fecaca' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: '8px' }}>
              {loading ? 'Entrando...' : 'Entrar no ERP'}
            </button>
          </form>
          <div style={{ marginTop: '16px', fontSize: '11px', color: '#9ca3af', textAlign: 'center', lineHeight: '1.5' }}>
            <strong>Ambiente Demo</strong><br/>
            Contador: admin@apex.com / admin<br/>
            Cliente: maria.eduarda@email.com / 123
          </div>
        </div>
      </div>
      <style>{`.ghost-action { background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justifyContent: center; border-radius: 4px; } .ghost-action:hover { background: #e5e7eb; }`}</style>
    </div>
  )
}

function AccountingERP({ user, onLogout, onClear }: { user: any, onLogout: () => void, onClear: () => void }) {
  const [view, setView] = useState<'dashboard' | 'pj' | 'pf'>('dashboard')
  
  return (
    <PremiumPanelLayout
      title="Accounting Panel"
      subtitle="Gerenciamento do módulo"
      headerActions={<button className="ghost-action" onClick={onClear} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>}
    >
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculator size={20} color="#34d399" />
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>ERP Contábil</div>
        </div>
        <div style={{ padding: '16px', fontSize: '11px', color: '#9ca3af', borderBottom: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>Logado como:</span>
          <strong style={{ color: '#fff', fontSize: '13px' }}>{user.name}</strong>
          <span style={{ color: '#34d399', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</span>
        </div>
        <div style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SidebarBtn icon={<LayoutDashboard size={16} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          {user.role === 'admin' && (
            <>
              <SidebarBtn icon={<Building2 size={16} />} label="Empresas (PJ)" active={view === 'pj'} onClick={() => setView('pj')} />
              <SidebarBtn icon={<User size={16} />} label="Pessoas (PF)" active={view === 'pf'} onClick={() => setView('pf')} />
            </>
          )}
          {user.role === 'client' && (
            <>
              <SidebarBtn icon={<Building2 size={16} />} label="Minhas Empresas" active={view === 'pj'} onClick={() => setView('pj')} />
            </>
          )}
        </div>
        <div style={{ padding: '12px 8px', borderTop: '1px solid #374151' }}>
          <button onClick={onLogout} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }} className="hover-bg-red">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {view === 'dashboard' && <ERPDashboard user={user} />}
          {view === 'pj' && <PJTab user={user} />}
          {view === 'pf' && <PFTab user={user} />}
        </div>
      </div>
      <style>{`
        .sidebar-btn { width: 100%; padding: 10px 12px; background: transparent; border: none; color: #d1d5db; display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.2s; font-weight: 500; }
        .sidebar-btn:hover { background: #1f2937; color: #fff; }
        .sidebar-btn.active { background: rgba(5, 150, 105, 0.2); color: #34d399; font-weight: 600; }
        .hover-bg-red:hover { background: rgba(239,68,68,0.1); }
        .stat-card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1); }
        .ghost-action { background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justifyContent: center; border-radius: 4px; }
        .ghost-action:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
    </PremiumPanelLayout>
  )
}

function SidebarBtn({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button className={`sidebar-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {icon} {label}
    </button>
  )
}

function ERPDashboard({ user }: { user: any }) {
  const [companies, setCompanies] = useState<any[]>([])
  const [persons, setPersons] = useState<any[]>([])
  const [obrigacoes, setObrigacoes] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/accounting/list').then(r => r.json()).then(d => { if (d.companies) setCompanies(d.companies) })
    fetch('/api/accounting/pf/list').then(r => r.json()).then(d => { if (d.persons) setPersons(d.persons) })
    fetch('/api/accounting/obrigacoes-pj').then(r => r.json()).then(d => { if (d.obrigacoes) setObrigacoes(d.obrigacoes) })
  }, [])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="stat-card" style={{ borderTop: '4px solid #059669' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Building2 size={16}/> Total Empresas (PJ)</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>{user.role === 'client' ? 1 : companies.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><User size={16}/> Total Pessoas (PF)</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>{user.role === 'client' ? 1 : persons.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><AlertTriangle size={16}/> Obrigações Pendentes</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>{obrigacoes.length}</div>
        </div>
      </div>
      
      <div className="stat-card">
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
          <CheckCircle size={18} color="#059669" /> Status do Sistema ERP
        </h3>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 12px', lineHeight: '1.6' }}>
          Bem-vindo ao <strong>Módulo Contábil (ERP)</strong>. Este ambiente está operando de forma independente e isolada, com suporte a cálculos tributários reais (DRE, IRPJ, CSLL, IRPF) e rastreamento de obrigações legais.
        </p>
        <div style={{ display: 'inline-flex', background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
          Ambiente: Produção (Live)
        </div>
      </div>
    </div>
  )
}

function PJTab({ user }: { user: any }) {
  const [companies, setCompanies] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null); const [report, setReport] = useState<any>(null)
  const [form, setForm] = useState<any>({ companyName: '', cnpj: '', tradeName: '', fiscalRegime: 'Simples Nacional', cnae: '', crc: '' })
  
  useEffect(() => {
    fetch('/api/accounting/list').then(r => r.json()).then(d => { if (d.companies) setCompanies(d.companies) })
  }, [])
  
  async function createCompany() {
    if (!form.companyName) return; setLoading(true)
    await fetch('/api/accounting/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ companyName: '', cnpj: '', tradeName: '', fiscalRegime: 'Simples Nacional', cnae: '', crc: '' })
    const r = await fetch('/api/accounting/list'); const d = await r.json(); if (d.companies) setCompanies(d.companies)
    setLoading(false)
  }
  
  async function generateReport(id: string) {
    setLoading(true); const r = await fetch('/api/accounting/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, period: 'Mensal' }) })
    const d = await r.json(); if (d.report) setReport(d.report); setLoading(false)
  }
  
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {user.role === 'admin' && (
      <div className="stat-card" style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#065f46' }}>Nova Empresa (PJ)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input value={form.companyName} onChange={e => setForm((p: any) => ({ ...p, companyName: e.target.value }))} placeholder="Razão Social *" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.cnpj} onChange={e => setForm((p: any) => ({ ...p, cnpj: e.target.value }))} placeholder="CNPJ" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.cnae} onChange={e => setForm((p: any) => ({ ...p, cnae: e.target.value }))} placeholder="CNAE" style={{...inp, boxSizing: 'border-box'}} />
          <select value={form.fiscalRegime} onChange={e => setForm((p: any) => ({ ...p, fiscalRegime: e.target.value }))} style={{...inp, boxSizing: 'border-box'}}>
            <option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>
          </select>
          <input value={form.crc} onChange={e => setForm((p: any) => ({ ...p, crc: e.target.value }))} placeholder="CRC (Contador)" style={{...inp, boxSizing: 'border-box'}} />
          <button onClick={createCompany} disabled={loading} style={{ gridColumn: '1 / -1', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={16} /> Cadastrar Empresa
          </button>
        </div>
      </div>
    )}
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
      {companies.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', background: '#fff', borderRadius: '10px', border: '1px dashed #d1d5db' }}>Nenhuma empresa cadastrada.</div>}
      {companies.map((cmp: any) => (<div key={cmp.id} className="stat-card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', padding: '20px' }}
        onClick={() => { setSelected(selected === cmp.id ? null : cmp.id); setReport(null) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{cmp.companyName}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>CNPJ: {cmp.cnpj || 'Não informado'} • {cmp.fiscalRegime}</div>
          </div>
          <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Ativo</span>
        </div>
        
        {selected === cmp.id && <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={(e) => { e.stopPropagation(); generateReport(cmp.id) }} disabled={loading} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> {loading && !report ? 'Gerando...' : 'Gerar DRE & Impostos'}
          </button>
          
          {report && <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#111827' }}>Demonstrativo do Resultado (DRE) - {report.period}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Receita Líquida</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>R$ {report.dre?.receitaLiquida?.toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Despesas Admin.</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>R$ {report.dre?.despesasAdministrativas?.toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Lucro Líquido</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>R$ {report.dre?.lucroLiquido?.toLocaleString('pt-BR')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, padding: '16px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#4c1d95' }}>Apuração de Impostos (IRPJ / CSLL)</h4>
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Base de Cálculo</span>
                    <strong>R$ {report.irpj?.baseCalculo?.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Alíquota</span>
                    <strong>{report.irpj?.aliquota}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #c4b5fd' }}>
                    <span style={{ color: '#4c1d95', fontWeight: 600 }}>Total Devido</span>
                    <strong style={{ color: '#4c1d95', fontSize: '16px' }}>R$ {report.irpj?.totalIRPJ?.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>Vencimento</span>
                    <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>{report.irpj?.vencimento}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>}
        </div>}
      </div>))}
    </div>
  </div>)
}

function PFTab({ user }: { user: any }) {
  const [persons, setPersons] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null); const [report, setReport] = useState<any>(null)
  const [form, setForm] = useState<any>({ name: '', cpf: '', email: '', phone: '', profissao: '', regimeTributario: 'Declaração Simplificada' })
  
  useEffect(() => {
    fetch('/api/accounting/pf/list').then(r => r.json()).then(d => { if (d.persons) setPersons(d.persons) })
  }, [])
  
  async function createPerson() {
    if (!form.name) return; setLoading(true)
    await fetch('/api/accounting/pf/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', cpf: '', email: '', phone: '', profissao: '', regimeTributario: 'Declaração Simplificada' })
    const r = await fetch('/api/accounting/pf/list'); const d = await r.json(); if (d.persons) setPersons(d.persons)
    setLoading(false)
  }
  
  async function generateReport(id: string) {
    setLoading(true); const r = await fetch('/api/accounting/pf/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const d = await r.json(); if (d.report) setReport(d.report); setLoading(false)
  }
  
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {user.role === 'admin' && (
      <div className="stat-card" style={{ padding: '20px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e3a8a' }}>Nova Pessoa Física (PF)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome completo *" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.cpf} onChange={e => setForm((p: any) => ({ ...p, cpf: e.target.value }))} placeholder="CPF" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="Email" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Telefone" style={{...inp, boxSizing: 'border-box'}} />
          <input value={form.profissao} onChange={e => setForm((p: any) => ({ ...p, profissao: e.target.value }))} placeholder="Profissão" style={{...inp, boxSizing: 'border-box'}} />
          <select value={form.regimeTributario} onChange={e => setForm((p: any) => ({ ...p, regimeTributario: e.target.value }))} style={{...inp, boxSizing: 'border-box'}}>
            <option>Declaração Simplificada</option><option>Declaração Completa</option>
          </select>
          <button onClick={createPerson} disabled={loading} style={{ gridColumn: '1 / -1', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={16} /> Cadastrar Pessoa Física
          </button>
        </div>
      </div>
    )}
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
      {persons.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', background: '#fff', borderRadius: '10px', border: '1px dashed #d1d5db' }}>Nenhuma PF cadastrada.</div>}
      {persons.map((p: any) => (<div key={p.id} className="stat-card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', padding: '20px' }}
        onClick={() => { setSelected(selected === p.id ? null : p.id); setReport(null) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{p.name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>CPF: {p.cpf || 'Não informado'} • {p.profissao || 'Profissão não informada'}</div>
          </div>
        </div>
        
        {selected === p.id && <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={(e) => { e.stopPropagation(); generateReport(p.id) }} disabled={loading} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> {loading && !report ? 'Calculando...' : 'Planejamento IRPF & Carnê-Leão'}
          </button>
          
          {report && <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#92400e' }}>💡 Deduções Permitidas (IRPF)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.deducoesPossiveis?.map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #fef3c7', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, color: '#92400e' }}>{d.tipo}</span>
                      <span style={{ color: '#059669', fontSize: '11px', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>{d.recomendado}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155' }}>📊 Faixas IRPF (Atualizado)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(report.faixasIRPF || []).map((f: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{f.faixa}</span>
                      <span style={{ fontWeight: 600, color: f.aliquota === 'Isento' ? '#059669' : '#dc2626' }}>{f.aliquota}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}
        </div>}
      </div>))}
    </div>
  </div>)
}
