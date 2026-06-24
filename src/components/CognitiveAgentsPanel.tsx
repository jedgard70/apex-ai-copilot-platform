import { useEffect, useState } from 'react'
import { X, Play, Activity, AlertCircle, CheckCircle, Clock, RefreshCw, Loader2, Users, Brain, Zap, Shield, BarChart3, Target, GitBranch, LogOut } from 'lucide-react'

type Agent = { id: string; name: string; role: string; icon: string; description: string; capabilities: string[]; status: string; coordinationModel: string; lastRun: string | null; tasks: number; successRate: number; recentLog: any[] }
type CoordModel = { id: string; name: string; description: string }

export function CognitiveAgentsPanel({ onClear }: { onClear: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Agent | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [log, setLog] = useState<any[]>([])
  const [taskInput, setTaskInput] = useState('')
  const [models, setModels] = useState<CoordModel[]>([])
  const [executing, setExecuting] = useState<string | null>(null)
  const [coordinationResult, setCoordinationResult] = useState<any>(null)
  const [tab, setTab] = useState<'agents' | 'coordination' | 'log' | 'status'>('agents')

  async function load() {
    setLoading(true)
    try {
      const [a, s, l, m] = await Promise.all([
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/agents/status').then(r => r.json()),
        fetch('/api/agents/log').then(r => r.json()),
        fetch('/api/agents/models').then(r => r.json()),
      ])
      if (a.agents) setAgents(a.agents)
      if (s.totalAgents) setStatus(s)
      if (l.log) setLog(l.log)
      if (m.models) setModels(m.models)
    } catch { /* */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv) }, [])

  async function executeAgent(agentId: string) {
    if (!taskInput.trim()) return
    setExecuting(agentId)
    try {
      await fetch(`/api/agents/${agentId}/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput }),
      })
      setTaskInput('')
      await load()
    } catch { /* */ }
    finally { setExecuting(null) }
  }

  async function coordinateAll(modelId: string) {
    setExecuting('coord')
    try {
      const r = await fetch('/api/agents/coordinate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, objective: taskInput || 'Executar rotina padrão de análise', agentIds: [] }),
      })
      const d = await r.json()
      if (d.coordination) setCoordinationResult(d.coordination)
      await load()
    } catch { /* */ }
    finally { setExecuting(null) }
  }

  const statusColor = (s: string) => s === 'idle' ? '#6b7280' : s === 'running' ? '#3b82f6' : '#22c55e'
  const roleColors: Record<string, string> = { Engenharia: '#3b82f6', Arquitetura: '#8b5cf6', Planejamento: '#f59e0b', Operação: '#10b981', 'Inteligência': '#ec4899', Comercial: '#f97316', Financeiro: '#22c55e', 'Jurídico': '#ef4444', Infraestrutura: '#06b6d4', Estratégia: '#6366f1', 'Núcleo Central': '#a855f7' }

  return (
    <section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#a855f7', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Brain size={14} style={{ display: 'inline' }} /> Agentes Cognitivos ACIP
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>{agents.length} Agentes Especializados</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
            {status ? `${status.activeAgents} ativos · ${status.averageSuccessRate}% sucesso · ${status.totalTasksExecuted} tarefas` : 'Carregando...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={load} disabled={loading} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #1f2937' }}>
        {([{ id: 'agents', label: '🤖 Agentes', icon: Users }, { id: 'coordination', label: '🔄 Coordenação', icon: GitBranch }, { id: 'log', label: '📋 Log', icon: Activity }, { id: 'status', label: '📊 Status', icon: BarChart3 }] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: tab === t.id ? '2px solid #a855f7' : '2px solid transparent', background: 'transparent', color: tab === t.id ? '#e2e8f0' : '#6b7280' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TASK INPUT */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#1f2937', borderRadius: '8px', padding: '8px 12px' }}>
        <Target size={14} color="#a855f7" />
        <input value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="Descreva a tarefa para os agentes..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '12px', outline: 'none' }} />
        <button onClick={() => coordinateAll('parallel')} disabled={executing === 'coord' || !taskInput.trim()}
          style={{ padding: '4px 12px', borderRadius: '6px', background: '#a855f733', color: '#a855f7', border: '1px solid #a855f744', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
          {executing === 'coord' ? 'Executando...' : 'Executar Todos'}
        </button>
      </div>

      {/* COORDINATION RESULT */}
      {coordinationResult && (
        <div style={{ padding: '10px', background: '#1a1a2e', borderRadius: '8px', border: '1px solid #a855f744' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a855f7' }}>🔄 {coordinationResult.model}</span>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>{coordinationResult.agentsCount} agentes · {coordinationResult.summary.successRate}% sucesso</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <MiniStat label="Total" value={coordinationResult.summary.total} color="#6b7280" />
            <MiniStat label="✅" value={coordinationResult.summary.completed} color="#22c55e" />
            <MiniStat label="❌" value={coordinationResult.summary.failed} color="#ef4444" />
            <MiniStat label="🔄" value={coordinationResult.summary.selfHealed} color="#3b82f6" />
          </div>
        </div>
      )}

      {/* TAB: AGENTS */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gap: '6px' }}>
          {agents.map(agent => (
            <div key={agent.id} onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
              style={{ padding: '10px 12px', background: '#111827', borderRadius: '8px', border: `1px solid ${agent.status === 'running' ? '#3b82f644' : '#1f2937'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{agent.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{agent.name}</div>
                    <div style={{ fontSize: '10px', color: roleColors[agent.role] || '#6b7280' }}>{agent.role} · {agent.tasks} tarefas</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(agent.status) }} />
                  <button onClick={e => { e.stopPropagation(); executeAgent(agent.id) }} disabled={executing === agent.id || !taskInput.trim()}
                    style={{ background: 'none', border: '1px solid #374151', borderRadius: '4px', padding: '3px 8px', color: '#9ca3af', cursor: 'pointer', fontSize: '10px' }}>
                    {executing === agent.id ? <Loader2 size={12} className="spin-icon" /> : <Play size={12} />}
                  </button>
                </div>
              </div>
              {selected?.id === agent.id && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 6px' }}>{agent.description}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {agent.capabilities.map((c: string) => <span key={c} style={{ padding: '2px 8px', borderRadius: '999px', background: '#1f2937', fontSize: '10px', color: '#94a3b8' }}>{c}</span>)}
                  </div>
                  {agent.recentLog.length > 0 && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #1f2937', paddingTop: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>Últimas execuções:</span>
                      {agent.recentLog.map((entry: any) => (
                        <div key={entry.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '10px', padding: '2px 0' }}>
                          {entry.status === 'completed' ? <CheckCircle size={10} color="#22c55e" /> : entry.status === 'failed' ? <AlertCircle size={10} color="#ef4444" /> : <Clock size={10} color="#f59e0b" />}
                          <span style={{ color: '#6b7280' }}>{entry.task}</span>
                          <span style={{ color: '#4b5563' }}>{new Date(entry.startedAt).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB: COORDINATION */}
      {tab === 'coordination' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Selecione o modelo de coordenação para executar a tarefa com todos os agentes:</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {models.map(model => (
              <div key={model.id} onClick={() => coordinateAll(model.id)}
                style={{ padding: '12px', background: '#111827', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{model.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: 2 }}>{model.description}</div>
                  </div>
                  <button disabled={executing === 'coord' || !taskInput.trim()}
                    style={{ padding: '4px 12px', borderRadius: '6px', background: '#a855f7', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    {executing === 'coord' ? <Loader2 size={12} className="spin-icon" /> : 'Executar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: LOG */}
      {tab === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Últimas {log.length} execuções:</span>
          {log.map((entry: any) => (
            <div key={entry.id} style={{ padding: '8px 10px', background: '#111827', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {entry.status === 'completed' ? <CheckCircle size={12} color="#22c55e" /> : entry.status === 'failed' ? <AlertCircle size={12} color="#ef4444" /> : <Loader2 size={12} className="spin-icon" color="#3b82f6" />}
              <span style={{ color: '#9ca3af', minWidth: 120 }}>{entry.agentName}</span>
              <span style={{ color: '#e2e8f0', flex: 1 }}>{entry.task}</span>
              {entry.durationMs && <span style={{ color: '#6b7280' }}>{(entry.durationMs / 1000).toFixed(1)}s</span>}
              {entry.selfHealed && <span style={{ color: '#3b82f6', fontSize: '9px', background: '#3b82f622', padding: '1px 6px', borderRadius: '999px' }}>self-healed</span>}
            </div>
          ))}
          {log.length === 0 && <div style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>Nenhuma execução ainda.</div>}
        </div>
      )}

      {/* TAB: STATUS */}
      {tab === 'status' && status && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            <MiniStat label="Total Agentes" value={status.totalAgents} color="#a855f7" />
            <MiniStat label="Ativos" value={status.activeAgents} color="#3b82f6" />
            <MiniStat label="Inativos" value={status.idleAgents} color="#6b7280" />
            <MiniStat label="Tarefas" value={status.totalTasksExecuted} color="#22c55e" />
            <MiniStat label="% Sucesso" value={`${status.averageSuccessRate}%`} color="#f59e0b" />
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {status.agentsByRole?.map((group: any) => (
              <div key={group.role} style={{ padding: '10px', background: '#111827', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: roleColors[group.role] || '#e2e8f0', marginBottom: '6px' }}>
                  {group.role} ({group.count})
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {group.agents.map((a: any) => (
                    <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '999px', background: a.status === 'running' ? '#3b82f622' : '#1f2937', fontSize: '10px', color: a.status === 'running' ? '#93c5fd' : '#6b7280' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(a.status) }} />
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
    </section>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: '10px', background: '#111827', borderRadius: '8px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
