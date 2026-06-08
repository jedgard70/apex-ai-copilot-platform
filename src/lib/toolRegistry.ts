import { toolData } from './toolData'

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
  | 'coding-support'
  | 'data-analysis'
  | 'academic-research'
  | 'visual-design'
  | 'negotiation'
  | 'tech-support'
  | 'writing-humanizer'
  | 'interior-design'
  | 'website-design'
  | 'revit-customization'
  | 'research-market-intelligence'
  | 'exploration'

export type CopilotTool = {
  id: ToolDomain
  name: string
  role: string
  trigger: string[]
}

export const tools = toolData

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
