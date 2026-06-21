import { useEffect, useMemo, useState } from 'react'
import { Clock3, Download, History, RefreshCcw, X } from 'lucide-react'
import { GenerationHistoryEntry } from '../lib/generationHistory'
import { ProjectWorkspace } from '../lib/projectWorkspace'

type GenerationHistoryPanelProps = {
  project: ProjectWorkspace
  onClear: () => void
}

type GenerationHistoryResponse = {
  providerStatus?: string
  summary?: {
    total: number
    completed: number
    failed: number
    byKind: Record<string, number>
  }
  entries?: GenerationHistoryEntry[]
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

function entryText(entry: GenerationHistoryEntry) {
  return [
    `Title: ${entry.title}`,
    `Kind: ${entry.kind}`,
    `Status: ${entry.status}`,
    `Created at: ${entry.createdAt}`,
    `Source: ${entry.sourceName || 'not provided'}`,
    `Artifacts: ${entry.artifactCount}`,
    '',
    'Summary:',
    entry.summary,
    '',
    'Artifacts:',
    ...(entry.artifacts || []).map(item => `- ${item}`),
  ].join('\n')
}

function buildHistoryRequestProject(project: ProjectWorkspace) {
  return {
    name: project.name,
    generationHistory: Array.isArray(project.generationHistory) ? project.generationHistory : [],
  }
}

export function GenerationHistoryPanel({ project, onClear }: GenerationHistoryPanelProps) {
  const [response, setResponse] = useState<GenerationHistoryResponse>({
    providerStatus: 'local-workspace',
    entries: project.generationHistory || [],
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const entries = response.entries || []
  const summary = useMemo(() => {
    if (response.summary) return response.summary
    const byKind = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.kind] = (acc[entry.kind] || 0) + 1
      return acc
    }, {})
    return {
      total: entries.length,
      completed: entries.filter(entry => entry.status === 'completed').length,
      failed: entries.filter(entry => entry.status === 'failed').length,
      byKind,
    }
  }, [entries, response.summary])

  useEffect(() => {
    setResponse({
      providerStatus: 'local-workspace',
      entries: project.generationHistory || [],
    })
  }, [project.generationHistory])

  async function refreshHistory() {
    setLoading(true)
    setMessage('')
    try {
      const fetchResponse = await fetch('/api/copilot/generation-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: buildHistoryRequestProject(project) }),
      })
      const data = await fetchResponse.json().catch(() => ({}))
      if (!fetchResponse.ok) throw new Error(data.error || 'Could not refresh generation history.')
      setResponse(data)
      setMessage(`History refreshed: ${data.entries?.length || 0} item(s).`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not refresh generation history.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="contracts-studio" aria-label="Generation Queue and History">
      <div className="contracts-heading">
        <div>
          <span>Generation Queue / History</span>
          <h2>Track image, video-plan and export runs for this project</h2>
          <p>Uses the same project workspace state in the app and on the web deployment.</p>
        </div>
        <button className="ghost-action" type="button" onClick={onClear} aria-label="Close generation history">
          <X size={16} />
        </button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>History summary</strong>
            <p>{project.name}</p>
            <p>{summary.total} total runs · {summary.completed} completed · {summary.failed} failed</p>
            <button className="contracts-primary" type="button" onClick={refreshHistory} disabled={loading}>
              <RefreshCcw size={16} /> {loading ? 'Refreshing...' : 'Refresh history'}
            </button>
            {message && <p className="contracts-message">{message}</p>}
          </div>

          <div className="contracts-card">
            <strong>By type</strong>
            <ul>
              {Object.entries(summary.byKind).map(([kind, count]) => (
                <li key={kind}>{kind}: {count}</li>
              ))}
              {!Object.keys(summary.byKind).length && <li>No generation run recorded yet.</li>}
            </ul>
          </div>
        </aside>

        <div className="contracts-main">
          <div className="contracts-card contracts-status-grid">
            <div>
              <span>Provider status</span>
              <strong>{response.providerStatus || 'local-workspace'}</strong>
              <p>The queue/history view is sourced from saved workspace generation records.</p>
            </div>
            <div>
              <span>Latest run</span>
              <strong>{entries[0]?.title || 'waiting'}</strong>
              <p>{entries[0]?.summary || 'Generate an image, plan or package to start the timeline.'}</p>
            </div>
          </div>

          <div className="contracts-grid">
            {entries.map(entry => (
              <div className="contracts-card" key={entry.id}>
                <div className="contracts-section-head">
                  <strong>{entry.title}</strong>
                  <span>{entry.status}</span>
                </div>
                <p>{entry.summary}</p>
                <p><Clock3 size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />{new Date(entry.createdAt).toLocaleString()}</p>
                <p><History size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />{entry.kind}</p>
                <p>Artifacts: {entry.artifactCount}</p>
                {!!entry.artifacts?.length && (
                  <ul>
                    {entry.artifacts.slice(0, 6).map(item => <li key={item}>{item}</li>)}
                  </ul>
                )}
                <div className="contracts-mini-actions">
                  <button type="button" onClick={() => downloadTextFile(`apex-generation-${entry.id}.txt`, entryText(entry))}>
                    <Download size={14} /> Export entry
                  </button>
                </div>
              </div>
            ))}
            {!entries.length && (
              <div className="contracts-card">
                <strong>No generation history yet</strong>
                <p>Open ArchVis, DirectCut, Export Center or Project Package Pipeline and run at least one generation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
