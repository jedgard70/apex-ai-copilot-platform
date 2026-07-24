/**
 * server/service/tripPlanner.mjs
 *
 * Trip Planner — planejamento de viagens.
 * Integração Direta com a Duffel API (Emissão NDC Real).
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
    originIata: String(data.originIata || 'JFK').trim().toUpperCase(),
    destIata: String(data.destIata || 'LHR').trim().toUpperCase(),
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
    bookedFlights: [],
    bookedInsurance: [],
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
  
  const flightsCost = (trip.bookedFlights || []).reduce((s, f) => {
    if (f.paymentMethod === 'miles') return s; // Milhas não afetam budget cash
    return s + (f.price || 0)
  }, 0)

  const insuranceCost = (trip.bookedInsurance || []).reduce((s, i) => s + (i.price || 0), 0)

  const totalSpent = estimatedCost + flightsCost + insuranceCost
  const remaining = totalBudget - totalSpent

  return {
    totalBudget,
    estimatedCost,
    flightsCost,
    insuranceCost,
    totalSpent,
    remaining,
    currency: trip.currency,
    onBudget: remaining >= 0,
  }
}

export function suggestDestinations() {
  return [
    { city: 'Paris', country: 'França', flag: '🇫🇷', budget: 3000, currency: 'EUR', iata: 'CDG' },
    { city: 'Londres', country: 'Reino Unido', flag: '🇬🇧', budget: 3500, currency: 'GBP', iata: 'LHR' },
    { city: 'Nova York', country: 'EUA', flag: '🇺🇸', budget: 4000, currency: 'USD', iata: 'JFK' },
    { city: 'Lisboa', country: 'Portugal', flag: '🇵🇹', budget: 2000, currency: 'EUR', iata: 'LIS' },
    { city: 'Miami', country: 'EUA', flag: '🇺🇸', budget: 2000, currency: 'USD', iata: 'MIA' },
    { city: 'São Paulo', country: 'Brasil', flag: '🇧🇷', budget: 1500, currency: 'BRL', iata: 'GRU' },
  ]
}

// ==========================================
// DUFFEL API ENGINE: REAL NDC EMISSION
// ==========================================

export async function searchFlights(originIata, destIata, date, travelersCount) {
  try {
    const token = process.env.DUFFEL_ACCESS_TOKEN || '';
    
    if (!token) {
      throw new Error('MISSING_DUFFEL_TOKEN: A chave DUFFEL_ACCESS_TOKEN não está configurada no .env');
    }

    // Criar array de passageiros com base na contagem (Apenas adultos para simplificar a interface atual)
    const passengers = Array(travelersCount).fill({ type: 'adult' });

    // Payload exigido pela Duffel para iniciar um 'Offer Request'
    const requestBody = {
      data: {
        slices: [
          {
            origin: originIata,
            destination: destIata,
            departure_date: date
          }
        ],
        passengers: passengers,
        cabin_class: 'economy' // Para fins de expansão futura, isso pode vir da interface
      }
    };

    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Duffel-Version': 'beta' // Versão de uso geral padrão para novas contas de devs
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Duffel API Error:', errData);
      const errMsg = errData.errors?.[0]?.message || 'Desconhecido';
      throw new Error(`Erro ao buscar dados na Duffel API: ${errMsg}`);
    }

    const json = await response.json();
    const offers = json.data.offers || [];
    
    // Converte o retorno NDC da Duffel para o nosso modelo de UI
    return offers.map(offer => {
      const priceRaw = parseFloat(offer.total_amount);
      const currency = offer.total_currency;
      
      const slice = offer.slices[0];
      const segment = slice.segments[0];
      
      const airlineName = offer.owner.name; // Retorna ex: "Delta Air Lines", "British Airways"
      
      // Cálculo realista da duração
      const departure = new Date(segment.departing_at);
      const arrival = new Date(slice.segments[slice.segments.length - 1].arriving_at);
      const durationHours = Math.floor((arrival - departure) / (1000 * 60 * 60));
      const durationMins = Math.floor(((arrival - departure) / (1000 * 60)) % 60);

      return {
        id: offer.id,
        airline: airlineName, // Tarifa de venda direta com Logo da Cia
        type: segment.passengers[0].cabin_class || 'economy',
        price: priceRaw,
        currency: currency,
        miles: Math.floor(priceRaw * 80), // Ex: Conversão de Milhas Padrão
        duration: `${durationHours}h ${durationMins}m`,
        stops: slice.segments.length - 1,
        tags: ['Duffel NDC', 'Tarifa Líquida']
      };
    });

  } catch (error) {
    if (error.message.includes('MISSING_DUFFEL_TOKEN')) {
      throw error; 
    }
    console.error('[Duffel] Error:', error);
    throw new Error('Duffel Indisponível no momento.');
  }
}

// O Seguro Viagem permanece em Mock (Simulação Direta com Operadora) conforme preferência do usuário.
export function searchInsurance(destination, days, travelers) {
  const perDay = 10;
  const totalDays = Math.max(1, days || 7);
  
  return [
    {
      id: `ins-${Date.now()}-1`,
      provider: 'SafeTrip Básico',
      coverage: 'Cobertura de $30.000',
      price: (perDay * totalDays * travelers) * 0.8,
      tags: ['Simulação de Mercado']
    },
    {
      id: `ins-${Date.now()}-2`,
      provider: 'AllShield Global',
      coverage: 'Cobertura de $60.000 + Bagagem',
      price: (perDay * totalDays * travelers) * 1.5,
      tags: ['Simulação', 'Recomendado']
    }
  ].sort((a, b) => a.price - b.price);
}

export function bookFlight(tripId, flightOption, paymentMethod) {
  const trip = getTrip(tripId)
  if (!trip) throw new Error('Viagem não encontrada')
  
  // No "Mundo Real Completo" aqui fariamos um POST para `https://api.duffel.com/air/orders` 
  // com os dados do cartão de crédito (Payment Intent) ou deduzindo das milhas do usuário local.
  // Para fins de POC de interface, marcamos localmente como concluído.
  
  const booked = {
    ...flightOption,
    bookingDate: new Date().toISOString(),
    paymentMethod,
    status: 'confirmed',
    bookingReference: 'DUF-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  
  trip.bookedFlights = trip.bookedFlights || []
  trip.bookedFlights.push(booked)
  return updateTrip(tripId, trip)
}

export function bookInsurance(tripId, insuranceOption) {
  const trip = getTrip(tripId)
  if (!trip) throw new Error('Viagem não encontrada')
  
  const booked = {
    ...insuranceOption,
    bookingDate: new Date().toISOString(),
    status: 'issued',
    policyNumber: `POL-${Math.floor(Math.random() * 1000000)}`
  }
  
  trip.bookedInsurance = trip.bookedInsurance || []
  trip.bookedInsurance.push(booked)
  return updateTrip(tripId, trip)
}
