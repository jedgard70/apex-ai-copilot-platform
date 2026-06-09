import { Bot, FileText, Layers3, X } from 'lucide-react'
import { ApexAgent, apexAgents } from '../lib/apexAgents'

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

export function AgentsPanel({ onClear, onOpenStudio }: AgentsPanelProps) {
  return (
    <section className="agents-studio contracts-studio">
      <div className="contracts-head">
        <div>
          <span><Bot size={16} /> Cognitive Agents</span>
          <h2>8-agent intelligence layer</h2>
          <p>Agent coverage is honest: planned/partial agents are not marked done until their underlying studios and evidence pipelines exist.</p>
        </div>
        <button onClick={onClear} aria-label="Close agents panel"><X size={18} /></button>
      </div>

      <div className="business-alert">
        <strong>Local-first CP11C implemented</strong>
        <span>EVM, Scheduler and NR Compliance now have local-first workspaces. External data, official compliance approval and source-connected automation still require future connectors.</span>
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
    </section>
  )
}
