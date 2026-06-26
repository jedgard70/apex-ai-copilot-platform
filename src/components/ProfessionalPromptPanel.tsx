import { useEffect, useState } from 'react'
import { X, Search, BookOpen, Download, Sparkles, Palette, Camera, Home, FileText, Building2, Compass, Image, Layers } from 'lucide-react'

const MODULE_ICONS: Record<string, any> = {
  archvis: Palette,
  directcut: Camera,
  chat: Sparkles,
  marketing: Layers,
  contracts: FileText,
  export: Download,
}

const MODULE_COLORS: Record<string, string> = {
  archvis: '#8b5cf6',
  directcut: '#00f0ff',
  chat: '#3b82f6',
  marketing: '#f59e0b',
  contracts: '#10b981',
  export: '#ec4899',
}

export function ProfessionalPromptPanel({ onClear, initialModule, onSelectPrompt }: { onClear: () => void; initialModule?: string; onSelectPrompt?: (prompt: string) => void }) {
  const [categories, setCategories] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(initialModule || null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/prompts/categories').then(r => r.json()).then(d => {
      if (d.categories) setCategories(d.categories)
    }).finally(() => setLoading(false))
  }, [])

  async function loadCategory(id: string) {
    setLoading(true)
    const r = await fetch(`/api/prompts/category/${id}`)
    const d = await r.json()
    if (d.category) setSelected(d.category)
    setLoading(false)
  }

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/prompts/search?q=${encodeURIComponent(q)}`)
      const d = await r.json()
      setResults(d.results || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const filtered = activeModule
    ? categories.filter(c => c.module === activeModule)
    : categories

  return (
    <section style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <BookOpen size={14} style={{ display: 'inline' }} /> Biblioteca de Prompts
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Skills & Presets Profissionais</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{categories.length} categorias · {categories.reduce((s, c) => s + (c.items || 0), 0)}+ presets</p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#1f2937', borderRadius: '8px', padding: '6px 10px' }}>
        <Search size={14} color="#6b7280" />
        <input value={search} onChange={e => { setSearch(e.target.value); doSearch(e.target.value) }}
          placeholder="Buscar prompts, estilos, técnicas..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '12px', outline: 'none' }} />
      </div>

      {/* Module filter chips */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveModule(null)}
          style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: !activeModule ? '#3b82f6' : '#1f2937', color: !activeModule ? '#fff' : '#9ca3af' }}>Todos</button>
        {['archvis', 'directcut', 'chat', 'marketing', 'contracts', 'export'].map(m => {
          const Icon = MODULE_ICONS[m]
          return (
            <button key={m} onClick={() => setActiveModule(activeModule === m ? null : m)}
              style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: activeModule === m ? MODULE_COLORS[m] : '#1f2937', color: activeModule === m ? '#fff' : '#9ca3af' }}>
              <Icon size={10} /> {m === 'archvis' ? 'ArchVis' : m === 'directcut' ? 'DirectCut' : m === 'chat' ? 'Chat' : m === 'marketing' ? 'Marketing' : m === 'contracts' ? 'Contratos' : 'Export'}
            </button>
          )
        })}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Resultados para "{search}"</span>
          {results.slice(0, 20).map((r, i) => (
            <div key={i} style={{ padding: '8px 10px', background: '#1f2937', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => loadCategory(r.category.id)}>
              <span style={{ color: '#9ca3af', fontSize: '10px' }}>{r.category.name}</span>
              {r.preset && <div style={{ color: '#e2e8f0', marginTop: 2, fontWeight: 500 }}>{r.preset.name}</div>}
              {r.matchType === 'category' && <div style={{ color: '#e2e8f0', marginTop: 2 }}>{r.category.name}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Selected category detail */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>{selected.name}</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>Voltar</button>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{selected.description}</p>
          {selected.presets && selected.presets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selected.presets.map((p: any, i: number) => (
                <details key={i}>
                  <summary style={{ cursor: 'pointer', padding: '8px 10px', background: '#1f2937', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    {p.name}
                  </summary>
                  <div style={{ marginTop: '6px', padding: '8px 10px', background: '#111827', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {p.prompt}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(p.prompt);
                        }}
                        style={{
                          background: '#374151',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Copiar
                      </button>
                      {onSelectPrompt && (
                        <button
                          type="button"
                          onClick={() => onSelectPrompt(p.prompt)}
                          style={{
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Usar no Chat
                        </button>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Grid */}
      {!selected && (
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(cat => {
            const Icon = MODULE_ICONS[cat.module] || BookOpen
            const color = MODULE_COLORS[cat.module] || '#6b7280'
            return (
              <div key={cat.id} onClick={() => loadCategory(cat.id)}
                style={{ padding: '12px', background: '#1f2937', borderRadius: '8px', border: `1px solid #374151`, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{cat.name}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${color}22`, color }}>{cat.type}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{cat.description}</p>
                {cat.items && <div style={{ marginTop: '6px', fontSize: '10px', color: '#9ca3af' }}>{cat.items} itens</div>}
              </div>
            )
          })}
        </div>
      )}

      {!selected && filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
          <BookOpen size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
          <p style={{ margin: 0 }}>Nenhuma categoria encontrada</p>
        </div>
      )}
    </section>
  )
}
