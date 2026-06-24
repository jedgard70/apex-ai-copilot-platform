import { useState, useEffect } from 'react'; import { X, Calculator, FileText, Plus } from 'lucide-react'
export function AccountingPanel({ onClear }: { onClear: () => void }) {
  const [companies, setCompanies] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null); const [report, setReport] = useState<any>(null)
  const [form, setForm] = useState({ companyName: '', cnpj: '', tradeName: '', fiscalRegime: 'Simples Nacional', cnae: '', crc: '' })
  useEffect(() => { fetch('/api/accounting/list').then(r => r.json()).then(d => { if (d.companies) setCompanies(d.companies) }) }, [])

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

  return (<section style={{ padding: '16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><span style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}><Calculator size={14} style={{ display: 'inline' }} /> Contabilidade (CRC)</span><h2 style={{ margin: '4px 0', fontSize: '16px' }}>IRPJ, DRE, Balanço, Obrigações</h2></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { const n = prompt('Nome da empresa:'); if (n) { setForm({ ...form, companyName: n }); document.getElementById('acc-form')?.scrollIntoView() } }}><Plus size={15} /> Nova Empresa</button>
          <button onClick={onClear} className="ghost-action"><X size={16} /></button>
        </div>
      </div>
      <div id="acc-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Razão Social *" style={s} />
        <input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="CNPJ" style={s} />
        <input value={form.cnae} onChange={e => setForm(p => ({ ...p, cnae: e.target.value }))} placeholder="CNAE" style={s} />
        <select value={form.fiscalRegime} onChange={e => setForm(p => ({ ...p, fiscalRegime: e.target.value }))} style={s}>
          <option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>
        </select>
        <input value={form.crc} onChange={e => setForm(p => ({ ...p, crc: e.target.value }))} placeholder="CRC (Dr. Edgard)" style={s} />
        <button onClick={createCompany} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cadastrar Empresa</button>
      </div>
      {companies.map(cmp => (
        <div key={cmp.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
          onClick={() => { setSelected(selected === cmp.id ? null : cmp.id); setReport(null) }}>
          <div style={{ fontWeight: 600 }}>{cmp.companyName}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{cmp.cnpj} · {cmp.fiscalRegime}</div>
          {selected === cmp.id && (
            <div style={{ marginTop: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); generateReport(cmp.id) }} disabled={loading}><FileText size={14} /> Gerar Relatório Fiscal</button>
              {report && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                      Base de Cálculo: R$ {report.irpj?.baseCalculo?.toLocaleString('pt-BR')}<br />
                      Alíquota: {report.irpj?.aliquota}%<br />
                      IRPJ Devido: R$ {report.irpj?.totalIRPJ?.toLocaleString('pt-BR')}<br />
                      Vencimento: {report.irpj?.vencimento}
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px' }}>Formulários Pendentes</h4>
                    {report.formularios?.map((f: any) => (
                      <div key={f.nome} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span>{f.nome} <small style={{ color: '#6b7280' }}>({f.periodo})</small></span>
                        <span style={{ color: '#f59e0b' }}>{f.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>)
}
const s = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
