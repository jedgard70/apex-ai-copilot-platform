/**
 * server/service/finance.mjs
 *
 * Financial Control service — receitas, despesas, MRR, P&L, contabilidade.
 * Dados reais armazenados em memória (Map), prontos para migrar ao Supabase.
 *
 * Evidence levels:
 *   USER_ENTERED       → lançamento manual do usuário
 *   SYSTEM_GENERATED   → gerado automaticamente (service order, invoice)
 *   IMPORTED_DOCUMENT  → importado de planilha/XML
 *   UNKNOWN            → sem origem confirmada
 *   NEEDS_ACCOUNTANT_REVIEW → precisa validação contábil
 */

import { randomUUID } from 'node:crypto'

// ─── Types ───────────────────────────────────────────────────────────────────

/** @typedef {'USER_ENTERED'|'SYSTEM_GENERATED'|'IMPORTED_DOCUMENT'|'UNKNOWN'|'NEEDS_ACCOUNTANT_REVIEW'} EvidenceLevel */

/** @typedef {'BRL'|'USD'|'EUR'} Currency */

/**
 * @typedef {Object} ExpenseEntry
 * @property {string}  id
 * @property {string}  description
 * @property {string}  category      - e.g. 'Software', 'Marketing', 'Freelancer', 'Tax', 'Office'
 * @property {number}  amount
 * @property {Currency} currency
 * @property {string}  date          - ISO date
 * @property {string}  [supplier]
 * @property {string}  [project]
 * @property {string}  [taxCategory]
 * @property {string}  [costCenter]
 * @property {string}  [notes]
 * @property {EvidenceLevel} evidence
 * @property {string}  createdAt
 */

/**
 * @typedef {Object} RevenueEntry
 * @property {string}  id
 * @property {string}  description
 * @property {string}  source        - 'service_order' | 'subscription' | 'manual' | 'imported'
 * @property {number}  amount
 * @property {Currency} currency
 * @property {string}  date          - ISO date
 * @property {string}  [clientName]
 * @property {string}  [orderId]
 * @property {string}  [invoiceId]
 * @property {string}  status        - 'pending' | 'paid' | 'overdue' | 'cancelled'
 * @property {EvidenceLevel} evidence
 * @property {string}  createdAt
 */

/**
 * @typedef {Object} FinancialSummary
 * @property {number} totalRevenue
 * @property {number} totalExpenses
 * @property {number} netProfit
 * @property {number} pendingRevenue
 * @property {number} overdueRevenue
 * @property {number} mrr           - Monthly Recurring Revenue
 * @property {number} arr           - Annual Recurring Revenue
 * @property {number} expenseRatio  - % dos custos sobre receita
 * @property {number} revenueCount
 * @property {number} expenseCount
 * @property {string} period
 */

// ─── In-memory store ─────────────────────────────────────────────────────────

import fs from 'fs'
import path from 'path'

const DB_DIR = path.join(process.cwd(), '.system_generated')
const EXPENSES_FILE = path.join(DB_DIR, 'expenses.json')
const REVENUES_FILE = path.join(DB_DIR, 'revenues.json')

let EXPENSES = new Map()
let REVENUES = new Map()

function loadDB() {
  try {
    if (fs.existsSync(EXPENSES_FILE)) {
      const data = JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf-8'))
      EXPENSES = new Map(data)
    }
    if (fs.existsSync(REVENUES_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVENUES_FILE, 'utf-8'))
      REVENUES = new Map(data)
    }
  } catch (err) {
    console.error('[finance] Error loading DB:', err)
  }
}

function saveDB() {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true })
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify([...EXPENSES]))
    fs.writeFileSync(REVENUES_FILE, JSON.stringify([...REVENUES]))
  } catch (err) {
    console.error('[finance] Error saving DB:', err)
  }
}

loadDB()

// ─── Expenses CRUD ──────────────────────────────────────────────────────────

export function createExpense(entry) {
  const id = randomUUID()
  const expense = {
    id,
    description: String(entry.description || '').trim(),
    category: entry.category || 'Other',
    amount: Number(entry.amount) || 0,
    currency: entry.currency || 'USD',
    date: entry.date || new Date().toISOString().slice(0, 10),
    supplier: String(entry.supplier || '').trim(),
    project: String(entry.project || '').trim(),
    taxCategory: String(entry.taxCategory || '').trim(),
    costCenter: String(entry.costCenter || '').trim(),
    notes: String(entry.notes || '').trim(),
    evidence: entry.evidence || 'USER_ENTERED',
    createdAt: new Date().toISOString(),
  }
  EXPENSES.set(id, expense)
  saveDB()
  return expense
}

export function getExpense(id) { return EXPENSES.get(id) || null }

export function updateExpense(id, updates) {
  const existing = EXPENSES.get(id)
  if (!existing) return null
  const updated = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
  EXPENSES.set(id, updated)
  saveDB()
  return updated
}

export function deleteExpense(id) { 
  const res = EXPENSES.delete(id);
  if(res) saveDB();
  return res;
}

export function listExpenses(filters = {}) {
  let items = Array.from(EXPENSES.values())
  if (filters.category) items = items.filter(e => e.category === filters.category)
  if (filters.startDate) items = items.filter(e => e.date >= filters.startDate)
  if (filters.endDate) items = items.filter(e => e.date <= filters.endDate)
  if (filters.project) items = items.filter(e => e.project && e.project.includes(filters.project))
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

// ─── Revenue (manual, além das service orders) ──────────────────────────────

export function createRevenue(entry) {
  const id = randomUUID()
  const revenue = {
    id,
    description: String(entry.description || '').trim(),
    source: entry.source || 'manual',
    amount: Number(entry.amount) || 0,
    currency: entry.currency || 'USD',
    date: entry.date || new Date().toISOString().slice(0, 10),
    clientName: String(entry.clientName || '').trim(),
    orderId: String(entry.orderId || '').trim(),
    invoiceId: String(entry.invoiceId || '').trim(),
    status: entry.status || 'pending',
    evidence: entry.evidence || 'USER_ENTERED',
    createdAt: new Date().toISOString(),
  }
  REVENUES.set(id, revenue)
  saveDB()
  return revenue
}

export function getRevenue(id) { return REVENUES.get(id) || null }

export function updateRevenue(id, updates) {
  const existing = REVENUES.get(id)
  if (!existing) return null
  const updated = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
  REVENUES.set(id, updated)
  saveDB()
  return updated
}

export function deleteRevenue(id) {
  const res = REVENUES.delete(id);
  if(res) saveDB();
  return res;
}

export function listRevenues(filters = {}) {
  let items = Array.from(REVENUES.values())
  if (filters.status) items = items.filter(r => r.status === filters.status)
  if (filters.source) items = items.filter(r => r.source === filters.source)
  if (filters.startDate) items = items.filter(r => r.date >= filters.startDate)
  if (filters.endDate) items = items.filter(r => r.date <= filters.endDate)
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

// ─── Financial Summary ──────────────────────────────────────────────────────

export function computeFinancialSummary(period = 'all') {
  const allRevenues = listRevenues()
  const allExpenses = listExpenses()

  const now = new Date()
  let startDate = '1900-01-01'
  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  }

  const filteredRevenues = allRevenues.filter(r => r.date >= startDate)
  const filteredExpenses = allExpenses.filter(e => e.date >= startDate)

  // Revenue aggregation
  const totalRevenue = filteredRevenues.reduce((s, r) => s + r.amount, 0)
  const pendingRevenue = filteredRevenues.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const overdueRevenue = filteredRevenues.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0)
  const paidRevenue = filteredRevenues.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0)

  // Expense aggregation
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  // MRR: sum of subscription revenues in current month
  const subscriptionRevenues = allRevenues.filter(r =>
    r.source === 'subscription' && r.status === 'paid'
  )
  const mrr = subscriptionRevenues.reduce((s, r) => s + r.amount, 0)

  const netProfit = paidRevenue - totalExpenses
  const expenseRatio = paidRevenue > 0 ? Math.round((totalExpenses / paidRevenue) * 100) : 0

  // Expenses by category
  const expensesByCategory = {}
  for (const e of allExpenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount
  }

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    pendingRevenue: Math.round(pendingRevenue * 100) / 100,
    overdueRevenue: Math.round(overdueRevenue * 100) / 100,
    paidRevenue: Math.round(paidRevenue * 100) / 100,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    expenseRatio,
    revenueCount: filteredRevenues.length,
    expenseCount: filteredExpenses.length,
    period,
    expensesByCategory,
    date: new Date().toISOString(),
  }
}

// ─── Expense categories ─────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Software',
  'Marketing',
  'Freelancer',
  'Salaries',
  'Tax',
  'Office',
  'Travel',
  'Hosting',
  'Tools',
  'Consulting',
  'Other',
]

// ─── Sync from service orders (auto-import) ─────────────────────────────────

/**
 * Auto-import paid service orders as revenue.
 * Called after Stripe webhook confirms payment.
 */
export function importServiceOrderAsRevenue(order) {
  if (!order || !order.amount) return null
  return createRevenue({
    description: `${order.serviceName} — ${order.clientName}`,
    source: 'service_order',
    amount: order.amount,
    currency: order.currency || 'USD',
    date: order.paidAt || new Date().toISOString(),
    clientName: order.clientName,
    orderId: order.id,
    status: 'paid',
    evidence: 'SYSTEM_GENERATED',
  })
}

// ─── Get monthly breakdown for charts ───────────────────────────────────────

export function getMonthlyBreakdown(months = 6) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = d.toISOString().slice(0, 7) // YYYY-MM
    const startDate = d.toISOString().slice(0, 10)
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

    const monthRevenues = listRevenues({ startDate, endDate })
    const monthExpenses = listExpenses({ startDate, endDate })

    result.push({
      month: monthStr,
      revenue: Math.round(monthRevenues.reduce((s, r) => s + (r.status === 'paid' ? r.amount : 0), 0) * 100) / 100,
      expenses: Math.round(monthExpenses.reduce((s, e) => s + e.amount, 0) * 100) / 100,
      pending: Math.round(monthRevenues.reduce((s, r) => s + (r.status === 'pending' ? r.amount : 0), 0) * 100) / 100,
    })
  }
  return result
}
