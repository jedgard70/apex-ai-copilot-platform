export type CopilotExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'blocked' | 'timeout'

export type CopilotExecutionRisk = 'low' | 'medium' | 'high'

export type CopilotExecutionSource = 'allowlist' | 'api' | 'ui' | 'raw-shell'

export type CopilotExecutionCommand = {
  id: string
  label: string
  description: string
  cwd: string
  executable: string
  args: string[]
  acceptsRawCommand?: boolean
  risk: CopilotExecutionRisk
  requiresApproval: boolean
  timeoutMs: number
  source: CopilotExecutionSource
}

export type CopilotExecutionRequest = {
  id: string
  commandId: string
  rawCommand?: string
  cwd?: string
  note?: string
  context?: string
  createdBy: string
  approvedBy?: string
  approvalText?: string
}

export type CopilotExecutionResult = {
  id: string
  commandId: string
  label: string
  cwd: string
  args: string[]
  rawCommand?: string
  shell: boolean
  status: CopilotExecutionStatus
  stdout: string
  stderr: string
  exitCode: number | null
  startedAt: string
  finishedAt: string
  durationMs: number
  createdBy: string
  risk: CopilotExecutionRisk
  requiresApproval: boolean
  approvedBy?: string
  redactedOutput: boolean
}
