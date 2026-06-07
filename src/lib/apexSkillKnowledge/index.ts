import { archvisKnowledge } from './archvis'
import { bimCadKnowledge } from './bimCad'
import { businessKnowledge } from './business'
import { cinematicKnowledge } from './cinematic'
import { codingKnowledge } from './coding'
import { dataKnowledge } from './data'
import { imagePromptKnowledge } from './imagePrompts'
import { interiorsKnowledge } from './interiors'
import { negotiationKnowledge } from './negotiation'
import { platformKnowledge } from './platform'
import { videoPromptKnowledge } from './videoPrompts'
import { writingKnowledge } from './writing'

export const apexSkillKnowledge = {
  archvis: archvisKnowledge,
  imagePrompts: imagePromptKnowledge,
  videoPrompts: videoPromptKnowledge,
  cinematic: cinematicKnowledge,
  interiors: interiorsKnowledge,
  bimCad: bimCadKnowledge,
  business: businessKnowledge,
  coding: codingKnowledge,
  writing: writingKnowledge,
  negotiation: negotiationKnowledge,
  data: dataKnowledge,
  platform: platformKnowledge,
}

export type ApexSkillKnowledgeDomain = keyof typeof apexSkillKnowledge

export function selectApexSkillKnowledge(input: string, fileName = ''): ApexSkillKnowledgeDomain[] {
  const text = `${input} ${fileName}`.toLowerCase()
  const domains = new Set<ApexSkillKnowledgeDomain>()
  if (/(archvis|render|humaniz|planta|floor plan|fachada|facade|imagem|image)/.test(text)) domains.add('archvis').add('imagePrompts')
  if (/(video|directcut|timelapse|roteiro|shot|camera|cinematic|cinema)/.test(text)) domains.add('videoPrompts').add('cinematic')
  if (/(interior|sala|quarto|cozinha|futurista|furniture|material|palette)/.test(text)) domains.add('interiors')
  if (/(ifc|rvt|dwg|dxf|skp|bim|cad|3d|viewer|clash)/.test(text)) domains.add('bimCad')
  if (/(venda|cliente|crm|proposal|proposta|business|marketing|or[cç]amento|budget)/.test(text)) domains.add('business')
  if (/(code|c[oó]digo|react|typescript|mcp|api|server|platform)/.test(text)) domains.add('coding').add('platform')
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
