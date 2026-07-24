import { useState } from 'react'
import { Clipboard, Download, FileJson, PackageCheck, Save, X, FileArchive } from 'lucide-react'
import JSZip from 'jszip'
import { ProjectWorkspace } from '../lib/projectWorkspace'
import { ProjectPackagePlan } from '../lib/projectPackageKnowledge'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type ProjectPackagePanelProps = {
  project: ProjectWorkspace
  goal: string
  conversationContext: string[]
  onSaveToProject?: (payload: ProjectPackagePlan) => void
  onRecordGeneration?: (payload: ProjectPackagePlan) => void
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

function packageText(plan: ProjectPackagePlan) {
  return [
    `Project package status: ${plan.packageStatus}`,
    '',
    'Executive summary:',
    plan.executiveSummary,
    '',
    'Design review:',
    plan.outputs.designReview,
    '',
    'Board package:',
    plan.outputs.boardPackage,
    '',
    'Quantity and budget:',
    plan.outputs.quantityAndBudget,
    '',
    'Client presentation:',
    plan.outputs.clientPresentation,
    '',
    'Execution documents:',
    plan.outputs.executionDocs,
    '',
    'Contract and finance:',
    plan.outputs.contractAndFinance,
    '',
    'Physical-financial schedule:',
    plan.outputs.physicalFinancialSchedule,
    '',
    'Missing inputs:',
    ...plan.missingInputs.map(item => `- ${item}`),
    '',
    'Next actions:',
    ...plan.nextActions.map(item => `- ${item}`),
  ].join('\n')
}

function buildProjectPackageRequestProject(project: ProjectWorkspace) {
  return {
    id: project.id,
    name: project.name,
    projectProfile: project.projectProfile || null,
    projectMemory: Array.isArray(project.projectMemory) ? project.projectMemory.slice(-10) : [],
    files: project.files.map(file => ({
      id: file.id,
      name: file.name,
      kind: file.kind,
      type: file.type,
      size: file.size,
      pageCount: file.pageCount,
    })),
    exports: Array.isArray(project.exports) ? project.exports : [],
  }
}

export function ProjectPackagePanel({ project, goal, conversationContext, onSaveToProject, onRecordGeneration, onClear }: ProjectPackagePanelProps) {
  const [plan, setPlan] = useState<ProjectPackagePlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generatePackage() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/project-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: buildProjectPackageRequestProject(project), goal, conversationContext }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Project package pipeline failed.')
      setPlan(data.plan)
      setMessage(data.plan?.message || 'Project package updated.')
      onRecordGeneration?.(data.plan)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Project package pipeline failed.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadZipPackage() {
    if (!plan) return
    const zip = new JSZip()
    
    // Add summary
    zip.file('apex-project-package.txt', packageText(plan))
    zip.file('apex-project-package.json', JSON.stringify(plan, null, 2))
    
    // Add raw exports
    const exportsFolder = zip.folder('Exports')
    if (exportsFolder && Array.isArray(project.exports)) {
      project.exports.forEach((exp: any, index: number) => {
        if (!exp) return
        const type = exp.type || 'unknown'
        const timestamp = exp.timestamp ? exp.timestamp.replace(/:/g, '-') : `item-${index}`
        let content = ''
        let ext = 'json'
        
        if (exp.plan) {
          content = JSON.stringify(exp.plan, null, 2)
        } else if (exp.text) {
          content = exp.text
          ext = 'txt'
        } else if (exp.markdown) {
          content = exp.markdown
          ext = 'md'
        } else {
          content = JSON.stringify(exp, null, 2)
        }
        
        exportsFolder.file(`${type}_${timestamp}.${ext}`, content)
      })
    }
    
    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `apex-package-${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <PremiumPanelLayout
      title="Complete delivery bundle"
      subtitle="Builds a real package plan from briefing, files and saved studio outputs already present in Apex."
      headerActions={
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Project Package Pipeline">
          <X size={16} />
        </button>
      }
    >
      <div className="contracts-studio" style={{ flex: 1, padding: 0, background: 'transparent' }}>
      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Pipeline goal</strong>
            <p>{goal || 'Complete project delivery package'}</p>
            <p>{project.name}</p>
            <p>{project.files.length} files · {project.exports.length} saved exports · {project.projectMemory.length} memory items</p>
            <button className="contracts-primary" type="button" onClick={generatePackage} disabled={loading}>
              <PackageCheck size={16} /> {loading ? 'Building package...' : 'Generate package'}
            </button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>Current workspace evidence</strong>
            <ul>
              <li>Client: {project.projectProfile?.clientName || 'not set'}</li>
              <li>Project type: {project.projectProfile?.projectType || 'not set'}</li>
              <li>Briefing: {project.projectProfile?.brief ? 'saved' : 'missing'}</li>
              <li>Budget exports: {project.exports.filter(item => item && typeof item === 'object' && (item as { type?: string }).type === 'budget-estimate').length}</li>
              <li>Contracts exports: {project.exports.filter(item => item && typeof item === 'object' && (item as { type?: string }).type === 'contracts-permits-review').length}</li>
              <li>Research exports: {project.exports.filter(item => item && typeof item === 'object' && (item as { type?: string }).type === 'research-market-intelligence').length}</li>
            </ul>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div>
              <span>Package status</span>
              <strong>{plan?.packageStatus || 'waiting'}</strong>
              <p>{plan?.executiveSummary || 'Generate the package to see the complete delivery bundle status.'}</p>
            </div>
            <div>
              <span>Provider status</span>
              <strong>{plan?.providerStatus || 'package-draft'}</strong>
              <p>{plan ? `${plan.artifacts.length} deliverable tracks evaluated from current project evidence.` : 'No package run yet.'}</p>
            </div>
          </div>

          {plan && (
            <>
              <div className="contracts-grid">
                {plan.artifacts.map(item => (
                  <div className="contracts-card" key={item.id}>
                    <strong>{item.title}</strong>
                    <p><strong>Status:</strong> {item.status}</p>
                    <p>{item.summary}</p>
                    <ul>
                      {item.evidence.map(entry => <li key={entry}>{entry}</li>)}
                    </ul>
                    <p><strong>Next:</strong> {item.nextAction}</p>
                  </div>
                ))}
              </div>

              <div className="contracts-card">
                <div className="contracts-section-head">
                  <strong>Package preview</strong>
                  <span>{plan.projectName}</span>
                </div>
                <pre className="contracts-draft">{packageText(plan)}</pre>
              </div>

              <div className="contracts-actions">
                <button type="button" onClick={() => copyText(packageText(plan))}><Clipboard size={15} /> Copy package text</button>
                <button type="button" onClick={() => downloadTextFile('apex-project-package.txt', packageText(plan))}><Download size={15} /> Export TXT</button>
                <button type="button" onClick={() => downloadTextFile('apex-project-package.json', JSON.stringify(plan, null, 2), 'application/json;charset=utf-8')}><FileJson size={15} /> Export JSON</button>
                <button type="button" onClick={downloadZipPackage}><FileArchive size={15} /> Export ZIP Bundle</button>
                <button type="button" onClick={() => onSaveToProject?.(plan)}><Save size={15} /> Save to Project Workspace</button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </PremiumPanelLayout>
  )
}
