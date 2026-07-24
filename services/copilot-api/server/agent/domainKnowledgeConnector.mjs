/**
 * Apex AI Copilot — H16 Domain Knowledge Connector
 * Subclassifies production domain intents for targeted, contextual replies.
 * Covers: orçamento/SINAPI, proposta/contrato, obra/campo, cronograma, marketing/vendas.
 */

function normalize(text = '') {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ─── Orçamento / SINAPI ───────────────────────────────────────────────────────

export function classifyOrcamentoQuery(message = '') {
  const t = normalize(message)
  if (/\bsinapi\b/.test(t)) return 'sinapi'
  if (/\bbdi\b/.test(t)) return 'bdi'
  if (/\bdesonerac\b|\bencargo\b/.test(t)) return 'encargos'
  if (/\bquantitativo\b|\bmemoria\s+de\s+calculo\b/.test(t)) return 'quantitativo'
  if (/\bmedicao\b|\bcriterio\b/.test(t)) return 'medicao'
  if (/\blicitac\b|\bproposta\s+de\s+preco\b/.test(t)) return 'licitacao'
  if (/\bcurva\s*s\b|\bfluxo\s*de\s*caixa\b|\bdesembolso\b/.test(t)) return 'fluxo_caixa'
  return 'geral'
}

const ORCAMENTO_KNOWLEDGE = {
  sinapi: {
    title: 'SINAPI — Sistema Nacional de Pesquisa de Custos e Índices',
    content: [
      '**O que é**: referência oficial da Caixa Econômica Federal para obras públicas e financiadas.',
      '**Composições**: cada código SINAPI tem insumos, mão de obra, equipamentos e encargos — nunca use apenas o custo unitário sem verificar a composição completa.',
      '**Desoneração**: SINAPI disponibiliza duas tabelas — com e sem desoneração da folha. Para obras públicas, verifique o edital.',
      '**Atualização**: tabelas publicadas mensalmente por estado. Use sempre o mês de referência da proposta.',
      '**Pesquisa**: acesse sinapi.caixa.gov.br → Insumos/Composições → filtre por UF e mês.',
      '**Itens sem composição**: use cotação de mercado com 3 orçamentos e justificativa técnica.',
      '',
      'Me diz o código ou serviço específico e eu te ajudo a montar a composição.',
    ],
  },
  bdi: {
    title: 'BDI — Benefícios e Despesas Indiretas',
    content: [
      '**Fórmula padrão**: BDI = [(1+AC+S+R+G) × (1+DF) / (1-T) - 1] × 100',
      '**Componentes típicos**: administração central (AC) 3-5%, seguro (S) 0,3-1%, risco (R) 0,5-2%, garantia (G) 0,3-0,6%, despesas financeiras (DF) 0,5-1,5%, tributos (T) 9,25% PIS/COFINS + ISS.',
      '**Limites TCU**: Acórdão 2622/2013 define limites por tipo de obra (edificações, instalações, infraestrutura).',
      '**Obras públicas**: BDI deve ser discriminado no edital. Diferente para itens de material vs. serviço.',
      '**Obras privadas**: negociável, mas justifique cada componente na proposta.',
      '',
      'Informe o tipo de obra e cliente (público/privado) para calcular o BDI adequado.',
    ],
  },
  encargos: {
    title: 'Encargos sociais e desoneração',
    content: [
      '**Encargos s/ desoneração**: INSS patronal 20% + RAT (0,5-3%) + SESI/SENAI/SEBRAE (~5,8%) + FGTS 8% + férias/13º/rescisão (~28%) = total ~62-68% sobre a folha.',
      '**Desoneração (Lei 12.546)**: CPRB substitui o INSS de 20% por alíquota sobre receita bruta (2-4,5% dependendo do CNAE). Para construção civil: 4,5%.',
      '**Quando usar**: comparar custo efetivo de cada regime para a empresa — não é automático que desonerado seja mais barato.',
      '**SINAPI desonerado**: use a tabela "com desoneração" apenas se a empresa optou pelo regime.',
      '**Encargos trabalhistas**: além do INSS, inclua provisões de férias (1/12 × 1,33), 13º salário (1/12) e rescisão estimada.',
    ],
  },
  quantitativo: {
    title: 'Quantitativos e memória de cálculo',
    content: [
      '**Estrutura**: discrimine por etapa (fundação, estrutura, vedação, cobertura, instalações, acabamento) e por serviço dentro de cada etapa.',
      '**Memória de cálculo**: para cada item, registre a fórmula, dimensões e fonte (planta, corte, detalhe, especificação).',
      '**Unidades**: m², m³, m, kg, un, vb — defina critério de medição antes de quantificar.',
      '**Conferência**: compare totais com referências de área bruta/líquida e indicadores por m² (kg aço/m², m³ concreto/m², etc).',
      '**Ferramentas**: planilha Excel com células referenciadas ou Revit Schedules para quantitativo automático.',
      '',
      'Me manda o projeto ou etapa específica e eu monto a planilha de quantitativos.',
    ],
  },
  medicao: {
    title: 'Critérios de medição',
    content: [
      '**Definição prévia**: acorde os critérios antes do contrato — o que conta como executado, qual tolerância, como medir.',
      '**Por etapa**: fundação (m³ de concreto + kg de aço), alvenaria (m² de parede executada), revestimento (m² de área revestida).',
      '**Itens globais (vb)**: defina percentual de medição por etapa (ex: 30% início, 50% conclusão, 20% comissionamento).',
      '**Boletim de medição**: data, período, serviços medidos, acumulado e saldo. Aprovação antes do faturamento.',
      '**RFI de divergência**: qualquer diferença entre medido e executado deve ter RFI formal com foto e justificativa.',
    ],
  },
  licitacao: {
    title: 'Licitação e análise de proposta',
    content: [
      '**Revisão da proposta**: compare preço unitário com SINAPI + encargos + BDI. Preço muito baixo = risco de desequilíbrio.',
      '**Impugnação**: identifique itens abaixo do custo de mercado e documente com cotações e SINAPI.',
      '**Exequibilidade**: Lei 14.133/2021 exige análise de exequibilidade para propostas 15% abaixo da referência.',
      '**Planilha de equalização**: compare as propostas item a item, não apenas o total.',
      '**Negociação**: concentre na margem (BDI) e nos itens de maior volume financeiro.',
    ],
  },
  fluxo_caixa: {
    title: 'Fluxo de caixa e cronograma físico-financeiro',
    content: [
      '**Curva S**: acumulado físico (%) e financeiro ($) ao longo do tempo. Deve ser suave — picos indicam planejamento irreal.',
      '**Desembolso mensal**: distribua o orçamento pelos meses conforme o cronograma físico de cada item.',
      '**Fluxo de caixa**: receitas (medições aprovadas + antecipações) - despesas (materiais, mão de obra, overhead).',
      '**Capital de giro**: estime o pico de necessidade de capital e planeje financiamento ou linhas de crédito.',
      '**Cenários**: calcule fluxo para 3 cenários (otimista, base, pessimista) com variação de prazo e produtividade.',
    ],
  },
  geral: {
    title: 'Orçamento e SINAPI — visão geral',
    content: [
      'Posso ajudar com orçamento e SINAPI em vários níveis:',
      '- **SINAPI**: busca de composições, interpretação de insumos, comparação com mercado.',
      '- **BDI**: cálculo, validação TCU, diferença público/privado.',
      '- **Encargos**: desoneração, regime tributário, cálculo de custo total da mão de obra.',
      '- **Quantitativos**: estruturação, memória de cálculo, conferência por indicadores.',
      '- **Medição**: critérios, boletim de medição, gestão de divergências.',
      '- **Licitação**: análise de proposta, exequibilidade, equalização.',
      '- **Fluxo de caixa**: curva S, desembolso mensal, capital de giro.',
      '',
      'Me diga o que está tentando resolver — planilha, dúvida específica ou revisão.',
    ],
  },
}

export function buildOrcamentoReply(message = '') {
  const topic = classifyOrcamentoQuery(message)
  const knowledge = ORCAMENTO_KNOWLEDGE[topic] || ORCAMENTO_KNOWLEDGE.geral
  return [`**${knowledge.title}**`, '', ...knowledge.content].join('\n')
}

// ─── Proposta / Contrato ──────────────────────────────────────────────────────

export function classifyPropostaQuery(message = '') {
  const t = normalize(message)
  if (/\baditivo\b/.test(t)) return 'aditivo'
  if (/\bmemorial\b|\bespecificac\b/.test(t)) return 'memorial'
  if (/\bcaderno\s*de\s*encargo\b/.test(t)) return 'caderno_encargos'
  if (/\brrt\b|\bart\b|\bcrea\b|\banotac\b/.test(t)) return 'rrt_art'
  if (/\blaudo\b|\bparecer\b/.test(t)) return 'laudo'
  if (/\bcontrato\b|\bclausal\b/.test(t)) return 'contrato'
  if (/\bproposta\b|\borçamento\s*comercial\b/.test(t)) return 'proposta'
  return 'geral'
}

const PROPOSTA_KNOWLEDGE = {
  aditivo: {
    title: 'Aditivo de contrato — prazo, valor e escopo',
    content: [
      '**Justificativa técnica**: documente a causa (projeto alterado, serviço extra, evento imprevisível) com evidências.',
      '**Tipos**: aditivo de prazo, valor, escopo ou os três juntos. Cada um tem impacto contratual diferente.',
      '**Limite legal**: em contratos públicos, aditivos de valor limitados a 25% (obras) ou 50% (reforma) do valor original.',
      '**Documentação**: RFI original, resposta do projetista, memória de cálculo do impacto e cronograma revisado.',
      '**Linguagem**: seja preciso no escopo incluído/excluído. Ambiguidade vira disputa futura.',
      '',
      'Me manda o contexto do aditivo (causa, valor, prazo impactado) e eu redigio a justificativa.',
    ],
  },
  memorial: {
    title: 'Memorial descritivo e especificações técnicas',
    content: [
      '**Estrutura**: por disciplina (ARQ, EST, HID, ELE, HVAC, Acabamento) com materiais, sistemas e padrão de qualidade.',
      '**Especificação técnica**: norma aplicável (ABNT), fabricante de referência (ou equivalente), critério de aceitação.',
      '**Memorial de cálculo**: dimensionamento de cada sistema com hipóteses, coeficientes e resultados.',
      '**Vinculação contratual**: memorial integra o contrato — o que não está descrito é extra.',
      '**Atualização**: revise o memorial a cada revisão de projeto significativa.',
    ],
  },
  caderno_encargos: {
    title: 'Caderno de encargos e diretrizes de execução',
    content: [
      '**Objetivo**: definir como cada serviço deve ser executado, não apenas o que.',
      '**Estrutura**: por serviço — pré-requisito, materiais aprovados, equipamentos, sequência de execução, controle e critério de aceite.',
      '**Tolerâncias**: defina tolerâncias geométricas, de prumo, nível e planeza por tipo de serviço.',
      '**Subempreiteiros**: o caderno de encargos é o briefing técnico para cada frente terceirizada.',
      '**Controle de qualidade**: cada item do caderno vira um check do checklist de inspeção.',
    ],
  },
  rrt_art: {
    title: 'RRT e ART — registro de responsabilidade técnica',
    content: [
      '**ART (CREA)**: obrigatória para engenheiros. Registre antes de iniciar, com descrição precisa dos serviços.',
      '**RRT (CAU)**: equivalente para arquitetos. Portal CAU → Registros → RRT.',
      '**Vínculo contratual**: ART/RRT devem espelhar o contrato — mesmos serviços, mesmo período, mesmo valor.',
      '**ART descritiva**: para atividades intelectuais (projeto, consultoria, laudo) — descreve o objeto e a metodologia.',
      '**Baixa**: ao concluir, registre a baixa ou conclusão parcial. ART em aberto gera multa.',
      '**INSS**: a ART é base para o GPS de obra. Calcule a CEI/matrícula CEF antes de iniciar.',
    ],
  },
  laudo: {
    title: 'Laudo técnico e parecer de engenharia',
    content: [
      '**Estrutura**: identificação do objeto → metodologia → vistoria/ensaios → análise técnica → conclusão → recomendações.',
      '**Evidências**: registre tudo com foto, data, coordenadas GPS, instrumento utilizado e resultado.',
      '**Normas**: cite a norma técnica aplicável para cada análise (ABNT NBR, NR, portaria).',
      '**Linguagem**: assertiva e sem especulação. Use "foi constatado", "evidenciado", "identificado" — não "parece" ou "pode ser".',
      '**Assinatura**: sempre com ART descritiva vinculada ao laudo específico.',
    ],
  },
  contrato: {
    title: 'Contrato — cláusulas essenciais',
    content: [
      '**Escopo**: descreva detalhadamente o que está incluído e o que está excluído. Liste os documentos que integram o contrato.',
      '**Prazo**: início, prazo total, marcos intermediários e critério para prorrogação.',
      '**Pagamento**: valor, forma, condições, reajuste (índice e periodicidade) e retenção de garantia.',
      '**Garantia de execução**: percentual retido (5-10%) e prazo de devolução após vistoria final.',
      '**Rescisão**: causas, prazo de notificação, multa e apuração de saldo devedor.',
      '**Foro**: defina a comarca — evita discussão posterior.',
    ],
  },
  proposta: {
    title: 'Proposta comercial — estrutura eficaz',
    content: [
      '**Abertura**: problema do cliente + resultado que você entrega (não "somos uma empresa de...").',
      '**Escopo**: lista clara de serviços incluídos, organizados por fase ou disciplina.',
      '**Exclusões e premissas**: o que o cliente deve fornecer, o que não está incluído.',
      '**Prazo e equipe**: cronograma macro e perfil da equipe dedicada.',
      '**Investimento**: valor total ou por fase. Para obras, apresente planilha resumo.',
      '**Próximos passos**: ação clara do cliente (assinar, pagar sinal, marcar kickoff).',
    ],
  },
  geral: {
    title: 'Propostas, contratos e documentação técnica',
    content: [
      'Posso ajudar com:',
      '- **Proposta comercial**: estrutura, escopo, exclusões, investimento.',
      '- **Contrato**: cláusulas essenciais, escopo, prazo, pagamento, garantia, rescisão.',
      '- **Aditivo**: justificativa técnica, tipos, limites legais, documentação.',
      '- **Memorial descritivo**: por disciplina, especificações técnicas, normas.',
      '- **Caderno de encargos**: diretrizes de execução por serviço.',
      '- **RRT/ART**: quando registrar, o que descrever, baixa, INSS de obra.',
      '- **Laudo técnico**: estrutura, linguagem, evidências, assinatura.',
      '',
      'Me manda o contexto ou o documento que quer criar/revisar.',
    ],
  },
}

export function buildPropostaReply(message = '') {
  const topic = classifyPropostaQuery(message)
  const knowledge = PROPOSTA_KNOWLEDGE[topic] || PROPOSTA_KNOWLEDGE.geral
  return [`**${knowledge.title}**`, '', ...knowledge.content].join('\n')
}

// ─── Obra / Campo ─────────────────────────────────────────────────────────────

export function classifyObraQuery(message = '') {
  const t = normalize(message)
  if (/\bdiario\s*de\s*obra\b/.test(t)) return 'diario_obra'
  if (/\brfi\b|\bsolicitacao\s*de\s*informac\b/.test(t)) return 'rfi'
  if (/\bchecklist\b|\binspecao\b|\bcontrole\s*de\s*qualidade\b/.test(t)) return 'checklist_qc'
  if (/\bnao\s*conform|\bncr\b/.test(t)) return 'ncr'
  if (/\brecebi?mento\s*de\s*material\b/.test(t)) return 'recebimento'
  if (/\blook.?ahead\b|\bplanejamento\s*semanal\b/.test(t)) return 'lookahead'
  if (/\brelatorio\s*de\s*visita\b|\brelatorio\s*de\s*progresso\b/.test(t)) return 'relatorio'
  return 'geral'
}

const OBRA_KNOWLEDGE = {
  diario_obra: {
    title: 'Diário de obra',
    content: [
      '**Campos obrigatórios**: data, clima (manhã/tarde), efetivo por função, equipamentos em operação, serviços executados, ocorrências e observações.',
      '**Frequência**: preenchimento diário pelo responsável técnico da obra.',
      '**Vinculação**: o diário é documento legal — registre paralisações, falta de material, clima adverso e decisões de campo.',
      '**Assinatura**: engenheiro responsável. Em obras públicas, fiscalização também assina.',
      '**Digital**: ferramentas como SIENGE, SINCO ou planilha compartilhada. Guarde com backup.',
      '',
      'Posso gerar um modelo de diário de obra adaptado ao seu tipo de projeto.',
    ],
  },
  rfi: {
    title: 'RFI — Request for Information',
    content: [
      '**Quando usar**: dúvida de projeto, conflito entre documentos, informação faltante, decisão de campo necessária.',
      '**Campos**: número (sequencial), data, assunto, descrição detalhada, local na obra, impacto em prazo/custo, prazo para resposta.',
      '**Destinatário**: projetista, coordenador ou cliente — definir no contrato.',
      '**Prazo**: exija prazo de resposta no contrato (ex: 48h para urgente, 5 dias corridos para normal).',
      '**Registro**: todo RFI sem resposta no prazo vira argumento para aditivo.',
      '**Encerramento**: registre a resposta recebida e a ação tomada.',
    ],
  },
  checklist_qc: {
    title: 'Checklist de inspeção e controle de qualidade',
    content: [
      '**Por serviço**: crie checklist específico para cada serviço crítico (formas, armação, concretagem, alvenaria, revestimento).',
      '**Pré-requisito**: o que deve estar pronto antes de iniciar o serviço.',
      '**Durante**: pontos a verificar em cada fase do serviço.',
      '**Pós-execução**: critérios de aceite e tolerâncias.',
      '**Responsável e data**: quem inspecionou, quando e qual o resultado (OK / pendência / reprovado).',
      '**Integração**: checklist aprovado libera o próximo serviço ou a medição.',
    ],
  },
  ncr: {
    title: 'NCR — Não Conformidade',
    content: [
      '**Identificação**: número, data, local, descrição da não conformidade, responsável pelo registro.',
      '**Classificação**: crítica (para a obra), maior (corrige antes de avançar), menor (corrige na conclusão).',
      '**Ação corretiva**: o que será feito, por quem, até quando.',
      '**Verificação**: quem confirma que a ação foi executada corretamente.',
      '**Encerramento**: data de encerramento e evidência fotográfica.',
      '**Registro histórico**: NCs recorrentes indicam problema de processo — analise causa raiz.',
    ],
  },
  recebimento: {
    title: 'Recebimento de material em obra',
    content: [
      '**Conferência quantitativa**: note fiscal vs. pedido vs. entregue. Registre divergências na NF antes de assinar.',
      '**Conferência qualitativa**: especificação, marca, dimensão, certificado de qualidade (quando exigido).',
      '**Inspeção de concreto**: slump test, moldagem de CPs, temperatura e hora do lançamento.',
      '**Inspeção de aço**: bitola, comprimento, certificado de norma (ABNT NBR 7480).',
      '**Rejeição**: material rejeitado deve ser segregado fisicamente com identificação e devolvido com GRD.',
      '**Armazenamento**: defina área por tipo de material com condições de proteção (temperatura, umidade, empilhamento).',
    ],
  },
  lookahead: {
    title: 'Look-ahead e planejamento semanal',
    content: [
      '**Look-ahead 3 semanas**: lista de serviços planejados por semana, com pré-requisito, responsável e recursos.',
      '**Reunião semanal**: toda segunda-feira — revisar look-ahead, registrar avanço real, atualizar pendências.',
      '**Remoção de restrições**: identifique o que impede o serviço (projeto, material, mão de obra, equipamento) e aja antes.',
      '**PPC (Percent Plan Complete)**: % de serviços planejados que foram concluídos. Meta: acima de 80%.',
      '**Causas de não conclusão**: analise semanalmente — projeto, suprimento, mão de obra, clima, equipamento, gerenciamento.',
    ],
  },
  relatorio: {
    title: 'Relatório de visita e progresso',
    content: [
      '**Relatório de visita**: data, participantes, objetivo, constatações, fotos, decisões e próximos passos com responsável e prazo.',
      '**Relatório de progresso (semanal/quinzenal)**: % físico por etapa (planejado vs. realizado), fotos por frente, pendências críticas.',
      '**Curva S atualizada**: inclua no relatório mensal o avanço físico e financeiro acumulado.',
      '**Formato**: objetivo (construtora, cliente, financiador) define nível de detalhe. Mantenha consistência entre períodos.',
    ],
  },
  geral: {
    title: 'Gestão de obra e campo',
    content: [
      'Posso estruturar qualquer documento de gestão de obra:',
      '- **Diário de obra**: modelo diário com campos legais e operacionais.',
      '- **RFI**: modelo, protocolo, prazo e gestão de resposta.',
      '- **Checklist de inspeção**: por serviço, com pré-requisito e critério de aceite.',
      '- **NCR**: modelo de não conformidade com ação corretiva e encerramento.',
      '- **Recebimento de material**: protocolo de conferência quantitativa e qualitativa.',
      '- **Look-ahead**: planejamento semanal, reunião de obra, PPC.',
      '- **Relatório**: visita técnica, progresso semanal, curva S.',
      '',
      'Diga a fase, tipo de obra e o que quer organizar — eu monto o modelo.',
    ],
  },
}

export function buildObraReply(message = '') {
  const topic = classifyObraQuery(message)
  const knowledge = OBRA_KNOWLEDGE[topic] || OBRA_KNOWLEDGE.geral
  return [`**${knowledge.title}**`, '', ...knowledge.content].join('\n')
}

// ─── Cronograma ───────────────────────────────────────────────────────────────

export function classifyCronogramaQuery(message = '') {
  const t = normalize(message)
  if (/\bevm\b|\bvalor\s*agregado\b|\bearned\s*value\b/.test(t)) return 'evm'
  if (/\bcaminho\s*critico\b|\bcritical\s*path\b|\bcpm\b/.test(t)) return 'caminho_critico'
  if (/\bms\s*project\b|\bmicrosoft\s*project\b/.test(t)) return 'ms_project'
  if (/\bprimavera\b|\bp6\b/.test(t)) return 'primavera'
  if (/\bbaseline\b|\blinha\s*de\s*base\b/.test(t)) return 'baseline'
  if (/\batraso\b|\brecuperac\b|\bcrash\b/.test(t)) return 'atraso'
  if (/\bwbs\b|\beap\b|\bestrutura\s*analiti/.test(t)) return 'wbs'
  return 'geral'
}

const CRONOGRAMA_KNOWLEDGE = {
  evm: {
    title: 'EVM — Earned Value Management',
    content: [
      '**Indicadores**: PV (Planned Value), EV (Earned Value), AC (Actual Cost).',
      '**Variações**: SV = EV - PV (variação de prazo) | CV = EV - AC (variação de custo).',
      '**Índices**: SPI = EV/PV (eficiência de prazo) | CPI = EV/AC (eficiência de custo).',
      '**Projeções**: EAC = BAC/CPI (estimativa no término) | ETC = EAC - AC (estimativa para completar).',
      '**Interpretação**: SPI < 1 = atrasado, CPI < 1 = acima do orçamento. Combine os dois para priorizar ação.',
      '**Frequência**: colete EV semanal ou quinzenal. EVM mensal é tarde demais para corrigir.',
    ],
  },
  caminho_critico: {
    title: 'Caminho crítico — CPM',
    content: [
      '**Definição**: sequência de atividades com folga zero que determina a duração total do projeto.',
      '**Early Start/Finish**: cálculo forward pass — soma das durações do início ao fim.',
      '**Late Start/Finish**: cálculo backward pass — subtração a partir da data de término.',
      '**Folga (TF)**: TF = LS - ES. Atividades com TF = 0 estão no caminho crítico.',
      '**Sub-crítico**: atividades com TF < 5 dias merecem atenção — qualquer desvio vira crítico.',
      '**Atualização**: recalcule o caminho crítico a cada atualização de progresso.',
    ],
  },
  ms_project: {
    title: 'MS Project — dicas práticas',
    content: [
      '**Estrutura**: crie WBS (sumário) antes de detalhar atividades. Use recuo para hierarquia.',
      '**Predecessoras**: vincule todas as atividades — sem link, o scheduler não calcula caminho crítico.',
      '**Calendários**: configure calendário por projeto (feriados, horários) e por recurso quando necessário.',
      '**Baseline**: salve a baseline antes de iniciar o projeto. Permita até 3 baselines para comparação.',
      '**Atualização**: use "% completo" ou "duração restante" — não misture os dois métodos.',
      '**Exportação**: use GIF ou PDF para relatório visual, XLS/CSV para integração com outros sistemas.',
    ],
  },
  primavera: {
    title: 'Primavera P6 — fundamentos',
    content: [
      '**Hierarquia**: EPS (Enterprise) → OBS (Organograma) → Project → WBS → Atividade.',
      '**Tipos de atividade**: Task Dependent, Resource Dependent, Level of Effort, Milestone.',
      '**Relações**: FS, SS, FF, SF com lag/lead. Use SS para atividades paralelas em série.',
      '**Nivelamento**: use "Level Resources" para resolver conflitos de alocação sem alterar caminho crítico.',
      '**Relatórios**: configure layouts por projeto. Use "P6 Reporter" ou exportação XLS para distribuição.',
      '**Integração**: P6 integra com SAP, Oracle EBS e ferramentas BIM para 4D scheduling.',
    ],
  },
  baseline: {
    title: 'Baseline — linha de base do cronograma',
    content: [
      '**O que é**: fotografia do cronograma aprovado no início do projeto. Referência para medir desvios.',
      '**Quando salvar**: após aprovação do cliente e antes de qualquer execução.',
      '**Revisão de baseline**: somente com aditivo formal aprovado — não altere baseline para esconder atraso.',
      '**Comparação**: sempre mostre planejado (baseline) vs. atual no relatório. O desvio é a notícia real.',
      '**Múltiplas baselines**: use para marcar eventos importantes (início, revisão contratual, eventos climáticos).',
    ],
  },
  atraso: {
    title: 'Atraso e recuperação de cronograma',
    content: [
      '**Diagnóstico**: identifique a causa raiz (projeto, suprimento, mão de obra, clima, terceiro) antes de propor recuperação.',
      '**Crash**: adicionar recursos em atividades do caminho crítico para reduzir duração. Analise custo-benefício.',
      '**Fast-tracking**: executar atividades em paralelo que seriam sequenciais. Aumenta risco de retrabalho.',
      '**Plano de recuperação**: formalize por escrito com atividades, recursos adicionais, responsáveis e nova data prevista.',
      '**Comunicação**: notifique o cliente imediatamente ao identificar risco de atraso — não espere a certeza.',
      '**Aditivo de prazo**: se a causa é do cliente ou evento imprevisível, formalize o aditivo antes de recuperar.',
    ],
  },
  wbs: {
    title: 'WBS / EAP — Estrutura Analítica do Projeto',
    content: [
      '**Regra dos 100%**: a WBS deve cobrir 100% do escopo — nada além, nada menos.',
      '**Níveis**: 3-4 níveis costumam ser suficientes. Mais profundo dificulta gestão; mais raso perde controle.',
      '**Orientação**: por entregável (produto), não por atividade (verbo). "Fundação concluída", não "executar fundação".',
      '**Pacotes de trabalho**: o nível mais baixo — mensurável, estimável e atribuível a um responsável.',
      '**Dicionário WBS**: para cada pacote, documente escopo incluído, exclusões, critério de aceite e responsável.',
    ],
  },
  geral: {
    title: 'Cronograma e planejamento de projeto',
    content: [
      'Posso ajudar com:',
      '- **WBS/EAP**: estrutura analítica do projeto, dicionário, pacotes de trabalho.',
      '- **CPM/Caminho crítico**: cálculo, atualização, atividades sub-críticas.',
      '- **EVM**: indicadores de prazo e custo, projeções de término.',
      '- **MS Project / Primavera P6**: configuração, dicas, exportação.',
      '- **Baseline**: quando salvar, como comparar, revisão formal.',
      '- **Atraso**: diagnóstico, crash, fast-tracking, plano de recuperação.',
      '',
      'Me diga o projeto, fase e o desafio específico.',
    ],
  },
}

export function buildCronogramaReply(message = '') {
  const topic = classifyCronogramaQuery(message)
  const knowledge = CRONOGRAMA_KNOWLEDGE[topic] || CRONOGRAMA_KNOWLEDGE.geral
  return [`**${knowledge.title}**`, '', ...knowledge.content].join('\n')
}

// ─── Marketing / Vendas ───────────────────────────────────────────────────────

export function classifyMarketingQuery(message = '') {
  const t = normalize(message)
  if (/\bproposta\s*comercial\b|\bpitch\b/.test(t)) return 'proposta_comercial'
  if (/\bfunil\b|\bprospect\b|\bcadencia\b/.test(t)) return 'funil_prospeccao'
  if (/\binstagram\b|\blinkedin\b|\bredes\s*sociais\b/.test(t)) return 'redes_sociais'
  if (/\bseo\b|\bsite\b|\blog\b/.test(t)) return 'digital'
  if (/\bcase\b|\bportfolio\b|\bprojeto\s*referencia\b/.test(t)) return 'portfolio'
  if (/\bprec\b|\bhonorario\b|\btabela\b/.test(t)) return 'precificacao'
  return 'geral'
}

const MARKETING_KNOWLEDGE = {
  proposta_comercial: {
    title: 'Pitch e proposta comercial para engenharia',
    content: [
      '**Abertura**: comece pelo problema do cliente, não pela sua empresa.',
      '**Diferencial**: o que você faz que os outros não fazem? Resultado, metodologia ou garantia específica.',
      '**Prova social**: 1-2 cases relevantes com resultado mensurável (prazo, custo, problema resolvido).',
      '**Escopo claro**: o que está incluído e o que não está. Ambiguidade mata a proposta.',
      '**Investimento**: apresente o valor como investimento com retorno (não como custo). Parcelamento e condições.',
      '**CTA**: o que o cliente precisa fazer agora? Reunião, assinatura, sinal?',
    ],
  },
  funil_prospeccao: {
    title: 'Funil de vendas e prospecção para engenharia',
    content: [
      '**Topo**: awareness — LinkedIn, indicações, SEO, palestras, eventos de setor.',
      '**Meio**: interesse — reunião técnica, visita à obra, envio de material técnico relevante.',
      '**Fundo**: decisão — proposta personalizada, negociação, referências.',
      '**Cadência de follow-up**: D+2 após envio da proposta, D+7, D+14. Não deixe esfriar.',
      '**CRM simples**: planilha com nome, empresa, estágio do funil, próxima ação e prazo.',
      '**Métrica**: taxa de conversão por etapa. Se menos de 50% avançam do 1º para o 2º contato, revise o discurso.',
    ],
  },
  redes_sociais: {
    title: 'Redes sociais para engenharia e arquitetura',
    content: [
      '**LinkedIn**: decisores compram de quem demonstra conhecimento. Post técnico > foto de obra.',
      '**Instagram**: obra, processo e resultado. Reels de time-lapse constroem muito mais que foto de planta.',
      '**Frequência**: 3x/semana no LinkedIn, 5x/semana no Instagram é suficiente para manter presença.',
      '**Formatos que funcionam**: antes e depois, "o que aprendi", bastidores, erros e lições.',
      '**CTA em todo post**: o que o leitor deve fazer? Comentar, salvar, DM, acessar o link.',
      '**Métricas**: salvo > curtida > comentário. Salvamentos indicam conteúdo útil.',
    ],
  },
  digital: {
    title: 'Presença digital — site e SEO para engenharia',
    content: [
      '**Site mínimo**: home, serviços, portfólio, sobre e contato. Carregue em menos de 2 segundos.',
      '**SEO local**: "engenheiro civil em [cidade]", "arquiteto em [cidade]". Google Meu Negócio atualizado.',
      '**Blog técnico**: artigos respondendo dúvidas do cliente ("quanto custa...", "como escolher...", "diferença entre..."). Cada artigo é um ponto de entrada orgânico.',
      '**Portfólio online**: fotos profissionais, descrição do problema, sua solução e resultado.',
      '**Depoimentos**: peça ao cliente por escrito. Coloque no site, LinkedIn e proposta.',
    ],
  },
  portfolio: {
    title: 'Portfólio e cases de referência',
    content: [
      '**Estrutura de case**: contexto (cliente, problema) → sua solução → resultado mensurável.',
      '**Resultado mensurável**: prazo cumprido, economia no orçamento, problema técnico resolvido, área executada.',
      '**Fotos**: antes, durante e depois. Foto profissional de entrega vale 10 fotos de celular de obra.',
      '**Confidencialidade**: peça autorização do cliente. Se não autorizar, use "cliente confidencial" com segmento.',
      '**Atualização**: adicione um novo case a cada projeto concluído. Portfólio estático parece empresa parada.',
    ],
  },
  precificacao: {
    title: 'Precificação de honorários de engenharia',
    content: [
      '**Custo hora**: salário desejado ÷ horas úteis/mês + overhead + impostos. Base de tudo.',
      '**Tabela CONFEA/CREA**: referência mínima para projetos públicos. Para privado, negocie com base no custo hora.',
      '**Formas de cobrar**: hora, por m², por fase do projeto, por valor de obra (%).',
      '**Por m²**: risco é projeto grande com muita complexidade — não venda m² de área difícil pelo mesmo preço de área simples.',
      '**Proposta fechada vs. aberta**: fechada dá segurança ao cliente; aberta (hora) transfere risco de escopo a quem merece.',
      '**Reajuste**: preveja no contrato. INCC para projetos de obra, IPCA para consultoria.',
    ],
  },
  geral: {
    title: 'Marketing e vendas para engenharia',
    content: [
      'Posso ajudar com:',
      '- **Proposta comercial**: estrutura, diferencial, CTA, linguagem para cada tipo de cliente.',
      '- **Funil e prospecção**: etapas, cadência de follow-up, CRM simples, métricas.',
      '- **Redes sociais**: LinkedIn, Instagram, frequência, formatos que funcionam.',
      '- **Site e SEO**: presença digital, SEO local, blog técnico.',
      '- **Portfólio**: cases, estrutura, fotos, resultados mensuráveis.',
      '- **Precificação**: custo hora, tabela CONFEA, formas de cobrar, reajuste.',
      '',
      'Me diga o seu nicho (obra, projeto, consultoria) e o desafio específico.',
    ],
  },
}

export function buildMarketingReply(message = '') {
  const topic = classifyMarketingQuery(message)
  const knowledge = MARKETING_KNOWLEDGE[topic] || MARKETING_KNOWLEDGE.geral
  return [`**${knowledge.title}**`, '', ...knowledge.content].join('\n')
}

// ─── Unified dispatcher ───────────────────────────────────────────────────────

export function buildDomainKnowledgeReply(intent, message = '') {
  switch (intent) {
    case 'production_orcamento_sinapi_help':   return buildOrcamentoReply(message)
    case 'production_proposta_contrato_help':  return buildPropostaReply(message)
    case 'production_obra_campo_help':         return buildObraReply(message)
    case 'production_cronograma_help':         return buildCronogramaReply(message)
    case 'production_marketing_vendas_help':   return buildMarketingReply(message)
    default: return null
  }
}

export const DOMAIN_KNOWLEDGE_INTENTS = new Set([
  'production_orcamento_sinapi_help',
  'production_proposta_contrato_help',
  'production_obra_campo_help',
  'production_cronograma_help',
  'production_marketing_vendas_help',
])
