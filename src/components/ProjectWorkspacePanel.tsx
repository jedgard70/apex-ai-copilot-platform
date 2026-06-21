import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Download, FolderOpen, Import, Plus, Save, Trash2 } from 'lucide-react'
import { projectProfileToDraft, ProjectProfileDraft, ProjectWorkspace } from '../lib/projectWorkspace'

type ProjectSummary = {
  files: number
  chatMessages: number
  archVisOutputs: number
  directCutPlans: number
  bim3dItems: number
  generatedImages: number
  tours: number
  constraints: number
  projectMemory: number
  skillUpdates: number
  preferences: number
  suppliers: number
  procurementItems: number
  alerts: number
  aiCostRecords: number
  tenants: number
  knowledgeItems: number
  metricsRecords: number
  executionRuns: number
}

type ProjectWorkspacePanelProps = {
  project: ProjectWorkspace
  projects: ProjectWorkspace[]
  summary: ProjectSummary
  onUpdateProfile: (profile: ProjectProfileDraft) => void
  onRename: (name: string) => void
  onNewProject: () => void
  onSwitchProject: (projectId: string) => void
  onSaveNow: () => void
  onExport: () => void
  onImport: (raw: string) => void
  onClear: () => void
  onSyncRemote?: () => Promise<string> | string
  openSignal?: string
}

export function ProjectWorkspacePanel({
  project,
  projects,
  summary,
  onUpdateProfile,
  onRename,
  onNewProject,
  onSwitchProject,
  onSaveNow,
  onExport,
  onImport,
  onClear,
  onSyncRemote,
  openSignal,
}: ProjectWorkspacePanelProps) {
  const importInput = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState(project.name)
  const [open, setOpen] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [syncStatus, setSyncStatus] = useState('')
  const [profileDraft, setProfileDraft] = useState<ProjectProfileDraft>(() => projectProfileToDraft(project.projectProfile))

  useEffect(() => {
    if (openSignal) setOpen(true)
  }, [openSignal])

  useEffect(() => {
    setName(project.name)
  }, [project.name])

  useEffect(() => {
    setProfileDraft(projectProfileToDraft(project.projectProfile))
  }, [project.projectProfile, project.id])

  function updateProfileField(field: keyof ProjectProfileDraft, value: string) {
    setProfileDraft(prev => ({ ...prev, [field]: value }))
  }

  function applyProfile() {
    onUpdateProfile(profileDraft)
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(String(reader.result || ''))
        setImportStatus(`Imported ${file.name}`)
      } catch (error) {
        setImportStatus(error instanceof Error ? error.message : 'Import failed. Check the project JSON.')
      }
    }
    reader.onerror = () => setImportStatus('Import failed. The file could not be read.')
    reader.readAsText(file)
    event.currentTarget.value = ''
  }

  return (
    <section className="project-workspace-panel" aria-label="Project Workspace">
      <button className="project-workspace-toggle" type="button" onClick={() => setOpen(value => !value)}>
        <FolderOpen size={17} />
        <span>{project.name}</span>
        <small>{summary.files} files · {summary.chatMessages} messages</small>
      </button>

      {open && (
        <div className="project-workspace-body">
          <div className="project-workspace-head">
            <div>
              <span>Project Workspace</span>
              <strong>{project.name}</strong>
            </div>
            <button type="button" onClick={onNewProject}><Plus size={15} /> New</button>
          </div>

          <label className="project-field">
            <span>Current project name</span>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              onBlur={() => onRename(name.trim() || project.name)}
              onKeyDown={event => {
                if (event.key === 'Enter') onRename(name.trim() || project.name)
              }}
            />
          </label>

          <label className="project-field">
            <span>Project list</span>
            <select value={project.id} onChange={event => onSwitchProject(event.target.value)}>
              {projects.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <div className="project-summary-grid">
            <div><strong>{summary.files}</strong><span>files</span></div>
            <div><strong>{summary.chatMessages}</strong><span>chat</span></div>
            <div><strong>{summary.archVisOutputs}</strong><span>ArchVis</span></div>
            <div><strong>{summary.directCutPlans}</strong><span>DirectCut</span></div>
            <div><strong>{summary.bim3dItems}</strong><span>BIM/3D</span></div>
            <div><strong>{summary.generatedImages}</strong><span>images</span></div>
            <div><strong>{summary.tours}</strong><span>tours</span></div>
            <div><strong>{summary.constraints}</strong><span>constraints</span></div>
            <div><strong>{summary.projectMemory}</strong><span>memory</span></div>
            <div><strong>{summary.skillUpdates}</strong><span>skills</span></div>
            <div><strong>{summary.preferences}</strong><span>prefs</span></div>
            <div><strong>{summary.suppliers}</strong><span>suppliers</span></div>
            <div><strong>{summary.procurementItems}</strong><span>procure</span></div>
            <div><strong>{summary.alerts}</strong><span>alerts</span></div>
            <div><strong>{summary.aiCostRecords}</strong><span>AI cost</span></div>
            <div><strong>{summary.tenants}</strong><span>tenants</span></div>
            <div><strong>{summary.knowledgeItems}</strong><span>KB</span></div>
            <div><strong>{summary.metricsRecords}</strong><span>metrics</span></div>
            <div><strong>{summary.executionRuns}</strong><span>runs</span></div>
          </div>

          <div className="project-profile-card">
          <div className="project-profile-head">
            <div>
              <strong>Persistent project memory</strong>
              <p>This context is saved with the workspace and sent to Apex chat automatically.</p>
            </div>
            <button type="button" onClick={applyProfile}>
              <Save size={15} /> Save memory
            </button>
          </div>

          <div className="project-profile-grid">
            <label className="project-field">
              <span>Client / account name</span>
              <input
                value={profileDraft.clientName}
                onChange={event => updateProfileField('clientName', event.target.value)}
                onBlur={applyProfile}
                placeholder="Client, builder, developer or internal owner"
              />
            </label>

            <label className="project-field">
              <span>Project type</span>
              <input
                value={profileDraft.projectType}
                onChange={event => updateProfileField('projectType', event.target.value)}
                onBlur={applyProfile}
                placeholder="Facade, condominium house, tower, campaign, proposal..."
              />
            </label>

            <label className="project-field project-field-wide">
              <span>Project briefing</span>
              <textarea
                value={profileDraft.brief}
                onChange={event => updateProfileField('brief', event.target.value)}
                onBlur={applyProfile}
                placeholder="Main scope, location, target client, goals, room program, approval needs..."
              />
            </label>

            <label className="project-field">
              <span>Visual / technical style</span>
              <textarea
                value={profileDraft.styleNotes}
                onChange={event => updateProfileField('styleNotes', event.target.value)}
                onBlur={applyProfile}
                placeholder="Contemporary, brutalist, warm wood, minimalist interiors, technical BIM review..."
              />
            </label>

            <label className="project-field">
              <span>Branding / stamp notes</span>
              <textarea
                value={profileDraft.brandingNotes}
                onChange={event => updateProfileField('brandingNotes', event.target.value)}
                onBlur={applyProfile}
                placeholder="Board title block, brand colors, approval deck tone, signature block..."
              />
            </label>

            <label className="project-field">
              <span>Preferred outputs</span>
              <textarea
                value={profileDraft.preferredOutputs}
                onChange={event => updateProfileField('preferredOutputs', event.target.value)}
                onBlur={applyProfile}
                placeholder="Boards, cuts, budget, video, social media ads, contract pack, timeline..."
              />
            </label>

            <label className="project-field">
              <span>Locked constraints</span>
              <textarea
                value={profileDraft.lockedConstraints}
                onChange={event => updateProfileField('lockedConstraints', event.target.value)}
                onBlur={applyProfile}
                placeholder="Items Apex must preserve across revisions and generations"
              />
            </label>
          </div>
          </div>

          <div className="project-actions">
          <button type="button" onClick={onSaveNow}><Save size={15} /> Save now</button>
            {onSyncRemote && (
              <button
                type="button"
                onClick={async () => {
                  setSyncStatus('Syncing current project to Supabase...')
                  const message = await onSyncRemote()
                  setSyncStatus(message)
                }}
              >
                <Save size={15} /> Sync to Supabase
              </button>
            )}
            <button type="button" onClick={onExport}><Download size={15} /> Export JSON</button>
            <button type="button" onClick={() => importInput.current?.click()}><Import size={15} /> Import JSON</button>
            <button type="button" onClick={onClear}><Trash2 size={15} /> Clear local</button>
          </div>
          <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
          {importStatus && <p className="project-import-status">{importStatus}</p>}
          {syncStatus && <p className="project-import-status">{syncStatus}</p>}

          <p className="project-note">
            Hybrid workspace. LocalStorage remains available; Supabase sync uses only the signed-in user's browser session and RLS.
          </p>
        </div>
      )}
    </section>
  )
}
