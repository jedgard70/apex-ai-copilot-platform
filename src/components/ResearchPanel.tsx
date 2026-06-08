import { useState } from 'react'
import { Clipboard, Download, FileJson, Globe, Save, Search, X } from 'lucide-react'
import { ResearchFinding, ResearchPlan, ResearchType, researchTypes, sourceConfidenceOptions } from '../lib/researchKnowledge'
import { SourceConfidence, noLiveSourceWarning } from '../lib/sourceConfidence'

type ResearchPanelProps = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: ResearchPlan) => void
  onClear: () => void
}

function downloadTextFile(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function proposalText(plan: ResearchPlan) {
  return [
    `Provider status: ${plan.providerStatus}`,
    noLiveSourceWarning,
    '',
    'Executive summary:',
    plan.proposalBuilder.executiveSummary,
    '',
    'Market opportunity:',
    plan.proposalBuilder.marketOpportunity,
    '',
    'Client pain points:',
    ...plan.proposalBuilder.clientPainPoints.map(item => `- ${item}`),
    '',
    'Value proposition:',
    plan.proposalBuilder.valueProposition,
    '',
    'Competitive positioning:',
    plan.proposalBuilder.competitivePositioning,
    '',
    'Pricing assumptions:',
    ...plan.proposalBuilder.pricingAssumptions.map(item => `- ${item}`),
    '',
    'Recommended offer:',
    plan.proposalBuilder.recommendedOffer,
    '',
    'CTA / next step:',
    plan.proposalBuilder.ctaNextStep,
  ].join('\n')
}

export function ResearchPanel({ goal, conversationContext, onSaveToProject, onClear }: ResearchPanelProps) {
  const [researchType, setResearchType] = useState<ResearchType>('Market research')
  const [query, setQuery] = useState(goal)
  const [region, setRegion] = useState('')
  const [freshness, setFreshness] = useState('Current source required')
  const [plan, setPlan] = useState<ResearchPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generateResearch() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/research-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchType, query, region, freshness, conversationContext }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Research planner failed.')
      setPlan(data.plan)
      setMessage(data.plan.message || 'Research plan generated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Research planner failed.')
    } finally {
      setLoading(false)
    }
  }

  function updateFinding(index: number, patch: Partial<ResearchFinding>) {
    if (!plan) return
    setPlan({ ...plan, findings: plan.findings.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  return (
    <section className="research-studio" aria-label="Research Market Intelligence Studio">
      <div className="research-heading">
        <div>
          <span>Research / Market Intelligence Studio</span>
          <h2>Source-aware research workspace</h2>
          <p>{noLiveSourceWarning}</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Research Studio"><X size={16} /></button>
      </div>

      <div className="research-layout">
        <aside className="research-controls">
          <div className="research-card">
            <strong>Research setup</strong>
            <label>Research type
              <select value={researchType} onChange={event => setResearchType(event.target.value as ResearchType)}>
                {researchTypes.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>Query
              <textarea value={query} onChange={event => setQuery(event.target.value)} />
            </label>
            <label>Region / location
              <input value={region} onChange={event => setRegion(event.target.value)} placeholder="city, state, country" />
            </label>
            <label>Date / source freshness
              <input value={freshness} onChange={event => setFreshness(event.target.value)} />
            </label>
            <button className="research-primary" type="button" onClick={generateResearch} disabled={loading}>
              <Search size={16} />
              {loading ? 'Preparing source plan...' : 'Generate research plan'}
            </button>
            {message && <p className="research-message">{message}</p>}
          </div>

          <div className="research-card">
            <strong>SINAPI source status</strong>
            <p>{plan?.sinapiStatus || 'not-connected'}</p>
            <small>No SINAPI value is valid until a table is uploaded or live source/API is connected.</small>
          </div>
        </aside>

        <div className="research-main">
          <div className="research-card research-status-grid">
            <div>
              <span>Provider status</span>
              <strong>{plan?.providerStatus || 'web-not-connected'}</strong>
              <p>{plan?.message || 'Generate a plan first. Current web browsing/source lookup is connector-ready only.'}</p>
            </div>
            <div>
              <span>Freshness</span>
              <strong>{plan?.freshness || freshness}</strong>
              <p>Current facts require live source verification.</p>
            </div>
          </div>

          <div className="research-card">
            <div className="research-section-head">
              <strong>Source list</strong>
              <span>{plan?.sources.length || 0} sources</span>
            </div>
            {(plan?.sources || []).map(source => (
              <article className="research-source-item" key={`${source.title}-${source.dateChecked}`}>
                <Globe size={16} />
                <div>
                  <strong>{source.title}</strong>
                  <span>{source.sourceName || source.url || 'source not connected'} · {source.dateChecked}</span>
                  <small>{source.evidenceLevel}: {source.note}</small>
                </div>
              </article>
            ))}
            {!plan?.sources.length && <p>No live sources connected yet. Add source connector or user-provided file later.</p>}
          </div>

          <div className="research-card research-table-card">
            <div className="research-section-head">
              <strong>Findings table</strong>
              <span>{plan?.findings.length || 0} claims</span>
            </div>
            <div className="research-table-wrap">
              <table className="research-table">
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Evidence</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan?.findings || []).map((finding, index) => (
                    <tr key={finding.id}>
                      <td><input value={finding.claim} onChange={event => updateFinding(index, { claim: event.target.value })} /></td>
                      <td><input value={finding.evidence} onChange={event => updateFinding(index, { evidence: event.target.value })} /></td>
                      <td>
                        <select value={finding.confidence} onChange={event => updateFinding(index, { confidence: event.target.value as SourceConfidence })}>
                          {sourceConfidenceOptions.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td><input value={finding.source} onChange={event => updateFinding(index, { source: event.target.value })} /></td>
                      <td><input value={finding.date} onChange={event => updateFinding(index, { date: event.target.value })} /></td>
                    </tr>
                  ))}
                  {!plan?.findings.length && <tr><td colSpan={5}>No findings yet. Generate a research plan first.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="research-card">
            <div className="research-section-head">
              <strong>Proposal builder</strong>
              <span>source-aware draft</span>
            </div>
            <pre className="research-proposal">{plan ? proposalText(plan) : 'Generate a research plan to prepare proposal support.'}</pre>
          </div>

          <div className="research-actions">
            <button type="button" disabled={!plan} onClick={() => plan && downloadTextFile('apex-research-plan.json', JSON.stringify(plan, null, 2), 'application/json;charset=utf-8')}><FileJson size={15} /> Export JSON</button>
            <button type="button" disabled={!plan} onClick={() => plan && copyText(proposalText(plan))}><Clipboard size={15} /> Copy proposal support</button>
            <button type="button" disabled={!plan} onClick={() => plan && downloadTextFile('apex-research-proposal.txt', proposalText(plan))}><Download size={15} /> Export proposal text</button>
            <button type="button" disabled={!plan} onClick={() => plan && onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
          </div>
        </div>
      </div>
    </section>
  )
}

