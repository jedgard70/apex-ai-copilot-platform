export type GenerationHistoryKind =
  | 'archvis-image'
  | 'directcut-plan'
  | 'export-package'
  | 'project-package'

export type GenerationHistoryStatus = 'completed' | 'failed'

export type GenerationHistoryEntry = {
  id: string
  kind: GenerationHistoryKind
  title: string
  sourceName?: string
  createdAt: string
  status: GenerationHistoryStatus
  summary: string
  artifactCount: number
  artifacts?: string[]
  metadata?: Record<string, unknown>
}
