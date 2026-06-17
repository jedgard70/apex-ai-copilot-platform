import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle, Clipboard, Download, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { getBrowserSupabaseClient } from '../lib/supabaseClient'
import { createKnowledgeBasePlan, KnowledgeBasePlan } from '../lib/knowledgeBaseKnowledge'

type Props = {
  goal: string
  conversationContext: string[]
  tenantId?: string
  projectId?: string
  isOwnerAdmin?: boolean
  onSaveToProject?: (plan: KnowledgeBasePlan) => void
  onClear: () => void
}

type KBItem = {
  id: string
  title: string
  source_type: string
  domain: string | null
  scope: string
  source_confidence: string
  status: string
  created_at: string
  metadata: Record<string, unknown>
}

function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

const CONFIDENCE_LABELS: Record<string, string> = {
  APPROVED_GLOBAL: '✅ Aprovado Global',
  PROJECT_MEMORY: '📁 Memória do Projeto',
  USER_PROVIDED: '👤 Fornecido pelo Usuário',
  NEEDS_REVIEW: '⚠️ Aguarda Revisão',
}

export function KnowledgeBasePanel({ goal, conversationContext, tenantId, projectId, isOwnerAdmin, onSaveToProject, onClear }: Props) {
  const [items, setItems] = useState<KBItem[]>([])
  const [filter, setFilter] = useState('')
  const [semanticQuery, setSemanticQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newSourceType, setNewSourceType] = useState('user correction')
  const [newScope, setNewScope] = useState<'project' | 'global'>('project')
  const [newText, setNewText] = useState('')

  const { client } = getBrowserSupabaseClient()

  async function loadItems() {
    if (!client) {
      const plan = createKnowledgeBasePlan(goal)
      setItems(plan.items.map((i, idx) => ({
        id: String(idx),
        title: i.title,
        source_type: i.sourceType,
        domain: i.domain,
        scope: i.scope,
        source_confidence: i.confidence,
        status: 'active',
        created_at: new Date().toISOString(),
        metadata: { summary: i.summary },
      })))
      return
    }
    setLoading(true)
    try {
      let q = client.from('knowledge_items').select('id,title,source_type,domain,scope,source_confidence,status,created_at,metadata').eq('status', 'active').order('created_at', { ascending: false })
      if (tenantId) q = q.eq('tenant_id', tenantId)
      if (projectId) q = q.eq('project_id', projectId)
      const { data, error: err } = await q
      if (err) throw err
      setItems(data || [])
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }

  async function semanticSearch() {
    if (!client || !semanticQuery.trim()) return
    setLoading(true)
    setError('')
    try {
      const embResp = await fetch('/api/copilot/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'embed', text: semanticQuery }),
      })
      const embData = await embResp.json()
      if (!embData.embedding) { setError('Embedding não disponível (configure OPENAI_API_KEY)'); return }

      const { data, error: err } = await client.rpc('match_knowledge_items', {
        query_embedding: embData.embedding,
        match_threshold: 0.5,
        match_count: 20,
        p_tenant_id: tenantId || null,
        p_project_id: projectId || null,
      })
      if (err) throw err
      setItems(data || [])
    } catch (e: any) {
      setError(e.message || 'Erro na busca semântica')
    } finally {
      setLoading(false)
    }
  }

  async function addItem() {
    if (!newTitle.trim() || !newText.trim()) return
    setAdding(true)
    setError('')
    try {
      let embedding: number[] | null = null
      const embResp = await fetch('/api/copilot/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'embed', text: newText }),
      })
      const embData = await embResp.json()
      if (embData.embedding) embedding = embData.embedding

      if (client && tenantId) {
        const row: Record<string, unknown> = {
          title: newTitle.trim(),
          source_type: newSourceType,
          domain: newDomain.trim() || null,
          scope: newScope,
          source_confidence: 'USER_PROVIDED',
          status: 'active',
          tenant_id: tenantId,
          metadata: { summary: newText.slice(0, 300) },
        }
        if (projectId) row.project_id = projectId
        if (embedding) row.embedding = embedding
        const { error: err } = await client.from('knowledge_items').insert(row)
        if (err) throw err
        await loadItems()
      } else {
        setItems(prev => [{
          id: Date.now().toString(),
          title: newTitle.trim(),
          source_type: newSourceType,
          domain: newDomain.trim() || null,
          scope: newScope,
          source_confidence: 'USER_PROVIDED',
          status: 'active',
          created_at: new Date().toISOString(),
          metadata: { summary: newText.slice(0, 300), _local: true },
        }, ...prev])
      }
      setNewTitle(''); setNewDomain(''); setNewText(''); setNewSourceType('user correction'); setNewScope('project')
      setShowAdd(false)
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar item')
    } finally {
      setAdding(false)
    }
  }

  async function deleteItem(id: string) {
    if (!client) { setItems(prev => prev.filter(i => i.id !== id)); return }
    const { error: err } = await client.from('knowledge_items').update({ status: 'archived' }).eq('id', id)
    if (err) { setError(err.message); return }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function approveItem(id: string) {
    if (!client) return
    const { error: err } = await client.from('knowledge_items').update({ source_confidence: 'APPROVED_GLOBAL' }).eq('id', id)
    if (err) { setError(err.message); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, source_confidence: 'APPROVED_GLOBAL' } : i))
  }

  useEffect(() => { loadItems() }, [tenantId, projectId])

  const filtered = items.filter(i =>
    `${i.title} ${i.domain || ''} ${i.source_type} ${i.source_confidence}`.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <section className="contracts-studio">
      <div className="contracts-heading">
        <div>
          <span><BookOpen size={16} /> Knowledge Base</span>
          <h2>Índice de conhecimento local</h2>
          <p>Conteúdo de conhecimento não é executado. Escopo global requer aprovação do Owner.</p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>

      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Busca textual</strong>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por título, domínio..." />
          </div>

          <div className="contracts-card">
            <strong>Busca semântica</strong>
            <input value={semanticQuery} onChange={e => setSemanticQuery(e.target.value)} placeholder="Descreva o que busca..." />
            <button className="contracts-primary" onClick={semanticSearch} disabled={loading}>
              <Search size={14} /> Buscar
            </button>
            <button onClick={loadItems} disabled={loading} style={{ marginTop: 4 }}>Recarregar todos</button>
          </div>

          <div className="contracts-card">
            <strong>Ações</strong>
            <button onClick={() => copy(JSON.stringify(items, null, 2))}><Clipboard size={15} /> Copiar índice</button>
            <button onClick={() => download('apex-knowledge.json', JSON.stringify(items, null, 2))}><Download size={15} /> Exportar JSON</button>
            <button onClick={() => onSaveToProject?.(createKnowledgeBasePlan(goal))}><Save size={15} /> Salvar no Projeto</button>
          </div>
        </aside>

        <div className="contracts-main">
          {error && <div className="contracts-card" style={{ color: '#ef4444' }}>{error}</div>}

          {showAdd && (
            <div className="contracts-card" style={{ marginBottom: 12 }}>
              <strong>Adicionar item de conhecimento</strong>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título *" />
                <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="Domínio (ex: estrutura, MEP, contratos)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select value={newSourceType} onChange={e => setNewSourceType(e.target.value)}>
                    <option value="user correction">Correção do usuário</option>
                    <option value="file">Arquivo</option>
                    <option value="project note">Nota do projeto</option>
                    <option value="web source">Fonte web</option>
                    <option value="prompt template">Template de prompt</option>
                    <option value="code pattern">Padrão de código</option>
                    <option value="skill">Habilidade</option>
                  </select>
                  <select value={newScope} onChange={e => setNewScope(e.target.value as 'project' | 'global')}>
                    <option value="project">Escopo: Projeto</option>
                    <option value="global">Escopo: Global</option>
                  </select>
                </div>
                <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Conteúdo do conhecimento *" rows={4} style={{ resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="contracts-primary" onClick={addItem} disabled={adding || !newTitle.trim() || !newText.trim()}>
                    {adding ? 'Salvando...' : <><Plus size={14} /> Adicionar</>}
                  </button>
                  <button onClick={() => setShowAdd(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <div className="contracts-card contracts-table-card">
            <div className="contracts-section-head">
              <strong>Itens de conhecimento</strong>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{filtered.length}</span>
                <button className="contracts-primary" onClick={() => setShowAdd(s => !s)} style={{ padding: '4px 10px', fontSize: 12 }}>
                  <Plus size={13} /> Novo item
                </button>
              </div>
            </div>
            {loading ? (
              <p style={{ padding: 16, color: '#888' }}>Carregando...</p>
            ) : (
              <div className="contracts-table-wrap">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Fonte</th>
                      <th>Domínio</th>
                      <th>Confiança</th>
                      <th>Escopo</th>
                      <th>Resumo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.source_type}</td>
                        <td>{item.domain || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{CONFIDENCE_LABELS[item.source_confidence] || item.source_confidence}</td>
                        <td>{item.scope}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(item.metadata?.summary || '—')}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                          {isOwnerAdmin && item.source_confidence === 'NEEDS_REVIEW' && (
                            <button title="Aprovar globalmente" onClick={() => approveItem(item.id)} style={{ padding: '2px 6px' }}>
                              <CheckCircle size={13} />
                            </button>
                          )}
                          <button title="Remover" onClick={() => deleteItem(item.id)} style={{ padding: '2px 6px', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Nenhum item encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
