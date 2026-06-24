import { useState, useEffect } from 'react'
import { X, Calculator, FileText, Plus, Building2, User } from 'lucide-react'

const inp = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }

export function AccountingPanel({ onClear }: { onClear: () => void }) {
  const [tab, setTab] = useState<'pj' | 'pf'>('pj')

  return (
    <section style={{ padding: '16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Calculator size={14} style={{ display: 'inline' }} /> Contabilidade (CRC)
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Obrigações Fiscais PJ + PF</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>IRPJ, DRE, Balanço, IRPF, Carnê-Leão, assessoria completa</p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', paddingBottom: 4 }}>
        <button onClick={() => setTab('pj')} style={{ padding: '6px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tab === 'pj' ? '#059669' : '#f3f4f6', color: tab === 'pj' ? '#fff' : '#374151', border: 'none' }}><Building2 size={14} style={{ display: 'inline' }} /> Empresa (PJ)</button>
        <button onClick={() => setTab('pf')} style={{ padding: '6px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tab === 'pf' ? '#3b82f6' : '#f3f4f6', color: tab === 'pf' ? '#fff' : '#374151', border: 'none' }}><User size={14} style={{ display: 'inline' }} /> Pessoa Física (PF)</button>
      </div>
      {tab === 'pj' ? <PJTab /> : <PFTab />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>
  )
}

function PJTab() {
  const [companies, setCompanies] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null); const [report, setReport] = useState<any>(null)
  const [obrigacoes, setObrigacoes] = useState<any[]>([])
  const [form, setForm] = useState<any>({ companyName: '', cnpj: '', tradeName: '', fiscalRegime: 'Simples Nacional', cnae: '', crc: '' })
  useEffect(() => {
    fetch('/api/accounting/list').then(r => r.json()).then(d => { if (d.companies) setCompanies(d.companies) })
    fetch('/api/accounting/obrigacoes-pj').then(r => r.json()).then(d => { if (d.obrigacoes) setObrigacoes(d.obrigacoes) })
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
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
      <input value={form.companyName} onChange={e => setForm((p: any) => ({ ...p, companyName: e.target.value }))} placeholder="Razão Social *" style={inp} />
      <input value={form.cnpj} onChange={e => setForm((p: any) => ({ ...p, cnpj: e.target.value }))} placeholder="CNPJ" style={inp} />
      <input value={form.cnae} onChange={e => setForm((p: any) => ({ ...p, cnae: e.target.value }))} placeholder="CNAE" style={inp} />
      <select value={form.fiscalRegime} onChange={e => setForm((p: any) => ({ ...p, fiscalRegime: e.target.value }))} style={inp}>
        <option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>
      </select>
      <input value={form.crc} onChange={e => setForm((p: any) => ({ ...p, crc: e.target.value }))} placeholder="CRC (Dr. Edgard)" style={inp} />
      <button onClick={createCompany} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Cadastrar Empresa</button>
    </div>
    {obrigacoes.length > 0 && <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '14px' }}>📋 Obrigações PJ ({obrigacoes.length} itens)</h3>
      <div style={{ overflowX: 'auto', fontSize: '11px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb' }}><th style={{ padding: '6px', textAlign: 'left' }}>Obrigação</th><th style={{ padding: '6px', textAlign: 'left' }}>Período</th><th style={{ padding: '6px', textAlign: 'left' }}>Órgão</th><th style={{ padding: '6px', textAlign: 'left' }}>Prazo</th><th style={{ padding: '6px', textAlign: 'left' }}>Multa</th></tr></thead>
          <tbody>{obrigacoes.map((o: any) => (<tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '6px' }}><strong>{o.nome}</strong><br /><small style={{ color: '#6b7280' }}>{o.descricao}</small></td>
            <td style={{ padding: '6px' }}>{o.periodo}</td><td style={{ padding: '6px' }}>{o.orgao}</td>
            <td style={{ padding: '6px' }}>{o.prazo}</td><td style={{ padding: '6px', color: '#dc2626', fontSize: '10px' }}>{o.multaAtraso}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </div>}
    {companies.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Nenhuma empresa cadastrada.</div>}
    {companies.map((cmp: any) => (<div key={cmp.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
      onClick={() => { setSelected(selected === cmp.id ? null : cmp.id); setReport(null) }}>
      <div style={{ fontWeight: 600 }}>{cmp.companyName}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{cmp.cnpj} · {cmp.fiscalRegime}</div>
      {selected === cmp.id && <div style={{ marginTop: '8px' }}>
        <button onClick={(e) => { e.stopPropagation(); generateReport(cmp.id) }} disabled={loading}><FileText size={14} /> Gerar Relatório</button>
        {report && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Receita Líquida</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>R$ {report.dre?.receitaLiquida?.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Despesas</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>R$ {report.dre?.despesasAdministrativas?.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Lucro Líquido</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb' }}>R$ {report.dre?.lucroLiquido?.toLocaleString('pt-BR')}</div>
            </div>
          </div>
          <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px' }}>IRPJ</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.8' }}>Base: R$ {report.irpj?.baseCalculo?.toLocaleString('pt-BR')} | Alíq: {report.irpj?.aliquota}% | Devido: R$ {report.irpj?.totalIRPJ?.toLocaleString('pt-BR')} | Venc: {report.irpj?.vencimento}</div>
          </div>
        </div>}
      </div>}
    </div>))}
  </div>)
}

function PFTab() {
  const [persons, setPersons] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null); const [report, setReport] = useState<any>(null)
  const [obrigacoes, setObrigacoes] = useState<any[]>([])
  const [form, setForm] = useState<any>({ name: '', cpf: '', email: '', phone: '', profissao: '', regimeTributario: 'Declaração Simplificada' })
  useEffect(() => {
    fetch('/api/accounting/pf/list').then(r => r.json()).then(d => { if (d.persons) setPersons(d.persons) })
    fetch('/api/accounting/obrigacoes-pf').then(r => r.json()).then(d => { if (d.obrigacoes) setObrigacoes(d.obrigacoes) })
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
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
      <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome completo *" style={inp} />
      <input value={form.cpf} onChange={e => setForm((p: any) => ({ ...p, cpf: e.target.value }))} placeholder="CPF" style={inp} />
      <input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="Email" style={inp} />
      <input value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Telefone" style={inp} />
      <input value={form.profissao} onChange={e => setForm((p: any) => ({ ...p, profissao: e.target.value }))} placeholder="Profissão" style={inp} />
      <select value={form.regimeTributario} onChange={e => setForm((p: any) => ({ ...p, regimeTributario: e.target.value }))} style={inp}>
        <option>Declaração Simplificada</option><option>Declaração Completa</option>
      </select>
      <button onClick={createPerson} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Cadastrar PF</button>
    </div>
    {obrigacoes.length > 0 && <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '14px' }}>📋 Obrigações PF ({obrigacoes.length} itens)</h3>
      <div style={{ overflowX: 'auto', fontSize: '11px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb' }}><th style={{ padding: '6px', textAlign: 'left' }}>Obrigação</th><th style={{ padding: '6px', textAlign: 'left' }}>Período</th><th style={{ padding: '6px', textAlign: 'left' }}>Órgão</th><th style={{ padding: '6px', textAlign: 'left' }}>Prazo</th><th style={{ padding: '6px', textAlign: 'left' }}>Multa</th></tr></thead>
          <tbody>{obrigacoes.map((o: any) => (<tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '6px' }}><strong>{o.nome}</strong><br /><small style={{ color: '#6b7280' }}>{o.descricao}</small></td>
            <td style={{ padding: '6px' }}>{o.periodo}</td><td style={{ padding: '6px' }}>{o.orgao}</td>
            <td style={{ padding: '6px' }}>{o.prazo}</td><td style={{ padding: '6px', color: '#dc2626', fontSize: '10px' }}>{o.multaAtraso}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </div>}
    {persons.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Nenhuma PF cadastrada.</div>}
    {persons.map((p: any) => (<div key={p.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
      onClick={() => { setSelected(selected === p.id ? null : p.id); setReport(null) }}>
      <div style={{ fontWeight: 600 }}>{p.name}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.cpf} · {p.profissao || '—'}</div>
      {selected === p.id && <div style={{ marginTop: '8px' }}>
        <button onClick={(e) => { e.stopPropagation(); generateReport(p.id) }} disabled={loading}><FileText size={14} /> Gerar Planejamento IRPF</button>
        {report && <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px' }}>💡 Deduções Possíveis IRPF</h4>
            {report.deducoesPossiveis?.map((d: any, i: number) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid #fde68a' }}>
              <span>{d.tipo}</span><span style={{ color: '#6b7280' }}>{d.limite}</span><span style={{ color: '#059669' }}>{d.recomendado}</span>
            </div>))}
          </div>
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px' }}>📊 Tabela IRPF 2026</h4>
            {(report.faixasIRPF || []).map((f: any, i: number) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span>{f.faixa}</span><span style={{ fontWeight: 600, color: f.aliquota === 'Isento' ? '#059669' : '#dc2626' }}>{f.aliquota}</span>
            </div>))}
          </div>
        </div>}
      </div>}
    </div>))}</div>)
}
