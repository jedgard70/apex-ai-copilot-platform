import runtimeKnowledge from './runtimeKnowledge.json'

export type ToolDomain =
  | 'file-intake'
  | 'archvis'
  | 'directcut'
  | 'bim-viewer'
  | 'budget'
  | 'contracts'
  | 'field'
  | 'marketing'
  | 'platform-build'

export type CopilotTool = {
  id: ToolDomain
  name: string
  role: string
  trigger: string[]
  status: 'ready-shell' | 'planned'
}

export const tools = runtimeKnowledge.tools as CopilotTool[]

export function toolRegistrySummary() {
  return tools.map(tool => `${tool.name}: ${tool.role}`).join('\n')
}

export function selectTool(text: string, fileName = '') {
  const haystack = `${text} ${fileName}`.toLowerCase()
  return (
    tools.find(tool => tool.trigger.some(token => haystack.includes(token.toLowerCase()))) ||
    tools[0]
  )
}
