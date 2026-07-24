import { randomUUID } from 'node:crypto'

const INVOICES = new Map()

export function createInvoice({ orderId, clientName, clientEmail, serviceName, amount, currency = 'BRL', orderNumber }) {
  const id = randomUUID()
  const number = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const invoice = {
    id, number,
    orderId, orderNumber,
    clientName, clientEmail,
    serviceName,
    amount: Number(amount),
    currency,
    status: 'pending',
    paidAt: null,
    createdAt: new Date().toISOString(),
  }
  INVOICES.set(id, invoice)
  return invoice
}

export function payInvoice(invoiceId, paymentId) {
  const inv = INVOICES.get(invoiceId)
  if (!inv) return null
  inv.status = 'paid'
  inv.paidAt = new Date().toISOString()
  inv.paymentId = paymentId
  return inv
}

export function getInvoice(id) { return INVOICES.get(id) || null }
export function listInvoices(clientEmail) {
  if (clientEmail) return Array.from(INVOICES.values()).filter(i => i.clientEmail === clientEmail)
  return Array.from(INVOICES.values())
}
