import { useEffect, useState } from 'react'
import { Plus, RefreshCw, X, MapPin, Calendar, DollarSign, Users, Trash2 } from 'lucide-react'

type Trip = { id: string; title: string; destination: string; startDate: string; endDate: string; budget: number; currency: string; travelers: number; notes: string; status: string; activities: { name: string; cost: number }[]; accommodation: string; transport: string; createdAt: string }
type Destination = { city: string; country: string; flag: string; budget: number; currency: string }

export function TripPlannerPanel({ onClear }: { onClear: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'USD', travelers: '1', notes: '', accommodation: '', transport: '' })

  async function fetchTrips() {
    setLoading(true)
    try {
      const [tRes, dRes] = await Promise.all([
        fetch('/api/trip/list'),
        fetch('/api/trip/destinations'),
      ])
      if (tRes.ok) { const d = await tRes.json(); setTrips(d.trips || []) }
      if (dRes.ok) { const d = await dRes.json(); setDestinations(d.destinations || []) }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTrips() }, [])

  async function createTrip() {
    if (!form.title || !form.destination) { setMessage('Título e destino obrigatórios'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/trip/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: Number(form.budget), travelers: Number(form.travelers) }),
      })
      if (res.ok) { setShowForm(false); setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'USD', travelers: '1', notes: '', accommodation: '', transport: '' }); await fetchTrips() }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function deleteTrip(id: string) {
    setLoading(true)
    try {
      await fetch('/api/trip/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (selectedTrip?.id === id) setSelectedTrip(null)
      await fetchTrips()
    } finally { setLoading(false) }
  }

  function selectDestination(d: Destination) {
    setForm(prev => ({ ...prev, destination: `${d.city}, ${d.country}`, budget: String(d.budget), currency: d.currency }))
  }

  const flag = (dest: string) => {
    const found = destinations.find(d => dest.includes(d.city))
    return found?.flag || '🌍'
  }

  return (
    <section style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}><MapPin size={14} style={{ display: 'inline' }} /> Trip Planner</span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Planejador de Viagens</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowForm(!showForm)}><Plus size={15} /> {showForm ? 'Cancelar' : 'Nova Viagem'}</button>
          <button onClick={fetchTrips} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {message && <div className="business-alert"><span>{message}</span></div>}

      {/* New trip form */}
      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título *" style={inp} />
          <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} placeholder="Destino *" style={inp} />
          <input value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} type="date" style={inp} />
          <input value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} type="date" style={inp} />
          <input value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="Orçamento" type="number" style={inp} />
          <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={inp}>
            <option value="USD">USD</option><option value="BRL">BRL</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
          </select>
          <input value={form.travelers} onChange={e => setForm(p => ({ ...p, travelers: e.target.value }))} placeholder="Viajantes" type="number" style={inp} />
          <input value={form.accommodation} onChange={e => setForm(p => ({ ...p, accommodation: e.target.value }))} placeholder="Hospedagem" style={inp} />
          <input value={form.transport} onChange={e => setForm(p => ({ ...p, transport: e.target.value }))} placeholder="Transporte" style={inp} />
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas..." style={{ ...inp, gridColumn: '1 / -1', minHeight: '60px' }} />
          <button onClick={createTrip} disabled={loading || !form.title || !form.destination}
            style={{ gridColumn: '1 / -1', padding: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Salvando...' : 'Criar Viagem'}
          </button>
        </div>
      )}

      {/* Destinations suggestion */}
      {!showForm && destinations.length > 0 && (
        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Destinos Sugeridos</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {destinations.slice(0, 6).map(d => (
              <button key={d.city} onClick={() => selectDestination(d)}
                style={{ padding: '4px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                {d.flag} {d.city} ~${d.budget}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trip list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {trips.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
            <MapPin size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>Nenhuma viagem planejada ainda.</p>
          </div>
        )}
        {trips.map(trip => (
          <div key={trip.id} onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
            style={{ padding: '12px', background: selectedTrip?.id === trip.id ? '#f5f3ff' : '#fff', borderRadius: '8px', border: `1px solid ${selectedTrip?.id === trip.id ? '#ddd6fe' : '#e5e7eb'}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{flag(trip.destination)} {trip.title}</strong>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{trip.destination}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteTrip(trip.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
            </div>
            {trip.startDate && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>📅 {trip.startDate}{trip.endDate ? ` → ${trip.endDate}` : ''}</div>}
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              {trip.budget > 0 && <span>💰 {trip.currency} {trip.budget}</span>}
              <span>👥 {trip.travelers} viajante(s)</span>
            </div>

            {selectedTrip?.id === trip.id && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px' }}>
                {trip.accommodation && <div><strong>Hospedagem:</strong> {trip.accommodation}</div>}
                {trip.transport && <div><strong>Transporte:</strong> {trip.transport}</div>}
                {trip.notes && <div style={{ marginTop: '4px' }}>{trip.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
    </section>
  )
}

const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
