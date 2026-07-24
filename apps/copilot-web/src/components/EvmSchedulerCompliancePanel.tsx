import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, CalendarDays, Clipboard, Download, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import {
  createEvmSchedulerCompliancePlan,
  EvmInputs,
  EvmSchedulerCompliancePlan,
} from '../lib/evmSchedulerComplianceKnowledge'

type EvmSchedulerCompliancePanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: EvmSchedulerCompliancePlan) => void
  onClear: () => void
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function downloadTextFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function inputNumber(value: string): number | undefined {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

export function EvmSchedulerCompliancePanel({
  goal,
  conversationContext,
  onSaveToProject,
  onClear,
}: EvmSchedulerCompliancePanelProps) {
  const [inputs, setInputs] = useState({ pv: '', ev: '', ac: '', bac: '' })
  const [plan, setPlan] = useState<EvmSchedulerCompliancePlan>(() => createEvmSchedulerCompliancePlan(goal))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const evmInputs: EvmInputs = useMemo(() => ({
    plannedValue: inputNumber(inputs.pv),
    earnedValue: inputNumber(inputs.ev),
    actualCost: inputNumber(inputs.ac),
    budgetAtCompletion: inputNumber(inputs.bac),
  }), [inputs])

  async function generatePlan() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/evm-scheduler-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext, evmInputs }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'EVM/Scheduler/NR analysis failed.')
      setPlan(data.plan)
      setMessage('Local analysis updated. Missing values remain UNKNOWN; compliance remains review-only.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'EVM/Scheduler/NR analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  function updateInput(key: keyof typeof inputs, value: string) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  return (
    <PremiumPanelLayout title="EVM + Scheduler + NR Compliance" subtitle="Configurações e monitoramento" onClose={onClear}>
      <div className="business-alert">
        <strong>Evidence rule</strong>
        <span>CONFIRMED requires user/project data. ESTIMATED is inferred. UNKNOWN remains missing. NR compliance is GENERAL_GUIDANCE or NEEDS_SAFETY_REVIEW until qualified review.</span>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3><Activity size={15} /> EVM inputs</h3>
          <div className="evm-input-grid">
            <label>PV - Planned Value<input value={inputs.pv} onChange={event => updateInput('pv', event.target.value)} placeholder="Example: 100000" /></label>
            <label>EV - Earned Value<input value={inputs.ev} onChange={event => updateInput('ev', event.target.value)} placeholder="Example: 85000" /></label>
            <label>AC - Actual Cost<input value={inputs.ac} onChange={event => updateInput('ac', event.target.value)} placeholder="Example: 90000" /></label>
            <label>BAC - Budget at Completion<input value={inputs.bac} onChange={event => updateInput('bac', event.target.value)} placeholder="Example: 150000" /></label>
          </div>
          <div className="contracts-actions">
            <button onClick={generatePlan} disabled={loading}><RefreshCw size={15} /> {loading ? 'Analyzing...' : 'Run local analysis'}</button>
            <button onClick={() => onSaveToProject?.(plan)}>Save to Project Workspace</button>
          </div>
          {message && <p className="contracts-message">{message}</p>}
        </div>

        <div className="contracts-card">
          <h3>Missing data</h3>
          {plan.missingData.length ? (
            <ul>{plan.missingData.map(item => <li key={item}>{item}</li>)}</ul>
          ) : (
            <p>PV, EV, AC and BAC supplied. EVM KPIs can be calculated from user/project data.</p>
          )}
        </div>
      </div>

      <div className="evm-kpi-grid">
        {[
          ['PV', plan.kpis.pv],
          ['EV', plan.kpis.ev],
          ['AC', plan.kpis.ac],
          ['CPI', plan.kpis.cpi],
          ['SPI', plan.kpis.spi],
          ['EAC', plan.kpis.eac],
          ['VAC', plan.kpis.vac],
          ['TCPI', plan.kpis.tcpi],
        ].map(([label, value]) => (
          <div key={label as string}>
            <span>{label}</span>
            <strong>{value === null ? 'UNKNOWN' : value}</strong>
            <small>{plan.kpis.evidence}</small>
          </div>
        ))}
      </div>

      <div className="contracts-card">
        <h3>EVM variance table</h3>
        <div className="contracts-table">
          <table>
            <thead><tr><th>Metric</th><th>Value</th><th>Evidence</th><th>Interpretation</th></tr></thead>
            <tbody>
              {plan.varianceTable.map(row => (
                <tr key={row.metric}>
                  <td>{row.metric}</td>
                  <td>{row.value === null ? 'UNKNOWN' : row.value}</td>
                  <td>{row.evidence}</td>
                  <td>{row.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3><CalendarDays size={15} /> Scheduler Agent</h3>
          <p>{plan.schedulePlan.summary}</p>
          <div className="contracts-table">
            <table>
              <thead><tr><th>Task</th><th>Duration</th><th>Dependencies</th><th>Evidence</th></tr></thead>
              <tbody>
                {plan.schedulePlan.tasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.name}<br /><small>{task.responsible}</small></td>
                    <td>{task.durationDays} days</td>
                    <td>{task.dependencies.join(', ') || 'None'}</td>
                    <td>{task.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="contracts-card">
          <h3>Lookahead + critical path</h3>
          <strong>Critical path planning</strong>
          <ol>{plan.criticalPath.map(step => <li key={step}>{step}</li>)}</ol>
          <strong>Lookahead</strong>
          <ul>{plan.schedulePlan.lookaheadPlan.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Physical-financial schedule</h3>
        <div className="contracts-table">
          <table>
            <thead><tr><th>Period</th><th>Physical</th><th>Financial</th><th>Evidence</th></tr></thead>
            <tbody>
              {plan.schedulePlan.physicalFinancialSchedule.map(row => (
                <tr key={row.period}>
                  <td>{row.period}</td>
                  <td>{row.physicalProgress}%</td>
                  <td>{row.financialProgress}%</td>
                  <td>{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contracts-card">
        <h3><ShieldCheck size={15} /> NR Compliance Agent</h3>
        <div className="business-alert">
          <strong>No official approval</strong>
          <span>Apex prepares safety/compliance workpapers only. Qualified safety/legal review is required before any official NR claim.</span>
        </div>
        <div className="contracts-table">
          <table>
            <thead><tr><th>NR</th><th>Checklist item</th><th>Risk</th><th>Evidence</th><th>Action</th></tr></thead>
            <tbody>
              {plan.nrChecklist.map(item => (
                <tr key={item.id}>
                  <td>{item.norm}</td>
                  <td>{item.item}<br /><small>{item.status}</small></td>
                  <td>{item.riskLevel}</td>
                  <td>{item.evidence}</td>
                  <td>{item.correctiveAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3><AlertTriangle size={15} /> Risk matrix</h3>
          <ul>
            {plan.riskMatrix.map(row => <li key={`${row.norm}-${row.risk}`}>{row.norm}: {row.count} {row.risk} item(s) · {row.evidence}</li>)}
          </ul>
        </div>
        <div className="contracts-card">
          <h3>Exports</h3>
          <div className="contracts-actions">
            <button onClick={() => copyText(plan.exports.evmReport)}><Clipboard size={15} /> Copy EVM</button>
            <button onClick={() => copyText(plan.exports.scheduleReport)}><Clipboard size={15} /> Copy schedule</button>
            <button onClick={() => copyText(plan.exports.nrComplianceReport)}><Clipboard size={15} /> Copy NR report</button>
            <button onClick={() => downloadTextFile('apex-cp11c-controls-report.txt', [
              plan.exports.evmReport,
              '',
              plan.exports.scheduleReport,
              '',
              plan.exports.nrComplianceReport,
              '',
              plan.exports.correctiveActionPlan,
            ].join('\n'))}><Download size={15} /> Download combined</button>
          </div>
        </div>
      </div>
    </PremiumPanelLayout>
  )
}
