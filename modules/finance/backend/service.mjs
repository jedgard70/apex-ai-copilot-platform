/**
 * modules/finance/backend/service.mjs
 *
 * Financial Control service — receitas, despesas, MRR, P&L, contabilidade.
 * Dados reais armazenados 100% no Supabase.
 */

import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

let supabaseClient = null
let IS_SUPABASE = false

function initSupabase() {
  if (supabaseClient) return true
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      IS_SUPABASE = true
      return true
    } catch (e) {
      console.warn('[finance] Error init Supabase:', e.message)
    }
  }
  return false
}

// ─── Helpers to read from Supabase ──────────────────────────────────────────

async function getSupabaseExpenses() {
  if (!initSupabase()) return []
  try {
    const { data, error } = await supabaseClient.from('finance_expenses').select('*')
    if (error && error.code === '42P01') {
      const { data: genericData } = await supabaseClient.from('sync_queue_items').select('*').eq('operation', 'FINANCE_EXPENSE')
      return genericData ? genericData.map(g => ({ id: g.id, ...g.payload })) : []
    }
    return data || []
  } catch (e) {
    return []
  }
}

async function saveSupabaseExpense(expense) {
  if (!initSupabase()) return null
  try {
    const { error } = await supabaseClient.from('finance_expenses').upsert([expense])
    if (error && error.code === '42P01') {
      await supabaseClient.from('sync_queue_items').upsert([{ id: expense.id, operation: 'FINANCE_EXPENSE', payload: expense }])
    }
  } catch (e) {}
}

async function deleteSupabaseExpense(id) {
  if (!initSupabase()) return false
  const { error } = await supabaseClient.from('finance_expenses').delete().eq('id', id)
  if (error && error.code === '42P01') {
    await supabaseClient.from('sync_queue_items').delete().eq('id', id).eq('operation', 'FINANCE_EXPENSE')
  }
  return true
}

async function getSupabaseRevenues() {
  if (!initSupabase()) return []
  try {
    const { data, error } = await supabaseClient.from('finance_revenue').select('*')
    if (error && error.code === '42P01') {
      const { data: genericData } = await supabaseClient.from('sync_queue_items').select('*').eq('operation', 'FINANCE_REVENUE')
      return genericData ? genericData.map(g => ({ id: g.id, ...g.payload })) : []
    }
    return data || []
  } catch (e) {
    return []
  }
}

async function saveSupabaseRevenue(revenue) {
  if (!initSupabase()) return null
  try {
    const { error } = await supabaseClient.from('finance_revenue').upsert([revenue])
    if (error && error.code === '42P01') {
      await supabaseClient.from('sync_queue_items').upsert([{ id: revenue.id, operation: 'FINANCE_REVENUE', payload: revenue }])
    }
  } catch (e) {}
}

async function deleteSupabaseRevenue(id) {
  if (!initSupabase()) return false
  const { error } = await supabaseClient.from('finance_revenue').delete().eq('id', id)
  if (error && error.code === '42P01') {
    await supabaseClient.from('sync_queue_items').delete().eq('id', id).eq('operation', 'FINANCE_REVENUE')
  }
  return true
}

// ─── Expenses CRUD ──────────────────────────────────────────────────────────

export async function createExpense(entry) {
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
  await saveSupabaseExpense(expense)
  return expense
}

export async function getExpense(id) {
  const all = await getSupabaseExpenses()
  return all.find(e => e.id === id) || null
}

export async function updateExpense(id, updates) {
  const existing = await getExpense(id)
  if (!existing) return null
  const updated = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
  await saveSupabaseExpense(updated)
  return updated
}

export async function deleteExpense(id) {
  return await deleteSupabaseExpense(id)
}

export async function listExpenses(filters = {}) {
  let items = await getSupabaseExpenses()
  if (filters.category) items = items.filter(e => e.category === filters.category)
  if (filters.startDate) items = items.filter(e => e.date >= filters.startDate)
  if (filters.endDate) items = items.filter(e => e.date <= filters.endDate)
  if (filters.project) items = items.filter(e => e.project && e.project.includes(filters.project))
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

// ─── Revenue (manual, além das service orders) ──────────────────────────────

export async function createRevenue(entry) {
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
  await saveSupabaseRevenue(revenue)
  return revenue
}

export async function getRevenue(id) {
  const all = await getSupabaseRevenues()
  return all.find(r => r.id === id) || null
}

export async function updateRevenue(id, updates) {
  const existing = await getRevenue(id)
  if (!existing) return null
  const updated = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
  await saveSupabaseRevenue(updated)
  return updated
}

export async function deleteRevenue(id) {
  return await deleteSupabaseRevenue(id)
}

export async function listRevenues(filters = {}) {
  let items = await getSupabaseRevenues()
  if (filters.status) items = items.filter(r => r.status === filters.status)
  if (filters.source) items = items.filter(r => r.source === filters.source)
  if (filters.startDate) items = items.filter(r => r.date >= filters.startDate)
  if (filters.endDate) items = items.filter(r => r.date <= filters.endDate)
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

// ─── Financial Summary ──────────────────────────────────────────────────────

export async function computeFinancialSummary(period = 'all') {
  const allRevenues = await listRevenues()
  const allExpenses = await listExpenses()

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

export async function importServiceOrderAsRevenue(order) {
  if (!order || !order.amount) return null
  return await createRevenue({
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

export async function getMonthlyBreakdown(months = 6) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = d.toISOString().slice(0, 7) // YYYY-MM
    const startDate = d.toISOString().slice(0, 10)
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

    const monthRevenues = await listRevenues({ startDate, endDate })
    const monthExpenses = await listExpenses({ startDate, endDate })

    result.push({
      month: monthStr,
      revenue: Math.round(monthRevenues.reduce((s, r) => s + (r.status === 'paid' ? r.amount : 0), 0) * 100) / 100,
      expenses: Math.round(monthExpenses.reduce((s, e) => s + e.amount, 0) * 100) / 100,
      pending: Math.round(monthRevenues.reduce((s, r) => s + (r.status === 'pending' ? r.amount : 0), 0) * 100) / 100,
    })
  }
  return result
}
