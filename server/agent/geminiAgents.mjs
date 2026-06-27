// Orchestrator para os diferentes modelos e personas da IA Gemini
// Com base nas ativações feitas pelo Owner.

const AGENT_PROFILES = {
  'gemini-3.5-flash': {
    id: 'agent-flash-speed',
    name: 'Agente Flash (Rápido)',
    description: 'Agente padrão para respostas ultrarrápidas, triagem e tarefas cotidianas (Assistant).',
    systemPrompt: 'Você é um assistente rápido e objetivo. Dê respostas diretas e execute comandos de forma ágil.',
    toolsEnabled: ['personal_assistant', 'whatsapp', 'google_workspace']
  },
  'gemini-3.1-pro-preview': {
    id: 'agent-pro-master',
    name: 'Agente Mestre (Arquitetura e Código)',
    description: 'Agente avançado para raciocínio complexo, planejamento de arquitetura e análise pesada de dados.',
    systemPrompt: 'Você é um engenheiro de software e analista de dados especialista. Pense passo-a-passo e detalhe arquiteturas.',
    toolsEnabled: ['owner_executor', 'terminal', 'file_system']
  },
  'flash-image': {
    id: 'agent-vision',
    name: 'Agente Visual',
    description: 'Agente especializado em analisar plantas de arquitetura, fotos de obras e gerar descrições visuais.',
    systemPrompt: 'Você é um especialista em visão computacional voltado para engenharia civil.',
    toolsEnabled: ['vision_analysis']
  },
  'gemma-4': {
    id: 'agent-gemma-local',
    name: 'Agente Gemma (Local/Seguro)',
    description: 'Agente local otimizado para dados sensíveis ou offline.',
    systemPrompt: 'Você é um modelo enxuto operando com foco máximo em privacidade de dados.',
    toolsEnabled: []
  }
}

export function getAvailableAgents() {
  return Object.values(AGENT_PROFILES)
}

export function routeTaskToAgent(task, preferredAgentId = null) {
  // Se o usuário pedir um agente específico
  if (preferredAgentId) {
    const agent = Object.values(AGENT_PROFILES).find(a => a.id === preferredAgentId)
    if (agent) return agent
  }

  // Roteamento inteligente baseado na tarefa
  const t = task.toLowerCase()
  if (t.includes('imagem') || t.includes('foto') || t.includes('planta')) {
    return AGENT_PROFILES['flash-image']
  }
  if (t.includes('arquitetura') || t.includes('código') || t.includes('analisar o banco')) {
    return AGENT_PROFILES['gemini-3.1-pro-preview']
  }
  
  // Fallback para o Flash (rápido)
  return AGENT_PROFILES['gemini-3.5-flash']
}

export function getAgentContext(agentId) {
  const agent = Object.values(AGENT_PROFILES).find(a => a.id === agentId)
  if (!agent) throw new Error('Agente não encontrado')
  return {
    systemPrompt: agent.systemPrompt,
    tools: agent.toolsEnabled,
    identity: agent.name
  }
}
