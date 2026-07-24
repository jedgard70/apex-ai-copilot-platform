const CLIENTS = new Map()

export function findOrCreateClient({ email, name, phone }) {
  if (!email && !phone) return null
  const key = email || phone
  if (CLIENTS.has(key)) return CLIENTS.get(key)
  const client = {
    id: key,
    name: name || email || 'Cliente',
    email: email || '',
    phone: phone || '',
    status: 'lead',
    firstContact: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    totalSpent: 0,
    orderCount: 0,
    orders: [],
    invoices: [],
    notes: '',
  }
  CLIENTS.set(key, client)
  return client
}

export function updateClientAfterOrder(email, order) {
  const client = CLIENTS.get(email)
  if (!client) return null
  client.lastContact = new Date().toISOString()
  client.totalSpent += order.amount || 0
  client.orderCount++
  client.orders.push(order.id)
  if (order.status === 'paid' || order.status === 'delivered') client.status = 'client'
  return client
}

export function getClient(email) { return CLIENTS.get(email) || null }
export function listClients() { return Array.from(CLIENTS.values()) }
