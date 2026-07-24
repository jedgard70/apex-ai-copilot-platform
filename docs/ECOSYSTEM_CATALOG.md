# Catálogo do Ecossistema Apex AI (Módulos, Agentes, Skills e Prompts)

*Este é um documento vivo (Checklist Contínuo) para mapear o acervo histórico da Apex Global (260 Agentes, 4.114 Skills) e organizá-los sob a nova arquitetura da Fase 1.*

## Resumo de Status
- **Em uso na Plataforma (MVP - Fase 1):** 19 Módulos Principais (Os "Chapéus" do Chat).
- **A serem absorvidos (Futuras Implementações):** Centenas de agentes especializados (Financeiro, Orçamento, Suprimentos) e scripts antigos que serão reativados na Fase 2 e 3.

---

## 🟢 1. MÓDULOS ATUAIS (Em Uso / Fase 1)

*Nota: Os agentes abaixo estão sendo validados no CHECKPOINT_TRACKER.*

### Módulo 1: International Market Strategy
- **Agentes Associados:** Diretor Comercial B2B (US Market).
- **Skills Ativadas:** `linkedin-outreach-generator`, `us-market-analyzer`.
- **Prompts:** Geração de scripts de vendas focados em redução de Rework (LOD 350+).
- **Para que serve:** Captação de clientes (Construtoras nos EUA) para terceirização offshore.

### Módulo 2: Technical Writing & Commercial Proposals
- **Agentes Associados:** Orçamentista de Serviços BIM, Redator Técnico.
- **Skills Ativadas:** `proposal-template-builder`, `pricing-calculator`.
- **Prompts:** Geração de propostas (Escopo, Preço, Prazos).
- **Para que serve:** Converter leads em contratos detalhados e proteger a Apex de passivos.

### Módulo 3: Revit Customization
- **Agentes Associados:** Desenvolvedor BIM (pyRevit Expert).
- **Skills Ativadas:** `python-revit-api`, `batch-sheet-exporter`.
- **Prompts:** Geração de código Python inofensivo e eficiente.
- **Para que serve:** Automatizar tarefas repetitivas de escritório para o cliente final.

### Módulo 4: Professional Writing Coach / AI Humanizer
- **Agentes Associados:** Editor Técnico, Redator Executivo.
- **Skills Ativadas:** `technical-to-executive-translator`, `tone-adjuster`.
- **Prompts:** Humanização de documentação bruta (Clash Reports) para formato executivo (Board Level).
- **Para que serve:** Comunicação C-Level e gestão de crise/impacto de cronograma.

### Módulo 5: SQL Expert / Data Analyst
- **Agentes Associados:** Analista de Dados de Engenharia, Engenheiro de Custos.
- **Skills Ativadas:** `supabase-sql-generator`, `evm-data-analyzer`.
- **Prompts:** Geração de queries relacionais para KPIs de Earned Value Management (EVM).
- **Para que serve:** Previsão analítica de estouro de orçamento em múltiplos canteiros.

### Módulo 6: DesignerGPT / Visual Designer
- **Agentes Associados:** Diretor de Arte, UI/UX Lead.
- **Skills Ativadas:** `brand-concept-generator`, `tailwind-token-mapper`.
- **Prompts:** Direcionamento estético e paleta de materiais corporativos.
- **Para que serve:** Briefing técnico para gerar telas e dashboards de alta conversão.

### Módulo 7: The Negotiator
- **Agentes Associados:** Closer B2B, Estrategista de Objeções.
- **Skills Ativadas:** `objection-handling-framework`, `value-anchoring`.
- **Prompts:** Roteiros de resposta comercial ancorando valor da coordenação BIM.
- **Para que serve:** Aumentar taxa de conversão contra concorrentes "gratuitos" e não independentes.

### Módulo 8: Tech Support Advisor
- **Agentes Associados:** Analista de Suporte de TI Nível 3.
- **Skills Ativadas:** `windows-performance-diagnostics`, `powershell-safe-reader`.
- **Prompts:** Scripts inofensivos de leitura (WMI/CIM) para diagnóstico de gargalos.
- **Para que serve:** Resolver problemas de performance em Workstations rodando Revit/Lumion.

### Módulo 9: Interior / Room Design
- **Agentes Associados:** Arquiteto de Interiores Sênior.
- **Skills Ativadas:** `material-specifier`, `lighting-director`.
- **Prompts:** Memorial descritivo conceitual (Hardscape, Mobiliário, Iluminação).
- **Para que serve:** Orientar equipe de renderização 3D e especificação de alto padrão corporativo.

### Módulo 10: Code GPT / Coding Assistant
- **Agentes Associados:** Arquiteto de Software Node/TS.
- **Skills Ativadas:** `express-supabase-integration`, `rls-security-auditor`.
- **Prompts:** Geração de endpoints seguros, com tratamento de RBAC.
- **Para que serve:** Desenvolvimento primário do próprio ecossistema Apex.

### Módulo 11: Academic Assistant / Research
- **Agentes Associados:** Pesquisador Acadêmico, Doutor em Engenharia Civil.
- **Skills Ativadas:** `research-outline-generator`, `literature-reviewer`.
- **Prompts:** Estruturação lógica e acadêmica de artigos sobre impacto da IA no AEC.
- **Para que serve:** Fundamentação teórica e R&D.

### Módulo 12: Website AI Designer
- **Agentes Associados:** Especialista em Growth Marketing (US Market).
- **Skills Ativadas:** `landing-page-copywriter`, `b2b-conversion-triggers`.
- **Prompts:** Estrutura VSL para terceirização BIM.
- **Para que serve:** Aquisição de clientes internacionais e Copywriting.

### Módulo 13: Exploration / General Reasoning
- **Agentes Associados:** Conselheiro de Diretoria (Board Advisor).
- **Skills Ativadas:** `strategic-decision-framework`, `risk-analysis`.
- **Prompts:** Cruzamento de variáveis (OPEX, Time-to-Market, Soberania).
- **Para que serve:** Tomada de decisão complexa (Ex: APS vs. IfcOpenShell).

### Módulo 14: Windows Care + Coding Assistant
- **Agentes Associados:** Analista de Infraestrutura (IT Care).
- **Skills Ativadas:** `windows-disk-cleanup`, `safe-powershell-scripts`.
- **Prompts:** Rotinas de saneamento de disco (`C:`) e cache do Autodesk.
- **Para que serve:** Manutenção preventiva para máquinas de engenharia locais.

### Módulo 15: Cognitive Agents (EVM / Scheduler / NR)
- **Agentes Associados:** Engenheiro de Planejamento (PMO).
- **Skills Ativadas:** `evm-calculator`, `schedule-variance-analyzer`.
- **Prompts:** Cálculo matemático pesado de Valor Agregado (SPI/CPI) com base em input de medições.
- **Para que serve:** Diagnóstico instantâneo de saúde do projeto (Atraso vs. Orçamento).

### Módulo 16: Supply Chain / Suppliers
- **Agentes Associados:** Comprador Estratégico, Logística de Obra.
- **Skills Ativadas:** `supplier-equalizer`, `lead-time-calculator`.
- **Prompts:** Estruturação de Mapas de Concorrência focados não só no preço, mas no Prazo de Entrega e Condição de Pagamento (Fluxo de Caixa).
- **Para que serve:** Compras (Procurement) e equalização de propostas comerciais de fornecedores.

### Módulo 17: Notifications / Alerts
- **Agentes Associados:** Watchdog de Risco, Monitor de Gatilhos.
- **Skills Ativadas:** `webhook-trigger-builder`, `alert-rule-engine`.
- **Prompts:** Geração de JSONs lógicos de automação ("Se X acontecer, notifique Y no WhatsApp").
- **Para que serve:** Prevenir estouros de orçamento e atrasos antes que virem crise.

### Módulo 18: AI Cost / Observability
- **Agentes Associados:** FinOps AI, Analista de Faturamento (Billing).
- **Skills Ativadas:** `token-usage-tracker`, `cost-anomaly-detector`.
- **Prompts:** Cálculo estimado de uso de Tokens LLM e infraestrutura de banco de dados.
- **Para que serve:** Evitar surpresas na fatura da OpenAI/Anthropic/GCP geradas pelos próprios clientes do Apex Copilot.

### Módulo 19: SaaS / CRM / Finance
- **Agentes Associados:** Diretor Financeiro (CFO), SaaS Pricing Strategist.
- **Skills Ativadas:** `mrr-ltv-calculator`, `subscription-tier-modeler`.
- **Prompts:** Estratégia de precificação (Pricing Tiers) e análise de retenção de clientes.
- **Para que serve:** Monetização da própria plataforma Apex Copilot B2B.

---

## 🟡 2. ACERVO LEGADO E FUTURAS IMPLEMENTAÇÕES (Fase 2+)

*O patrimônio da Apex (Agentes, Módulos Físicos, integrações) que aguardam a conclusão da Fase 1 para serem conectados.*

- **Integrações de Viewer:** IfcOpenShell, Autodesk Platform Services (APS).
- **Bancos de Dados Analíticos:** Agentes de Custos com integração ao SINAPI.
- **Skills Órfãs (Milhares):** Scripts de raspagem de dados, rotinas de RH e Financeiro que serão atrelados a novos Agentes conforme a necessidade dos Studios Canônicos da empresa.
