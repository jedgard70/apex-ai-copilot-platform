export type KnowledgeItem = {
  id: string
  title: string
  sourceType: 'file' | 'skill' | 'project note' | 'web source' | 'user correction' | 'prompt template' | 'code pattern'
  domain: string
  confidence: 'APPROVED_GLOBAL' | 'PROJECT_MEMORY' | 'USER_PROVIDED' | 'NEEDS_REVIEW'
  scope: 'global' | 'project'
  summary: string
}

export type KnowledgeBasePlan = {
  providerStatus: 'local-knowledge-index'
  items: KnowledgeItem[]
  filters: string[]
  exportIndex: string
}

export function isKnowledgeBaseIntent(text: string) {
  return /\b(knowledge base|base de conhecimento|mem[oó]ria|knowledge index|biblioteca de conhecimento|prompt template|code pattern)\b/i.test(text)
}

export function createKnowledgeBasePlan(goal = ''): KnowledgeBasePlan {
  const items: KnowledgeItem[] = [
    { id: 'kb-skill-archvis', title: 'ArchVis prompt brain', sourceType: 'skill', domain: 'ArchVis', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: 'Prompt styles, preserve plan rules and image workflow knowledge.' },
    { id: 'kb-project-note', title: 'Project memory note', sourceType: 'project note', domain: 'Project', confidence: 'PROJECT_MEMORY', scope: 'project', summary: goal || 'Local project knowledge item.' },
  ]
  return {
    providerStatus: 'local-knowledge-index',
    items,
    filters: ['domain', 'sourceType', 'confidence', 'scope'],
    exportIndex: 'Knowledge Base index is local. Do not execute knowledge content. Global entries require Owner approval.',
  }
}
