import { useState } from 'react'
import { Clipboard, Download, Save, Send, Sparkles, X } from 'lucide-react'
import { CampaignAutomationPlan, CampaignChannel, CampaignFormat, CampaignGoal, createCampaignAutomationPlan } from '../lib/campaignAutomationKnowledge'

type Props = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: CampaignAutomationPlan) => void
  onSendToDirectCut?: (summary: string) => void
  onClear: () => void
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function CampaignAutomationPanel({ goal, conversationContext, onSaveToProject, onSendToDirectCut, onClear }: Props) {
  const [campaignGoal, setCampaignGoal] = useState<CampaignGoal>('lead-generation')
  const [channel, setChannel] = useState<CampaignChannel>('instagram-facebook')
  const [format, setFormat] = useState<CampaignFormat>(/\b(vsl|landing|video sales|v[íi]deo de vendas|p[aá]gina de vendas)\b/i.test(goal) ? 'vsl-landing' : 'social-pack')
  const [audience, setAudience] = useState('Prospective architecture / construction clients')
  const [offer, setOffer] = useState(goal)
  const [plan, setPlan] = useState<CampaignAutomationPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generatePlan() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/campaign-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext, campaignGoal, channel, format, audience, offer }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.plan) throw new Error(data.error || 'Campaign planner failed.')
      setPlan(data.plan)
      setMessage('Campaign pack generated.')
    } catch (error) {
      setPlan(createCampaignAutomationPlan(goal, campaignGoal, channel, format, audience, offer))
      setMessage(error instanceof Error ? error.message : 'Campaign planner failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="contracts-studio">
      <div className="contracts-heading">
        <div>
          <span><Sparkles size={16} /> Campaign Automation</span>
          <h2>Campaign and VSL conversion pack</h2>
          <p>Generate social ads, CTAs, storyboard and video-sales landing structure inside Apex.</p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Campaign setup</strong>
            <label>
              <span>Goal</span>
              <select value={campaignGoal} onChange={event => setCampaignGoal(event.target.value as CampaignGoal)}>
                <option value="lead-generation">Lead generation</option>
                <option value="client-approval">Client approval</option>
                <option value="property-sales">Property sales</option>
                <option value="brand-awareness">Brand awareness</option>
              </select>
            </label>
            <label>
              <span>Channel</span>
              <select value={channel} onChange={event => setChannel(event.target.value as CampaignChannel)}>
                <option value="instagram-facebook">Instagram + Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <label>
              <span>Format</span>
              <select value={format} onChange={event => setFormat(event.target.value as CampaignFormat)}>
                <option value="social-pack">Social campaign pack</option>
                <option value="vsl-landing">VSL / video sales landing</option>
              </select>
            </label>
            <label>
              <span>Audience</span>
              <input value={audience} onChange={event => setAudience(event.target.value)} />
            </label>
            <label>
              <span>Offer / focus</span>
              <textarea value={offer} onChange={event => setOffer(event.target.value)} />
            </label>
            <button className="contracts-primary" onClick={generatePlan} disabled={loading}>{loading ? 'Generating...' : 'Generate campaign pack'}</button>
          </div>

          <div className="contracts-card">
            <strong>Actions</strong>
            <button onClick={() => plan && copy(plan.report)} disabled={!plan}><Clipboard size={15} /> Copy report</button>
            <button onClick={() => plan && download('apex-campaign-pack.json', JSON.stringify(plan, null, 2))} disabled={!plan}><Download size={15} /> Export JSON</button>
            <button onClick={() => plan && onSaveToProject?.(plan)} disabled={!plan}><Save size={15} /> Save to Project Workspace</button>
            <button
              onClick={() => plan && onSendToDirectCut?.(`Create a campaign video for ${plan.offerSummary}. Hooks: ${plan.hookOptions.join(' | ')}. Primary CTA: ${plan.ctaOptions[0] || 'Book a discovery call'}.`)}
              disabled={!plan || !onSendToDirectCut}
            >
              <Send size={15} /> Send to DirectCut
            </button>
          </div>
        </aside>

        <div className="contracts-main">
          {message && <div className="contracts-card"><strong>Status</strong><span>{message}</span></div>}
          {plan && (
            <>
              <div className="contracts-card">
                <strong>Primary caption</strong>
                <p>{plan.primaryCaption}</p>
              </div>
              <Grid title="Hook options" items={plan.hookOptions} />
              <Grid title="Alternate captions" items={plan.alternateCaptions} />
              <Grid title="CTA options" items={plan.ctaOptions} />
              <Grid title="Storyboard" items={plan.storyboard} />
              <div className="contracts-card">
                <div className="contracts-section-head">
                  <strong>VSL landing blueprint</strong>
                  <span>{plan.format}</span>
                </div>
                <p><strong>Urgency bar:</strong> {plan.vslLanding.urgencyBar}</p>
                <p><strong>Headline:</strong> {plan.vslLanding.heroHeadline}</p>
                <p><strong>Subheadline:</strong> {plan.vslLanding.heroSubheadline}</p>
                <p><strong>Audio prompt:</strong> {plan.vslLanding.autoplayPrompt}</p>
                <p><strong>Primary CTA:</strong> {plan.vslLanding.ctaLabel}</p>
                <p><strong>Destination:</strong> {plan.vslLanding.ctaDestinationHint}</p>
              </div>
              <div className="contracts-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: '#7f1d1d', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', padding: '10px 16px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {plan.vslLanding.urgencyBar}
                </div>
                <div style={{ padding: 18, background: 'linear-gradient(180deg, #091225 0%, #0f172a 100%)', color: '#fff', display: 'grid', gap: 14 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 24, lineHeight: 1.2 }}>{plan.vslLanding.heroHeadline}</strong>
                    <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.78)' }}>{plan.vslLanding.heroSubheadline}</p>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, overflow: 'hidden', background: '#020617' }}>
                    <div style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at center, rgba(59,130,246,0.2), rgba(2,6,23,1))' }}>
                      <div style={{ textAlign: 'center', maxWidth: 320, padding: 20 }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>▶</div>
                        <strong style={{ display: 'block', marginBottom: 6 }}>Video-first sales page preview</strong>
                        <span style={{ color: 'rgba(255,255,255,0.74)', fontSize: 13 }}>{plan.vslLanding.autoplayPrompt}</span>
                      </div>
                    </div>
                    <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>{plan.vslLanding.ctaDestinationHint}</span>
                      <button style={{ background: '#22c55e', color: '#04130a', border: 'none', borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
                        {plan.vslLanding.ctaLabel}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    {plan.vslLanding.trustElements.map(item => (
                      <div key={item} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.82)' }}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>
                    <span>Terms of use</span>
                    <span>Privacy policy</span>
                    <span>{plan.offerSummary}</span>
                  </div>
                </div>
              </div>
              <Grid title="Player behavior" items={plan.vslLanding.playerBehavior} />
              <Grid title="VSL page sections" items={plan.vslLanding.pageSections} />
              <Grid title="Trust elements" items={plan.vslLanding.trustElements} />
              <Grid title="Tracking checklist" items={plan.vslLanding.trackingChecklist} />
              <Grid title="Publishing checklist" items={plan.publishingChecklist} />
              <div className="contracts-card">
                <div className="contracts-section-head">
                  <strong>Ad variations</strong>
                  <span>{plan.adVariations.length}</span>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {plan.adVariations.map(item => (
                    <div key={item.title} style={{ border: '1px solid rgba(150, 164, 195, 0.18)', borderRadius: 12, padding: 10 }}>
                      <strong>{item.title}</strong>
                      <p>{item.copy}</p>
                      <small>{item.creativeDirection}</small>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function Grid({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="contracts-card">
      <div className="contracts-section-head">
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
  )
}
