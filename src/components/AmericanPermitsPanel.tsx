import { useState, useEffect } from 'react'; import { X, FileCheck, Plus, RefreshCw, Building2 } from 'lucide-react'
export function AmericanPermitsPanel({ onClear }: { onClear: () => void }) {
  const [projects, setProjects] = useState<any[]>([]); const [loading, setLoading] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | null>(null); const [checklist, setChecklist] = useState<any>(null)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [form, setForm] = useState({ projectName: '', address: '', city: '', state: 'CA', zipCode: '', buildingType: 'residential', squareFootage: '', floors: '1', permitTypes: ['building-permit'], engineerName: 'Dr. Edgard', engineerLicense: '' })
  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() { setLoading(true); const r = await fetch('/api/permits/list'); const d = await r.json(); if (d.projects) setProjects(d.projects); setLoading(false) }
  async function createProject() { if (!form.projectName) return; setLoading(true); await fetch('/api/permits/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, squareFootage: Number(form.squareFootage), floors: Number(form.floors) }) }); setShowForm(false); await fetchProjects(); setLoading(false) }
  async function loadChecklist(id: string) { setLoading(true); const r = await fetch('/api/permits/checklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const d = await r.json(); if (d.checklist) setChecklist(d.checklist); setLoading(false) }

  return (<section style={{ padding: '16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div><span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}><Building2 size={14} style={{ display: 'inline' }} /> American Permits</span><h2 style={{ margin: '4px 0', fontSize: '16px' }}>Aprovação de Projetos EUA</h2></div>
      <div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setShowForm(!showForm)}><Plus size={15} /> Novo Projeto</button><button onClick={onClear} className="ghost-action"><X size={16} /></button></div>
    </div>
    {showForm && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
      <input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} placeholder="Project Name *" style={s} />
      <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" style={s} />
      <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="City" style={s} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} style={s}><option>CA</option><option>NY</option><option>FL</option><option>TX</option><option>WA</option></select>
        <input value={form.zipCode} onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))} placeholder="ZIP" style={s} />
      </div>
      <select value={form.buildingType} onChange={e => setForm(p => ({ ...p, buildingType: e.target.value }))} style={s}>
        <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={form.squareFootage} onChange={e => setForm(p => ({ ...p, squareFootage: e.target.value }))} placeholder="Sq Ft" style={s} />
        <input value={form.floors} onChange={e => setForm(p => ({ ...p, floors: e.target.value }))} placeholder="Floors" style={s} />
      </div>
      <input value={form.engineerLicense} onChange={e => setForm(p => ({ ...p, engineerLicense: e.target.value }))} placeholder="PE License #" style={s} />
      <button onClick={createProject} disabled={loading} style={{ gridColumn: '1 / -1', padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Criar Projeto</button>
    </div>)}
    {projects.map(p => (<div key={p.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
      onClick={() => { setSelected(selected === p.id ? null : p.id); setChecklist(null) }}>
      <div style={{ fontWeight: 600 }}>{p.projectName}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.city}, {p.state} · {p.buildingType} · ${(Number(p.squareFootage) * 0.5).toFixed(0)} est.</div>
      {selected === p.id && (<div style={{ marginTop: '8px' }}>
        <button onClick={(e) => { e.stopPropagation(); loadChecklist(p.id) }} disabled={loading}><FileCheck size={14} /> Gerar Checklist</button>
        {checklist && checklist.checklist?.map((c: any, i: number) => (<div key={i} style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px', marginTop: '6px', fontSize: '12px' }}>
          <div style={{ fontWeight: 600 }}>{c.permitName}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Fee: ${c.estimatedFee?.toFixed(2)} · Timeline: {c.estimatedTimeline}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>Docs: {c.requiredDocs?.join(', ')}</div>
        </div>))}
      </div>)}
    </div>))}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
  </section>)
}
const s = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
