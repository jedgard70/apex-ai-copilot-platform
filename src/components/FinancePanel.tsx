import { useEffect, useState } from 'react'
import { Copy, DollarSign, RefreshCw, Save, X } from 'lucide-react'
import { BusinessCurrency, localDemoModeNotice, paymentConnectorNotice } from '../lib/saasBusinessModel'
import { BusinessPlan, businessCurrencies, createBusinessPlan } from '../lib/crmFinanceKnowledge'

type FinancePanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: BusinessPlan) => void
  onClear?: () => void
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function financeText(plan: BusinessPlan) {
  return [
    'Finance draft',
    plan.finance.summary.revenueSummary,
    plan.finance.summary.accountsReceivable,
    '',
    'Invoices:',
    ...plan.finance.invoices.map(item => `- ${item.client} / ${item.project}: ${item.currency} ${item.amount} / ${item.status} / ${item.source}`),
    '',
    'Expenses:',
    ...plan.finance.expenses.map(item => `- ${item.project} / ${item.category}: ${item.currency} ${item.amount} / ${item.status}`),
    '',
    'Warnings:',
    ...plan.finance.summary.warnings.map(item => `- ${item}`),
    '',
    'Accounting handoff:',
    plan.finance.accounting.accountantHandoffPackage,
    '',
    'Tax prep checklist:',
    ...plan.finance.accounting.taxPreparationChecklist.map(item => `- ${item}`),
  ].join('\n')
}

export function FinancePanel({ goal, conversationContext, onSaveToProject, onClear }: FinancePanelProps) {
  const [currency, setCurrency] = useState<BusinessCurrency>('USD')
  const [plan, setPlan] = useState<BusinessPlan>(() => createBusinessPlan(goal || 'Finance layer setup', 'USD'))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [checkingStripe, setCheckingStripe] = useState(false)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeStatusMessage, setStripeStatusMessage] = useState('Checking Stripe connector...')
  const [stripePriceId, setStripePriceId] = useState('')
  const [tenantId, setTenantId] = useState('tenant-local')
  const [userId, setUserId] = useState('user-local')
  const [customerEmail, setCustomerEmail] = useState('')
  const [startingCheckout, setStartingCheckout] = useState(false)

  async function refreshStripeStatus() {
    setCheckingStripe(true)
    try {
      const response = await fetch('/api/stripe/status')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStripeConfigured(false)
        setStripeStatusMessage(data.reason || data.error || 'Stripe connector is not configured.')
        return
      }
      setStripeConfigured(Boolean(data.configured))
      setStripeStatusMessage(data.configured ? 'Stripe connector is configured and ready for checkout session creation.' : (data.reason || 'Stripe connector is not configured.'))
    } catch (error) {
      setStripeConfigured(false)
      setStripeStatusMessage(error instanceof Error ? error.message : 'Failed to check Stripe connector status.')
    } finally {
      setCheckingStripe(false)
    }
  }

  useEffect(() => {
    refreshStripeStatus()
  }, [])

  async function generatePlan(nextCurrency = currency) {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: 'finance', goal, conversationContext, currency: nextCurrency }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Finance planner failed.')
      setPlan(data.plan)
      setMessage(data.plan?.message || 'Finance structure updated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Finance planner failed.')
    } finally {
      setLoading(false)
    }
  }

  async function openStripeCheckout() {
    if (!stripePriceId.trim()) {
      setMessage('Stripe priceId is required to start a real checkout session.')
      return
    }
    setStartingCheckout(true)
    setMessage('')
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId.trim() || 'tenant-local',
          userId: userId.trim() || 'user-local',
          plan: 'Business',
          priceId: stripePriceId.trim(),
          customerEmail: customerEmail.trim() || undefined,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/billing`,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to create Stripe checkout session.')
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      throw new Error('Stripe checkout URL was not returned.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Stripe checkout.')
    } finally {
      setStartingCheckout(false)
    }
  }

  return (
    <section className="business-studio contracts-studio">
      <div className="contracts-heading">
        <div>
          <span><DollarSign size={16} /> Finance</span>
          <h2>Invoices, revenue placeholders and project profit</h2>
          <p>{localDemoModeNotice}. {stripeConfigured ? 'Stripe connector active for real checkout flow.' : paymentConnectorNotice}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => generatePlan()} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> {loading ? 'Building...' : 'Generate'}
          </button>
          {onClear && (
            <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Finance Panel">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {message && <div className="business-alert"><strong>Status</strong><span>{message}</span></div>}

      <div className="contracts-card">
        <h3>Finance controls</h3>
        <label className="business-field">
          Currency
          <select value={currency} onChange={event => {
            const next = event.target.value as BusinessCurrency
            setCurrency(next)
            setPlan(createBusinessPlan(goal, next))
          }}>
            {businessCurrencies.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="business-alert">
          <strong>{stripeConfigured ? 'Stripe connector active' : 'Stripe connector pending'}</strong>
          <span>{stripeStatusMessage}</span>
        </div>
        <div className="contracts-grid" style={{ marginTop: '12px' }}>
          <label className="business-field">
            Stripe priceId
            <input value={stripePriceId} onChange={event => setStripePriceId(event.target.value)} placeholder="price_..." />
          </label>
          <label className="business-field">
            Tenant ID
            <input value={tenantId} onChange={event => setTenantId(event.target.value)} />
          </label>
          <label className="business-field">
            User ID
            <input value={userId} onChange={event => setUserId(event.target.value)} />
          </label>
          <label className="business-field">
            Customer email (optional)
            <input value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} placeholder="client@domain.com" />
          </label>
        </div>
        <div className="contracts-actions">
          <button type="button" onClick={() => refreshStripeStatus()} disabled={checkingStripe}>
            <RefreshCw size={15} className={checkingStripe ? 'spin-icon' : ''} /> {checkingStripe ? 'Checking...' : 'Check Stripe status'}
          </button>
          <button type="button" onClick={openStripeCheckout} disabled={startingCheckout || !stripeConfigured}>
            <DollarSign size={15} /> {startingCheckout ? 'Starting checkout...' : 'Open real Stripe checkout'}
          </button>
        </div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3>Invoices</h3>
          <div className="contracts-table">
            <table>
              <thead>
                <tr><th>Client</th><th>Project</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {plan.finance.invoices.map(item => (
                  <tr key={item.id}>
                    <td>{item.client}</td>
                    <td>{item.project}</td>
                    <td>{item.currency} {item.amount}</td>
                    <td>{item.status}<br /><small>{item.source}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="contracts-card">
          <h3>Payments</h3>
          <div className="contracts-table">
            <table>
              <thead>
                <tr><th>Invoice</th><th>Amount</th><th>Status</th><th>Evidence</th></tr>
              </thead>
              <tbody>
                {plan.finance.payments.map(item => (
                  <tr key={item.id}>
                    <td>{item.invoiceId}</td>
                    <td>{item.currency} {item.amount}</td>
                    <td>{item.status}</td>
                    <td>{item.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Expenses</h3>
          <div className="contracts-table">
            <table>
              <thead>
                <tr><th>Project</th><th>Category</th><th>Amount</th><th>Status / Evidence</th></tr>
              </thead>
              <tbody>
                {plan.finance.expenses.map(item => (
                  <tr key={item.id}>
                    <td>{item.project}</td>
                    <td>{item.category}</td>
                    <td>{item.currency} {item.amount}</td>
                    <td>{item.status}<br /><small>{item.evidence || 'UNKNOWN'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      <div className="contracts-card">
        <h3>Revenue / profit summary</h3>
        <ul>
          <li>{plan.finance.summary.revenueSummary}</li>
          <li>{plan.finance.summary.clientBalance}</li>
          <li>{plan.finance.summary.accountsReceivable}</li>
          <li>{plan.finance.summary.projectCostProfit}</li>
        </ul>
        <div className="contracts-actions">
          <button onClick={() => copyText(financeText(plan))}><Copy size={15} /> Copy finance summary</button>
          <button onClick={() => onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Accounting / Contabilidade</h3>
        <div className="business-alert">
          <strong>NEEDS_ACCOUNTANT_REVIEW</strong>
          <span>{plan.finance.accounting.reviewNotice}</span>
        </div>
        <div className="business-two-col">
          <div>
            <strong>Accounting Summary</strong>
            <p>{plan.finance.accounting.monthlyAccountingSummary}</p>
            <strong>Chart of accounts placeholder</strong>
            <ul>{plan.finance.accounting.chartOfAccountsPlaceholder.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <strong>Documents for Accountant</strong>
            <ul>{plan.finance.accounting.documentsPendingForAccountant.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Revenue / Expense Ledger</h3>
        <div className="contracts-table">
          <table>
            <thead>
              <tr><th>Type</th><th>Description</th><th>Amount</th><th>Tax / Cost center</th><th>Evidence</th></tr>
            </thead>
            <tbody>
              {plan.finance.accounting.ledger.map(item => (
                <tr key={item.id}>
                  <td>{item.type}</td>
                  <td>{item.description}<br /><small>{item.clientOrSupplier}</small></td>
                  <td>{item.currency} {item.amount}</td>
                  <td>{item.taxCategory}<br /><small>{item.costCenter}</small></td>
                  <td>{item.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3>Tax Prep Checklist</h3>
          <ul>{plan.finance.accounting.taxPreparationChecklist.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="contracts-card">
          <h3>Accountant Export Package</h3>
          <p>{plan.finance.accounting.accountantHandoffPackage}</p>
          <div className="contracts-actions">
            <button onClick={() => copyText(plan.finance.accounting.accountantHandoffPackage)}><Copy size={15} /> Copy handoff</button>
          </div>
        </div>
      </div>
    </section>
  )
}
