export type SkillExportTarget =
  | 'chatgpt'
  | 'gemini'
  | 'claude'
  | 'api'
  | 'cursor-codex'
  | 'generic-md'
  | 'generic-json'
  | 'zip-bundle'

export type SkillExportLanguage = 'EN' | 'PT' | 'bilingual'

export type SkillExportFormat = 'md' | 'json' | 'zip-compatible'

export type SkillExportRequest = {
  skillName: string
  description: string
  targetPlatform: SkillExportTarget
  domains: string[]
  includedReferences: string[]
  outputFormat: SkillExportFormat
  language: SkillExportLanguage
}

export type SkillExportFile = {
  path: string
  content: string
  type: 'markdown' | 'json' | 'yaml' | 'text'
}

export type SkillExportPackage = {
  exportId: string
  createdAt: string
  skillName: string
  description: string
  targetPlatform: SkillExportTarget
  outputFormat: SkillExportFormat
  language: SkillExportLanguage
  domains: string[]
  files: SkillExportFile[]
  mainPrompt: string
  warnings: string[]
  importInstructions: string[]
}

export const exportTargets: { id: SkillExportTarget; label: string; description: string }[] = [
  { id: 'chatgpt', label: 'ChatGPT Skill package', description: 'SKILL.md, agent manifest and references.' },
  { id: 'gemini', label: 'Gemini Gem instructions', description: 'Gem instructions and reference index.' },
  { id: 'claude', label: 'Claude Project pack', description: 'Project instructions plus knowledge index.' },
  { id: 'api', label: 'OpenAI API prompt pack', description: 'System prompt, tool registry, memory index and runtime rules.' },
  { id: 'cursor-codex', label: 'Cursor/Codex prompt pack', description: 'Agent prompt, repo rules and implementation checklist.' },
  { id: 'generic-md', label: 'Generic Markdown pack', description: 'Portable markdown knowledge pack.' },
  { id: 'generic-json', label: 'Generic JSON registry', description: 'Machine-readable registry for custom runtimes.' },
  { id: 'zip-bundle', label: 'ZIP-compatible bundle', description: 'Folder-shaped export with all portable files.' },
]

export const exportDomains = [
  'Apex Copilot behavior',
  'ArchVis / Humanizacao',
  'DirectCut / Video',
  'BIM / 3D / Viewer',
  'Project Workspace',
  'Skill Update / Memory',
  'Business / Marketing',
  'Coding / Platform',
  'Data / SQL',
  'Writing / Negotiation',
]

export function isSkillExportIntent(text: string) {
  return /\b(gera|gerar|cria|criar|exporta|exportar|skill para chatgpt|gem para gemini|gemini|claude|codex|cursor|prompt pack|zip da skill|skill pack|knowledge pack|system prompt|pack de prompt)\b/i.test(text)
}

export function sanitizeExportText(value: string) {
  return value
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-openai-key]')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-token]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-pat]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}/gi, '$1=[redacted-secret]')
}

export function buildSkillExportRequest(targetPlatform: SkillExportTarget = 'chatgpt'): SkillExportRequest {
  return {
    skillName: 'Apex AI Copilot',
    description: 'Portable Apex AI Copilot knowledge and behavior pack.',
    targetPlatform,
    domains: ['Apex Copilot behavior', 'ArchVis / Humanizacao', 'DirectCut / Video', 'BIM / 3D / Viewer'],
    includedReferences: ['runtime knowledge', 'tool registry', 'approved skill updates'],
    outputFormat: targetPlatform === 'generic-json' ? 'json' : 'zip-compatible',
    language: 'bilingual',
  }
}

export function serializeExportPackage(pack: SkillExportPackage) {
  return JSON.stringify(pack, null, 2)
}
