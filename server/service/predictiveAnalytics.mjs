/**
 * server/service/predictiveAnalytics.mjs — ACIP
 * Predição de atrasos, risco financeiro, gargalos e retrabalho
 */
export function predictDelays(projeto) {
  const data = { projeto: projeto || 'Geral', geradoEm: new Date().toISOString() }
  return {
    ...data,
    delayRisk: [
      { fator: 'Clima (chuvas sazonais)', impacto: 0.12, cor: '#f59e0b', descricao: 'Previsão de chuvas acima da média nos próximos 30 dias' },
      { fator: 'Fornecedor de aço', impacto: 0.18, cor: '#ef4444', descricao: 'Fornecedor principal com histórico de atrasos de 5-10 dias' },
      { fator: 'Mão de obra especializada', impacto: 0.08, cor: '#3b82f6', descricao: 'Disponibilidade limitada de pedreiros na região' },
      { fator: 'Licenciamento ambiental', impacto: 0.22, cor: '#ef4444', descricao: 'Processo de licença ambiental em andamento, risco de paralização' },
      { fator: 'Dependência entre tarefas', impacto: 0.15, cor: '#f59e0b', descricao: '3 tarefas críticas com dependência direta na rota crítica' },
    ].map(d => ({ ...d, nivel: d.impacto >= 0.2 ? 'critical' : d.impacto >= 0.1 ? 'alto' : 'médio' })),
    probAtrasoGeral: 0.38,
    diasAtrasoEstimado: 18,
    recomendacoes: [
      'Negociar penalidades contratuais com fornecedor de aço',
      'Iniciar processo de licenciamento ambiental com urgência',
      'Contratar equipe de obra adicional para tarefas críticas',
      'Criar buffer de 15 dias no cronograma para contingências climáticas',
    ],
  }
}

export function predictFinancialRisk(projeto) {
  return {
    projeto: projeto || 'Geral', geradoEm: new Date().toISOString(),
    riscos: [
      { tipo: 'Estouro de orçamento', probabilidade: 0.25, impactoEstimado: 180000, categoria: 'custo', nivel: 'alto' },
      { tipo: 'Multa por atraso', probabilidade: 0.35, impactoEstimado: 95000, categoria: 'contratual', nivel: 'alto' },
      { tipo: 'Variacao cambial insumos', probabilidade: 0.15, impactoEstimado: 45000, categoria: 'custo', nivel: 'médio' },
      { tipo: 'Retrabalho por NCI', probabilidade: 0.20, impactoEstimado: 32000, categoria: 'qualidade', nivel: 'médio' },
      { tipo: 'Inadimplência cliente', probabilidade: 0.05, impactoEstimado: 250000, categoria: 'receita', nivel: 'baixo' },
    ],
    riscoFinanceiroGeral: 0.22,
    valorEmRisco: 377000,
    recomendacoes: [
      'Alocar provisão de 15% para estouro de orçamento',
      'Incluir cláusula de reajuste por variação cambial nos contratos',
      'Intensificar qualidade para reduzir retrabalho',
    ],
  }
}

export function detectBottlenecks(projeto) {
  return {
    projeto: projeto || 'Geral', geradoEm: new Date().toISOString(),
    gargalos: [
      { recurso: 'Concretagem', tipo: 'equipamento', ocupacao: 0.92, status: 'critical', descricao: 'Caminhão betoneira compartilhado entre 2 obras' },
      { recurso: 'Equipe de elétrica', tipo: 'mao-de-obra', ocupacao: 0.88, status: 'alerta', descricao: 'Apenas 1 equipe para 3 frentes de trabalho' },
      { recurso: 'Aprovação de projetos', tipo: 'processo', ocupacao: 0.85, status: 'alerta', descricao: 'Engenheiro responsável sobrecarregado' },
    ],
    recomendacoes: [
      'Alugar caminhão betoneira adicional para o período de pico',
      'Contratar equipe de elétrica temporária',
      'Distribuir aprovações entre 2 engenheiros',
    ],
  }
}

export function generateReport(projeto) {
  const delays = predictDelays(projeto); const finance = predictFinancialRisk(projeto); const bottlenecks = detectBottlenecks(projeto)
  const scoreGeral = Math.round((1 - ((delays.probAtrasoGeral + finance.riscoFinanceiroGeral) / 2)) * 100)
  return {
    projeto: projeto || 'Geral', geradoEm: new Date().toISOString(), scoreGeral,
    resumo: scoreGeral >= 70 ? 'Baixo risco — projetos dentro dos parâmetros esperados' : scoreGeral >= 50 ? 'Risco moderado — monitorar indicadores críticos' : 'Alto risco — intervenção necessária',
    delays, finance, bottlenecks,
  }
}
