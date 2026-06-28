/**
 * api/finance/index.mjs — Vercel serverless endpoint
 *
 * POST /api/finance/summary      → get financial summary
 * POST /api/finance/expense      → create expense
 * GET  /api/finance/expenses     → list expenses
 * POST /api/finance/expense/delete → delete expense
 * POST /api/finance/revenue      → create manual revenue
 * GET  /api/finance/revenues     → list revenues
 * POST /api/finance/revenue/delete → delete revenue
 * GET  /api/finance/monthly      → monthly breakdown for charts
 */

const FINANCE_BASE = './server/service/finance.mjs'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    const mod = await import(FINANCE_BASE)

    // ── POST /api/finance/summary ──
    if (path === '/api/finance/summary' && req.method === 'POST') {
      const summary = mod.computeFinancialSummary(body.period || 'all')
      const monthly = mod.getMonthlyBreakdown(body.months || 6)
      return res.status(200).json({ providerStatus: 'connected', summary, monthly })
    }

    // ── POST /api/finance/expense ──
    if (path === '/api/finance/expense' && req.method === 'POST') {
      if (body.action === 'delete' && body.id) {
        const ok = mod.deleteExpense(body.id)
        return res.status(200).json({ providerStatus: 'connected', deleted: ok })
      }
      if (body.id) {
        const updated = mod.updateExpense(body.id, body)
        if (!updated) return res.status(404).json({ error: 'Expense not found' })
        return res.status(200).json({ providerStatus: 'connected', expense: updated })
      }
      const expense = mod.createExpense(body)
      return res.status(200).json({ providerStatus: 'connected', expense })
    }

    // ── GET /api/finance/expenses ──
    if (path === '/api/finance/expenses' && req.method === 'GET') {
      const expenses = mod.listExpenses(req.query || {})
      return res.status(200).json({ providerStatus: 'connected', expenses })
    }

    // ── GET /api/finance/revenues ──
    if (path === '/api/finance/revenues' && req.method === 'GET') {
      const revenues = mod.listRevenues(req.query || {})
      return res.status(200).json({ providerStatus: 'connected', revenues })
    }

    // ── POST /api/finance/revenue ──
    if (path === '/api/finance/revenue' && req.method === 'POST') {
      if (body.action === 'delete' && body.id) {
        const ok = mod.deleteRevenue(body.id)
        return res.status(200).json({ providerStatus: 'connected', deleted: ok })
      }
      if (body.id) {
        const updated = mod.updateRevenue(body.id, body)
        if (!updated) return res.status(404).json({ error: 'Revenue not found' })
        return res.status(200).json({ providerStatus: 'connected', revenue: updated })
      }
      const revenue = mod.createRevenue(body)
      return res.status(200).json({ providerStatus: 'connected', revenue })
    }

    // ── POST /api/finance/revenue/:id/payment-link ──
    if (path?.includes('/payment-link') && req.method === 'POST') {
      const id = path.replace('/payment-link', '').replace('/api/finance/revenue/', '')
      const revenue = mod.getRevenue(id)
      if (!revenue) return res.status(404).json({ error: 'Revenue not found' })
      
      // Se tiver chave Stripe, gera um Payment Link real (aqui simplificado).
      // Como fallback, geramos um link simulado para POC
      const paymentLink = process.env.STRIPE_SECRET_KEY 
        ? `https://buy.stripe.com/test_${revenue.id.split('-')[0]}` 
        : `https://apex-pay.local/checkout/${revenue.id}?amount=${revenue.amount}`;
      
      const updated = mod.updateRevenue(id, { notes: `Link de Pagamento Gerado: ${paymentLink}` })
      return res.status(200).json({ providerStatus: 'connected', revenue: updated, paymentLink })
    }

    // ── GET /api/finance/monthly ──
    if (path === '/api/finance/monthly' && req.method === 'GET') {
      const months = Number(req.query?.months) || 6
      const monthly = mod.getMonthlyBreakdown(months)
      return res.status(200).json({ providerStatus: 'connected', monthly })
    }

    // ── GET /api/finance/categories ──
    if (path === '/api/finance/categories' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', categories: mod.EXPENSE_CATEGORIES })
    }

    return res.status(404).json({ error: 'Not found', path })
  } catch (err) {
    console.error('[finance] Error:', err.message)
    return res.status(500).json({ error: err.message || 'finance_error' })
  }
}
