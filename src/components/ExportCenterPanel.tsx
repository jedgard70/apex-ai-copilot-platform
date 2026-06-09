import { useState } from 'react'
import { Clipboard, Download, FileArchive, FileJson, PackageCheck, X } from 'lucide-react'
import { ProjectWorkspace } from '../lib/projectWorkspace'
import {
  ExportFormat,
  ExportPackageResult,
  ExportScope,
  copyExportFile,
  downloadExportFile,
  exportFormats,
  exportScopes,
  exportSections,
} from '../lib/exportCenter'

type ExportCenterPanelProps = {
  project: ProjectWorkspace
  onClear: () => void
}

export function ExportCenterPanel({ project, onClear }: ExportCenterPanelProps) {
  const [exportScope, setExportScope] = useState<ExportScope>('full-project')
  const [format, setFormat] = useState<ExportFormat>('json')
  const [includeImages, setIncludeImages] = useState(false)
  const [includeChat, setIncludeChat] = useState(true)
  const [selectedSections, setSelectedSections] = useState<string[]>(exportSections)
  const [result, setResult] = useState<ExportPackageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function toggleSection(section: string) {
    setSelectedSections(prev => prev.includes(section)
      ? prev.filter(item => item !== section)
      : [...prev, section])
  }

  async function generatePackage() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/export-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          exportScope,
          format,
          includeImages,
          includeChat,
          selectedSections,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Export package failed.')
      setResult(data)
      setMessage(`Export ready: ${data.files?.length || 0} file(s).`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export package failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="contracts-studio export-center-studio" aria-label="Export Center">
      <div className="contracts-heading">
        <div>
          <span>Export Center</span>
          <h2>Package project outputs safely</h2>
          <p>Exports only data already present in the local Project Workspace. Secrets are redacted and no fake files are generated.</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close Export Center">
          <X size={16} />
        </button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Export setup</strong>
            <label>Export scope
              <select value={exportScope} onChange={event => setExportScope(event.target.value as ExportScope)}>
                {exportScopes.map(scope => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
              </select>
            </label>
            <label>Export format
              <select value={format} onChange={event => setFormat(event.target.value as ExportFormat)}>
                {exportFormats.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="export-checkbox">
              <input type="checkbox" checked={includeImages} onChange={event => setIncludeImages(event.target.checked)} />
              <span>Include image/dataUrl assets when present</span>
            </label>
            <label className="export-checkbox">
              <input type="checkbox" checked={includeChat} onChange={event => setIncludeChat(event.target.checked)} />
              <span>Include chat messages</span>
            </label>
            <button className="contracts-primary" type="button" onClick={generatePackage} disabled={loading}>
              <PackageCheck size={16} /> Generate export package
            </button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>Selected sections</strong>
            <div className="export-section-list">
              {exportSections.map(section => (
                <label key={section} className="export-checkbox">
                  <input type="checkbox" checked={selectedSections.includes(section)} onChange={() => toggleSection(section)} />
                  <span>{section}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="contracts-card">
            <strong>Project snapshot</strong>
            <p>{project.name}</p>
            <p>{project.files.length} files · {project.chatMessages.length} chat messages · {project.exports.length} saved exports</p>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div>
              <span>Provider status</span>
              <strong>{result?.providerStatus || 'waiting'}</strong>
              <p>{result ? `${result.files.length} package file(s) generated in UI state.` : 'Generate a package to preview downloadable files.'}</p>
            </div>
            <div>
              <span>Safety</span>
              <strong>No .env.local / no API keys</strong>
              <p>Exports are redacted and limited to the provided project state.</p>
            </div>
          </div>

          {result && (
            <>
              <div className="contracts-grid">
                <OutputList title="Warnings" items={result.warnings} />
                <OutputList title="Redaction summary" items={result.redactionSummary} />
              </div>

              <div className="contracts-card contracts-table-card">
                <div className="contracts-section-head">
                  <strong>Generated files</strong>
                  <span>{result.files.length} files</span>
                </div>
                <div className="contracts-table-wrap">
                  <table className="contracts-table">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>MIME</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.files.map(file => (
                        <tr key={file.filename}>
                          <td>{file.filename}</td>
                          <td>{file.mimeType}</td>
                          <td>{file.size} bytes</td>
                          <td>
                            <div className="contracts-mini-actions">
                              <button type="button" title="Copy" onClick={() => copyExportFile(file)}><Clipboard size={14} /></button>
                              <button type="button" title="Download" onClick={() => downloadExportFile(file)}><Download size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="contracts-card">
                <div className="contracts-section-head">
                  <strong>Preview</strong>
                  <span>{result.files[0]?.filename || 'none'}</span>
                </div>
                <pre className="contracts-draft">{result.files[0]?.content || 'No file content generated.'}</pre>
              </div>

              <div className="contracts-actions">
                {result.files.map(file => (
                  <button key={file.filename} type="button" onClick={() => downloadExportFile(file)}>
                    {file.mimeType.includes('json') ? <FileJson size={15} /> : <FileArchive size={15} />}
                    Download {file.filename}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function OutputList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="contracts-card">
      <strong>{title}</strong>
      {items.length ? (
        <ul>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>None.</p>
      )}
    </div>
  )
}
