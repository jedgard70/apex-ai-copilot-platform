import { useState } from 'react'
import { Copy, RefreshCw, Save, Target } from 'lucide-react'
import { BusinessPlan, createBusinessPlan, pipelineStages, serviceCatalogDefaults } from '../lib/crmFinanceKnowledge'
import { localDemoModeNotice } from '../lib/saasBusinessModel'

type CrmPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: BusinessPlan) => void
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function proposalText(plan: BusinessPlan) {
  return [
    plan.sales.title,
    '',
    plan.sales.executiveSummary,
    '',
    'Scope:',
    ...plan.sales.serviceScope.map(item => `- ${item}`),
    '',
    'Quote packages:',
    ...plan.sales.quotePackages.map(item => `- ${item}`),
    '',
    'Email draft:',
    plan.sales.emailDraft,
  ].join('\n')
}

export function CrmPanel({ goal, conversationContext, onSaveToProject }: CrmPanelProps) {
  const [plan, setPlan] = useState<BusinessPlan>(() => createBusinessPlan(goal || 'CRM/Sales layer setup'))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generatePlan() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: 'crm-sales', goal, conversationContext }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Business planner failed.')
      setPlan(data.plan)
      setMessage(data.plan?.message || 'CRM/Sales structure updated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Business planner failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="business-studio contracts-studio">
      <div className="contracts-head">
        <div>
          <span><Target size={16} /> CRM / Sales</span>
          <h2>Pipeline, proposals and client follow-up</h2>
          <p>{localDemoModeNotice}. CRM records are local scaffolding until a database is approved.</p>
        </div>
        <button onClick={generatePlan} disabled={loading}><RefreshCw size={16} /> {loading ? 'Building...' : 'Generate'}</button>
      </div>

      {message && <div className="business-alert"><strong>Status</strong><span>{message}</span></div>}

      <div className="contracts-card">
        <h3>Pipeline stages</h3>
        <div className="business-stage-row">
          {pipelineStages.map(stage => <span key={stage}>{stage}</span>)}
        </div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3>Leads and opportunities</h3>
          <div className="contracts-table">
            <table>
              <thead>
                <tr><th>Lead</th><th>Stage</th><th>Value</th><th>Next action</th></tr>
              </thead>
              <tbody>
                {plan.crm.opportunities.map(item => (
                  <tr key={item.id}>
                    <td>{item.company}<br /><small>{item.title}</small></td>
                    <td>{item.stage}</td>
                    <td>{item.currency} {item.expectedValue} · {item.probability}%</td>
                    <td>{item.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="contracts-card">
          <h3>Follow-up tasks</h3>
          <ul>
            {plan.crm.followUpTasks.map(task => <li key={task}>{task}</li>)}
          </ul>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Service catalog</h3>
        <div className="business-service-grid">
          {serviceCatalogDefaults.map(service => (
            <div key={service.id}>
              <strong>{service.name}</strong>
              <span>{service.category}</span>
              <small>{service.description}</small>
              <em>{service.priceConfidence}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="contracts-card">
        <h3>Proposal builder</h3>
        <p>{plan.sales.executiveSummary}</p>
        <div className="business-two-col">
          <div>
            <strong>Quote packages</strong>
            <ul>{plan.sales.quotePackages.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <strong>Objection handling</strong>
            <ul>{plan.sales.objectionHandling.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <pre>{plan.sales.emailDraft}</pre>
        <div className="contracts-actions">
          <button onClick={() => copyText(proposalText(plan))}><Copy size={15} /> Copy proposal</button>
          <button onClick={() => onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
        </div>
      </div>
    </section>
  )
}
