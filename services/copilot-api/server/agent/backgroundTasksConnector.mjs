/**
 * Apex AI Copilot — Background Tasks & Multi-Agent Clash Detection Connector
 */

export function classifyBackgroundTasksQuery(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return /\b(segundo plano|noite|overnight|background|madrugada|colisao|colisoes|conflito|conflitos|incompatibilidade|incompatibilidades|interferencia|interferencias|clash|clashes)\b/i.test(t)
}

export function getBackgroundTasksStatus() {
  return {
    id: 'background_tasks_scheduler',
    name: 'Background Multi-Agent Tasks',
    configured: true,
    status: 'configured',
    details: 'Suporta agendamento e simulação de tarefas overnight com cooperação multi-agente.'
  }
}

export const defaultTasks = [
  {
    id: 'mep-structural-clash',
    title: 'Análise de Conflitos: Hidrossanitário vs. Estrutura',
    description: 'Análise autônoma de interferências físicas entre tubulações MEP e vigas/pilares de concreto armado.',
    status: 'scheduled', // 'scheduled', 'running', 'completed'
    scheduledTime: 'Hoje às 02:00',
    agents: ['BIM Manager Agent', 'Quality QA Agent', 'Cost Controller Agent', 'Scheduler Agent'],
    progress: 0,
    logs: [
      '[02:00:00] [Maestro AI] Iniciando tarefa agendada overnight "mep-structural-clash".',
      '[02:00:05] [Maestro AI] Convocando agentes: BIM Manager, Quality QA, Cost Controller e Scheduler.',
      '[02:01:20] [BIM Manager] Lendo arquivos IFC do repositório (modelo_mep.ifc e modelo_estrutura.ifc).',
      '[02:03:10] [BIM Manager] Executando detecção de colisão tridimensional...',
      '[02:05:40] [BIM Manager] Identificados 2 conflitos críticos geométricos entre tubulações e elementos estruturais.',
      '[02:06:15] [Quality QA] Analisando conformidade com a NBR 18 (Segurança) e NBR 6118 (Estruturas de Concreto).',
      '[02:07:30] [Quality QA] Conflito CL-01 (Viga V102) viola integridade estrutural se perfurado sem reforço.',
      '[02:08:45] [Cost Controller] Calculando impacto financeiro de retrabalho se executado conforme projeto original.',
      '[02:09:10] [Cost Controller] Estimativa de retrabalho: R$ 8.500,00 caso o concreto já tenha sido concretado.',
      '[02:10:00] [Scheduler] Avaliando impacto no cronograma físico-financeiro (lookahead de alvenaria/acabamento).',
      '[02:10:50] [Scheduler] Risco de atraso estimado em 3 dias úteis na etapa de fechamento.',
      '[02:11:30] [Maestro AI] Consolidando análises e auto-correções propostas em relatório estruturado.',
      '[02:12:00] [Maestro AI] Relatório concluído com sucesso e pronto para a manhã seguinte.'
    ],
    report: `### Relatório Multi-Agente: Detecção de Conflitos e Auto-Correção
**Tarefa**: Análise de Conflitos: Hidrossanitário (MEP) vs. Estrutura  
**Data da Execução**: Executado às 02:00 (Overnight Run)  
**Status**: Concluído com Sucesso · Auto-Correções Propostas

> [!IMPORTANT]
> **Aviso de Execução Autônoma**  
> Este relatório foi consolidado de forma autônoma pelos Agentes Cognitivos da Apex. Nenhuma alteração foi realizada diretamente nos arquivos IFC originais no servidor. As propostas abaixo aguardam aprovação de engenharia.

---

#### 1. Incompatibilidades Geométricas Detectadas

| ID | Pavimento | Elemento MEP | Elemento Estrutura | Severidade | Impacto Rework | Proposta de Auto-Correção |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CL-01** | 1º Pavimento | Tubulação Esgoto DN100 | Viga Concreto V102 | **Crítico** | R$ 5.000,00 | Rotacionar curva de desvio em 45° no ramal de esgoto para passar logo abaixo do nível inferior da viga V102. |
| **CL-02** | 2º Pavimento | Duto de Ventilação 60x40 | Pilar Concreto P204 | **Alto** | R$ 3.500,00 | Deslocar eixo do duto de ar condicionado em 15cm à esquerda, criando transição suave antes do cruzamento com o pilar. |

---

#### 2. Análise de Impacto (EVM e Cronograma)

- **Custo Total Estimado de Retrabalho (VAC)**: **-R$ 8.500,00** (evitado se as correções forem aprovadas antes da concretagem).
- **Impacto no Cronograma**: Risco de atraso de **3 dias úteis** no caminho crítico da etapa de alvenaria e instalações devido a interferências físicas.
- **KPI de Desempenho Projetado**:
  - SPI atual: 0.98 $\rightarrow$ Com correção: **1.00**
  - CPI atual: 0.96 $\rightarrow$ Com correção: **0.99**

---

#### 3. Conformidade Normativa (Quality & Safety)

> [!WARNING]
> **Norma NBR 6118 (Concreto Armado)**: Furos em vigas de concreto não podem ser executados sem reforço estrutural próximo à zona de tração máxima. O desvio geométrico proposto para a tubulação do **CL-01** é a melhor alternativa técnica para evitar a redução da seção transversal resistente da viga.
`
  }
]
