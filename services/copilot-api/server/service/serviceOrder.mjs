import { randomUUID } from 'node:crypto'

const ORDERS = new Map()

export function createServiceOrder({ clientId, clientName, clientEmail, serviceType, serviceName, description, amount, currency = 'BRL', plan = 'unique' }) {
  const id = randomUUID()
  const number = `OS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const order = {
    id, number,
    clientId: clientId || 'anonymous',
    clientName: clientName || 'Cliente',
    clientEmail: clientEmail || '',
    serviceType: serviceType || 'render',
    serviceName: serviceName || 'Servico Apex',
    description: description || '',
    amount: Number(amount) || 0,
    currency: currency || 'BRL',
    plan: plan || 'unique',
    status: 'pending',
    invoiceId: null,
    paymentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewCount: 0,
    approvedAt: null,
    deliveredAt: null,
  }
  ORDERS.set(id, order)
  return order
}

export function getServiceOrder(id) { return ORDERS.get(id) || null }

export function updateServiceOrderStatus(id, status, extra = {}) {
  const order = ORDERS.get(id)
  if (!order) return null
  order.status = status
  order.updatedAt = new Date().toISOString()
  if (status === 'approved') order.approvedAt = new Date().toISOString()
  if (status === 'delivered') order.deliveredAt = new Date().toISOString()
  Object.assign(order, extra)
  return order
}

export function incrementReviewCount(id) {
  const order = ORDERS.get(id)
  if (!order) return null
  order.reviewCount++
  return order
}

export function listServiceOrders(clientId) {
  if (clientId) return Array.from(ORDERS.values()).filter(o => o.clientId === clientId)
  return Array.from(ORDERS.values())
}

export function buildServiceOrderReply(order) {
  if (!order) return 'Pedido nao encontrado.'
  return `Pedido ${order.number} criado com sucesso para ${order.clientName}. Servico: ${order.serviceName}. Valor: ${(order.amount).toFixed(2)} ${order.currency}. Status: ${order.status}.`
}
