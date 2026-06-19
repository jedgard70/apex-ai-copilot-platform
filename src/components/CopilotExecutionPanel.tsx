import { CheckCircle2, Clipboard, Play, RefreshCw, ShieldCheck, Terminal, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CopilotExecutionCommand, CopilotExecutionResult } from '../lib/copilotExecutionModel'

type CopilotExecutionPanelProps = {
  initialRuns?: CopilotExecutionResult[]
  onRunComplete?: (run: CopilotExecutionResult, runs: CopilotExecutionResult[]) => void
  onClear: () => void
}

function formatDuration(value?: number) {
  if (!value) return '0ms'
  if (value < 1000) return `${value}ms`
  return `${(value / 1000).toFixed(1)}s`
}

function statusIcon(status: CopilotExecutionResult['status']) {
  if (status === 'completed') return <CheckCircle2 size={16} />
  if (status === 'running') return <RefreshCw size={16} className="spin-icon" />
  return <XCircle size={16} />
}

function buildRunReport(run: CopilotExecutionResult) {
  return [
    `Apex Copilot Local Execution v0`,
    `Command: ${run.commandId} (${run.label})`,
    `Shell: ${run.shell ? 'yes' : 'no'}`,
    `Status: ${run.status}`,
    `Exit code: ${run.exitCode ?? 'n/a'}`,
    `Duration: ${formatDuration(run.durationMs)}`,
    `CWD: ${run.cwd}`,
    `Args: ${run.args.join(' ')}`,
    run.rawCommand ? `Raw command: ${run.rawCommand}` : '',
    `Redacted output: ${run.redactedOutput ? 'yes' : 'no'}`,
    '',
    'STDOUT:',
    run.stdout || '(empty)',
    '',
    'STDERR:',
    run.stderr || '(empty)',
  ].join('\n')
}

export function CopilotExecutionPanel({ initialRuns = [], onRunComplete, onClear }: CopilotExecutionPanelProps) {
  const [commands, setCommands] = useState<CopilotExecutionCommand[]>([])
  const [runs, setRuns] = useState<CopilotExecutionResult[]>(initialRuns)
  const [selectedCommandId, setSelectedCommandId] = useState('')
  const [runningCommandId, setRunningCommandId] = useState('')
  const [cwd, setCwd] = useState('D:\\AI-constr\\apex-ai-copilot-platform')
  const [rawCommand, setRawCommand] = useState('')
  const [rawApproval, setRawApproval] = useState(false)
  const [error, setError] = useState('')
  const latestRun = runs[0]
  const allowlistedCommands = useMemo(
    () => commands.filter(command => command.acceptsRawCommand !== true),
    [commands],
  )
  const rawShellCommand = useMemo(
    () => commands.find(command => command.acceptsRawCommand === true),
    [commands],
  )

  useEffect(() => {
    let mounted = true
    fetch('/api/copilot/execution/commands')
      .then(response => response.json())
      .then(data => {
        if (!mounted) return
        const nextCommands = Array.isArray(data.commands) ? data.commands : []
        setCommands(nextCommands)
        setSelectedCommandId(current => current || nextCommands.find((command: CopilotExecutionCommand) => command.acceptsRawCommand !== true)?.id || nextCommands[0]?.id || '')
      })
      .catch(fetchError => {
        if (mounted) setError(fetchError instanceof Error ? fetchError.message : 'Could not load execution commands.')
      })
    return () => {
      mounted = false
    }
  }, [])

  const selectedCommand = useMemo(
    () => commands.find(command => command.id === selectedCommandId),
    [commands, selectedCommandId],
  )
  const selectedIsRaw = selectedCommand?.acceptsRawCommand === true

  useEffect(() => {
    setRawApproval(false)
  }, [cwd, rawCommand, selectedCommandId])

  async function runSelectedCommand(commandId = selectedCommandId) {
    if (!commandId || runningCommandId) return
    const command = commands.find(item => item.id === commandId)
    if (command?.acceptsRawCommand && !rawCommand.trim()) {
      setError('Raw command is required.')
      return
    }
    setError('')
    setRunningCommandId(commandId)
    const pending: CopilotExecutionResult = {
      id: `pending-${Date.now()}`,
      commandId,
      label: command?.label || commandId,
      cwd,
      args: command?.acceptsRawCommand ? [rawCommand] : [],
      rawCommand: command?.acceptsRawCommand ? rawCommand : undefined,
      shell: true,
      status: 'running',
      stdout: '',
      stderr: '',
      exitCode: null,
      startedAt: new Date().toISOString(),
      finishedAt: '',
      durationMs: 0,
      createdBy: 'User',
      risk: command?.risk || 'low',
      requiresApproval: false,
      approvedBy: undefined,
      redactedOutput: false,
    }
    setRuns(previous => [pending, ...previous.filter(run => run.status !== 'running')])

    try {
      const response = await fetch('/api/copilot/execution/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId,
          cwd,
          rawCommand: command?.acceptsRawCommand ? rawCommand : undefined,
          note: command?.acceptsRawCommand ? 'Raw shell command execution' : 'Run command',
        }),
      })
      const data = await response.json()
      const result = data.result as CopilotExecutionResult | undefined
      if (!response.ok || !result) {
        throw new Error(data.error || 'Execution request failed.')
      }
      setRuns(previous => {
        const nextRuns = [result, ...previous.filter(run => run.id !== pending.id)].slice(0, 12)
        onRunComplete?.(result, nextRuns)
        return nextRuns
      })
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Execution failed.'
      setError(message)
      setRuns(previous => [{
        ...pending,
        status: 'failed',
        stderr: message,
        finishedAt: new Date().toISOString(),
      }, ...previous.filter(run => run.id !== pending.id)])
    } finally {
      setRunningCommandId('')
    }
  }

  async function copyLatestReport() {
    if (!latestRun) return
    await navigator.clipboard.writeText(buildRunReport(latestRun))
  }

  return (
    <section className="copilot-execution-panel business-studio" aria-label="Apex Copilot Local Execution v0">
      <div className="copilot-execution-head">
        <div>
          <span><ShieldCheck size={15} /> Apex Copilot Local Execution v0</span>
          <h2>Copilot Execution</h2>
          <p>Platform Maintenance · Build & Repo Checks</p>
        </div>
        <button onClick={onClear} aria-label="Close Copilot Execution">
          <XCircle size={18} />
        </button>
      </div>

      <div className="execution-guardrail">
        <Terminal size={18} />
        <span>Registered commands and raw shell mode run through spawn with shell enabled.</span>
      </div>

      {error && <div className="business-alert"><strong>Execution error</strong><span>{error}</span></div>}

      <div className="execution-command-list">
        {allowlistedCommands.map(command => (
          <button
            key={command.id}
            className={command.id === selectedCommandId ? 'active' : ''}
            onClick={() => setSelectedCommandId(command.id)}
            type="button"
          >
            <strong>{command.label}</strong>
            <span>{command.executable} {command.args.join(' ')}</span>
            <small>{command.description}</small>
          </button>
        ))}
      </div>

      {rawShellCommand && (
        <div className="execution-guardrail">
          <ShieldCheck size={18} />
          <span>Live shell livre. Execute comandos reais dentro do repositório.</span>
          <button type="button" onClick={() => setSelectedCommandId(rawShellCommand.id)}>
            Select raw shell
          </button>
        </div>
      )}

      <div className="execution-raw-controls">
        <label>
          <span>CWD</span>
          <input
            value={cwd}
            onChange={event => setCwd(event.target.value)}
            placeholder="C:\\path\\to\\working-directory"
          />
        </label>
        {selectedIsRaw && (
          <>
            <label>
              <span>Raw command</span>
              <textarea
                value={rawCommand}
                onChange={event => setRawCommand(event.target.value)}
                placeholder="Type the raw shell command..."
                rows={4}
              />
            </label>
          </>
        )}
      </div>

      <div className="execution-actions">
        <button type="button" onClick={() => runSelectedCommand()} disabled={!selectedCommand || Boolean(runningCommandId)}>
          <Play size={16} /> Run selected
        </button>
        <button type="button" onClick={copyLatestReport} disabled={!latestRun}>
          <Clipboard size={16} /> Copy report
        </button>
      </div>

      {selectedCommand && (
        <div className="execution-command-meta">
          <span>Risk: {selectedCommand.risk}</span>
          <span>Timeout: {formatDuration(selectedCommand.timeoutMs)}</span>
          <span>CWD: {selectedIsRaw ? cwd : selectedCommand.cwd}</span>
          <span>Shell: enabled</span>
        </div>
      )}

      <div className="execution-runs">
        {runs.length === 0 && <p className="business-muted">No execution runs yet.</p>}
        {runs.map(run => (
          <article key={run.id} className={`execution-run ${run.status}`}>
            <div className="execution-run-head">
              <strong>{statusIcon(run.status)} {run.label}</strong>
              <span>{run.status} · exit {run.exitCode ?? 'n/a'} · {formatDuration(run.durationMs)}</span>
            </div>
            <pre>{run.stdout || '(stdout empty)'}</pre>
            {run.stderr && <pre className="execution-stderr">{run.stderr}</pre>}
          </article>
        ))}
      </div>
    </section>
  )
}
