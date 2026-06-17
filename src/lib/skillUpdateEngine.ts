export type SkillUpdateCategory =
  | 'global-rule'
  | 'project-memory'
  | 'prompt-template'
  | 'archvis-skill'
  | 'directcut-skill'
  | 'bim-3d-skill'
  | 'revit-skill'
  | 'windows-coding-skill'
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
  storageTargets: string[]
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

export type SkillUpdateStorageLayer = 'trusted' | 'project-memory' | 'global-skill' | 'learned-file'

const TRUSTED_GLOBAL_SKILL_NAME_PATTERNS = [
  /(^|[\/])skill\.md$/i,
  /(^|[\/])skills?\.md$/i,
  /(^|[\/])apex.*skill.*\.md$/i,
  /(^|[\/])global.*skill.*\.md$/i,
  /(^|[\/])copilot.*skill.*\.md$/i,
  /(^|[\/])(governance|permissions|platform-status|support-skills-map|evaluation-harness-sample|copilot-advanced|mcp-builder-guide|folder-structure|analyzer-agent)\.md$/i,
  /(^|[\/])(skill-update-log|runtime-knowledge|knowledge-pack|readme-import|reference-index|handoff|prompt|rules)\.md$/i,
]

const TRUSTED_GLOBAL_SKILL_PATH_PATTERNS = [
  /(^|[\/])skills[\/].*\.md$/i,
  /(^|[\/])skills[\/].*([\/])skill\.md$/i,
  /(^|[\/])skills[\/].*([\/])references[\/].*\.md$/i,
  /(^|[\/])skills[\/].*([\/])(integracao.*|.*-drafts.*|.*-knowledge.*)\.md$/i,
  /(^|[\/])skills[\/].*([\/])(?:governance|permissions|platform-status|support-skills-map|evaluation-harness-sample|copilot-advanced|mcp-builder-guide|folder-structure|analyzer-agent)\.md$/i,
  /(^|[\/])skills[\/]approved[\/].*\.md$/i,
  /(^|[\/])skills[\/]trusted[\/].*\.md$/i,
]

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
  // H5.1F: removed mem[oó]ria/memoria/brain/prompt — too broad, triggers on memory conversations
  return /\b(atualiza(?:r)? skill|incorpora(?:r)? skill|aprend(?:er|a) skill|adiciona(?:r)? skill|skill update|update.*skill|add.*memory|ingest.*skill|skill.*export|aprenda isso|incorpore isso|adicione isso)\b/i.test(text)
}

export function isTrustedGlobalSkillSource(fileName: string, text = '', relativePath = '') {
  const normalized = `${fileName || ''}\n${text || ''}`.toLowerCase()
  const pathText = String(relativePath || '').replace(/\\/g, '/')
  return TRUSTED_GLOBAL_SKILL_NAME_PATTERNS.some(pattern => pattern.test(normalized))
    || TRUSTED_GLOBAL_SKILL_PATH_PATTERNS.some(pattern => pattern.test(pathText))
    || /\b(references|reference|handoffs?|governance|permissions|platform status|skills map|skill map)\b/i.test(normalized)
}

export function classifySkillUpdateStorageLayer(fileName: string, relativePath = ''): SkillUpdateStorageLayer {
  const pathText = String(relativePath || '').replace(/\\/g, '/')
  if (/skills\/(approved|trusted)\//i.test(pathText)) return 'trusted'
  if (/\bskills\//i.test(pathText)) return 'global-skill'
  if (/\blearned\//i.test(pathText)) return 'learned-file'
  if (/\.md$/i.test(fileName) && pathText) return 'project-memory'
  return 'project-memory'
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
