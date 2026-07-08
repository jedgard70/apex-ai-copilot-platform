/**
 * AiThinkingSteps.tsx
 * Visualiza os passos da AI em tempo real durante o processamento:
 * "Explored 2 files", "Edited main.tsx +39 -14", "Working...", etc.
 */

import React, { useEffect, useRef, useState } from 'react'

export type ThinkingStepType =
  | 'thinking'
  | 'searching'
  | 'reading'
  | 'editing'
  | 'running'
  | 'calling'
  | 'done'
  | 'error'

export interface ThinkingStep {
  id: string
  type: ThinkingStepType
  label: string
  detail?: string
  count?: number
  diff?: { added: number; removed: number }
  ts: number
  done?: boolean
}

interface AiThinkingStepsProps {
  steps: ThinkingStep[]
  isActive: boolean
  collapsed?: boolean
  onToggle?: () => void
}

const STEP_ICONS: Record<ThinkingStepType, string> = {
  thinking: '💭',
  searching: '🔍',
  reading:  '📄',
  editing:  '✏️',
  running:  '▶️',
  calling:  '🔧',
  done:     '✅',
  error:    '❌',
}

const STEP_COLORS: Record<ThinkingStepType, string> = {
  thinking: '#94a3b8',
  searching:'#60a5fa',
  reading:  '#a78bfa',
  editing:  '#34d399',
  running:  '#fbbf24',
  calling:  '#f472b6',
  done:     '#4ade80',
  error:    '#f87171',
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      animation: 'apex-pulse 1.2s infinite',
      flexShrink: 0,
    }} />
  )
}

function StepRow({ step, isLast, isActive }: { step: ThinkingStep; isLast: boolean; isActive: boolean }) {
  const color = STEP_COLORS[step.type]
  const isPulsing = isLast && isActive && !step.done

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '3px 0',
      opacity: step.done === false && !isLast ? 0.65 : 1,
      transition: 'opacity 0.3s',
    }}>
      {/* Timeline dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3px', flexShrink: 0 }}>
        {isPulsing
          ? <PulsingDot color={color} />
          : <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: step.done ? STEP_COLORS.done : color, flexShrink: 0, display: 'inline-block' }} />
        }
        {!isLast && <div style={{ width: '1px', height: '14px', background: '#1e293b', marginTop: '3px' }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: color, fontFamily: 'monospace', fontWeight: 500 }}>
            {step.label}
          </span>

          {/* Count badge */}
          {step.count !== undefined && (
            <span style={{
              fontSize: '11px', color: '#94a3b8',
              background: 'rgba(148,163,184,0.1)', borderRadius: '4px',
              padding: '0 5px',
            }}>
              ×{step.count}
            </span>
          )}

          {/* Diff badge for edits */}
          {step.diff && (
            <span style={{ fontSize: '11px', display: 'flex', gap: '4px' }}>
              {step.diff.added > 0 && (
                <span style={{ color: '#4ade80' }}>+{step.diff.added}</span>
              )}
              {step.diff.removed > 0 && (
                <span style={{ color: '#f87171' }}>-{step.diff.removed}</span>
              )}
            </span>
          )}

          {/* Working spinner */}
          {isPulsing && (
            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              Working...
            </span>
          )}
        </div>

        {/* Detail line */}
        {step.detail && (
          <div style={{
            fontSize: '11px',
            color: '#475569',
            marginTop: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '340px',
          }}>
            {step.detail}
          </div>
        )}
      </div>
    </div>
  )
}

export function AiThinkingSteps({ steps, isActive, collapsed: initialCollapsed = false, onToggle }: AiThinkingStepsProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [steps, collapsed])

  // Auto-collapse when done
  useEffect(() => {
    if (!isActive && steps.length > 0) {
      const t = setTimeout(() => setCollapsed(true), 2500)
      return () => clearTimeout(t)
    }
  }, [isActive, steps.length])

  if (steps.length === 0) return null

  const searchCount = steps.filter(s => s.type === 'searching').length
  const fileCount   = steps.filter(s => s.type === 'reading').length
  const editCount   = steps.filter(s => s.type === 'editing').length

  const summaryParts: string[] = []
  if (searchCount > 0) summaryParts.push(`${searchCount} search${searchCount > 1 ? 'es' : ''}`)
  if (fileCount > 0)   summaryParts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`)
  if (editCount > 0)   summaryParts.push(`${editCount} edit${editCount > 1 ? 's' : ''}`)

  return (
    <>
      <style>{`
        @keyframes apex-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>

      <div style={{
        margin: '6px 0 8px 0',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        background: 'rgba(15,23,42,0.6)',
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: '12px',
        backdropFilter: 'blur(4px)',
      }}>
        {/* Header / toggle */}
        <button
          onClick={() => { setCollapsed(c => !c); onToggle?.() }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 10px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: '#64748b', textAlign: 'left',
          }}
        >
          {isActive && <PulsingDot color="#6366f1" />}
          <span style={{ fontSize: '11px', color: '#475569', flex: 1 }}>
            {isActive
              ? '🤖 AI working...'
              : `Explored ${summaryParts.join(', ') || 'context'}`
            }
          </span>
          <span style={{ fontSize: '10px', color: '#334155' }}>
            {collapsed ? '›' : '⌄'}
          </span>
        </button>

        {/* Steps list */}
        {!collapsed && (
          <div
            ref={scrollRef}
            style={{
              padding: '4px 12px 10px 10px',
              maxHeight: '220px',
              overflowY: 'auto',
              borderTop: '1px solid #0f172a',
            }}
          >
            {steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                isLast={i === steps.length - 1}
                isActive={isActive}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Helper to parse tool call events from SSE stream ───────────────────────

export function parseThinkingStepFromEvent(event: string): ThinkingStep | null {
  try {
    const data = JSON.parse(event)
    if (!data?.type) return null

    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
    const ts = Date.now()

    switch (data.type) {
      case 'tool_call':
        return { id, ts, type: 'calling', label: `Calling ${data.name || 'tool'}`, detail: data.args ? JSON.stringify(data.args).slice(0, 60) : undefined }
      case 'tool_result':
        return { id, ts, type: 'reading', label: `Got result from ${data.name || 'tool'}`, done: true }
      case 'search':
        return { id, ts, type: 'searching', label: `Searching: ${data.query || '...'}`, detail: data.query }
      case 'read_file':
        return { id, ts, type: 'reading', label: `Reading ${data.file || 'file'}`, detail: data.file }
      case 'edit_file':
        return { id, ts, type: 'editing', label: `Editing ${data.file || 'file'}`, diff: data.diff, done: true }
      case 'thinking':
        return { id, ts, type: 'thinking', label: data.text || 'Thinking...' }
      default:
        return null
    }
  } catch {
    return null
  }
}

export default AiThinkingSteps
