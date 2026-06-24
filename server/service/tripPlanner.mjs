/**
 * server/service/tripPlanner.mjs
 *
 * Trip Planner — planejamento de viagens.
 * Apenas para usuários internos (Owner).
 * Dados locais (sem API externa).
 */

const TRIPS = new Map()
let tripCounter = 0

export function createTrip(data) {
  tripCounter++
  const id = `trip-${Date.now()}-${tripCounter}`
  const trip = {
    id,
    title: String(data.title || 'Nova Viagem').trim(),
    destination: String(data.destination || '').trim(),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    budget: Number(data.budget) || 0,
    currency: data.currency || 'USD',
    travelers: Number(data.travelers) || 1,
    notes: String(data.notes || '').trim(),
    status: 'planned',
    activities: Array.isArray(data.activities) ? data.activities : [],
    accommodation: String(data.accommodation || '').trim(),
    transport: String(data.transport || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  TRIPS.set(id, trip)
  return trip
}

export function getTrip(id) { return TRIPS.get(id) || null }

export function updateTrip(id, updates) {
  const t = TRIPS.get(id)
  if (!t) return null
  const updated = { ...t, ...updates, id: t.id, createdAt: t.createdAt, updatedAt: new Date().toISOString() }
  TRIPS.set(id, updated)
  return updated
}

export function deleteTrip(id) { return TRIPS.delete(id) }

export function listTrips() {
  return Array.from(TRIPS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function calculateBudgetSummary(trip) {
  const totalBudget = trip.budget || 0
  const estimatedCost = (trip.activities || []).reduce((s, a) => s + (a.cost || 0), 0)
  const remaining = totalBudget - estimatedCost
  return {
    totalBudget,
    estimatedCost,
    remaining,
    currency: trip.currency,
    onBudget: remaining >= 0,
  }
}

export function suggestDestinations() {
  return [
    { city: 'Paris', country: 'França', flag: '🇫🇷', budget: 3000, currency: 'EUR' },
    { city: 'Londres', country: 'Reino Unido', flag: '🇬🇧', budget: 3500, currency: 'GBP' },
    { city: 'Nova York', country: 'EUA', flag: '🇺🇸', budget: 4000, currency: 'USD' },
    { city: 'Tóquio', country: 'Japão', flag: '🇯🇵', budget: 3500, currency: 'USD' },
    { city: 'Dubai', country: 'Emirados Árabes', flag: '🇦🇪', budget: 4000, currency: 'USD' },
    { city: 'Barcelona', country: 'Espanha', flag: '🇪🇸', budget: 2500, currency: 'EUR' },
    { city: 'Roma', country: 'Itália', flag: '🇮🇹', budget: 2500, currency: 'EUR' },
    { city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', budget: 1500, currency: 'USD' },
    { city: 'Lisboa', country: 'Portugal', flag: '🇵🇹', budget: 2000, currency: 'EUR' },
    { city: 'Cancún', country: 'México', flag: '🇲🇽', budget: 2000, currency: 'USD' },
    { city: 'Sydney', country: 'Austrália', flag: '🇦🇺', budget: 4000, currency: 'USD' },
    { city: 'Bangkok', country: 'Tailândia', flag: '🇹🇭', budget: 1200, currency: 'USD' },
  ]
}
