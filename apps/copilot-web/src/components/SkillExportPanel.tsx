import { useEffect, useMemo, useState } from 'react'
import { Archive, Clipboard, Download, FileCode2, PackageOpen, X } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import {
  buildSkillExportRequest,
  exportDomains,
  exportTargets,
  serializeExportPackage,
  SkillExportFile,
  SkillExportLanguage,
  SkillExportPackage,
  SkillExportRequest,
  SkillExportTarget,
} from '../lib/skillExportFactory'

type SkillExportPanelProps = {
  openSignal?: string
  onClose: () => void
}

export function SkillExportPanel({ openSignal, onClose }: SkillExportPanelProps) {
  const [open, setOpen] = useState(Boolean(openSignal))
  const [request, setRequest] = useState<SkillExportRequest>(() => buildSkillExportRequest('chatgpt'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pack, setPack] = useState<SkillExportPackage | null>(null)

  useEffect(() => {
    if (openSignal) setOpen(true)
  }, [openSignal])

  const selectedTarget = useMemo(
    () => exportTargets.find(target => target.id === request.targetPlatform) || exportTargets[0],
    [request.targetPlatform],
  )

  function updateTarget(targetPlatform: SkillExportTarget) {
    setRequest({
      ...buildSkillExportRequest(targetPlatform),
      skillName: request.skillName,
      description: request.description,
      language: request.language,
    })
    setPack(null)
  }

  function toggleDomain(domain: string) {
    setRequest(current => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter(item => item !== domain)
        : [...current.domains, domain],
    }))
    setPack(null)
  }

  async function generatePreview() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/copilot/export-skill-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const status = data.providerStatus ? ` (${data.providerStatus})` : ''
        throw new Error(`${data.error || 'Could not export skill pack.'}${status}`)
      }
      if (!data.pack) throw new Error('Skill export returned no pack. Check server.mjs /api/copilot/export-skill-pack.')
      setPack(data.pack)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not export skill pack. Confirm the local server is running and retry.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMainPrompt() {
    if (!pack) return
    await navigator.clipboard.writeText(pack.mainPrompt)
  }

  function downloadFile(file: SkillExportFile) {
    const blob = new Blob([file.content], { type: file.type === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.path.split('/').pop() || 'apex-export.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function downloadBundle() {
    if (!pack) return
    const blob = new Blob([serializeExportPackage(pack)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${pack.skillName.replace(/[^a-z0-9_-]+/gi, '-') || 'apex-skill-pack'}-${pack.targetPlatform}.zip-compatible.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  if (!open) {
    return (
      <section className="skill-export-panel compact">
        <button type="button" onClick={() => setOpen(true)}>
          <PackageOpen size={17} />
          Skill export
        </button>
      </section>
    )
  }

  return (
    <PremiumPanelLayout 
      title="Skill Export Panel" 
      subtitle="Ações e configurações operacionais"
      headerActions={
        <button type="button" onClick={() => { setOpen(false); onClose() }} aria-label="Close skill export">
          <X size={16} />
        </button>
      }
    >

      <label className="skill-export-field">
        <span>Platform</span>
        <select value={request.targetPlatform} onChange={event => updateTarget(event.target.value as SkillExportTarget)}>
          {exportTargets.map(target => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
        <small>{selectedTarget.description}</small>
      </label>

      <label className="skill-export-field">
        <span>Skill name</span>
        <input value={request.skillName} onChange={event => setRequest({ ...request, skillName: event.target.value })} />
      </label>

      <label className="skill-export-field">
        <span>Description</span>
        <textarea value={request.description} onChange={event => setRequest({ ...request, description: event.target.value })} />
      </label>

      <label className="skill-export-field">
        <span>Language</span>
        <select value={request.language} onChange={event => setRequest({ ...request, language: event.target.value as SkillExportLanguage })}>
          <option value="EN">EN</option>
          <option value="PT">PT</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </label>

      <div className="skill-export-domains">
        <strong>Knowledge domains</strong>
        <div>
          {exportDomains.map(domain => (
            <label key={domain}>
              <input type="checkbox" checked={request.domains.includes(domain)} onChange={() => toggleDomain(domain)} />
              <span>{domain}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="skill-export-primary" type="button" onClick={generatePreview} disabled={loading || !request.domains.length}>
        <Archive size={17} />
        {loading ? 'Preparing export...' : 'Generate export preview'}
      </button>

      {error && <div className="skill-export-error">{error}</div>}

      {pack && (
        <div className="skill-export-preview">
          <div className="skill-export-summary">
            <strong>{pack.skillName}</strong>
            <span>{pack.targetPlatform} · {pack.files.length} files · {pack.language}</span>
          </div>

          <div className="skill-export-actions">
            <button type="button" onClick={copyMainPrompt}><Clipboard size={15} /> Copy main prompt</button>
            <button type="button" onClick={downloadBundle}><Download size={15} /> Download ZIP-compatible bundle</button>
          </div>

          <div className="skill-export-file-list">
            <strong>Files to be created</strong>
            {pack.files.map(file => (
              <button type="button" key={file.path} onClick={() => downloadFile(file)}>
                <FileCode2 size={15} />
                <span>{file.path}</span>
                <small>{file.type}</small>
              </button>
            ))}
          </div>

          <label className="skill-export-preview-text">
            <span>Preview generated instructions</span>
            <textarea readOnly value={pack.mainPrompt} />
          </label>

          {!!pack.warnings.length && (
            <div className="skill-export-warning">
              {pack.warnings.map(warning => <span key={warning}>{warning}</span>)}
            </div>
          )}
        </div>
      )}
    </PremiumPanelLayout>
  )
}
