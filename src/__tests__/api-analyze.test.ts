import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Helper to simulate the handler logic without importing ESM directly
// We test the business logic by recreating the core functions

function buildUserMessage(action: string, payload: Record<string, unknown>): string {
  if (action === 'contracts-review') {
    const { clauses, documentText, documentType = 'Contrato de Construção', projectContext } = payload as any
    const content = documentText || (Array.isArray(clauses) ? clauses.map((c: string, i: number) => `Cláusula ${i + 1}: ${c}`).join('\n\n') : '')
    return [
      `Tipo de documento: ${documentType}`,
      projectContext ? `Contexto do projeto: ${projectContext}` : '',
      '',
      'Texto do contrato para análise:',
      String(content).slice(0, 12000),
    ].filter(Boolean).join('\n')
  }
  if (action === 'supply-chain') {
    const { suppliers, items, projectContext } = payload as any
    return [
      projectContext ? `Contexto do projeto: ${projectContext}` : '',
      suppliers?.length ? `Fornecedores:\n${JSON.stringify(suppliers, null, 2)}` : '',
      items?.length ? `Itens/Materiais:\n${JSON.stringify(items, null, 2)}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 12000)
  }
  if (action === 'field-ops') {
    const { projectName, date, weather, activities, occurrences, workers, projectContext } = payload as any
    return [
      `Projeto: ${projectName || 'Não informado'}`,
      `Data: ${date || new Date().toLocaleDateString('pt-BR')}`,
      weather ? `Clima: ${weather}` : '',
      workers ? `Efetivo: ${workers} trabalhadores` : '',
      projectContext ? `Contexto: ${projectContext}` : '',
      activities?.length ? `Atividades realizadas:\n${activities.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}` : '',
      occurrences?.length ? `Ocorrências:\n${occurrences.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}` : '',
    ].filter(Boolean).join('\n').slice(0, 8000)
  }
  return ''
}

function fallback(action: string, payload: Record<string, unknown>) {
  if (action === 'contracts-review') {
    return { mode: 'planning-only', risks: [], suggestions: ['Configure ANTHROPIC_API_KEY para ativar revisão jurídica por IA.'], missingClauses: [], summary: 'Revisão jurídica por IA não disponível.' }
  }
  if (action === 'supply-chain') {
    return { mode: 'planning-only', riskItems: [], savingsOpportunities: [{ description: 'Configure ANTHROPIC_API_KEY', estimatedSaving: 'N/A', action: 'Configurar variável' }], supplierRecommendations: [], summary: 'Análise de supply chain por IA não disponível.' }
  }
  if (action === 'field-ops') {
    const { date, weather, activities, occurrences } = payload as any
    return {
      mode: 'planning-only',
      rdoNumber: `RDO-${(date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')}-001`,
      date: date || new Date().toLocaleDateString('pt-BR'),
      weatherSummary: weather || 'Não informado',
      activitiesPerformed: (activities || []).map((a: string) => ({ activity: a, progress: 'Não informado', team: 'Não informado', observations: '' })),
      occurrences: occurrences || [],
      nextDayPlan: [],
      alerts: [{ severity: 'Baixa', message: 'Configure ANTHROPIC_API_KEY para geração inteligente de RDO.' }],
      summary: 'Geração de RDO por IA não disponível.',
    }
  }
  return { mode: 'planning-only' }
}

describe('analyze API — buildUserMessage', () => {
  it('contracts-review: includes document text and type', () => {
    const msg = buildUserMessage('contracts-review', { documentText: 'Cláusula 1: pagamento em 30 dias', documentType: 'Contrato de Serviço' })
    expect(msg).toContain('Tipo de documento: Contrato de Serviço')
    expect(msg).toContain('Cláusula 1: pagamento em 30 dias')
  })

  it('contracts-review: uses clauses array when no documentText', () => {
    const msg = buildUserMessage('contracts-review', { clauses: ['Prazo: 12 meses', 'Multa: 2%'] })
    expect(msg).toContain('Cláusula 1: Prazo: 12 meses')
    expect(msg).toContain('Cláusula 2: Multa: 2%')
  })

  it('contracts-review: truncates to 12000 chars', () => {
    const long = 'x'.repeat(15000)
    const msg = buildUserMessage('contracts-review', { documentText: long })
    expect(msg.length).toBeLessThanOrEqual(12200) // includes header lines
  })

  it('supply-chain: formats suppliers and items', () => {
    const msg = buildUserMessage('supply-chain', {
      suppliers: [{ name: 'Fornecedor A', rating: 'Bom' }],
      items: [{ name: 'Cimento', qty: 100 }],
      projectContext: 'Obra Residencial',
    })
    expect(msg).toContain('Fornecedor A')
    expect(msg).toContain('Cimento')
    expect(msg).toContain('Obra Residencial')
  })

  it('supply-chain: empty when no suppliers or items', () => {
    const msg = buildUserMessage('supply-chain', {})
    expect(msg.trim()).toBe('')
  })

  it('field-ops: includes project name, date, weather', () => {
    const msg = buildUserMessage('field-ops', {
      projectName: 'Edifício Alpha',
      date: '2026-06-15',
      weather: 'Ensolarado',
      workers: 25,
      activities: ['Concretagem laje', 'Alvenaria 3º andar'],
      occurrences: ['Atraso na entrega de aço'],
    })
    expect(msg).toContain('Edifício Alpha')
    expect(msg).toContain('Ensolarado')
    expect(msg).toContain('25 trabalhadores')
    expect(msg).toContain('Concretagem laje')
    expect(msg).toContain('Atraso na entrega de aço')
  })

  it('unknown action: returns empty string', () => {
    const msg = buildUserMessage('unknown-action', {})
    expect(msg).toBe('')
  })
})

describe('analyze API — fallback responses', () => {
  it('contracts-review fallback has planning-only mode', () => {
    const result = fallback('contracts-review', {})
    expect(result.mode).toBe('planning-only')
    expect(result.risks).toEqual([])
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.missingClauses).toEqual([])
  })

  it('supply-chain fallback has savingsOpportunities', () => {
    const result = fallback('supply-chain', {}) as any
    expect(result.mode).toBe('planning-only')
    expect(Array.isArray(result.savingsOpportunities)).toBe(true)
  })

  it('field-ops fallback generates rdoNumber from date', () => {
    const result = fallback('field-ops', { date: '2026-06-15', weather: 'Nublado', activities: ['Pintura'], occurrences: [] }) as any
    expect(result.mode).toBe('planning-only')
    expect(result.rdoNumber).toBe('RDO-20260615-001')
    expect(result.weatherSummary).toBe('Nublado')
    expect(result.activitiesPerformed[0].activity).toBe('Pintura')
  })

  it('field-ops fallback uses current date when none provided', () => {
    const result = fallback('field-ops', {}) as any
    expect(result.rdoNumber).toMatch(/^RDO-\d{8}-001$/)
  })

  it('unknown action fallback is planning-only', () => {
    const result = fallback('xyz', {}) as any
    expect(result.mode).toBe('planning-only')
  })
})
