import { useState, useEffect } from 'react'
import { Cpu, Shield, FileText, Plus, RefreshCw, X } from 'lucide-react'

export function NRCompliancePanel({ onClear }: { onClear: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [documents, setDocuments] = useState<any[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ companyName: '', cnpj: '', address: '', responsibleEngineer: 'Dr. Edgard', creaOrOe: '', nrs: [] })
  const nrs = [{ id: 'NR-6' }, { id: 'NR-10' }, { id: 'NR-18' }, { id: 'NR-33' }, { id: 'NR-35' }, { id: 'NR-7' }, { id: 'NR-9' }, { id: 'NR-12' }]

  async function fetchProjects() {
    setLoading(true)
    const res = await fetch('/api/nr/list'); const d = await res.json()
    if (d.projects) setProjects(d.projects)
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  async function createProject() {
    if (!form.companyName || !form.cnpj) return
    setLoading(true)
    await fetch('/api/nr/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowForm(false); setForm({ companyName: '', cnpj: '', address: '', responsibleEngineer: 'Dr. Edgard', creaOrOe: '', nrs: [] })
    await fetchProjects()
    setLoading(false)
  }

  async function generateDocs(id: string) {
    setLoading(true)
    const res = await fetch('/api/nr/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const d = await res.json()
    if (d.documents) setDocuments(d.documents)
    setLoading(false)
  }

  return (
    <section style={{ padding: '16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}><Shield size={14} style={{ display: 'inline' }} /> NR Compliance</span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Documentação CREA / OE</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowForm(!showForm)}><Plus size={15} /> Novo Projeto</button>
          <button onClick={fetchProjects} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <input value={form.companyName} onChange={e => setForm((p: any) => ({ ...p, companyName: e.target.value }))} placeholder="Empresa *" style={inp} />
          <input value={form.cnpj} onChange={e => setForm((p: any) => ({ ...p, cnpj: e.target.value }))} placeholder="CNPJ *" style={inp} />
          <input value={form.address} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} placeholder="Endereço" style={{...inp, gridColumn: '1 / -1'}} />
          <input value={form.creaOrOe} onChange={e => setForm((p: any) => ({ ...p, creaOrOe: e.target.value }))} placeholder="CREA / OE" style={inp} />
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>NRs:</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {nrs.map(n => (
                <label key={n.id} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={form.nrs.includes(n.id)} onChange={e => {
                    if (e.target.checked) setForm((p: any) => ({ ...p, nrs: [...p.nrs, n.id] }))
                    else setForm((p: any) => ({ ...p, nrs: p.nrs.filter((x: string) => x !== n.id) }))
                  }} /> {n.id}
                </label>
              ))}
            </div>
          </div>
          <button onClick={createProject} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Criar Projeto NR</button>
        </div>
      )}

      {projects.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}><Shield size={32} style={{ opacity: 0.3 }} /><p>Nenhum projeto NR ainda.</p></div>
      )}

      {projects.map((p: any) => (
        <div key={p.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
          onClick={() => { setSelected(selected?.id === p.id ? null : p); setDocuments(null) }}>
          <div style={{ fontWeight: 600 }}>{p.companyName}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.cnpj} · {p.nrs?.length || 0} NRs</div>
          {selected?.id === p.id && (
            <div style={{ marginTop: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); generateDocs(p.id) }} disabled={loading} style={{ marginBottom: '8px' }}>
                <FileText size={14} /> Gerar Documentos
              </button>
              {documents && documents.map((doc: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px', marginTop: '4px', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>{doc.content}</div>
              ))}
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>
  )
}
const inp = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
