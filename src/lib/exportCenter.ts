import { ProjectWorkspace } from './projectWorkspace'

export type ExportScope =
  | 'full-project'
  | 'archvis'
  | 'directcut'
  | 'bim-3d'
  | 'budget'
  | 'contracts-permits'
  | 'fieldops-rdo'
  | 'research-market'
  | 'evm-scheduler-nr'
  | 'supply-chain'
  | 'notifications'
  | 'ai-cost'
  | 'skill-package'
  | 'custom'

export type ExportFormat = 'json' | 'markdown' | 'txt' | 'csv' | 'zip-json'

export type ExportCenterRequest = {
  project: ProjectWorkspace
  exportScope: ExportScope
  format: ExportFormat
  includeImages: boolean
  includeChat: boolean
  selectedSections: string[]
}

export type ExportPackageFile = {
  filename: string
  mimeType: string
  content: string
  size: number
}

export type ExportPackageResult = {
  providerStatus: 'export-ready'
  files: ExportPackageFile[]
  warnings: string[]
  redactionSummary: string[]
}

export const exportScopes: { value: ExportScope; label: string }[] = [
  { value: 'full-project', label: 'Full project package' },
  { value: 'archvis', label: 'ArchVis package' },
  { value: 'directcut', label: 'DirectCut package' },
  { value: 'bim-3d', label: 'BIM / 3D package' },
  { value: 'budget', label: 'Budget package' },
  { value: 'contracts-permits', label: 'Contracts / Permits package' },
  { value: 'fieldops-rdo', label: 'FieldOps / RDO package' },
  { value: 'research-market', label: 'Research / Market package' },
  { value: 'evm-scheduler-nr', label: 'EVM / Scheduler / NR package' },
  { value: 'supply-chain', label: 'Supply Chain / Suppliers package' },
  { value: 'notifications', label: 'Notifications / Alerts package' },
  { value: 'ai-cost', label: 'AI Cost / Observability package' },
  { value: 'skill-package', label: 'Skill package' },
  { value: 'custom', label: 'Custom selection' },
]

export const exportFormats: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'txt', label: 'TXT' },
  { value: 'csv', label: 'CSV where table data exists' },
  { value: 'zip-json', label: 'ZIP-compatible JSON bundle' },
]

export const exportSections = [
  'project',
  'archvis',
  'directcut',
  'bim3d',
  'budget',
  'contracts',
  'fieldops',
  'research',
  'evm-scheduler-nr',
  'supply-chain',
  'notifications',
  'ai-cost',
  'skills',
]

export function isExportIntent(text: string) {
  return /\b(exportar projeto|baixar pacote|gerar pacote do cliente|exportar or[cç]amento|exportar contrato|exportar rdo|exportar bim report|exportar archvis|exportar evm|exportar cronograma|exportar nr|exportar compliance|exportar fornecedores|exportar supply chain|exportar alertas|exportar custo de ia|exportar observabilidade|exportar tudo|export center|export package|download package|client package)\b/i.test(text)
}

export function downloadExportFile(file: ExportPackageFile) {
  const blob = new Blob([file.content], { type: file.mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function copyExportFile(file: ExportPackageFile) {
  return navigator.clipboard?.writeText(file.content).catch(() => undefined)
}
