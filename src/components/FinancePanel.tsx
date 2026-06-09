import { useState } from 'react'
import { Copy, DollarSign, RefreshCw, Save } from 'lucide-react'
import { BusinessCurrency, localDemoModeNotice, paymentConnectorNotice } from '../lib/saasBusinessModel'
import { BusinessPlan, businessCurrencies, createBusinessPlan } from '../lib/crmFinanceKnowledge'

type FinancePanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: BusinessPlan) => void
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

export function FinancePanel({ goal, conversationContext, onSaveToProject }: FinancePanelProps) {
  const [currency, setCurrency] = useState<BusinessCurrency>('USD')
  const [plan, setPlan] = useState<BusinessPlan>(() => createBusinessPlan(goal || 'Finance layer setup', 'USD'))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  return (
    <section className="business-studio contracts-studio">
      <div className="contracts-head">
        <div>
          <span><DollarSign size={16} /> Finance</span>
          <h2>Invoices, revenue placeholders and project profit</h2>
          <p>{localDemoModeNotice}. {paymentConnectorNotice}</p>
        </div>
        <button onClick={() => generatePlan()} disabled={loading}><RefreshCw size={16} /> {loading ? 'Building...' : 'Generate'}</button>
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
          <strong>No fake payment</strong>
          <span>Draft invoices are not sent, paid or verified. Revenue remains placeholder until entered or connector-backed.</span>
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
