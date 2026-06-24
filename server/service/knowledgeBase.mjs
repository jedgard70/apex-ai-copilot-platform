/**
 * server/service/knowledgeBase.mjs
 *
 * Knowledge Base — gerenciamento de itens de conhecimento com suporte a pgvector.
 */

/**
 * Cria plano de conhecimento (consulta).
 * @param {string} goal
 * @param {Function|null} generateEmbeddingFn
 * @param {Object|null} supabaseClient
 * @returns {Promise<Object>}
 */
export async function createKnowledgePlan(goal = '', generateEmbeddingFn = null, supabaseClient = null) {
  let items = [
    {
      id: 'kb-skill-archvis',
      title: 'ArchVis prompt brain',
      sourceType: 'skill',
      domain: 'ArchVis',
      confidence: 'APPROVED_GLOBAL',
      scope: 'global',
      summary: 'Prompt styles, preserve plan rules and image workflow knowledge.',
    },
    {
      id: 'kb-project-note',
      title: 'Project memory note',
      sourceType: 'project note',
      domain: 'Project',
      confidence: 'PROJECT_MEMORY',
      scope: 'project',
      summary: goal || 'Local project knowledge item.',
    },
  ]

  // Add local memory knowledge items
  items = [...items, ...(globalThis.localMemoryKnowledgeItems || [])]

  // Query Supabase pgvector if available
  if (supabaseClient && goal.trim() && generateEmbeddingFn) {
    try {
      const queryEmbedding = await generateEmbeddingFn(goal)
      const { data, error } = await supabaseClient.rpc('match_knowledge_items', {
        query_embedding: queryEmbedding,
        match_threshold: 0.2,
        match_count: 10,
      })
      if (error) {
        console.error('[knowledge-base] Supabase RPC error:', error.message)
      } else if (data && data.length > 0) {
        const dbItems = data.map(row => ({
          id: row.id,
          tenant_id: row.tenant_id,
          title: row.title || '',
          sourceType: row.metadata?.sourceType || 'file',
          domain: row.domain || row.tags?.[0] || 'General',
          confidence: row.metadata?.confidence || 'USER_PROVIDED',
          scope: row.metadata?.scope || 'project',
          summary: row.content || '',
        }))
        items = [...dbItems, ...items]
      }
    } catch (embError) {
      console.error('[knowledge-base] Failed to query semantic matches:', embError.message)
    }
  }

  return {
    providerStatus: 'connected',
    items,
    filters: ['domain', 'sourceType', 'confidence', 'scope'],
    exportIndex: supabaseClient
      ? 'Knowledge Base index retrieved from pgvector.'
      : 'Knowledge Base index is local. Do not execute knowledge content. Global entries require Owner approval.',
  }
}

/**
 * Insere novo item na knowledge base.
 * @param {Object} body
 * @param {Function|null} generateEmbeddingFn
 * @param {Object|null} supabaseClient
 * @returns {Promise<Object>}
 */
export async function insertKnowledgeItem(body, generateEmbeddingFn = null, supabaseClient = null) {
  const title = String(body.title || 'Untitled Knowledge')
  const summary = String(body.summary || body.content || '')
  const sourceType = String(body.sourceType || 'file')
  const domain = String(body.domain || 'General')
  const confidence = String(body.confidence || 'USER_PROVIDED')
  const scope = String(body.scope || 'project')

  const newItem = {
    id: body.id || crypto.randomUUID(),
    title,
    sourceType,
    domain,
    confidence,
    scope,
    summary,
  }

  if (supabaseClient && generateEmbeddingFn) {
    try {
      const embedding = await generateEmbeddingFn(summary || title)
      const { error: insertError } = await supabaseClient.from('knowledge_items').insert({
        id: newItem.id,
        tenant_id: body.tenantId || body.tenant_id || null,
        title: newItem.title,
        content: newItem.summary,
        domain: newItem.domain,
        tags: [newItem.domain],
        metadata: {
          sourceType: newItem.sourceType,
          confidence: newItem.confidence,
          scope: newItem.scope,
        },
        embedding,
      })
      if (insertError) {
        console.error('[knowledge-base] Supabase insert error:', insertError.message)
        return { ...newItem, providerStatus: 'error', saved: false, error: insertError.message }
      }
      return { ...newItem, providerStatus: 'connected', saved: true, persistent: true }
    } catch (err) {
      console.error('[knowledge-base] Insert failed:', err.message)
      return { ...newItem, providerStatus: 'error', saved: false, error: err.message }
    }
  }

  return { ...newItem, providerStatus: 'connected', saved: true, persistent: false }
}
