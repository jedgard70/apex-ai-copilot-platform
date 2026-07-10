import { useEffect, useState } from 'react'
import { Plus, RefreshCw, X, MapPin, Calendar, DollarSign, Users, Trash2, Plane, ShieldCheck, CreditCard, Award, CheckCircle2 } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type Flight = { id: string; airline: string; type: string; price: number; miles: number; duration: string; stops: number; tags: string[]; paymentMethod?: string; bookingDate?: string; bookingReference?: string }
type Insurance = { id: string; provider: string; coverage: string; price: number; tags: string[]; policyNumber?: string; bookingDate?: string }
type Trip = { id: string; title: string; destination: string; originIata: string; destIata: string; startDate: string; endDate: string; budget: number; currency: string; travelers: number; notes: string; status: string; activities: { name: string; cost: number }[]; accommodation: string; transport: string; createdAt: string; bookedFlights?: Flight[]; bookedInsurance?: Insurance[] }
type Destination = { city: string; country: string; flag: string; budget: number; currency: string }
type BudgetSummary = { totalBudget: number; estimatedCost: number; flightsCost: number; insuranceCost: number; totalSpent: number; remaining: number; currency: string; onBudget: boolean }

export function TripPlannerPanel({ onClear }: { onClear: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripBudget, setTripBudget] = useState<BudgetSummary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', destination: '', originIata: 'JFK', destIata: 'LHR', startDate: '', endDate: '', budget: '', currency: 'USD', travelers: '1', notes: '', accommodation: '', transport: '' })

  const [activeTab, setActiveTab] = useState<'details' | 'flights' | 'insurance'>('details')
  const [searchResults, setSearchResults] = useState<{ flights?: Flight[], insurance?: Insurance[] }>({})

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

  async function loadTripDetails(id: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/trip/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (res.ok) {
        const d = await res.json()
        setSelectedTrip(d.trip)
        setTripBudget(d.budget)
      }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function createTrip() {
    if (!form.title || !form.destination) { setMessage('Título e destino obrigatórios'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/trip/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: Number(form.budget), travelers: Number(form.travelers) }),
      })
      if (res.ok) { setShowForm(false); setForm({ title: '', destination: '', originIata: 'JFK', destIata: 'LHR', startDate: '', endDate: '', budget: '', currency: 'USD', travelers: '1', notes: '', accommodation: '', transport: '' }); await fetchTrips() }
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

  async function searchFlights() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const res = await fetch('/api/trip/flights/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originIata: selectedTrip.originIata, destIata: selectedTrip.destIata, date: selectedTrip.startDate, travelers: selectedTrip.travelers })
      })
      if (res.ok) {
        const d = await res.json()
        setSearchResults(prev => ({ ...prev, flights: d.flights }))
      } else {
        const err = await res.json()
        setMessage(err.error || 'Erro na API de Voos')
      }
    } catch(err) {
      setMessage('Erro na conexão com o sistema de passagens')
    } finally { setLoading(false) }
  }

  async function bookFlight(flight: Flight, paymentMethod: 'credit_card' | 'miles') {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const res = await fetch('/api/trip/flights/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: selectedTrip.id, flight, paymentMethod })
      })
      if (res.ok) {
        const d = await res.json()
        setSelectedTrip(d.trip)
        setTripBudget(d.budget)
        setSearchResults(prev => ({ ...prev, flights: [] }))
      }
    } finally { setLoading(false) }
  }

  async function searchInsurance() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      // Cálculo simples de dias (fake)
      const days = selectedTrip.startDate && selectedTrip.endDate ? 7 : 7 
      const res = await fetch('/api/trip/insurance/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: selectedTrip.destination, days, travelers: selectedTrip.travelers })
      })
      if (res.ok) {
        const d = await res.json()
        setSearchResults(prev => ({ ...prev, insurance: d.insurance }))
      }
    } finally { setLoading(false) }
  }

  async function bookInsurance(insurance: Insurance) {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const res = await fetch('/api/trip/insurance/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: selectedTrip.id, insurance })
      })
      if (res.ok) {
        const d = await res.json()
        setSelectedTrip(d.trip)
        setTripBudget(d.budget)
        setSearchResults(prev => ({ ...prev, insurance: [] }))
      }
    } finally { setLoading(false) }
  }

  function selectDestination(d: Destination & { iata?: string }) {
    setForm(prev => ({ ...prev, destination: `${d.city}, ${d.country}`, destIata: d.iata || 'LHR', budget: String(d.budget), currency: d.currency }))
  }

  const flag = (dest: string) => {
    const found = destinations.find(d => dest.includes(d.city))
    return found?.flag || '🌍'
  }

  return (
    <PremiumPanelLayout 
      title="Trip Planner & Booking" 
      subtitle="Ações e configurações operacionais"
      headerActions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowForm(!showForm)} className="ghost-action" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Plus size={15} /> {showForm ? 'Cancelar' : 'Nova Viagem'}</button>
          <button onClick={fetchTrips} disabled={loading} className="ghost-action"><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>

      {message && <div className="business-alert"><span>{message}</span></div>}

      {/* New trip form */}
      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título da Viagem (ex: Férias 2026) *" style={inp} />
          <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} placeholder="Destino (ex: Miami, EUA) *" style={inp} />
          
          <input value={form.originIata} onChange={e => setForm(p => ({ ...p, originIata: e.target.value }))} placeholder="Aeroporto Origem (IATA) ex: GRU *" style={inp} />
          <input value={form.destIata} onChange={e => setForm(p => ({ ...p, destIata: e.target.value }))} placeholder="Aeroporto Destino (IATA) ex: MIA *" style={inp} />

          <input value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} type="date" style={inp} />
          <input value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} type="date" style={inp} />
          <input value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="Orçamento Total" type="number" style={inp} />
          <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={inp}>
            <option value="USD">USD</option><option value="BRL">BRL</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
          </select>
          <input value={form.travelers} onChange={e => setForm(p => ({ ...p, travelers: e.target.value }))} placeholder="Nº de Viajantes" type="number" style={inp} />
          <button onClick={createTrip} disabled={loading || !form.title || !form.destination}
            style={{ gridColumn: '1 / -1', padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
            {loading ? 'Salvando...' : 'Iniciar Planejamento'}
          </button>
        </div>
      )}

      {/* Destinations suggestion */}
      {!showForm && !selectedTrip && destinations.length > 0 && (
        <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Destinos Sugeridos (Trending)</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {destinations.slice(0, 8).map(d => (
              <button key={d.city} onClick={() => { setShowForm(true); selectDestination(d) }}
                style={{ padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span style={{ marginRight: '4px' }}>{d.flag}</span> {d.city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trip list or Selected Trip */}
      {!selectedTrip ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trips.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
              <MapPin size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>Nenhuma viagem planejada ainda.</p>
            </div>
          )}
          {trips.map(trip => (
            <div key={trip.id} onClick={() => { loadTripDetails(trip.id); setActiveTab('details') }}
              style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{flag(trip.destination)} {trip.title}</strong>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{trip.destination}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteTrip(trip.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={16} /></button>
              </div>
              {trip.startDate && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {trip.startDate}{trip.endDate ? ` → ${trip.endDate}` : ''}</div>}
            </div>
          ))}
        </div>
      ) : (
        /* SELECTED TRIP DETAILS */
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {flag(selectedTrip.destination)} {selectedTrip.title}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{selectedTrip.destination} • {selectedTrip.travelers} viajante(s)</div>
            </div>
            <button onClick={() => setSelectedTrip(null)} style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Voltar</button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button onClick={() => setActiveTab('details')} style={{ ...tabBtn, borderBottom: activeTab === 'details' ? '2px solid #7c3aed' : '2px solid transparent', color: activeTab === 'details' ? '#7c3aed' : '#64748b' }}>Resumo & Budget</button>
            <button onClick={() => setActiveTab('flights')} style={{ ...tabBtn, borderBottom: activeTab === 'flights' ? '2px solid #7c3aed' : '2px solid transparent', color: activeTab === 'flights' ? '#7c3aed' : '#64748b' }}><Plane size={14}/> Passagens Aéreas</button>
            <button onClick={() => setActiveTab('insurance')} style={{ ...tabBtn, borderBottom: activeTab === 'insurance' ? '2px solid #7c3aed' : '2px solid transparent', color: activeTab === 'insurance' ? '#7c3aed' : '#64748b' }}><ShieldCheck size={14}/> Seguro Viagem</button>
          </div>

          <div style={{ padding: '16px' }}>
            {/* TAB: DETAILS */}
            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={card}>
                    <div style={cardTitle}><DollarSign size={14}/> Orçamento Total</div>
                    <div style={cardVal}>{selectedTrip.currency} {tripBudget?.totalBudget?.toLocaleString()}</div>
                  </div>
                  <div style={card}>
                    <div style={cardTitle}>Total Gasto (Voos + Seguros + Ativ.)</div>
                    <div style={{ ...cardVal, color: (tripBudget?.remaining ?? 0) < 0 ? '#ef4444' : '#10b981' }}>
                      {selectedTrip.currency} {tripBudget?.totalSpent?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Itens Comprados (Booking)</h4>
                  {(!selectedTrip.bookedFlights?.length && !selectedTrip.bookedInsurance?.length) && <p style={{ fontSize: '13px', color: '#94a3b8' }}>Nenhuma passagem ou seguro emitido ainda.</p>}
                  
                  {selectedTrip.bookedFlights?.map(f => (
                    <div key={f.id} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14}/> Voo Confirmado: {f.airline}</strong>
                        <span style={{ fontWeight: 'bold' }}>REF: {f.bookingReference}</span>
                      </div>
                      <div style={{ color: '#166534' }}>
                        Pagamento via: {f.paymentMethod === 'miles' ? `Milhas (${f.miles.toLocaleString()})` : `Cartão de Crédito (${selectedTrip.currency} ${f.price})`}
                      </div>
                    </div>
                  ))}

                  {selectedTrip.bookedInsurance?.map(i => (
                    <div key={i.id} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14}/> Seguro Emitido: {i.provider}</strong>
                        <span style={{ fontWeight: 'bold' }}>Apólice: {i.policyNumber}</span>
                      </div>
                      <div style={{ color: '#166534' }}>{i.coverage} | Valor: {selectedTrip.currency} {i.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FLIGHTS */}
            {activeTab === 'flights' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Plane size={16}/> Buscar Passagens Aéreas</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1e40af' }}>Pesquisando conexões diretas via NDC entre <strong>{selectedTrip.originIata}</strong> e <strong>{selectedTrip.destIata}</strong> pela Duffel API.</p>
                  <button onClick={searchFlights} disabled={loading} style={primaryBtn}>{loading ? 'Consultando Companhias Aéreas (NDC)...' : 'Pesquisar Voos Agora'}</button>
                </div>

                {searchResults.flights && searchResults.flights.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>Resultados da Busca (Market Engine)</h4>
                    {searchResults.flights.map(flight => (
                      <div key={flight.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              {flight.tags.map(t => <span key={t} style={{ background: '#fef08a', color: '#854d0e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{t}</span>)}
                            </div>
                            <h5 style={{ margin: 0, fontSize: '15px' }}>{flight.airline}</h5>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Duração: {flight.duration} | Paradas: {flight.stops}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{selectedTrip.currency} {flight.price.toLocaleString()}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>ou {flight.miles.toLocaleString()} milhas</div>
                          </div>
                        </div>
                        
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => bookFlight(flight, 'credit_card')} disabled={loading} style={buyBtnCard}><CreditCard size={14}/> Comprar c/ Cartão</button>
                          <button onClick={() => bookFlight(flight, 'miles')} disabled={loading} style={buyBtnMiles}><Award size={14}/> Emitir c/ Milhas</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: INSURANCE */}
            {activeTab === 'insurance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#fdf4ff', padding: '16px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#831843', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16}/> Seguro Viagem Internacional</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#9d174d' }}>Compare os seguros mais baratos do mercado para cobrir despesas médicas na viagem para <strong>{selectedTrip.destination}</strong>.</p>
                  <button onClick={searchInsurance} disabled={loading} style={{ ...primaryBtn, background: '#db2777' }}>{loading ? 'Buscando apólices...' : 'Cotar Seguros Agora'}</button>
                </div>

                {searchResults.insurance && searchResults.insurance.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>Opções de Seguro</h4>
                    {searchResults.insurance.map(ins => (
                      <div key={ins.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                            {ins.tags.map(t => <span key={t} style={{ background: '#fce7f3', color: '#be185d', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{t}</span>)}
                          </div>
                          <h5 style={{ margin: 0, fontSize: '15px' }}>{ins.provider}</h5>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{ins.coverage}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>{selectedTrip.currency} {ins.price.toLocaleString()}</div>
                          <button onClick={() => bookInsurance(ins)} disabled={loading} style={{ ...buyBtnCard, width: '100%', justifyContent: 'center' }}><ShieldCheck size={14}/> Contratar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
      </div>
    </PremiumPanelLayout>
  )
}

const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
const tabBtn: React.CSSProperties = { flex: 1, padding: '12px', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
const card: React.CSSProperties = { background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }
const cardTitle: React.CSSProperties = { fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }
const cardVal: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }
const primaryBtn: React.CSSProperties = { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }
const buyBtnCard: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }
const buyBtnMiles: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }
