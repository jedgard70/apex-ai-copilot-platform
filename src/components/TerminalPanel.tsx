import React, { useEffect, useRef, useState, useCallback } from 'react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info'
  text: string
  ts: number
}

export function TerminalPanel({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', text: 'Apex Terminal — conectado ao servidor local', ts: Date.now() },
    { type: 'info', text: 'Digite um comando e pressione Enter. Ex: git status, npm run build, ls', ts: Date.now() },
  ])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [cwd, setCwd] = useState('d:\\AI-constr\\apex-ai-copilot-platform')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [running])

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text, ts: Date.now() }])
  }

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    historyRef.current = [trimmed, ...historyRef.current.slice(0, 49)]
    historyIndexRef.current = -1
    addLine('input', `$ ${trimmed}`)
    setInput('')
    setRunning(true)

    // Handle built-in commands
    if (trimmed === 'clear' || trimmed === 'cls') {
      setLines([{ type: 'info', text: 'Terminal limpo.', ts: Date.now() }])
      setRunning(false)
      return
    }

    try {
      // Try Local Worker first, then fallback to platform API
      const localWorkerUrl = (window as any).__APEX_LOCAL_WORKER_URL__ || ''
      const localWorkerToken = (window as any).__APEX_LOCAL_WORKER_TOKEN__ || ''

      let response: Response | null = null

      if (localWorkerUrl && localWorkerToken) {
        try {
          response = await fetch(`${localWorkerUrl.replace(/\/$/, '')}/run-command`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localWorkerToken}`,
            },
            body: JSON.stringify({ command: trimmed, cwd }),
            signal: AbortSignal.timeout(60000),
          })
        } catch { /* fall through to platform API */ }
      }

      if (!response || !response.ok) {
        try {
          response = await fetch('/api/copilot/terminal/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: trimmed, cwd }),
            signal: AbortSignal.timeout(60000),
          })
        } catch { /* ignore and fallback */ }
      }

      if (!response || !response.ok) {
        // Fallback: use platform's /api/copilot/chat to interpret the command
        response = await fetch('/api/copilot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Execute este comando de terminal e retorne APENAS a saída do comando, sem explicações: \`${trimmed}\`\nContexto: estou no diretório ${cwd}`,
            selectedModel: 'gemini|gemini-2.5-flash',
            terminalMode: true,
          }),
          signal: AbortSignal.timeout(60000),
        })
      }

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        const output = data.stdout || data.output || data.finalReply || data.reply || ''
        const stderr = data.stderr || ''
        const exitCode = data.exitCode ?? data.exit_code ?? null
        const newCwd = data.cwd || data.workingDir || null

        if (newCwd) setCwd(newCwd)

        if (output) {
          output.split('\n').forEach((line: string) => addLine('output', line))
        }
        if (stderr) {
          stderr.split('\n').forEach((line: string) => addLine('error', line))
        }
        if (!output && !stderr) {
          addLine('info', exitCode === 0 ? '(comando concluído sem saída)' : `Código de saída: ${exitCode ?? 'desconhecido'}`)
        }
      } else {
        addLine('error', `Erro HTTP ${response.status} ao executar comando`)
      }
    } catch (err: any) {
      addLine('error', `Falha: ${err.message || err}`)
    } finally {
      setRunning(false)
    }
  }, [cwd])

  // Listen to external terminal-run events (from CodeEditorPanel "Run no Terminal")
  useEffect(() => {
    const handler = (e: any) => runCommand(e.detail || '')
    window.addEventListener('terminal-run', handler)
    return () => window.removeEventListener('terminal-run', handler)
  }, [runCommand])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !running) {
      runCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIndexRef.current + 1, historyRef.current.length - 1)
      historyIndexRef.current = next
      setInput(historyRef.current[next] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(historyIndexRef.current - 1, -1)
      historyIndexRef.current = next
      setInput(next === -1 ? '' : historyRef.current[next] || '')
    } else if (e.key === 'c' && e.ctrlKey) {
      addLine('info', '^C')
      setInput('')
      setRunning(false)
    }
  }

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return '#7dd3fc'   // azul claro
      case 'output': return '#d1fae5'  // verde claro
      case 'error': return '#fca5a5'   // vermelho claro
      case 'info': return '#94a3b8'    // cinza
      default: return '#e2e8f0'
    }
  }

  const terminalContent = (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', fontFamily: "'Consolas', 'Menlo', monospace", backgroundColor: '#0d1117' }}>
        {!embedded && (
          <div style={{ padding: '6px 14px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', color: '#8b949e', fontSize: '12px' }}>
            <span style={{ color: '#484f58' }}>{cwd}</span>
          </div>
        )}

      {/* Output area */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontSize: '13px', lineHeight: '1.6' }}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line.text}
          </div>
        ))}
        {running && (
          <div style={{ color: '#f59e0b', animation: 'pulse 1s infinite' }}>
            ⏳ executando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px',
        backgroundColor: '#161b22',
        borderTop: '1px solid #30363d',
        gap: '8px',
        flexShrink: 0,
      }}>
        <span style={{ color: '#3fb950', fontSize: '13px', flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={running}
          placeholder={running ? 'aguardando...' : 'Digite um comando...'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e6edf3',
            fontFamily: 'inherit',
            fontSize: '13px',
            caretColor: '#3fb950',
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          onClick={() => !running && runCommand(input)}
          disabled={running || !input.trim()}
          style={{
            background: running || !input.trim() ? '#21262d' : '#238636',
            border: 'none',
            borderRadius: '4px',
            color: '#e6edf3',
            cursor: running || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '4px 10px',
          }}
        >
          ▶ Run
        </button>
      </div>
      </div>
  )

  if (embedded) {
    return terminalContent
  }

  return (
    <PremiumPanelLayout 
      title="Apex Terminal" 
      subtitle="Ações e configurações operacionais"
      headerActions={
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}
          title="Fechar terminal"
        >×</button>
      }
    >
      {terminalContent}
    </PremiumPanelLayout>
  )
}
