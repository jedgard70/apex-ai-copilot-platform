import React, { useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Plus, Trash2, Cpu } from 'lucide-react'
import { uid } from 'radash'

const D = {
  bg: '#131313',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353534',
  primaryContainer: '#00f0ff',
  onPrimaryContainer: '#006970',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#b9cacb',
  outline: '#5a6e6f',
  outlineVariant: '#3b494b',
}

// ─── Custom Nodes ────────────────────────────────────────────────────────────

const GenericActionNode = ({ data, id }: any) => (
  <div style={{
    background: D.surfaceContainerHigh,
    border: `1px solid ${D.outlineVariant}`,
    borderRadius: 8,
    padding: 12,
    width: 260,
    color: D.onSurface,
    fontFamily: 'system-ui, sans-serif'
  }}>
    <Handle type="target" position={Position.Left} style={{ background: D.primaryContainer }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: D.onPrimaryContainer, background: D.primaryContainer, padding: '2px 6px', borderRadius: 4 }}>
        {data.moduleName || 'Action'}
      </span>
      <button onClick={() => data.onRemove(id)} style={{ background: 'none', border: 'none', color: D.onSurfaceVariant, cursor: 'pointer' }}>
        <Trash2 size={14} />
      </button>
    </div>
    <div>
      <label style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block', marginBottom: 4 }}>Action Prompt</label>
      <textarea
        className="nodrag"
        value={data.prompt || ''}
        onChange={(e) => data.onPromptChange(id, e.target.value)}
        rows={3}
        placeholder="Descreva a ação..."
        style={{ width: '100%', fontSize: 11, background: D.bg, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: 6, resize: 'none', outline: 'none' }}
      />
    </div>
    <Handle type="source" position={Position.Right} style={{ background: D.primaryContainer }} />
  </div>
)

const nodeTypes = {
  genericAction: GenericActionNode
}

// ─── Global Workflow Orchestrator ────────────────────────────────────────────

export function GlobalWorkflowOrchestrator() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])
  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [])

  const addNode = (moduleName: string) => {
    const id = uid()
    const newNode: Node = {
      id,
      type: 'genericAction',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        moduleName,
        prompt: '',
        onRemove: (nodeId: string) => setNodes(nds => nds.filter(n => n.id !== nodeId)),
        onPromptChange: (nodeId: string, val: string) => {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, prompt: val } } : n))
        }
      }
    }
    setNodes(nds => [...nds, newNode])
  }

  const handleExecute = async () => {
    if (nodes.length === 0) return
    setLoading(true)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando workflow global com ${nodes.length} nós...`])

    try {
      const res = await fetch('/api/copilot/global-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      })
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        setLogs(prev => [...prev, `[ERROR] Falha: ${data.message || 'Erro desconhecido'}`])
      } else {
        setLogs(prev => [...prev, `[SUCCESS] Workflow na fila! Request ID: ${data.requestId}`])
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: D.bg }}>
      
      {/* Header Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cpu size={24} color={D.primaryContainer} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: D.onSurface }}>Global Workflow Orchestrator</h2>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => addNode('Marketing')} style={{ background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Marketing
          </button>
          <button onClick={() => addNode('CRM')} style={{ background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add CRM
          </button>
          <button onClick={() => addNode('BIM 3D')} style={{ background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add BIM
          </button>
          <div style={{ width: 1, background: D.outlineVariant, margin: '0 8px' }} />
          <button onClick={handleExecute} disabled={loading || nodes.length === 0} style={{ background: D.primaryContainer, color: D.onPrimaryContainer, border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: nodes.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: (loading || nodes.length === 0) ? 0.5 : 1 }}>
            <Play size={14} /> {loading ? 'Running...' : 'Run Global Workflow'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: D.bg }}
          >
            <Background color={D.outlineVariant} gap={16} />
            <Controls style={{ button: { background: D.surfaceContainerHigh, border: `1px solid ${D.outlineVariant}`, color: D.onSurface } }} />
          </ReactFlow>
        </div>

        {/* Logs Panel */}
        <div style={{ width: 320, background: D.surfaceContainerHighest, borderLeft: `1px solid ${D.outlineVariant}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${D.outlineVariant}`, fontWeight: 600, color: D.onSurfaceVariant, fontSize: 13 }}>
            Execution Logs
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.length === 0 ? (
              <span style={{ color: D.outline, fontSize: 12 }}>Nenhuma execução registrada...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: log.includes('ERROR') ? '#ff4d4f' : log.includes('SUCCESS') ? '#52c41a' : D.onSurfaceVariant, padding: '6px 8px', background: D.bg, borderRadius: 4, border: `1px solid ${D.outlineVariant}` }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
