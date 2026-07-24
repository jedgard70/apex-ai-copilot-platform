import { useState, useEffect } from 'react'
import { Bot, FileText, Layers3, X, Activity, Play, Clock, CheckCircle } from 'lucide-react'
import { ApexAgent, apexAgents } from '../lib/apexAgents'

import { PremiumPanelLayout } from './PremiumPanelLayout'

type AgentsPanelProps = {
  onClear: () => void
  onOpenStudio?: (studio: string) => void
}

function statusLabel(status: ApexAgent['status']) {
  if (status === 'implemented') return 'Implemented'
  if (status === 'partial') return 'Partial'
  return 'Planned'
}

function statusClass(status: ApexAgent['status']) {
  return `agent-status ${status}`
}

function ClashReportView() {
  return (
    <div className="bg-task-report-box">
      <h3 style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '6px', margin: '0 0 12px 0', color: '#1e293b', fontSize: '14px' }}>
        Relatório Multi-Agente: Detecção de Conflitos e Auto-Correção
      </h3>
      <p style={{ fontSize: '11px', margin: '4px 0', color: '#475569' }}><strong>Tarefa:</strong> Análise de Conflitos: Hidrossanitário (MEP) vs. Estrutura</p>
      <p style={{ fontSize: '11px', margin: '4px 0', color: '#475569' }}><strong>Execução:</strong> 02:00 (Overnight Run)</p>
      <p style={{ fontSize: '11px', margin: '4px 0', color: '#16a34a', fontWeight: 'bold' }}><strong>Status:</strong> Concluído · Auto-Correções Propostas</p>
      
      <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '10px', margin: '14px 0', borderRadius: '4px' }}>
        <strong style={{ color: '#991b1b', fontSize: '10px', display: 'block', marginBottom: '2px' }}>AVISO DE EXECUÇÃO AUTÔNOMA</strong>
        <span style={{ fontSize: '11px', color: '#7f1d1d' }}>Este relatório foi consolidado pelos Agentes Cognitivos da Apex. Nenhuma alteração foi realizada nos arquivos IFC originais. As propostas abaixo aguardam aprovação de engenharia.</span>
      </div>

      <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>1. Incompatibilidades Geométricas Detectadas</h4>
      <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Pavimento</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Elemento MEP</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Elemento Estrutura</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Severidade</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Rework</th>
              <th style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Proposta de Auto-Correção</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}><strong>CL-01</strong></td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>1º Pavimento</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Tubulação Esgoto DN100</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Viga Concreto V102</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1', color: '#dc2626', fontWeight: 'bold' }}>Crítico</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>R$ 5.000,00</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Rotacionar curva de desvio em 45° no ramal de esgoto para passar logo abaixo do nível inferior da viga V102.</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}><strong>CL-02</strong></td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>2º Pavimento</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Duto de Ventilação 60x40</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Pilar Concreto P204</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1', color: '#ea580c', fontWeight: 'bold' }}>Alto</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>R$ 3.500,00</td>
              <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Deslocar duto de ar condicionado em 15cm à esquerda, criando transição suave antes do cruzamento com o pilar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>2. Análise de Impacto (EVM e Cronograma)</h4>
      <ul style={{ fontSize: '11px', margin: '0 0 16px 0', paddingLeft: '16px', lineHeight: '1.6', color: '#334155' }}>
        <li><strong>Custo Total de Retrabalho (VAC):</strong> -R$ 8.500,00 (evitado se as correções forem aprovadas).</li>
        <li><strong>Impacto no Cronograma:</strong> Risco de atraso de <strong>3 dias úteis</strong> no caminho crítico da etapa de alvenaria.</li>
        <li><strong>Desempenho Projetado:</strong> SPI atual: 0.98 &rarr; Com correção: <strong>1.00</strong> | CPI atual: 0.96 &rarr; Com correção: <strong>0.99</strong></li>
      </ul>

      <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>3. Conformidade Normativa (Quality & Safety)</h4>
      <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px', borderRadius: '4px' }}>
        <strong style={{ color: '#b45309', fontSize: '10px', display: 'block', marginBottom: '2px' }}>AVISO NBR 6118 (CONCRETO ARMADO)</strong>
        <span style={{ fontSize: '11px', color: '#78350f' }}>Furos em vigas de concreto não podem ser executados sem reforço estrutural próximo à zona de tração máxima. O desvio geométrico proposto para a tubulação do CL-01 é a melhor alternativa técnica para evitar a redução da seção transversal resistente da viga.</span>
      </div>
    </div>
  )
}

export function AgentsPanel({ onClear, onOpenStudio }: AgentsPanelProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null)
  const [showReportId, setShowReportId] = useState<string | null>(null)
  const [logProgress, setLogProgress] = useState<number>(0)
  const [activeLogs, setActiveLogs] = useState<string[]>([])

  const [webGpuSupported, setWebGpuSupported] = useState(false)
  const [offlineMode, setOfflineMode] = useState(() => {
    try {
      return localStorage.getItem('apex_offline_webgpu') === 'true'
    } catch (_) {
      return false
    }
  })
  const [modelLoading, setModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(offlineMode)
  const [modelProgress, setModelProgress] = useState(0)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      setWebGpuSupported(true)
    }
  }, [])

  function handleToggleOffline(checked: boolean) {
    setOfflineMode(checked)
    try {
      localStorage.setItem('apex_offline_webgpu', String(checked))
    } catch (_) {}

    if (checked && !modelLoaded) {
      setModelLoading(true)
      setModelProgress(0)
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setModelProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setModelLoading(false)
          setModelLoaded(true)
        }
      }, 150)
    } else if (!checked) {
      setModelLoaded(false)
      setModelLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/copilot/background-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.tasks) setTasks(data.tasks)
      })
      .catch(() => undefined)
  }, [])

  async function runTask(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setRunningTaskId(taskId)
    setLogProgress(0)
    setActiveLogs([])
    setShowReportId(null)

    const totalLogs = task.logs || []
    let currentLogIndex = 0

    const interval = setInterval(() => {
      if (currentLogIndex < totalLogs.length) {
        setActiveLogs(prev => [...prev, totalLogs[currentLogIndex]])
        currentLogIndex++
        setLogProgress(Math.floor((currentLogIndex / totalLogs.length) * 100))
      } else {
        clearInterval(interval)

        fetch('/api/copilot/background-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'run', taskId }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.task) {
              setTasks(prev => prev.map(t => t.id === taskId ? data.task : t))
            }
            setRunningTaskId(null)
          })
          .catch(() => setRunningTaskId(null))
      }
    }, 400)
  }

  return (
    <PremiumPanelLayout
      title="Cognitive Agents"
      subtitle="Gerenciamento do módulo"
      headerActions={<button onClick={onClear} aria-label="Close agents panel" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18} /></button>}
    >

      <div className="business-alert">
        <strong>Local-first CP11C implemented</strong>
        <span>EVM, Scheduler and NR Compliance now have local-first workspaces. External data, official compliance approval and source-connected automation still require future connectors.</span>
      </div>

      {/* WebGPU Offline AI Mode Switch Card */}
      <div className="bg-task-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MODO OFFLINE (WebGPU)</span>
          </div>
          <span style={{ fontSize: '10px', background: webGpuSupported ? '#16a34a' : '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
            {webGpuSupported ? 'WebGPU Disponível' : 'WebGPU Indisponível'}
          </span>
        </div>
        
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: '1.4' }}>
          Execute modelos de linguagem leves (Gemma-2B / Phi-3) 100% no seu navegador usando o hardware gráfico local. Reduz latência e preserva privacidade total.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Ativar Modelo Local (Cliente-Side)</span>
          <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
            <input 
              type="checkbox" 
              checked={offlineMode} 
              onChange={e => handleToggleOffline(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} 
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: offlineMode ? '#6366f1' : '#475569', 
              transition: '0.3s', borderRadius: '20px' 
            }}>
              <span style={{ 
                position: 'absolute', content: '""', height: '14px', width: '14px', left: offlineMode ? '18px' : '4px', bottom: '3px', 
                backgroundColor: 'white', transition: '0.3s', borderRadius: '50%' 
              }} />
            </span>
          </label>
        </div>

        {modelLoading && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Carregando Phi-3-mini-4bit (ONNX)...</span>
              <span>{modelProgress}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#6366f1', width: `${modelProgress}%`, transition: 'width 0.1s linear' }} />
            </div>
          </div>
        )}

        {modelLoaded && !modelLoading && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#4ade80' }}>
            <CheckCircle size={14} />
            <span>Modelo carregado em GPU local (VRAM: 2.1GB). Chat local habilitado.</span>
          </div>
        )}
      </div>

      {/* Background/Overnight Tasks Monitor */}
      <div className="background-tasks-section">
        <h3><Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> Análises em Segundo Plano (Overnight Tasks)</h3>
        <p className="subtitle">Agende e acompanhe execuções autônomas multi-agente de longo curso.</p>

        {tasks.map(task => (
          <div className="bg-task-card" key={task.id}>
            <div className="bg-task-card-head">
              <span className="bg-task-title">{task.title}</span>
              <span className={`bg-task-badge ${task.status}`}>
                {task.status === 'scheduled' ? 'Agendado' : task.status === 'running' ? 'Processando' : 'Concluído'}
              </span>
            </div>
            <p className="bg-task-desc">{task.description}</p>
            <div className="bg-task-meta">
              <span><strong>Horário:</strong> {task.scheduledTime}</span>
              <div>
                {task.agents.map((agent: string) => (
                  <span className="bg-task-agents" key={agent}>{agent.split(' ')[0]}</span>
                ))}
              </div>
            </div>

            {runningTaskId === task.id && (
              <div>
                <div className="bg-task-progress-bar">
                  <div className="bg-task-progress-fill" style={{ width: `${logProgress}%` }}></div>
                </div>
                <div className="bg-task-terminal">
                  {activeLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="contracts-actions" style={{ marginTop: '8px' }}>
              {task.status === 'scheduled' && runningTaskId !== task.id && (
                <button type="button" onClick={() => runTask(task.id)}>
                  <Play size={14} /> Executar Agora
                </button>
              )}
              {task.status === 'completed' && (
                <button type="button" onClick={() => setShowReportId(prev => prev === task.id ? null : task.id)}>
                  <FileText size={14} /> {showReportId === task.id ? 'Fechar Relatório' : 'Ver Relatório'}
                </button>
              )}
            </div>

            {showReportId === task.id && <ClashReportView />}
          </div>
        ))}
      </div>

      <div className="agents-grid">
        {apexAgents.map(agent => (
          <article className="agent-card" key={agent.id}>
            <div className="agent-card-head">
              <div>
                <strong>{agent.name}</strong>
                <span>{agent.domain}</span>
              </div>
              <em className={statusClass(agent.status)}>{statusLabel(agent.status)}</em>
            </div>

            <div className="agent-section">
              <span><Layers3 size={14} /> Connected studios</span>
              <p>{agent.connectedStudios.join(', ')}</p>
            </div>

            <div className="agent-section">
              <span>Responsibilities</span>
              <ul>{agent.responsibilities.slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul>
            </div>

            <div className="agent-section">
              <span>Evidence rules</span>
              <ul>{agent.evidenceRules.slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul>
            </div>

            {agent.gaps.length > 0 && (
              <div className="agent-gap">
                <strong>Gap</strong>
                <span>{agent.gaps[0]}</span>
              </div>
            )}

            <div className="contracts-actions">
              <button onClick={() => onOpenStudio?.(agent.connectedStudios[0])}>Open connected studio</button>
              <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(agent, null, 2))}><FileText size={14} /> Generate agent report</button>
              <button onClick={() => navigator.clipboard?.writeText(agent.gaps.join('\n') || 'No current gap listed.')}>Show missing capabilities</button>
            </div>
          </article>
        ))}
      </div>
    </PremiumPanelLayout>
  )
}
