import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

type FileNode = {
  name: string
  path: string
  isDir: boolean
}

export function WorkspaceFileTree({ onFileSelect }: { onFileSelect?: (path: string, name: string) => void }) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [error, setError] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))

  useEffect(() => {
    let mounted = true
    fetch('/api/copilot/fs/list')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        if (data.ok) {
          setFiles(data.files)
        } else {
          setError(data.error || 'Failed to load files')
        }
      })
      .catch(err => {
        if (mounted) setError(err.message)
      })
    return () => { mounted = false }
  }, [])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  // Build tree
  const tree: Record<string, FileNode[]> = {}
  files.forEach(f => {
    const parent = f.path.substring(0, f.path.lastIndexOf('/')) || ''
    if (!tree[parent]) tree[parent] = []
    tree[parent].push(f)
  })

  const renderTree = (parentPath: string, depth: number) => {
    const nodes = tree[parentPath]
    if (!nodes) return null

    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path)
      return (
        <div key={node.path}>
          <div
            style={{
              paddingLeft: `${depth * 16}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingTop: '4px',
              paddingBottom: '4px',
              cursor: 'pointer',
              color: node.isDir ? '#e2e8f0' : '#94a3b8',
              fontSize: '13px',
              userSelect: 'none',
              opacity: node.isDir ? 1 : 0.8,
            }}
            onClick={() => {
              if (node.isDir) {
                toggleFolder(node.path)
              } else if (onFileSelect) {
                onFileSelect(node.path, node.name)
              }
            }}
          >
            {node.isDir ? (
              isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />
            ) : (
              <div style={{ width: '14px' }} />
            )}
            {node.isDir ? <Folder size={14} color="#3b82f6" /> : <File size={14} color="#64748b" />}
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.name}</span>
          </div>
          {node.isDir && isExpanded && renderTree(node.path, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div style={{ padding: '16px', background: 'var(--bg-color, #0f172a)', color: '#fff', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Folder size={16} /> Workspace Local
      </h3>
      {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderTree('', 0)}
      </div>
    </div>
  )
}
