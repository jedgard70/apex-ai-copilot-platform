import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  Clipboard,
  Download,
  FileJson,
  FileText,
  HardHat,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { exportFieldOpsPdf } from '../lib/fieldOpsPdfExport'
import { formatSize, IntakeFile } from '../lib/fileIntake'
import {
  FieldAcceptanceStatus,
  FieldActivity,
  FieldEvidence,
  FieldIssue,
  FieldIssueStatus,
  FieldOpsPlan,
  FieldRdoContext,
  FieldRiskLevel,
  FieldSafetyItem,
  FieldSeverity,
  defaultFieldContext,
  emptyFieldOpsPlan,
  fieldAcceptanceStatusOptions,
  fieldEvidenceOptions,
  fieldIssueStatusOptions,
  fieldRiskLevelOptions,
  fieldSeverityOptions,
} from '../lib/fieldOpsKnowledge'

type FieldOpsPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: FieldOpsPlan, context: FieldRdoContext) => Promise<string | void> | string | void
  onSendToBudget?: (summary: string) => void
  onSendToContracts?: (summary: string) => void
  onSendToDirectCut?: (summary: string) => void
  onClear: () => void
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
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

function planText(plan: FieldOpsPlan) {
  return [
    plan.rdoDraft,
    '',
    'Client summary:',
    plan.clientSummary,
    '',
    'Issues / punch list:',
    ...plan.issues.map(item => `- ${item.severity} | ${item.evidence} | ${item.location}: ${item.issue} (${item.status})`),
    '',
    'Safety report:',
    plan.safetyReport,
    '',
    'Quality punch list:',
    plan.qualityPunchList,
    '',
    'Next-day plan:',
    plan.nextDayPlan,
    '',
    `Confidence: ${plan.confidenceSummary}`,
  ].join('\n')
}

export function FieldOpsPanel({
  source,
  goal,
  conversationContext,
  onSaveToProject,
  onSendToBudget,
  onSendToContracts,
  onSendToDirectCut,
  onClear,
}: FieldOpsPanelProps) {
  const [context, setContext] = useState<FieldRdoContext>(() => ({
    ...defaultFieldContext,
    project: goal || defaultFieldContext.project,
  }))
  const [plan, setPlan] = useState<FieldOpsPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [draftActivity, setDraftActivity] = useState('Field activity performed today')
  const [draftIssue, setDraftIssue] = useState('Open field issue / punch item')
  const [draftPhotoCaption, setDraftPhotoCaption] = useState('Field photo note')

  function updateContext<K extends keyof FieldRdoContext>(key: K, value: FieldRdoContext[K]) {
    setContext(prev => ({ ...prev, [key]: value }))
  }

  function currentPlan() {
    return plan || emptyFieldOpsPlan()
  }

  async function generateReport(action: 'rdo' | 'client' | 'safety' | 'quality') {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/fieldops-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          source: source ? {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            kind: source.kind,
            dimensions: source.dimensions,
          } : null,
          goal,
          conversationContext,
          currentPlan: plan,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Field Operations planner failed.')
      setPlan(data.plan)
      setMessage(data.plan.message || 'Field report draft generated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Field Operations planner failed.')
    } finally {
      setLoading(false)
    }
  }

  function addActivity() {
    const current = currentPlan()
    const activity: FieldActivity = {
      id: id(),
      description: draftActivity || 'Field activity',
      responsibleParty: 'Field team',
      evidence: 'USER_REPORTED',
      status: 'Completed',
    }
    setPlan({ ...current, activities: [...current.activities, activity] })
    setDraftActivity('')
  }

  function updateActivity(index: number, patch: Partial<FieldActivity>) {
    const current = currentPlan()
    setPlan({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  function addIssue() {
    const current = currentPlan()
    const issue: FieldIssue = {
      id: id(),
      issue: draftIssue || 'Field issue',
      location: 'Unassigned location',
      severity: 'Medium',
      evidence: 'USER_REPORTED',
      assignedTo: 'Field team',
      dueDate: '',
      status: 'Open',
    }
    setPlan({ ...current, issues: [...current.issues, issue] })
    setDraftIssue('')
  }

  function updateIssue(index: number, patch: Partial<FieldIssue>) {
    const current = currentPlan()
    setPlan({ ...current, issues: current.issues.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  function updateSafety(index: number, patch: Partial<FieldSafetyItem>) {
    const current = currentPlan()
    setPlan({ ...current, safetyItems: current.safetyItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  function updateQuality(index: number, patch: Partial<FieldSafetyItem>) {
    const current = currentPlan()
    setPlan({ ...current, qualityItems: current.qualityItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  function addPhotoNote() {
    const current = currentPlan()
    setPlan({
      ...current,
      photoLog: [
        ...current.photoLog,
        {
          id: id(),
          fileName: source?.file.name || 'manual-photo-note',
          caption: draftPhotoCaption || 'Field photo note',
          location: 'Unassigned location',
          relatedActivity: 'General field progress',
          evidence: source?.kind === 'image' ? 'PHOTO_CONFIRMED' : 'USER_REPORTED',
        },
      ],
    })
    setDraftPhotoCaption('')
  }

  async function savePlan() {
    if (!onSaveToProject) return
    setSaving(true)
    setMessage('')
    try {
      const result = await onSaveToProject(snapshot, context)
      setMessage(result || 'Field report saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Field report save failed.')
    } finally {
      setSaving(false)
    }
  }

  const snapshot = currentPlan()

  return (
    <section className="contracts-studio fieldops-studio" aria-label="Field Operations RDO Studio" style={{ background: '#0B1221' }}>
      <div className="contracts-heading" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ color: '#6C47FF', fontSize: 18 }}>engineering</span>
            <span style={{ color: '#6C47FF', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field Operations / RDO Studio</span>
          </div>
          <h2 style={{ margin: '2px 0', fontSize: 16, fontWeight: 600, color: '#e2e2e2' }}>Daily reports, progress, quality, safety and punch list</h2>
          <p style={{ fontSize: 11, color: '#c6c6ce', margin: 0 }}>No field condition is treated as verified unless supported by photo or user-provided field data. Weather is manual unless a connector supplies it.</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Field Operations Studio" style={{ color: '#c6c6ce' }}>
          <X size={16} />
        </button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Daily Report / RDO</strong>
            <label>Date
              <input type="date" value={context.date} onChange={event => updateContext('date', event.target.value)} />
            </label>
            <label>Project
              <input value={context.project} onChange={event => updateContext('project', event.target.value)} />
            </label>
            <label>Weather
              <input value={context.weather} placeholder="Manual/user-provided only" onChange={event => updateContext('weather', event.target.value)} />
            </label>
            <label>Crew / equipe
              <textarea value={context.crew} onChange={event => updateContext('crew', event.target.value)} />
            </label>
            <label>Activities performed
              <textarea value={context.activitiesPerformed} onChange={event => updateContext('activitiesPerformed', event.target.value)} />
            </label>
            <label>Equipment
              <textarea value={context.equipment} onChange={event => updateContext('equipment', event.target.value)} />
            </label>
            <label>Materials delivered / used
              <textarea value={context.materialsDeliveredUsed} onChange={event => updateContext('materialsDeliveredUsed', event.target.value)} />
            </label>
            <label>Visitors
              <textarea value={context.visitors} onChange={event => updateContext('visitors', event.target.value)} />
            </label>
            <label>Delays
              <textarea value={context.delays} onChange={event => updateContext('delays', event.target.value)} />
            </label>
            <label>Incidents
              <textarea value={context.incidents} onChange={event => updateContext('incidents', event.target.value)} />
            </label>
            <label>Safety notes
              <textarea value={context.safetyNotes} onChange={event => updateContext('safetyNotes', event.target.value)} />
            </label>
            <label>Quality notes
              <textarea value={context.qualityNotes} onChange={event => updateContext('qualityNotes', event.target.value)} />
            </label>
          </div>

          <div className="contracts-card">
            <strong>Source photo / field file</strong>
            {source ? (
              <div className="contracts-source">
                <Camera size={18} />
                <div>
                  <span>{source.file.name}</span>
                  <small>{source.kind} · {formatSize(source.file.size)}</small>
                </div>
              </div>
            ) : (
              <p>No field photo attached. Apex will label field content as USER_REPORTED or UNKNOWN.</p>
            )}
            <button className="contracts-primary" type="button" onClick={() => generateReport('rdo')} disabled={loading}><HardHat size={16} /> Generate RDO</button>
            <button type="button" onClick={() => generateReport('client')} disabled={loading}><Clipboard size={16} /> Generate client report</button>
            <button type="button" onClick={() => generateReport('safety')} disabled={loading}><ShieldCheck size={16} /> Generate safety report</button>
            <button type="button" onClick={() => generateReport('quality')} disabled={loading}><AlertTriangle size={16} /> Generate quality checklist</button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>Quick add</strong>
            <input value={draftActivity} onChange={event => setDraftActivity(event.target.value)} />
            <button type="button" onClick={addActivity}><Plus size={15} /> Add activity</button>
            <input value={draftIssue} onChange={event => setDraftIssue(event.target.value)} />
            <button type="button" onClick={addIssue}><Plus size={15} /> Add issue</button>
            <input value={draftPhotoCaption} onChange={event => setDraftPhotoCaption(event.target.value)} />
            <button type="button" onClick={addPhotoNote}><Plus size={15} /> Add photo note</button>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div>
              <span>Provider status</span>
              <strong>{snapshot.providerStatus}</strong>
              <p>{snapshot.confidenceSummary}</p>
            </div>
            <div>
              <span>Evidence rule</span>
              <strong>PHOTO_CONFIRMED / USER_REPORTED / ASSUMPTION / UNKNOWN</strong>
              <p>No fake weather and no fake inspection approval.</p>
            </div>
          </div>

          <div className="contracts-card">
            <div className="contracts-section-head">
              <strong>RDO / Daily Report</strong>
              <button type="button" onClick={() => copyText(snapshot.rdoDraft)}><Clipboard size={14} /> Copy</button>
            </div>
            <pre className="contracts-draft">{snapshot.rdoDraft}</pre>
          </div>

          <div className="contracts-grid">
            <OutputBlock title="Client progress report" text={snapshot.clientSummary} />
            <OutputBlock title="Internal field report" text={snapshot.internalFieldReport} />
            <OutputBlock title="Safety report" text={snapshot.safetyReport} />
            <OutputBlock title="Quality punch list" text={snapshot.qualityPunchList} />
            <OutputBlock title="Materials log" text={snapshot.materialsLog} />
            <OutputBlock title="Next-day plan" text={snapshot.nextDayPlan} />
          </div>

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Progress / activities</strong>
              <span>{snapshot.activities.length} activities</span>
            </div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Responsible</th>
                    <th>Evidence</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.activities.map((item, index) => (
                    <tr key={item.id}>
                      <td><input value={item.description} onChange={event => updateActivity(index, { description: event.target.value })} /></td>
                      <td><input value={item.responsibleParty} onChange={event => updateActivity(index, { responsibleParty: event.target.value })} /></td>
                      <td><EvidenceSelect value={item.evidence} onChange={value => updateActivity(index, { evidence: value })} /></td>
                      <td>
                        <select value={item.status} onChange={event => updateActivity(index, { status: event.target.value as FieldActivity['status'] })}>
                          {['Planned', 'In Progress', 'Completed', 'Blocked'].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td><button type="button" onClick={() => setPlan({ ...snapshot, activities: snapshot.activities.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                  {!snapshot.activities.length && <tr><td colSpan={5}>No activities yet. Generate RDO or add an activity manually.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Issues / punch list</strong>
              <span>{snapshot.issues.length} issues</span>
            </div>
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Location</th>
                    <th>Severity</th>
                    <th>Evidence</th>
                    <th>Assigned</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.issues.map((item, index) => (
                    <tr key={item.id}>
                      <td><input value={item.issue} onChange={event => updateIssue(index, { issue: event.target.value })} /></td>
                      <td><input value={item.location} onChange={event => updateIssue(index, { location: event.target.value })} /></td>
                      <td><SeveritySelect value={item.severity} onChange={value => updateIssue(index, { severity: value })} /></td>
                      <td><EvidenceSelect value={item.evidence} onChange={value => updateIssue(index, { evidence: value })} /></td>
                      <td><input value={item.assignedTo} onChange={event => updateIssue(index, { assignedTo: event.target.value })} /></td>
                      <td><input type="date" value={item.dueDate} onChange={event => updateIssue(index, { dueDate: event.target.value })} /></td>
                      <td>
                        <select value={item.status} onChange={event => updateIssue(index, { status: event.target.value as FieldIssueStatus })}>
                          {fieldIssueStatusOptions.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td><button type="button" onClick={() => setPlan({ ...snapshot, issues: snapshot.issues.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                  {!snapshot.issues.length && <tr><td colSpan={8}>No issues yet. Add field issues or generate a quality/safety report.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-grid">
            <ChecklistTable
              title="Safety checklist"
              items={snapshot.safetyItems}
              onUpdate={updateSafety}
              type="safety"
            />
            <ChecklistTable
              title="Quality checklist"
              items={snapshot.qualityItems}
              onUpdate={updateQuality}
              type="quality"
            />
          </div>

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Photo log</strong>
              <span>{snapshot.photoLog.length} photos/notes</span>
            </div>
            {source?.kind === 'image' && source.url && (
              <div className="fieldops-photo-preview">
                <img src={source.url} alt={source.file.name} />
              </div>
            )}
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Caption</th>
                    <th>Location</th>
                    <th>Related activity</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.photoLog.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item.fileName}</td>
                      <td><input value={item.caption} onChange={event => setPlan({ ...snapshot, photoLog: snapshot.photoLog.map((photo, itemIndex) => itemIndex === index ? { ...photo, caption: event.target.value } : photo) })} /></td>
                      <td><input value={item.location} onChange={event => setPlan({ ...snapshot, photoLog: snapshot.photoLog.map((photo, itemIndex) => itemIndex === index ? { ...photo, location: event.target.value } : photo) })} /></td>
                      <td><input value={item.relatedActivity} onChange={event => setPlan({ ...snapshot, photoLog: snapshot.photoLog.map((photo, itemIndex) => itemIndex === index ? { ...photo, relatedActivity: event.target.value } : photo) })} /></td>
                      <td><EvidenceSelect value={item.evidence} onChange={value => setPlan({ ...snapshot, photoLog: snapshot.photoLog.map((photo, itemIndex) => itemIndex === index ? { ...photo, evidence: value } : photo) })} /></td>
                    </tr>
                  ))}
                  {!snapshot.photoLog.length && <tr><td colSpan={5}>No photo notes yet. Add a note from the uploaded image or field observation.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="contracts-actions">
            <button type="button" onClick={() => downloadTextFile('apex-field-rdo.json', JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8')}><FileJson size={15} /> Export RDO JSON</button>
            <button type="button" onClick={() => exportFieldOpsPdf(snapshot, context)}><FileText size={15} /> Export RDO PDF</button>
            <button type="button" onClick={() => copyText(planText(snapshot))}><Clipboard size={15} /> Copy RDO text</button>
            <button type="button" onClick={savePlan} disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save to Project Workspace'}</button>
            <button type="button" onClick={() => onSendToBudget?.(snapshot.nextDayPlan || snapshot.clientSummary)}><Send size={15} /> Send blockers to Budget</button>
            <button type="button" onClick={() => onSendToContracts?.(snapshot.qualityPunchList || snapshot.internalFieldReport)}><Send size={15} /> Send contract issue to Contracts</button>
            <button type="button" onClick={() => onSendToDirectCut?.(snapshot.clientSummary || snapshot.rdoDraft)}><Download size={15} /> Send progress to DirectCut</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function EvidenceSelect({ value, onChange }: { value: FieldEvidence; onChange: (value: FieldEvidence) => void }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value as FieldEvidence)}>
      {fieldEvidenceOptions.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

function SeveritySelect({ value, onChange }: { value: FieldSeverity; onChange: (value: FieldSeverity) => void }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value as FieldSeverity)}>
      {fieldSeverityOptions.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

function ChecklistTable({
  title,
  items,
  onUpdate,
  type,
}: {
  title: string
  items: Array<FieldSafetyItem>
  onUpdate: (index: number, patch: Partial<FieldSafetyItem>) => void
  type: 'safety' | 'quality'
}) {
  return (
    <div className="contracts-card contracts-table-card">
      <div className="contracts-section-head">
        <strong>{title}</strong>
        <span>{items.length} checks</span>
      </div>
      <div className="contracts-table-wrap">
        <table className="contracts-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Status</th>
              {type === 'safety' && <th>Risk</th>}
              <th>Evidence</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td><input value={item.item} onChange={event => onUpdate(index, { item: event.target.value })} /></td>
                <td>
                  <select value={item.status} onChange={event => onUpdate(index, { status: event.target.value as FieldAcceptanceStatus })}>
                    {fieldAcceptanceStatusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </td>
                {type === 'safety' && (
                  <td>
                    <select value={item.riskLevel} onChange={event => onUpdate(index, { riskLevel: event.target.value as FieldRiskLevel })}>
                      {fieldRiskLevelOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                )}
                <td><EvidenceSelect value={item.evidence} onChange={value => onUpdate(index, { evidence: value })} /></td>
                <td><input value={item.notes} onChange={event => onUpdate(index, { notes: event.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OutputBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="contracts-card">
      <div className="contracts-section-head">
        <strong>{title}</strong>
        <button type="button" onClick={() => copyText(text)} disabled={!text}>
          <Clipboard size={14} /> Copy
        </button>
      </div>
      <pre className="contracts-draft">{text || 'Generate a Field Operations report first.'}</pre>
    </div>
  )
}
