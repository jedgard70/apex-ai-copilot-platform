import { useMemo, useState } from 'react'
import { BookOpen, Clipboard, Compass, Download, Search, X } from 'lucide-react'
import { createPlatformMapSections } from '../lib/platformMapKnowledge'

type Props = {
  onClear: () => void
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function statusLabel(status: 'ready' | 'partial' | 'planned') {
  if (status === 'ready') return 'Ready'
  if (status === 'partial') return 'Partial'
  return 'Planned'
}

export function PlatformMapPanel({ onClear }: Props) {
  const [filter, setFilter] = useState('')
  const sections = useMemo(() => createPlatformMapSections(), [])
  const normalizedFilter = filter.trim().toLowerCase()
  const filteredSections = sections
    .map(section => ({
      ...section,
      features: section.features.filter(feature => {
        if (!normalizedFilter) return true
        return `${section.title} ${feature.name} ${feature.summary} ${feature.command} ${feature.outputs.join(' ')}`
          .toLowerCase()
          .includes(normalizedFilter)
      }),
    }))
    .filter(section => section.features.length > 0)

  return (
    <section className="contracts-studio">
      <div className="contracts-heading">
        <div>
          <span><Compass size={16} /> Platform Map</span>
          <h2>Interactive platform manual</h2>
          <p>Mapa navegável das funcionalidades reais, parciais e planejadas da Apex no app e no site.</p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Buscar funcionalidade</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Search size={14} />
              <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Ex: orçamento, BIM, status, CRM..." />
            </div>
          </div>

          <div className="contracts-card">
            <strong>Como usar</strong>
            <p style={{ margin: '8px 0 0', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5 }}>
              Cada item mostra o que existe, o comando natural para abrir e o que ele entrega.
            </p>
          </div>

          <div className="contracts-card">
            <strong>Ações</strong>
            <button onClick={() => copy(JSON.stringify(sections, null, 2))}><Clipboard size={15} /> Copiar mapa</button>
            <button onClick={() => download('apex-platform-map.json', JSON.stringify(sections, null, 2))}><Download size={15} /> Exportar JSON</button>
          </div>
        </aside>

        <div className="contracts-main">
          {filteredSections.map(section => (
            <div key={section.id} className="contracts-card" style={{ marginBottom: 12 }}>
              <div className="contracts-section-head">
                <strong><BookOpen size={15} style={{ marginRight: 6 }} /> {section.title}</strong>
                <span>{section.features.length} item(ns)</span>
              </div>
              <p style={{ margin: '8px 0 14px', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5 }}>{section.summary}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {section.features.map(feature => (
                  <details key={`${section.id}-${feature.name}`} open={!normalizedFilter}>
                    <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontWeight: 600 }}>{feature.name}</span>
                      <span className={`status-chip ${feature.status}`}>{statusLabel(feature.status)}</span>
                    </summary>
                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                      <div><strong>O que faz:</strong> {feature.summary}</div>
                      <div><strong>Comando:</strong> <code>{feature.command}</code></div>
                      <div><strong>Entrega:</strong> {feature.outputs.join(' · ')}</div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
