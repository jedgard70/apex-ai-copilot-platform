export type SkillUpdateCategory =
  | 'global-rule'
  | 'project-memory'
  | 'prompt-template'
  | 'archvis-skill'
  | 'directcut-skill'
  | 'bim-3d-skill'
  | 'code-platform-pattern'
  | 'business-marketing'
  | 'writing-negotiation'
  | 'data-sql'
  | 'obsolete-unsafe-ignore'

export type SkillUpdateApprovalType = 'project-memory' | 'global-skill-update'

export type SkillUpdateRiskLevel = 'low' | 'medium' | 'high'

export type SkillUpdateFilePayload = {
  name: string
  type: string
  size: number
  extension: string
  text?: string
  metadataOnly?: boolean
}

export type SkillUpdateAnalysis = {
  updateId: string
  timestamp: string
  sourceFilename: string
  category: SkillUpdateCategory
  targetDomain: string
  summary: string
  understood: string[]
  additions: string[]
  updates: string[]
  ignored: string[]
  warnings: string[]
  duplicates: string[]
  conflicts: string[]
  riskLevel: SkillUpdateRiskLevel
  recommendedTarget: SkillUpdateApprovalType
  sanitizedText: string
  rollbackNote: string
}

export type SkillUpdateApplyResult = {
  updateId: string
  timestamp: string
  approvalType: SkillUpdateApprovalType
  sourceFilename: string
  summary: string
  targetDomain: string
  affectedFiles: string[]
  rollbackNote: string
  applied: boolean
}

export type ProjectMemoryUpdate = {
  updateId: string
  timestamp: string
  sourceFilename: string
  summary: string
  targetDomain: string
  category: SkillUpdateCategory
  content: string
  warnings: string[]
}

const SUPPORTED_EXTENSIONS = new Set(['txt', 'md', 'json', 'pdf', 'py', 'js', 'ts', 'tsx', 'zip'])
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'py', 'js', 'ts', 'tsx'])

export function getFileExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() || ''
}

export function isSkillUpdateSupported(fileName: string) {
  return SUPPORTED_EXTENSIONS.has(getFileExtension(fileName))
}

export function isSkillTextReadable(fileName: string) {
  return TEXT_EXTENSIONS.has(getFileExtension(fileName))
}

export function isSkillUpdateIntent(text: string) {
  return /\b(atualiza|atualizar|incorpora|incorporar|aprenda|aprender|adicione|adicionar|skill|mem[oó]ria|memoria|brain|prompt|refer[eê]ncia|reference|learn|ingest|update.*skill|add.*memory)\b/i.test(text)
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-openai-key]')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-token]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-pat]')
    .replace(/\b[A-Za-z0-9_-]*service[_-]?role[A-Za-z0-9_:\-."= ]{8,}/gi, '[redacted-service-role-reference]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}/gi, '$1=[redacted-secret]')
}

export async function buildSkillUpdatePayload(file: File): Promise<SkillUpdateFilePayload> {
  const extension = getFileExtension(file.name)
  const base: SkillUpdateFilePayload = {
    name: file.name,
    type: file.type,
    size: file.size,
    extension,
  }

  if (!isSkillTextReadable(file.name)) {
    return { ...base, metadataOnly: true }
  }

  const text = await file.text()
  return {
    ...base,
    text: redactSensitiveText(text).slice(0, 120000),
    metadataOnly: false,
  }
}

export function buildProjectMemoryUpdate(analysis: SkillUpdateAnalysis, editedContent?: string): ProjectMemoryUpdate {
  return {
    updateId: analysis.updateId,
    timestamp: new Date().toISOString(),
    sourceFilename: analysis.sourceFilename,
    summary: analysis.summary,
    targetDomain: analysis.targetDomain,
    category: analysis.category,
    content: editedContent?.trim() || analysis.sanitizedText || analysis.additions.join('\n'),
    warnings: analysis.warnings,
  }
}
