import { useState } from 'react'
import { BusinessPlan, createBusinessPlan, pipelineStages, serviceCatalogDefaults } from '../lib/crmFinanceKnowledge'
import { localDemoModeNotice } from '../lib/saasBusinessModel'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type CrmPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: BusinessPlan) => void
  onActivateService?: (serviceId: string) => void
  onClear?: () => void
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

export function CrmPanel({ goal, conversationContext, onSaveToProject, onActivateService, onClear }: CrmPanelProps) {
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
    <PremiumPanelLayout
      title="CRM Command Center"
      subtitle="Real-time intelligence and relationship management."
      headerActions={
        <div className="flex gap-3 items-center">
          <button
            onClick={generatePlan}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1e2020] border border-[#45464d]/20 rounded-xl text-[#e2e2e2] font-label-caps text-xs hover:bg-[#1C294A] transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'refresh'}</span>
            {loading ? 'Building...' : 'Generate'}
          </button>
          <button
            onClick={() => onSaveToProject?.(plan)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] rounded-xl text-white font-label-caps text-xs hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#6C47FF]/20"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors ml-4"
              aria-label="Close CRM Panel"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
      {message && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm text-[#c6c6ce]" style={{ background: 'rgba(22, 33, 62, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <strong className="text-[#6C47FF]">Status: </strong>
          <span>{message}</span>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue Forecast Chart */}
        <div className="col-span-12 lg:col-span-8 rounded-xl p-6 relative overflow-hidden" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="font-label-caps text-[#c6c6ce] mb-1 uppercase tracking-widest text-xs">Revenue Forecast</h3>
              <p className="font-headline-md text-[24px] text-[#e2e2e2]">
                $2.4M
                <span className="text-[#c9beff] text-sm font-normal ml-2">+12.4% vs prev. month</span>
              </p>
            </div>
            <span className="text-[#c6c6ce] font-label-caps text-xs bg-[#0B1221] px-3 py-1 rounded-lg">Next 6 Months</span>
          </div>
          <div className="h-64 w-full flex items-end gap-2 relative z-10">
            {[
              { h: 40, label: 'JAN', proj: false },
              { h: 55, label: 'FEB', proj: false },
              { h: 45, label: 'MAR', proj: false },
              { h: 70, label: 'APR', proj: false },
              { h: 85, label: 'MAY (PROJ)', proj: true },
              { h: 60, label: 'JUN', proj: false },
            ].map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg transition-all cursor-pointer relative group"
                style={{
                  height: `${bar.h}%`,
                  background: bar.proj
                    ? 'linear-gradient(to top, rgba(108,71,255,0.6), rgba(108,71,255,0.8))'
                    : `rgba(108,71,255,${0.1 + i * 0.1})`,
                  borderTop: bar.proj ? '2px solid #6C47FF' : 'none',
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#c6c6ce] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="col-span-12 lg:col-span-4 rounded-xl p-6 flex flex-col justify-between" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h3 className="font-label-caps text-[#c6c6ce] mb-6 uppercase tracking-widest text-xs">Pipeline Overview</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#c6c6ce]">Qualified Leads</span>
                  <span className="font-headline-md text-[24px] text-[#e2e2e2]">1,204</span>
                </div>
                <div className="w-full bg-[#0B1221] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#6C47FF] h-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#c6c6ce]">Active Proposals</span>
                  <span className="font-headline-md text-[24px] text-[#e2e2e2]">342</span>
                </div>
                <div className="w-full bg-[#0B1221] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#c9beff] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#c6c6ce]">Closing Stage</span>
                  <span className="font-headline-md text-[24px] text-[#e2e2e2]">89</span>
                </div>
                <div className="w-full bg-[#0B1221] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#D71920] h-full" style={{ width: '22%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#45464d]/10">
            <span className="text-[#6C47FF] text-xs font-bold bg-[#6C47FF]/10 px-2 py-0.5 rounded-full">AI INSIGHT</span>
            <p className="text-sm text-[#7e89ab] italic leading-relaxed mt-2">
              Conversion rates in "Qualified" stage are 14% higher this week due to automated AI follow-ups.
            </p>
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="col-span-12 rounded-xl p-6" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="font-label-caps text-[#c6c6ce] mb-4 uppercase tracking-widest text-xs">Pipeline Stages</h3>
          <div className="flex flex-wrap gap-2">
            {pipelineStages.map(stage => (
              <span key={stage} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#c6c6ce] border border-[#45464d]/20 bg-[#1C294A]/50">
                {stage}
              </span>
            ))}
          </div>
        </div>

        {/* High-Value Leads Table */}
        <div className="col-span-12 rounded-xl overflow-hidden" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="px-6 py-4 border-b border-[#45464d]/10 flex justify-between items-center">
            <h3 className="font-label-caps text-[#c6c6ce] uppercase tracking-widest text-xs">Leads & Opportunities</h3>
            <button className="text-[#6C47FF] font-label-caps text-xs hover:underline">View All Leads</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0B1221]">
                <tr>
                  <th className="text-left py-3 px-6 font-label-caps text-[#c6c6ce] text-xs">Lead</th>
                  <th className="text-left py-3 px-6 font-label-caps text-[#c6c6ce] text-xs">Stage</th>
                  <th className="text-left py-3 px-6 font-label-caps text-[#c6c6ce] text-xs">Value</th>
                  <th className="text-left py-3 px-6 font-label-caps text-[#c6c6ce] text-xs">Next Action</th>
                  <th className="text-right py-3 px-6 font-label-caps text-[#c6c6ce] text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#45464d]/5">
                {plan.crm.opportunities.map((item, i) => (
                  <tr key={item.id} className="hover:bg-[#1C294A]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#1C294A] flex items-center justify-center text-xs font-bold text-[#6C47FF]">
                          {item.company.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[#e2e2e2] font-bold text-sm">{item.company}</p>
                          <p className="text-[10px] text-[#c6c6ce] uppercase">{item.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{
                        background: i === 0 ? 'rgba(108,71,255,0.15)' : 'rgba(22,33,62,0.5)',
                        color: i === 0 ? '#6C47FF' : '#7e89ab',
                        border: i === 0 ? '1px solid rgba(108,71,255,0.2)' : '1px solid rgba(69,70,77,0.2)',
                      }}>
                        {item.stage}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#e2e2e2]">{item.currency} {item.expectedValue}</td>
                    <td className="py-4 px-6 text-[#c6c6ce] text-sm">{item.nextAction}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 hover:bg-[#1C294A] rounded-lg transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[#c6c6ce] text-[18px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Follow-up Tasks */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-6" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="font-label-caps text-[#c6c6ce] mb-4 uppercase tracking-widest text-xs">Follow-up Tasks</h3>
          <ul className="space-y-3">
            {plan.crm.followUpTasks.map(task => (
              <li key={task} className="flex items-center gap-3 text-sm text-[#c6c6ce]">
                <span className="material-symbols-outlined text-[16px] text-[#6C47FF]">task_alt</span>
                {task}
              </li>
            ))}
          </ul>
        </div>

        {/* Service Catalog */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-6" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="font-label-caps text-[#c6c6ce] mb-4 uppercase tracking-widest text-xs">Service Catalog</h3>
          <div className="space-y-4">
            {serviceCatalogDefaults.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border border-[#45464d]/10 bg-[#0B1221]/30">
                <div>
                  <strong className="text-[#e2e2e2] text-sm">{service.name}</strong>
                  <p className="text-[10px] text-[#6C47FF] uppercase font-bold">{service.category}</p>
                  <p className="text-xs text-[#c6c6ce] mt-1">{service.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onActivateService?.(service.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#6C47FF] text-white hover:brightness-110"
                >
                  Activate
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Proposal Builder */}
        <div className="col-span-12 rounded-xl p-6" style={{ background: 'rgba(22, 33, 62, 0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="font-label-caps text-[#c6c6ce] mb-4 uppercase tracking-widest text-xs">Proposal Builder</h3>
          <p className="text-[#c6c6ce] text-sm mb-4">{plan.sales.executiveSummary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <strong className="text-[#e2e2e2] text-sm">Quote Packages</strong>
              <ul className="mt-2 space-y-1">
                {plan.sales.quotePackages.map(item => (
                  <li key={item} className="text-sm text-[#c6c6ce] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#6C47FF]">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong className="text-[#e2e2e2] text-sm">Objection Handling</strong>
              <ul className="mt-2 space-y-1">
                {plan.sales.objectionHandling.map(item => (
                  <li key={item} className="text-sm text-[#c6c6ce] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#6C47FF]">lightbulb</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <pre className="text-sm text-[#c6c6ce] bg-[#0B1221]/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{plan.sales.emailDraft}</pre>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => copyText(proposalText(plan))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-[#45464d]/20 text-[#e2e2e2] hover:bg-[#1C294A] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy proposal
            </button>
            <button
              onClick={() => onSaveToProject?.(plan)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#6C47FF] text-white hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save to Project
            </button>
          </div>
        </div>
      </div>
      </div>
    </PremiumPanelLayout>
  )
}
