import React, { useState } from 'react'
import Head from './Head' // Mock ou remove
// import { useRouter } from 'next/router'
import { CodeEditorPanel, IDEFile } from '../components/CodeEditorPanel'
import { TerminalPanel } from '../components/TerminalPanel'
import { WorkspaceFileTree } from '../components/WorkspaceFileTree'
import ApexCopilot from '../components/ApexCopilot'
import { FileCode, Search, GitBranch, Settings, LogOut, Code, Play } from 'lucide-react'

export function CommandMode({ onClose }: { onClose: () => void }) {
  // const router = useRouter()
  const [activeFile, setActiveFile] = useState<IDEFile | undefined>()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  
  // View states
  const [showExplorer, setShowExplorer] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showCopilot, setShowCopilot] = useState(true)

  const handleFileSelect = async (path: string, name: string) => {
    try {
      const res = await fetch(`/api/copilot/fs/read?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.ok) {
        setActiveFile({ name, content: data.content, path })
      } else {
        setActiveFile({ name, content: `// Erro ao carregar: ${data.error}`, path })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRunFile = (fileName: string) => {
    const event = new CustomEvent('terminal-run', { detail: `node ${fileName}` })
    window.dispatchEvent(event)
  }

  const handleSaveFile = async (content: string) => {
    if (!activeFile?.path) return
    try {
      const res = await fetch('/api/copilot/fs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: activeFile.path, content })
      })
      const data = await res.json()
      if (data.ok) {
        alert('Arquivo salvo com sucesso!')
      } else {
        alert('Erro ao salvar: ' + data.error)
      }
    } catch (error) {
      alert('Erro na conexão ao salvar')
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#1e1e1e', // VS Code Dark Theme Background
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Removed Head for standard Vite app */}

      {/* Title Bar */}
      <div style={{ height: '35px', backgroundColor: '#333333', display: 'flex', alignItems: 'center', padding: '0 15px', fontSize: '13px', userSelect: 'none', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Code size={16} color="#007acc" style={{ marginRight: 5 }} />
          
          {/* File Menu */}
          <div style={{ position: 'relative' }}>
            <span onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: activeMenu === 'file' ? 'rgba(255,255,255,0.1)' : 'transparent' }} className="hover-bg-light">File</span>
            {activeMenu === 'file' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#252526', border: '1px solid #454545', borderRadius: 4, padding: '4px 0', minWidth: 150, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <div onClick={() => { handleSaveFile(activeFile?.content || ''); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">Save</div>
                <div onClick={() => { setActiveFile(undefined); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">Close Editor</div>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div style={{ position: 'relative' }}>
            <span onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: activeMenu === 'view' ? 'rgba(255,255,255,0.1)' : 'transparent' }} className="hover-bg-light">View</span>
            {activeMenu === 'view' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#252526', border: '1px solid #454545', borderRadius: 4, padding: '4px 0', minWidth: 150, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <div onClick={() => { setShowExplorer(!showExplorer); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">{showExplorer ? 'Hide' : 'Show'} Explorer</div>
                <div onClick={() => { setShowTerminal(!showTerminal); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">{showTerminal ? 'Hide' : 'Show'} Terminal</div>
                <div onClick={() => { setShowCopilot(!showCopilot); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">{showCopilot ? 'Hide' : 'Show'} AI Copilot</div>
              </div>
            )}
          </div>

          {/* Terminal Menu */}
          <div style={{ position: 'relative' }}>
            <span onClick={() => setActiveMenu(activeMenu === 'terminal' ? null : 'terminal')} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: activeMenu === 'terminal' ? 'rgba(255,255,255,0.1)' : 'transparent' }} className="hover-bg-light">Terminal</span>
            {activeMenu === 'terminal' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#252526', border: '1px solid #454545', borderRadius: 4, padding: '4px 0', minWidth: 150, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <div onClick={() => { if(activeFile) handleRunFile(activeFile.name); setActiveMenu(null) }} style={{ padding: '6px 15px', cursor: 'pointer' }} className="hover-bg-light">Run Active File</div>
              </div>
            )}
          </div>
          
        </div>
        <div style={{ margin: '0 auto', fontSize: '12px', color: '#858585' }}>
          {activeFile?.name ? `${activeFile.name} — Apex AI Command Mode` : 'Apex AI Command Mode'}
        </div>
        <div style={{ display: 'flex' }}>
          <button 
            onClick={onClose}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', 
              border: '1px solid #555', color: '#ccc', padding: '4px 10px', 
              borderRadius: 4, cursor: 'pointer', fontSize: 12 
            }}
          >
            <LogOut size={12} />
            Voltar para Plataforma
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Activity Bar (Extreme Left) */}
        <div style={{ width: '48px', backgroundColor: '#333333', borderRight: '1px solid #252526', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 15, gap: 20 }}>
           <div style={{ color: '#ffffff', cursor: 'pointer', borderLeft: '2px solid #007acc', paddingLeft: 12, paddingRight: 14 }}>
             <FileCode size={24} strokeWidth={1.5} />
           </div>
           <div style={{ color: '#858585', cursor: 'pointer', paddingLeft: 14, paddingRight: 14 }}>
             <Search size={24} strokeWidth={1.5} />
           </div>
           <div style={{ color: '#858585', cursor: 'pointer', paddingLeft: 14, paddingRight: 14 }}>
             <GitBranch size={24} strokeWidth={1.5} />
           </div>
           <div style={{ flex: 1 }}></div>
           <div style={{ color: '#858585', cursor: 'pointer', paddingBottom: 15 }}>
             <Settings size={24} strokeWidth={1.5} />
           </div>
        </div>

        {/* Sidebar - Explorer */}
        {showExplorer && (
          <div style={{ width: '250px', backgroundColor: '#252526', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', fontSize: '11px', textTransform: 'uppercase', color: '#cccccc', letterSpacing: '0.5px' }}>
              Explorer
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
               <WorkspaceFileTree onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* Main Editor + Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setActiveMenu(null)}>
          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#252526', height: '35px' }}>
            {activeFile && (
               <div style={{ 
                 backgroundColor: '#1e1e1e', color: '#ffffff', padding: '0 15px', 
                 display: 'flex', alignItems: 'center', fontSize: 13, borderTop: '1px solid #007acc',
                 cursor: 'pointer'
               }}>
                 {activeFile.name}
               </div>
            )}
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditorPanel 
              activeFile={activeFile}
              onRunFile={handleRunFile}
              hasNativeHandle={false}
              onSaveNativeFile={handleSaveFile}
              onChangeContent={(val) => {
                if (activeFile) {
                  setActiveFile({ ...activeFile, content: val })
                }
              }}
            />
          </div>
          
          {showTerminal && (
            <div style={{ height: '300px', borderTop: '1px solid #333333', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', backgroundColor: '#1e1e1e', padding: '0 15px', height: '35px', alignItems: 'center', fontSize: '11px', textTransform: 'uppercase', color: '#858585', gap: 20 }}>
                <span style={{ cursor: 'pointer' }}>Problems</span>
                <span style={{ cursor: 'pointer' }}>Output</span>
                <span style={{ cursor: 'pointer' }}>Debug Console</span>
                <span style={{ borderBottom: '1px solid #007acc', color: '#ffffff', height: '35px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Terminal</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <TerminalPanel embedded={true} />
              </div>
            </div>
          )}
        </div>

        {/* AI Copilot Side Panel */}
        {showCopilot && (
          <div style={{ width: '400px', backgroundColor: '#1e1e1e', borderLeft: '1px solid #333333', position: 'relative', display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '10px 15px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cccccc' }}>
               CHAT - APEX AI COPILOT
             </div>
             <div style={{ flex: 1, overflow: 'hidden' }}>
               {/* Using embedded=true to force it into the div layout without floating */}
               <ApexCopilot embedded={true} />
             </div>
          </div>
        )}
      </div>
      
      {/* Footer / Status Bar */}
      <div style={{ height: '22px', backgroundColor: '#007acc', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '12px', color: '#ffffff' }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <GitBranch size={12} />
          <span>main</span>
          <span style={{ opacity: 0.8 }}>0</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>TypeScript React</span>
          <span>Prettier</span>
        </div>
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  )
}
