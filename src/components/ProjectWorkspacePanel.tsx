import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Download, FolderOpen, Import, Plus, Save, Trash2 } from 'lucide-react'
import { ProjectWorkspace } from '../lib/projectWorkspace'

type ProjectSummary = {
  files: number
  chatMessages: number
  archVisOutputs: number
  directCutPlans: number
  bim3dItems: number
  generatedImages: number
  tours: number
  constraints: number
  skillUpdates: number
  preferences: number
  suppliers: number
  procurementItems: number
  alerts: number
  aiCostRecords: number
  tenants: number
  knowledgeItems: number
  metricsRecords: number
}

type ProjectWorkspacePanelProps = {
  project: ProjectWorkspace
  projects: ProjectWorkspace[]
  summary: ProjectSummary
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

  useEffect(() => {
    if (openSignal) setOpen(true)
  }, [openSignal])

  useEffect(() => {
    setName(project.name)
  }, [project.name])

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
            <div><strong>{summary.skillUpdates}</strong><span>skills</span></div>
            <div><strong>{summary.preferences}</strong><span>prefs</span></div>
            <div><strong>{summary.suppliers}</strong><span>suppliers</span></div>
            <div><strong>{summary.procurementItems}</strong><span>procure</span></div>
            <div><strong>{summary.alerts}</strong><span>alerts</span></div>
            <div><strong>{summary.aiCostRecords}</strong><span>AI cost</span></div>
            <div><strong>{summary.tenants}</strong><span>tenants</span></div>
            <div><strong>{summary.knowledgeItems}</strong><span>KB</span></div>
            <div><strong>{summary.metricsRecords}</strong><span>metrics</span></div>
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
