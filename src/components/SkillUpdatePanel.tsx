import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Brain, Check, FileText, ShieldCheck, X } from 'lucide-react'
import {
  buildProjectMemoryUpdate,
  classifySkillUpdateStorageLayer,
  buildSkillUpdatePayload,
  isSkillUpdateSupported,
  ProjectMemoryUpdate,
  SkillUpdateAnalysis,
  SkillUpdateApplyResult,
} from '../lib/skillUpdateEngine'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type SkillUpdatePanelProps = {
  source?: IntakeFile
  openSignal?: string
  autoAnalyzeSignal?: string
  autoApplyProjectMemory?: boolean
  autoApplyGlobal?: boolean
  onApproveProjectMemory: (update: ProjectMemoryUpdate) => void
  onAppliedGlobal: (result: SkillUpdateApplyResult) => void
  onClose: () => void
}

export function SkillUpdatePanel({
  source,
  openSignal,
  autoAnalyzeSignal,
  autoApplyProjectMemory,
  autoApplyGlobal,
  onApproveProjectMemory,
  onAppliedGlobal,
  onClose,
}: SkillUpdatePanelProps) {
  const [open, setOpen] = useState(Boolean(openSignal))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<SkillUpdateAnalysis | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [applyResult, setApplyResult] = useState<SkillUpdateApplyResult | null>(null)
  const [autoHandledSignal, setAutoHandledSignal] = useState('')

  const supported = useMemo(() => source ? isSkillUpdateSupported(source.file.name) : false, [source])
  const storageLayer = useMemo(() => {
    if (!source) return 'project-memory' as const
    return classifySkillUpdateStorageLayer(source.file.name, source.sourcePath || source.file.webkitRelativePath || '')
  }, [source])

  useEffect(() => {
    if (openSignal) {
      setOpen(true)
      setApplyResult(null)
    }
  }, [openSignal])

  useEffect(() => {
    setAnalysis(null)
    setEditedContent('')
    setError('')
    setApplyResult(null)
    setAutoHandledSignal('')
  }, [source?.file.name, source?.file.size])

  useEffect(() => {
    if (!source || !supported || !autoAnalyzeSignal) return
    if (autoHandledSignal === autoAnalyzeSignal) return
    setAutoHandledSignal(autoAnalyzeSignal)
    void analyze()
  }, [source, supported, autoAnalyzeSignal, autoHandledSignal])

  useEffect(() => {
    if (!analysis || !autoApplyProjectMemory) return
    if (analysis.riskLevel === 'high') return
    if (applyResult?.approvalType === 'project-memory') return
    approveProjectMemory()
  }, [analysis, autoApplyProjectMemory])

  useEffect(() => {
    if (!analysis || !autoApplyGlobal) return
    if (analysis.riskLevel === 'high') return
    if (applyResult?.approvalType === 'global-skill-update') return
    void approveGlobalUpdate()
  }, [analysis, autoApplyGlobal])

  async function analyze() {
    if (!source || !supported) return
    setLoading(true)
    setError('')
    setApplyResult(null)
    try {
      const payload = await buildSkillUpdatePayload(source.file)
      const response = await fetch('/api/copilot/analyze-skill-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: payload }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not analyze skill update.')
      setAnalysis(data.analysis)
      setEditedContent(data.analysis?.sanitizedText || data.analysis?.additions?.join('\n') || '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not analyze skill update.')
    } finally {
      setLoading(false)
    }
  }

  function approveProjectMemory() {
    if (!analysis) return
    const update = buildProjectMemoryUpdate(analysis, editedContent)
    onApproveProjectMemory(update)
      setApplyResult({
        updateId: update.updateId,
        timestamp: update.timestamp,
        approvalType: 'project-memory',
        sourceFilename: update.sourceFilename,
        summary: update.summary,
        targetDomain: update.targetDomain,
        affectedFiles: ['localStorage: active Project Workspace memory'],
        storageTargets: ['Project Workspace localStorage', `Layer: ${storageLayer}`],
        rollbackNote: 'Remove this memory item from the active Project Workspace.',
        applied: true,
      })
  }

  async function approveGlobalUpdate() {
    if (!analysis) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/copilot/apply-skill-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          editedContent,
          approvalType: 'global-skill-update',
          ownerApproved: true,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not apply global skill update.')
      setApplyResult(data.result)
      onAppliedGlobal(data.result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not apply global skill update.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <section className="skill-update-panel compact">
        <button type="button" onClick={() => setOpen(true)}>
          <Brain size={17} />
          Skill update
        </button>
      </section>
    )
  }

  return (
    <section className="skill-update-panel" aria-label="Skill Update Panel">
      <div className="skill-update-head">
        <div>
          <span>Owner approval required</span>
          <h2>Skill Update Panel</h2>
        </div>
        <button type="button" onClick={() => { setOpen(false); onClose() }} aria-label="Close skill update">
          <X size={16} />
        </button>
      </div>

      {!source && (
        <div className="skill-update-empty">
          <FileText size={32} />
          <strong>Upload a TXT, MD, JSON, PDF, PY, JS, TS, TSX or ZIP file first.</strong>
          <p>Apex will analyze the file and show exactly what it recommends before changing memory or skills.</p>
        </div>
      )}

      {source && (
        <div className="skill-update-source">
          <FileText size={20} />
          <div>
            <strong>{source.file.name}</strong>
            <span>{source.sourcePath || source.file.webkitRelativePath || source.file.type || 'unknown type'} · {formatSize(source.file.size)}</span>
          </div>
        </div>
      )}

      {source && !supported && (
        <div className="skill-update-warning">
          <AlertTriangle size={18} />
          <span>This file type is not supported for skill updates. Upload TXT, MD, JSON, PDF, PY, JS, TS, TSX or ZIP.</span>
        </div>
      )}

      {source && supported && !analysis && (
        <button className="skill-update-primary" type="button" onClick={analyze} disabled={loading}>
          <ShieldCheck size={17} />
          {loading ? 'Analyzing safely...' : 'Analyze before updating'}
        </button>
      )}

      {source && supported && (
        <div className="skill-update-summary">
          <span>Layer</span>
          <strong>{storageLayer}</strong>
          <small>{storageLayer === 'trusted' ? 'Auto-global trusted source' : storageLayer === 'global-skill' ? 'Auto-global skills folder source' : 'Project memory source'}</small>
        </div>
      )}

      {error && <div className="skill-update-error">{error}</div>}

      {analysis && (
        <div className="skill-update-preview">
          <div className="skill-update-summary">
            <span>{analysis.category}</span>
            <strong>{analysis.summary}</strong>
            <small>Target: {analysis.targetDomain} · Risk: {analysis.riskLevel}</small>
          </div>

          <PreviewList title="What Apex understood" items={analysis.understood} />
          <PreviewList title="Would add" items={analysis.additions} />
          <PreviewList title="Would update" items={analysis.updates} />
          <PreviewList title="Would ignore" items={analysis.ignored} />
          <PreviewList title="Risk / conflict warnings" items={[...analysis.warnings, ...analysis.conflicts, ...analysis.duplicates]} />

          <label className="skill-update-editor">
            <span>Edit before applying</span>
            <textarea value={editedContent} onChange={event => setEditedContent(event.target.value)} />
          </label>

          <div className="skill-update-actions">
            <button type="button" onClick={approveProjectMemory} disabled={loading}>
              <Check size={15} />
              Approve as project memory
            </button>
            <button type="button" onClick={approveGlobalUpdate} disabled={loading || analysis.riskLevel === 'high'}>
              <Brain size={15} />
              Approve as global skill update
            </button>
            <button type="button" onClick={() => setAnalysis(null)} disabled={loading}>
              Reject
            </button>
          </div>

          {analysis.riskLevel === 'high' && (
            <div className="skill-update-warning">
              <AlertTriangle size={18} />
              <span>High-risk updates are blocked from global application. Save as project memory only after review, or reject.</span>
            </div>
          )}
        </div>
      )}

      {applyResult && (
        <div className="skill-update-result">
          <strong>Applied: {applyResult.approvalType}</strong>
          <span>{applyResult.summary}</span>
          <small>Affected: {applyResult.affectedFiles.join(', ')}</small>
          <small>Saved to: {applyResult.storageTargets.join(' · ')}</small>
        </div>
      )}
    </section>
  )
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="skill-update-list">
      <strong>{title}</strong>
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}
