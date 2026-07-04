import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save, Wand2, Loader2 } from 'lucide-react'
import { IntakeFile } from '../lib/fileIntake'

export function CodeEditorPanel({ 
  onRunFile, 
  activeFile,
  hasNativeHandle,
  onSaveNativeFile,
  onChangeContent
}: { 
  onRunFile: (fileName: string) => void,
  activeFile?: IntakeFile,
  hasNativeHandle: boolean,
  onSaveNativeFile: (content: string) => void,
  onChangeContent: (content: string) => void
}) {
  const [content, setContent] = useState('')
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.extractedText || '')
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
       onRunFile(activeFile.file.name)
     }
  }

  async function handleAIFix() {
    if (!content) return
    setIsFixing(true)
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Você é um Code Fixer autônomo. Corrija o código abaixo removendo variáveis não utilizadas e consertando erros do TypeScript. RETORNE APENAS O CÓDIGO FONTE, nada de explicações, nada de blocos markdown, apenas o texto puro:\n\n${content}`
        })
      })
      const data = await res.json()
      if (data.finalReply) {
        let fixed = data.finalReply.replace(/```[\w]*\n?/g, '').replace(/```$/g, '').trim()
        setContent(fixed)
        onChangeContent(fixed)
      }
    } catch (e) {
      console.error('Code Fixer error', e)
    } finally {
      setIsFixing(false)
    }
  }

  function handleChange(val: string | undefined) {
      const newVal = val || ''
      setContent(newVal)
      onChangeContent(newVal)
  }

  function getLanguage() {
      if (!activeFile) return 'javascript'
      const name = activeFile.file.name.toLowerCase()
      if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript'
      if (name.endsWith('.html')) return 'html'
      if (name.endsWith('.css')) return 'css'
      if (name.endsWith('.json')) return 'json'
      if (name.endsWith('.md')) return 'markdown'
      return 'javascript'
  }

  return (
     <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e' }}>
       <div style={{ display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid #333' }}>
         <button onClick={handleRun} disabled={!activeFile} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: activeFile ? '#22c55e' : '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: activeFile ? 'pointer' : 'not-allowed' }}>
           <Play size={14} /> Run no Terminal
         </button>
         <button onClick={handleSave} disabled={!activeFile || !hasNativeHandle} title={!hasNativeHandle ? 'Disponível apenas para arquivos conectados via "Pasta Local"' : 'Salvar direto no seu HD'} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: activeFile && hasNativeHandle ? '#3b82f6' : '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: activeFile && hasNativeHandle ? 'pointer' : 'not-allowed' }}>
           <Save size={14} /> Salvar no Disco
         </button>
         <button onClick={handleAIFix} disabled={!activeFile || isFixing} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: activeFile ? '#8b5cf6' : '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: activeFile ? 'pointer' : 'not-allowed', marginLeft: '8px' }}>
           {isFixing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
           {isFixing ? 'Corrigindo...' : 'AI Code Fixer'}
         </button>
         {activeFile && <span style={{ color: '#aaa', fontSize: '12px', alignSelf: 'center', marginLeft: 'auto' }}>{activeFile.file.name}</span>}
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
