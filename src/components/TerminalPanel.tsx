import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export function TerminalPanel({ onClose, embedded = false }: { onClose?: () => void, embedded?: boolean }) {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      theme: { background: '#1e1e1e' },
      fontFamily: 'Consolas, monospace',
      fontSize: 14,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    const wsUrl = window.location.protocol === 'https:'
      ? `wss://${window.location.host}/terminal`
      : `ws://${window.location.host}/terminal`

    const ws = new WebSocket(wsUrl)

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    ws.onmessage = (evento) => {
      // If we receive text data from the backend
      if (typeof evento.data === 'string') {
        term.write(evento.data)
      } else {
        // Blob or ArrayBuffer
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') term.write(reader.result)
        }
        reader.readAsText(evento.data)
      }
    }

    const handleGlobalRun = (e: any) => { if (ws.readyState === WebSocket.OPEN) { ws.send(e.detail); } }; window.addEventListener('terminal-run', handleGlobalRun);

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    })
    resizeObserver.observe(terminalRef.current)

    return () => { window.removeEventListener('terminal-run', handleGlobalRun);
      term.dispose()
      ws.close()
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      bottom: embedded ? undefined : 0,
      left: embedded ? undefined : 0,
      right: embedded ? undefined : 0,
      height: embedded ? '100%' : '350px',
      backgroundColor: '#1e1e1e',
      borderTop: '1px solid #333',
      zIndex: embedded ? 1 : 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#2d2d2d',
        color: '#fff',
        fontFamily: 'sans-serif',
        fontSize: '12px'
      }}>
        <span>Apex Local Terminal</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0 8px' }}
        >
          X
        </button>
      </div>
      <div ref={terminalRef} style={{ flex: 1, padding: '10px', overflow: 'hidden' }} />
    </div>
  )
}
