import { useEffect, useState } from 'react'
import { Clipboard, Download, Play, RefreshCw, Save, ShieldCheck, Sparkles, X } from 'lucide-react'
import { AutoupgradePlan, AutoupgradeRecommendation, createAutoupgradePlan } from '../lib/autoupgradeKnowledge'
import { ProjectWorkspace } from '../lib/projectWorkspace'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type Props = {
  goal: string
  conversationContext: string[]
  project: ProjectWorkspace
  runtimeSummary: {
    selectedModel: string
    modelState: string
    lastResponseMode: string
    persistenceMode: string
  }
  isOwnerAdmin?: boolean
  onSaveToProject?: (plan: AutoupgradePlan) => void
  onOpenExecution?: (recommendation: AutoupgradeRecommendation) => void
  onExecuteRecommendation?: (recommendation: AutoupgradeRecommendation) => void
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

export function AutoupgradePanel({ goal, conversationContext, project, runtimeSummary, isOwnerAdmin, onSaveToProject, onOpenExecution, onExecuteRecommendation, onClear }: Props) {
  const [plan, setPlan] = useState<AutoupgradePlan>(() => createAutoupgradePlan(goal))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(1800)

  async function refresh() {
    const projectSummary = {
      name: project.name,
      files: project.files.length,
      messages: project.chatMessages.length,
      exports: project.exports.length,
      activeStudio: project.activeStudio || 'none',
      generationHistory: project.generationHistory.length,
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/autoupgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext, projectSummary, runtimeSummary }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.plan) throw new Error(data.error || 'Autoupgrade plan failed.')
      setPlan(data.plan)
      setMessage('Autoupgrade queue refreshed from current platform evidence.')
    } catch (error) {
      setPlan(createAutoupgradePlan(goal, projectSummary, runtimeSummary))
      setMessage(error instanceof Error ? error.message : 'Autoupgrade refresh failed.')
    } finally {
      setLoading(false)
      setLastRefreshed(new Date())
      setCountdown(1800)
    }
  }

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 1800000)
    return () => window.clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, project.name, project.files.length, project.chatMessages.length, project.exports.length, project.activeStudio, project.generationHistory.length, runtimeSummary.selectedModel, runtimeSummary.modelState, runtimeSummary.lastResponseMode, runtimeSummary.persistenceMode])

  useEffect(() => {
    const cd = window.setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => window.clearInterval(cd)
  }, [])

  return (
    <PremiumPanelLayout
      title="Autoupgrade Center"
      subtitle={plan.postureSummary || "Safe self-improvement queue"}
      headerActions={<button className="ghost-action" onClick={onClear} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>}
    >
      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Current posture</strong>
            <ul>{plan.platformSignals.map(item => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="contracts-card">
            <strong>Safe automation rules</strong>
            <ul>{plan.safeAutomationRules.map(item => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="contracts-card">
            <strong>Actions</strong>
            <button className="contracts-primary" onClick={refresh} disabled={loading}><RefreshCw size={15} /> {loading ? 'Refreshing...' : 'Refresh queue'}</button>
            <button onClick={() => copy(plan.report)}><Clipboard size={15} /> Copy report</button>
            <button onClick={() => download('apex-autoupgrade-plan.json', JSON.stringify(plan, null, 2))}><Download size={15} /> Export JSON</button>
            <button onClick={() => onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(226,232,240,0.6)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Last refresh: {lastRefreshed.toLocaleTimeString()}</span>
              <span>Auto-refresh in: {Math.floor(countdown / 60)}m {countdown % 60}s</span>
            </div>
          </div>
        </aside>

        <div className="contracts-main">
          {message && <div className="contracts-card"><strong>Status</strong><span>{message}</span></div>}

          <div className="contracts-card">
            <div className="contracts-section-head">
              <strong>Execution queue</strong>
              <span>{plan.executionQueue.length} ready item(ns)</span>
            </div>
            <ul>{plan.executionQueue.map(item => <li key={item}>{item}</li>)}</ul>
          </div>

          {plan.recommendations.map(item => (
            <div key={item.id} className="contracts-card">
              <div className="contracts-section-head">
                <strong>{item.title}</strong>
                <span className={`status-chip ${item.priority === 'critical' ? 'partial' : item.status === 'ready-now' ? 'ready' : 'planned'}`}>{item.priority.toUpperCase()} · {item.status}</span>
              </div>
              <p><strong>Area:</strong> {item.area}</p>
              <p><strong>Why:</strong> {item.why}</p>
              <p><strong>Action:</strong> {item.action}</p>
              <ul>{item.evidence.map(evidence => <li key={evidence}>{evidence}</li>)}</ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {item.suggestedCommand && (
                  <button type="button" onClick={() => copy(item.suggestedCommand || '')}>
                    <Clipboard size={15} /> Copy command
                  </button>
                )}
                {onOpenExecution && (
                  <button type="button" onClick={() => onOpenExecution(item)} disabled={!isOwnerAdmin || !item.requiresApproval}>
                    <Play size={15} /> Send to execution
                  </button>
                )}
                {onExecuteRecommendation && (
                  <button type="button" onClick={() => onExecuteRecommendation(item)} disabled={!isOwnerAdmin || !item.commandId || item.status !== 'ready-now'}>
                    <RefreshCw size={15} /> Run approved action
                  </button>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(226,232,240,0.72)' }}>
                  <ShieldCheck size={14} />
                  {item.requiresApproval ? 'Owner approval required' : 'Read-only recommendation'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PremiumPanelLayout>
  )
}
