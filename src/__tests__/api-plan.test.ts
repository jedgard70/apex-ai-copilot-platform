import { describe, it, expect } from 'vitest'

// Replicate plan handler fallback logic for unit testing

function handleFieldOpsFallback(payload: Record<string, unknown>) {
  const { date, weather, activities = [], occurrences = [] } = payload as any
  return {
    mode: 'planning-only',
    studioAction: 'field-ops',
    projectName: (payload as any).projectName || 'Não informado',
    date: date || new Date().toLocaleDateString('pt-BR'),
    weatherSummary: weather || 'Não informado',
    activities: Array.isArray(activities) ? activities : [],
    occurrences: Array.isArray(occurrences) ? occurrences : [],
  }
}

function handleResearchFallback(payload: Record<string, unknown>) {
  const { query, topic = 'general' } = payload as any
  return {
    mode: 'planning-only',
    studioAction: 'research',
    query: query || '',
    topic,
    results: [],
    message: 'Configure TAVILY_API_KEY para pesquisa web e análise.',
  }
}

function handleKnowledgeFallback(payload: Record<string, unknown>) {
  const { goal = '' } = payload as any
  return {
    mode: 'planning-only',
    studioAction: 'knowledge',
    providerStatus: 'local-knowledge-index',
    goal,
    items: [
      { id: 'kb-skill-archvis', title: 'ArchVis prompt brain', sourceType: 'skill', domain: 'ArchVis', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: 'Prompt styles, preserve plan rules and image workflow knowledge.' },
      { id: 'kb-project', title: 'Memória do projeto', sourceType: 'project note', domain: 'Projeto', confidence: 'PROJECT_MEMORY', scope: 'project', summary: goal || 'Conhecimento local do projeto.' },
    ],
    filters: ['domain', 'sourceType', 'confidence', 'scope'],
    exportIndex: 'Índice local. Não executar conteúdo. Entradas globais requerem aprovação do Proprietário.',
  }
}

function handleBimTourFallback(payload: Record<string, unknown>) {
  const { tourSteps = [], target = 'report' } = payload as any
  return {
    mode: 'planning-only',
    tourTitle: 'Tour BIM (planejamento)',
    objective: 'Revisar modelo BIM e preparar roteiro de apresentação.',
    audience: 'Equipe de obra',
    orderedSteps: tourSteps.length ? tourSteps : [{ name: 'Vista geral', description: 'Visão completa do modelo' }],
    cameraPath: [],
    narration: 'Tour BIM disponível com GEMINI_API_KEY para geração inteligente.',
    storyboard: '',
    durationEstimate: '5-10 min',
    exportNotes: `Destino: ${target}`,
  }
}

describe('plan API — field-ops fallback', () => {
  it('returns planning-only mode', () => {
    const r = handleFieldOpsFallback({})
    expect(r.mode).toBe('planning-only')
    expect(r.studioAction).toBe('field-ops')
  })

  it('uses provided weather and date', () => {
    const r = handleFieldOpsFallback({ weather: 'Chuvoso', date: '15/06/2026' })
    expect(r.weatherSummary).toBe('Chuvoso')
    expect(r.date).toBe('15/06/2026')
  })

  it('activities defaults to empty array', () => {
    const r = handleFieldOpsFallback({})
    expect(r.activities).toEqual([])
  })

  it('passes activities through', () => {
    const r = handleFieldOpsFallback({ activities: ['Concretagem', 'Alvenaria'] })
    expect(r.activities).toEqual(['Concretagem', 'Alvenaria'])
  })
})

describe('plan API — research fallback', () => {
  it('returns planning-only mode with results array', () => {
    const r = handleResearchFallback({ query: 'SINAPI 2024' })
    expect(r.mode).toBe('planning-only')
    expect(r.results).toEqual([])
    expect(r.query).toBe('SINAPI 2024')
  })

  it('defaults topic to general', () => {
    const r = handleResearchFallback({})
    expect(r.topic).toBe('general')
  })

  it('message mentions required env vars', () => {
    const r = handleResearchFallback({})
    expect(r.message).toContain('TAVILY_API_KEY')
    expect(r.message).toContain('TAVILY_API_KEY')
  })
})

describe('plan API — knowledge fallback', () => {
  it('returns local-knowledge-index providerStatus', () => {
    const r = handleKnowledgeFallback({ goal: 'obra residencial' })
    expect(r.providerStatus).toBe('local-knowledge-index')
  })

  it('items include APPROVED_GLOBAL entry', () => {
    const r = handleKnowledgeFallback({})
    const approved = r.items.find(i => i.confidence === 'APPROVED_GLOBAL')
    expect(approved).toBeTruthy()
  })

  it('project memory item summary uses goal', () => {
    const r = handleKnowledgeFallback({ goal: 'análise estrutural' })
    const mem = r.items.find(i => i.confidence === 'PROJECT_MEMORY')
    expect(mem?.summary).toContain('análise estrutural')
  })

  it('filters array is non-empty', () => {
    const r = handleKnowledgeFallback({})
    expect(r.filters.length).toBeGreaterThan(0)
  })
})

describe('plan API — bim-tour fallback', () => {
  it('returns planning-only mode', () => {
    const r = handleBimTourFallback({})
    expect(r.mode).toBe('planning-only')
  })

  it('uses provided tourSteps', () => {
    const steps = [{ name: 'Fachada', description: 'Vista da fachada principal' }]
    const r = handleBimTourFallback({ tourSteps: steps })
    expect(r.orderedSteps).toEqual(steps)
  })

  it('defaults to one step when no tourSteps', () => {
    const r = handleBimTourFallback({})
    expect(r.orderedSteps.length).toBe(1)
    expect(r.orderedSteps[0].name).toBe('Vista geral')
  })

  it('includes target in exportNotes', () => {
    const r = handleBimTourFallback({ target: 'twinmotion' })
    expect(r.exportNotes).toContain('twinmotion')
  })

  it('narration mentions ANTHROPIC_API_KEY', () => {
    const r = handleBimTourFallback({})
    expect(r.narration).toContain('ANTHROPIC_API_KEY')
  })
})
