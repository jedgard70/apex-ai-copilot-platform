import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save } from 'lucide-react'
export type IDEFile = { name: string, path?: string, extractedText?: string, content?: string }

export function CodeEditorPanel({ 
  onRunFile, 
  activeFile,
  hasNativeHandle,
  onSaveNativeFile,
  onChangeContent
}: { 
  onRunFile: (fileName: string) => void,
  activeFile?: IDEFile,
  hasNativeHandle: boolean,
  onSaveNativeFile: (content: string) => void,
  onChangeContent: (content: string) => void
}) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || activeFile.extractedText || '')
    } else {
      setContent('// Selecione um arquivo para editar ou crie um novo.')
    }
  }, [activeFile])

  function handleSave() {
     if (activeFile) {
       onSaveNativeFile(content)
     }
  }

  function handleRun() {
     if (activeFile) {
       onRunFile(activeFile.name)
     }
  }

  function handleChange(val: string | undefined) {
      const newVal = val || ''
      setContent(newVal)
      onChangeContent(newVal)
  }

  function getLanguage() {
      if (!activeFile) return 'javascript'
      const name = activeFile.name.toLowerCase()
      if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript'
      if (name.endsWith('.html')) return 'html'
      if (name.endsWith('.css')) return 'css'
      if (name.endsWith('.json')) return 'json'
      if (name.endsWith('.md')) return 'markdown'
      return 'javascript'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#252526', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#ccc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Code Editor</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
         <button onClick={handleRun} disabled={!activeFile} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: activeFile ? '#22c55e' : '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: activeFile ? 'pointer' : 'not-allowed', fontSize: 12 }}>
           <Play size={12} /> Run no Terminal
         </button>
         <button onClick={handleSave} disabled={!activeFile} title="Salvar direto no seu HD" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: activeFile ? '#3b82f6' : '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: activeFile ? 'pointer' : 'not-allowed', fontSize: 12 }}>
           <Save size={12} /> Salvar no Disco
         </button>
         {activeFile && <span style={{ color: '#aaa', fontSize: '12px', alignSelf: 'center', marginLeft: '8px' }}>{activeFile.name}</span>}
        </div>
      </div>
       <div style={{ flex: 1, overflow: 'hidden' }}>
         <Editor
           height="100%"
           language={getLanguage()}
           theme="vs-dark"
           value={content}
           onChange={handleChange}
           options={{ minimap: { enabled: true }, fontSize: 14 }}
         />
       </div>
    </div>
  )
}
