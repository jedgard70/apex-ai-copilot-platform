import { archvisKnowledge } from './archvis'
import { bimCadKnowledge } from './bimCad'
import { businessKnowledge } from './business'
import { cinematicKnowledge } from './cinematic'
import { codingKnowledge } from './coding'
import { dataKnowledge } from './data'
import { imagePromptKnowledge } from './imagePrompts'
import { interiorsKnowledge } from './interiors'
import { internationalMarketStrategyKnowledge } from './internationalMarketStrategy'
import { negotiationKnowledge } from './negotiation'
import { platformEngineeringKnowledge } from './platformEngineering'
import { platformKnowledge } from './platform'
import { revitCustomizationKnowledge } from './revitCustomization'
import { videoPromptKnowledge } from './videoPrompts'
import { windowsCareKnowledge } from './windowsCare'
import { writingKnowledge } from './writing'

export const apexSkillKnowledge = {
  archvis: archvisKnowledge,
  imagePrompts: imagePromptKnowledge,
  videoPrompts: videoPromptKnowledge,
  cinematic: cinematicKnowledge,
  interiors: interiorsKnowledge,
  internationalMarketStrategy: internationalMarketStrategyKnowledge,
  bimCad: bimCadKnowledge,
  business: businessKnowledge,
  coding: codingKnowledge,
  writing: writingKnowledge,
  negotiation: negotiationKnowledge,
  data: dataKnowledge,
  platform: platformKnowledge,
  platformEngineering: platformEngineeringKnowledge,
  windowsCare: windowsCareKnowledge,
  revitCustomization: revitCustomizationKnowledge,
}

export type ApexSkillKnowledgeDomain = keyof typeof apexSkillKnowledge

export function selectApexSkillKnowledge(input: string, fileName = ''): ApexSkillKnowledgeDomain[] {
  const text = `${input} ${fileName}`.toLowerCase()
  const domains = new Set<ApexSkillKnowledgeDomain>()
  if (/(archvis|render|humaniz|planta|floor plan|fachada|facade|imagem|image)/.test(text)) domains.add('archvis').add('imagePrompts')
  if (/(video|directcut|timelapse|roteiro|shot|camera|cinematic|cinema)/.test(text)) domains.add('videoPrompts').add('cinematic')
  if (/(interior|sala|quarto|cozinha|futurista|furniture|material|palette)/.test(text)) domains.add('interiors')
  if (/(ifc|rvt|dwg|dxf|skp|bim|cad|3d|viewer|clash)/.test(text)) domains.add('bimCad')
  if (/(revit customization|configurar revit|revit templates?|revit plugin|revit|dynamo|pyrevit|add-?in|plugin|c#|csharp|ribbon|shared parameter|shared parameters|par[aâ]metro|par[aâ]metros compartilhados|view template|template bim|fam[ií]lia|families|ifc export|exportar ifc|glb|manifest|externalcommand|iexternalcommand|iexternalapplication|sheets|pranchas|schedules|quantitativos|qa\/qc|model checking)/.test(text)) domains.add('revitCustomization').add('bimCad').add('coding')
  if (/(eua|usa|united states|mercado americano|american market|europa|europe|european market|mercado europeu|offshore|d[oó]lar|euro|clientes internacionais|international clients|permit set|permit sets|portfolio americano|linkedin em ingl[eê]s|linkedin|prospec[cç][aã]o|outreach|bim em d[oó]lar|revit em d[oó]lar|opera[cç][aã]o remota|remote operation|residential construction docs|construction documentation)/.test(text)) domains.add('internationalMarketStrategy').add('business').add('revitCustomization')
  if (/(venda|cliente|crm|proposal|proposta|business|marketing|or[cç]amento|budget)/.test(text)) domains.add('business')
  if (/(platform engineering|status da plataforma|abrir pr|github|repo|repository|branch|pr\b|pull request|supabase status|supabase|sql|vercel|deploy|deployment|backend|frontend|database|schema|rls|policy|policies|security|seguran[cç]a|vulnerab|refactor|module|m[oó]dulo|code review|auditoria t[eé]cnica|build error|deploy error|secrets?|dependency|depend[eê]ncia|cors|auth|migra[cç][aã]o|migration)/.test(text)) domains.add('platformEngineering').add('coding').add('platform')
  if (/(code skill|livre code|corrigir c[oó]digo|code|c[oó]digo|react|typescript|mcp|api|server|platform)/.test(text)) domains.add('coding').add('platform')
  if (/(windows care|windows repair|diagn[oó]stico windows|meu pc est[aá] lento|windows|computador|pc lento|lento|limpeza|startup|inicializa[cç][aã]o|powershell|defender|malware|v[ií]rus|processo|task scheduler|scheduled task|appdata|temp|disco|ram|cpu)/.test(text)) domains.add('windowsCare').add('coding')
  if (/(write|escreva|texto|copy|document|doc|humaniz)/.test(text)) domains.add('writing')
  if (/(negocia|counteroffer|proposta comercial|deal)/.test(text)) domains.add('negotiation')
  if (/(data|dados|sql|planilha|xlsx|csv|analytics|metric)/.test(text)) domains.add('data')
  if (domains.size === 0) domains.add('platform')
  return [...domains].slice(0, 4)
}

export function buildCompactSkillContext(input: string, fileName = '') {
  return selectApexSkillKnowledge(input, fileName)
    .map(domain => {
      const knowledge = apexSkillKnowledge[domain]
      return `${knowledge.category}: ${JSON.stringify(knowledge).slice(0, 900)}`
    })
    .join('\n')
}
