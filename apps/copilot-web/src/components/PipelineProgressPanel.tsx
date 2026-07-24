import { useEffect, useRef, useState } from 'react'
import {
  Activity, AlertCircle, CheckCircle, Clock, Cpu, ExternalLink, Image,
  Loader2, Megaphone, Minimize2, Maximize2, X, RefreshCw, FileText, Video,
} from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'queued' | 'running' | 'done' | 'error'

type TaskStep = {
  label: string
  status: TaskStatus
  detail?: string
  startedAt?: string
  endedAt?: string
}

type PipelineTask = {
  id: string
  type: string
  status: TaskStatus
  progress: number
  label: string
  steps: TaskStep[]
  currentStep: number
  meta?: Record<string, any>
  result?: string
  error?: string
  createdAt: string
  updatedAt: string
  endedAt?: string
}

type BriefStatus = {
  active: number
  queued: number
  done24h: number
  errors: number
  latest: string | null
}

// ─── Icon picker ─────────────────────────────────────────────────────────────

function taskIcon(type: string) {
  if (type.startsWith('generate-campaign')) return Megaphone
  if (type.startsWith('generate-image')) return Image
  if (type.startsWith('generate-video')) return Video
  if (type.startsWith('generate-document') || type.startsWith('generate-plan')) return FileText
  return Activity
}

function statusIcon(status: TaskStatus) {
  switch (status) {
    case 'queued': return <Clock size={12} color="#6b7280" />
    case 'running': return <Loader2 size={12} className="spin-icon" color="#3b82f6" />
    case 'done': return <CheckCircle size={12} color="#10b981" />
    case 'error': return <AlertCircle size={12} color="#ef4444" />
  }
}

// ─── Format duration ─────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  onClear: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PipelineProgressPanel({ onClear }: Props) {
  const [tasks, setTasks] = useState<PipelineTask[]>([])
  const [brief, setBrief] = useState<BriefStatus>({ active: 0, queued: 0, done24h: 0, errors: 0, latest: null })
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [showRecent, setShowRecent] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Poll active tasks ──
  async function fetchStatus() {
    try {
      const res = await fetch('/api/pipeline/active')
      const d = await res.json()
      if (d.tasks) setTasks(d.tasks)
      if (d.brief) setBrief(d.brief)
    } catch {
      // Silencio
    }
  }

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 2500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // ── Fetch recent (on demand) ──
  async function fetchRecent() {
    setLoading(true)
    try {
      const res = await fetch('/api/pipeline/recent')
      const d = await res.json()
      if (d.tasks) setTasks(d.tasks)
      if (d.brief) setBrief(d.brief)
      setShowRecent(true)
    } catch { /* */ }
    finally { setLoading(false) }
  }

  // ── Has anything happening? ──
  const hasActivity = brief.active > 0 || brief.queued > 0 || brief.errors > 0

  // ── Expandir automaticamente quando tem atividade ──
  useEffect(() => {
    if (hasActivity && !expanded) setExpanded(true)
  }, [brief.active, brief.queued, brief.errors])

  return (
    <PremiumPanelLayout
      title="Pipeline Status"
      subtitle={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {brief.active > 0 && `${brief.active} em execução`}
          {brief.active > 0 && brief.queued > 0 && ' | '}
          {brief.queued > 0 && `${brief.queued} na fila`}
          {!hasActivity && 'Nenhuma tarefa ativa'}
          {hasActivity && (brief.active > 0 || brief.queued > 0) && ` | ${brief.done24h} concluídas (24h)`}
        </span>
      }
      headerActions={
        <>
          <button
            onClick={() => { setShowRecent(!showRecent); if (!showRecent) fetchRecent() }}
            className="ghost-action"
            style={{ fontSize: '11px', padding: '4px 6px' }}
            title={showRecent ? 'Mostrar ativas' : 'Mostrar recentes'}
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="ghost-action" title={expanded ? 'Minimizar' : 'Expandir'}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Badge row */}
      {brief.done24h > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MiniBadge label="Em execução" count={brief.active} color="#3b82f6" />
          <MiniBadge label="Na fila" count={brief.queued} color="#6b7280" />
          <MiniBadge label="Concluídas" count={brief.done24h} color="#10b981" />
          <MiniBadge label="Erros" count={brief.errors} color="#ef4444" />
        </div>
      )}

      {/* Task list */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
              <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Nenhuma tarefa em execução</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Gere campanhas, imagens ou documentos para ver o progresso aqui</p>
            </div>
          )}
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .spin-icon { animation: spin 1s linear infinite }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes progress-stripes {
          from { background-position: 20px 0 }
          to { background-position: 0 0 }
        }
        .pipeline-progress-bar {
          height: 4px;
          border-radius: 2px;
          background: #1f2937;
          overflow: hidden;
        }
        .pipeline-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .pipeline-progress-fill.running {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          background-size: 20px 100%;
          animation: progress-stripes 0.8s linear infinite;
        }
        .pipeline-progress-fill.done { background: #10b981; }
        .pipeline-progress-fill.error { background: #ef4444; }
      `}</style>
      </div>
    </PremiumPanelLayout>
  )
}

// ─── MiniBadge ───────────────────────────────────────────────────────────────

function MiniBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
      background: color + '22', color, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {count} {label}
    </span>
  )
}

// ─── TaskCard ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: PipelineTask }) {
  const Icon = taskIcon(task.type)
  const isRunning = task.status === 'running'

  return (
    <div style={{
      background: '#111827', borderRadius: '8px', padding: '10px 12px',
      border: '1px solid ' + (isRunning ? '#1e3a5f' : '#1f2937'),
      transition: 'border-color 0.3s',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <Icon size={14} color={task.status === 'done' ? '#10b981' : task.status === 'error' ? '#ef4444' : '#3b82f6'} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.label || task.type}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#6b7280', whiteSpace: 'nowrap' }}>
          {fmtTime(task.createdAt)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="pipeline-progress-bar" style={{ marginBottom: '6px' }}>
        <div
          className={`pipeline-progress-fill ${task.status}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* Progress % and status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: task.status === 'done' ? '#10b981' : task.status === 'error' ? '#ef4444' : '#60a5fa' }}>
          {task.status === 'done' ? '✓ Concluído' : task.status === 'error' ? '✗ Erro' : `${task.progress}%`}
        </span>
        {task.result && <span style={{ fontSize: '10px', color: '#6b7280' }}>{task.result}</span>}
      </div>

      {/* Error message */}
      {task.error && (
        <div style={{ fontSize: '11px', color: '#ef4444', padding: '4px 8px', background: '#450a0a', borderRadius: '4px', marginBottom: '4px' }}>
          {task.error}
        </div>
      )}

      {/* Steps list */}
      {task.steps.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          {task.steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#9ca3af' }}>
              {statusIcon(step.status)}
              <span style={{
                flex: 1,
                color: step.status === 'done' ? '#d1d5db' : step.status === 'error' ? '#ef4444' : step.status === 'running' ? '#93c5fd' : '#6b7280',
                fontWeight: step.status === 'running' ? 600 : 400,
              }}>
                {step.label}
              </span>
              {step.endedAt && <span style={{ color: '#6b7280', fontSize: '9px' }}>{fmtTime(step.endedAt)}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Meta info */}
      {task.meta?.product && (
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
          Produto: {task.meta.product}
        </div>
      )}
    </div>
  )
}
