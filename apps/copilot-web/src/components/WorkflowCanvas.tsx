import React, { useState, useCallback, useEffect } from 'react'
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
import { Upload, X, Play } from 'lucide-react'

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

// ─── Custom Image Node ────────────────────────────────────────────────────────

const ImagePromptNode = ({ data, id }: any) => {
  return (
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
        <span style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant }}>{data.label || 'Generation Node'}</span>
        <button onClick={() => data.onRemove(id)} style={{ background: 'none', border: 'none', color: D.onSurfaceVariant, cursor: 'pointer' }}>
          <X size={14} />
        </button>
      </div>

      {/* Image Slot */}
      <div style={{
        position: 'relative', width: '100%', height: 140, background: D.surfaceContainerHighest,
        border: `1px dashed ${D.outline}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8
      }}>
        {data.image ? (
          <>
            <img src={data.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Node img" />
            <button onClick={() => data.onImageChange(id, undefined)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>×</button>
          </>
        ) : (
          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: D.onSurfaceVariant }}>
            <Upload size={16} />
            <span style={{ fontSize: 10 }}>Upload Reference</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0]
              if (file) {
                const r = new FileReader()
                r.onload = () => data.onImageChange(id, r.result as string)
                r.readAsDataURL(file)
              }
            }} />
          </label>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block', marginBottom: 4 }}>Prompt</label>
        <textarea
          className="nodrag"
          value={data.prompt || ''}
          onChange={(e) => data.onPromptChange(id, e.target.value)}
          rows={3}
          placeholder="Describe generation..."
          style={{ width: '100%', fontSize: 11, background: D.bg, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: 6, resize: 'none', outline: 'none' }}
        />
      </div>

      <Handle type="source" position={Position.Right} style={{ background: D.primaryContainer }} />
    </div>
  )
}

const nodeTypes = {
  imagePromptNode: ImagePromptNode
}

// ─── Workflow Canvas ─────────────────────────────────────────────────────────

export function WorkflowCanvas({ sourceImage, onExecuteFlow }: { sourceImage?: string; onExecuteFlow?: (nodes: Node[], edges: Edge[]) => void }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: D.primaryContainer, strokeWidth: 2 } }, eds)), [])

  const handleImageChange = useCallback((nodeId: string, image?: string) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, image } } : n))
  }, [])

  const handlePromptChange = useCallback((nodeId: string, prompt: string) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, prompt } } : n))
  }, [])

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
  }, [])

  // Add initial nodes if empty
  useEffect(() => {
    if (nodes.length === 0) {
      setNodes([
        {
          id: 'node-1',
          type: 'imagePromptNode',
          position: { x: 50, y: 50 },
          data: { label: 'Initial Reference', image: sourceImage, onImageChange: handleImageChange, onPromptChange: handlePromptChange, onRemove: handleRemoveNode }
        },
        {
          id: 'node-2',
          type: 'imagePromptNode',
          position: { x: 450, y: 50 },
          data: { label: 'Final Output Target', image: undefined, onImageChange: handleImageChange, onPromptChange: handlePromptChange, onRemove: handleRemoveNode }
        }
      ])
      setEdges([
        { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: D.primaryContainer, strokeWidth: 2 } }
      ])
    }
  }, [sourceImage, handleImageChange, handlePromptChange, handleRemoveNode, nodes.length])

  const handleAddNode = () => {
    if (nodes.length >= 20) {
      alert('Limite máximo de 20 nodes atingido.')
      return
    }
    const newNodeId = `node-${Date.now()}`
    
    // Find right-most position
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 0)
    
    setNodes(nds => [...nds, {
      id: newNodeId,
      type: 'imagePromptNode',
      position: { x: maxX + 350, y: 50 },
      data: { label: `Node ${nds.length + 1}`, image: undefined, onImageChange: handleImageChange, onPromptChange: handlePromptChange, onRemove: handleRemoveNode }
    }])
  }

  const handleExecute = () => {
    if (onExecuteFlow) {
      onExecuteFlow(nodes, edges)
    } else {
      console.log('Execute graph:', { nodes, edges })
      alert('Gráfico enviado para execução! (Workflow salvo no console)')
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: D.bg }}>
      {/* Top Toolbar */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
        <button onClick={handleAddNode} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
          <span style={{ fontSize: 14 }}>+</span> Add Node ({nodes.length}/20)
        </button>
        <button onClick={handleExecute} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: D.primaryContainer, color: D.onPrimaryContainer, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
          <Play size={12} fill="currentColor" /> Execute Flow
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
