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
  | 'international-market-strategy'
  | 'platform-engineering-devops'
  | 'owner-command'
  | 'export-center'
  | 'skill-export'
  | 'saas-crm-finance'
  | 'cognitive-agents'
  | 'windows-care-coding'
  | 'evm-scheduler-compliance'
  | 'supply-chain'
  | 'notifications-alerts'
  | 'ai-cost-observability'
  | 'multi-tenant-readiness'
  | 'pwa-mobile-field'
  | 'digital-twin'
  | 'knowledge-base'
  | 'metrics-dashboard'
  | 'copilot-execution'
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
