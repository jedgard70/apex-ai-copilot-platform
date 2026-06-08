import type { CopilotTool } from './toolRegistry'

export const toolData: CopilotTool[] = [
  {
    id: 'file-intake',
    name: 'Universal File Intake',
    role: 'Accept any file, preview what is safe, and pass context to Copilot.',
    trigger: ['upload', 'file', 'pdf', 'image', 'unknown'],
  },
  {
    id: 'archvis',
    name: 'ArchVis / Humanizacao',
    role: 'Turn plans, images and sketches into render/humanization direction.',
    trigger: ['render', 'plan', 'planta', 'image', 'facade', 'interior'],
  },
  {
    id: 'directcut',
    name: 'DirectCut / Video',
    role: 'Create scripts, shot lists and construction video plans.',
    trigger: ['video', 'timelapse', 'reel', 'tour', 'directcut'],
  },
  {
    id: 'bim-viewer',
    name: 'BIM / 3D Viewer',
    role: 'Open Apex internal BIM / 3D Studio or internal import/conversion workflow.',
    trigger: ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx', 'rvt', 'dwg', 'dxf', 'skp', 'bim', 'clash'],
  },
  {
    id: 'budget',
    name: 'Budget / Quantity',
    role: 'Prepare quantity, budget and proposal workflows from project context.',
    trigger: ['budget', 'estimate', 'orcamento', 'quantity', 'takeoff'],
  },
  {
    id: 'contracts',
    name: 'Contracts / Permits',
    role: 'Review contracts, permits, compliance and legal-document workflow context.',
    trigger: ['contract', 'permit', 'legal', 'compliance', 'contrato'],
  },
  {
    id: 'field',
    name: 'Field Operations',
    role: 'Route RDO, quality, progress, crew and material workflows.',
    trigger: ['field', 'jobsite', 'rdo', 'obra', 'quality'],
  },
  {
    id: 'marketing',
    name: 'Marketing / Website',
    role: 'Build portfolio, sales page, social and project storytelling outputs.',
    trigger: ['marketing', 'website', 'portfolio', 'social', 'sales'],
  },
  {
    id: 'platform-build',
    name: 'Platform Build Support',
    role: 'Help code, design and rebuild the Apex AI Copilot platform itself.',
    trigger: ['code', 'build', 'platform', 'component', 'api'],
  },
  {
    id: 'coding-support',
    name: 'Code GPT / Coding Assistant',
    role: 'Write, debug, review and explain code across frontend, backend, APIs and automation.',
    trigger: ['code', 'programar', 'programacao', 'debug', 'typescript', 'react', 'api', 'script'],
  },
  {
    id: 'data-analysis',
    name: 'SQL Expert / Data Analyst',
    role: 'Analyze datasets, write SQL, interpret metrics and build decision-ready data narratives.',
    trigger: ['sql', 'data', 'dados', 'analise', 'analytics', 'dashboard', 'metric'],
  },
  {
    id: 'academic-research',
    name: 'Academic Assistant / Research',
    role: 'Support research outlines, summaries, study plans, paper structure and evidence organization.',
    trigger: ['research', 'pesquisa', 'academic', 'paper', 'scholar', 'estudo'],
  },
  {
    id: 'visual-design',
    name: 'DesignerGPT / Visual Designer',
    role: 'Create design direction, logos, visual systems, image prompts and brand concepts.',
    trigger: ['design', 'logo', 'visual', 'brand', 'marca', 'identidade'],
  },
  {
    id: 'negotiation',
    name: 'The Negotiator',
    role: 'Prepare negotiation strategy, scripts, objections, positioning and closing language.',
    trigger: ['negociar', 'negociacao', 'negotiation', 'proposal', 'proposta', 'closing'],
  },
  {
    id: 'tech-support',
    name: 'Tech Support Advisor',
    role: 'Diagnose technical issues, explain fixes and guide operational troubleshooting.',
    trigger: ['erro', 'bug', 'suporte', 'support', 'troubleshoot', 'config'],
  },
  {
    id: 'writing-humanizer',
    name: 'Professional Writing Coach / AI Humanizer',
    role: 'Write, rewrite, humanize, translate and polish professional content.',
    trigger: ['write', 'escreva', 'texto', 'humanizar', 'copy', 'email', 'contrato'],
  },
  {
    id: 'interior-design',
    name: 'Interior / Room Design',
    role: 'Plan rooms, finishes, furniture, lighting, style direction and interior prompts.',
    trigger: ['interior', 'room', 'ambiente', 'decoracao', 'mobiliario', 'furniture'],
  },
  {
    id: 'website-design',
    name: 'Website AI Designer',
    role: 'Create landing pages, portfolios, website copy, sections and conversion flows.',
    trigger: ['landing', 'website', 'site', 'portfolio', 'web', 'pagina'],
  },
  {
    id: 'exploration',
    name: 'Exploration / General Reasoning',
    role: 'Think through open-ended questions, strategy, planning, decisions and general knowledge tasks.',
    trigger: ['explore', 'pensar', 'ideia', 'estrategia', 'strategy', 'geral'],
  },
]
