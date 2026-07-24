import { describe, it, expect } from 'vitest'
import { isKnowledgeBaseIntent, createKnowledgeBasePlan } from '../lib/knowledgeBaseKnowledge'
import { emptyContractsPlan, legalDisclaimer, permitRegions, contractDocumentTypes } from '../lib/contractsKnowledge'

describe('isKnowledgeBaseIntent', () => {
  it('detects "knowledge base"', () => {
    expect(isKnowledgeBaseIntent('show me the knowledge base')).toBe(true)
  })
  it('detects "base de conhecimento"', () => {
    expect(isKnowledgeBaseIntent('abrir base de conhecimento')).toBe(true)
  })
  it('detects "memória"', () => {
    expect(isKnowledgeBaseIntent('ver memória do projeto')).toBe(true)
  })
  it('detects "prompt template"', () => {
    expect(isKnowledgeBaseIntent('criar prompt template')).toBe(true)
  })
  it('returns false for unrelated text', () => {
    expect(isKnowledgeBaseIntent('gerar orçamento')).toBe(false)
    expect(isKnowledgeBaseIntent('analisar contrato')).toBe(false)
  })
})

describe('createKnowledgeBasePlan', () => {
  it('returns expected structure', () => {
    const plan = createKnowledgeBasePlan('teste de projeto')
    expect(plan.providerStatus).toBe('local-knowledge-index')
    expect(Array.isArray(plan.items)).toBe(true)
    expect(plan.items.length).toBeGreaterThan(0)
    expect(Array.isArray(plan.filters)).toBe(true)
    expect(plan.exportIndex).toBeTruthy()
  })

  it('items have required fields', () => {
    const plan = createKnowledgeBasePlan()
    for (const item of plan.items) {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(['file', 'skill', 'project note', 'web source', 'user correction', 'prompt template', 'code pattern']).toContain(item.sourceType)
      expect(['APPROVED_GLOBAL', 'PROJECT_MEMORY', 'USER_PROVIDED', 'NEEDS_REVIEW']).toContain(item.confidence)
      expect(['global', 'project']).toContain(item.scope)
    }
  })

  it('includes goal in project note summary when provided', () => {
    const plan = createKnowledgeBasePlan('análise de risco estrutural')
    const note = plan.items.find(i => i.sourceType === 'project note')
    expect(note?.summary).toContain('análise de risco estrutural')
  })
})

describe('contractsKnowledge constants', () => {
  it('legalDisclaimer is non-empty string', () => {
    expect(typeof legalDisclaimer).toBe('string')
    expect(legalDisclaimer.length).toBeGreaterThan(10)
  })

  it('permitRegions includes Brazil', () => {
    expect(permitRegions).toContain('Brazil')
  })

  it('contractDocumentTypes includes Contract', () => {
    expect(contractDocumentTypes).toContain('Contract')
  })
})

describe('emptyContractsPlan', () => {
  const ctx = {
    documentType: 'Contract' as const,
    projectName: 'Edifício Teste',
    parties: 'A e B',
    location: 'São Paulo, SP',
    region: 'Brazil' as const,
    country: 'Brasil',
    stateProvince: 'SP',
    cityMunicipality: 'São Paulo',
    ahjLocalAuthority: 'PMSP',
    language: 'pt-BR',
    reviewMode: 'Risk review' as const,
  }

  it('returns ready status', () => {
    const plan = emptyContractsPlan(ctx)
    expect(plan.providerStatus).toBe('ready')
  })

  it('sets detectedDocumentType from context', () => {
    const plan = emptyContractsPlan(ctx)
    expect(plan.detectedDocumentType).toBe('Contract')
  })

  it('sets jurisdictionStatus to ASSUMPTION when location given', () => {
    const plan = emptyContractsPlan(ctx)
    expect(plan.jurisdictionStatus).toBe('ASSUMPTION')
  })

  it('sets jurisdictionStatus to UNKNOWN when no location', () => {
    const plan = emptyContractsPlan({ ...ctx, location: '' })
    expect(plan.jurisdictionStatus).toBe('UNKNOWN')
  })

  it('has empty risk and permit arrays', () => {
    const plan = emptyContractsPlan(ctx)
    expect(plan.riskItems).toEqual([])
    expect(plan.permitChecklist).toEqual([])
  })

  it('message matches legalDisclaimer', () => {
    const plan = emptyContractsPlan(ctx)
    expect(plan.message).toBe(legalDisclaimer)
  })
})
