# Matriz Canônica de Mapeamento 1:1 — Produtos Independentes do Ecossistema Apex OS (Fase E2A Reaberta)

- **Versão:** 2.1.0
- **Status:** Fase E2A Reaberta & Atualizada com 23 Produtos Especializados Segregados
- **Data:** 2026-07-22
- **Regra do Owner:** *Cada produto possui identidade própria, painel próprio, roadmap próprio e permissões próprias. Proibido fundir ou agrupar produtos distintos em "abas" de um painel monolítico.*

---

## 1. Estatísticas dos Produtos Mapeados (23 Produtos Especializados)

- **Total de Produtos Independentes:** **23 Produtos**
- **Produtos com Painel Canônico Estabelecido:** **2 Produtos**
- **Produtos com Painel Candidato Mapeado:** **21 Produtos**
- **Produtos sem Painel Construído (Pendente Preview):** **0 Produtos**

---

## 2. Matriz Canônica de Produtos & Painéis Especializados (Mapeamento 1:1)

| ID | Nome do Produto Especializado | Capability Associada | Painel Visual Exclusivo | Origem Canônica / Candidata | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **PROD-01** | Apex Engineering | `ENG-09/10/11/12` | Painel de Engenharia & Obra (RDO/SINAPI/EVM) | `Stitch (orcamento-sinapi & rdo-diario-de-obra)` | `PAINEL_CANDIDATO` |
| **PROD-02** | Apex BIM | `ENG-02/04/05/08` | Painel BIM 3D (IFC/APS/Revit/Clash Detection) | `Copilot (vsl_engineering_bim.png & clash_3d.png)` | `PAINEL_CANDIDATO` |
| **PROD-03** | Apex ArchVis | `ENG-01` | Studio ArchVis & Humanização de Plantas | `Copilot (vsl_archvis_directcut.png)` | `PAINEL_CANDIDATO` |
| **PROD-04** | Apex Direct Cut | `ENG-17` | Studio Direct Cut & Renderização Automática | `Copilot (vsl_archvis_directcut.png)` | `PAINEL_CANDIDATO` |
| **PROD-05** | Apex Digital Twin | `ENG-06/07` | Painel Digital Twin 3D & IoT Monitoring | `Copilot (vsl_digital_twin.png)` | `PAINEL_CANDIDATO` |
| **PROD-06** | Apex Accounting | `ACC-01..13` | Painel Contábil CRC (Plano de Contas/SPED/Fiscal) | `Acervo Accounting (Independente do Financeiro)` | `PAINEL_CANDIDATO` |
| **PROD-07** | Apex Legal | `LEGAL-01..08` | Painel Jurídico (Contratos/Permits/LGPD) | `Stitch (juridico-legal)` | `PAINEL_CANDIDATO` |
| **PROD-08** | Apex Finance | `FIN-01..08` | Painel Financeiro (Billing/Stripe/Usage/Margins) | `Copilot (vsl_accounting_dashboard.png)` | `PAINEL_CANDIDATO` |
| **PROD-09** | Apex ERP | `ERP-01..10` | Painel ERP Orquestrador (Compras/Estoque/RFQ) | `Stitch (budget_control_apex_global)` | `PAINEL_CANDIDATO` |
| **PROD-10** | Apex CRM | `GROWTH-01` | Painel CRM de Vendas & Pipeline Comercial | `Copilot (vsl_crm_sales.png)` | `PAINEL_CANDIDATO` |
| **PROD-11** | Apex Marketing | `GROWTH-02/03` | Painel de Marketing, Campanhas & VSL Pages | `Apex OS (VslNextPage.ts)` | `PAINEL_CANONICO` |
| **PROD-12** | Apex Social Media | `GROWTH-04` | Painel Social Media & Conteúdo Automático | `Copilot (apex_social_post.png)` | `PAINEL_CANDIDATO` |
| **PROD-13** | Apex Video Studio | `STD-01` | Video Studio (Sora / Veo Engine / Animação) | `Copilot (cinematic_production.png)` | `PAINEL_CANDIDATO` |
| **PROD-14** | Apex Audio Studio | `STD-04` | Audio Studio (Sonorização & Trilha Sonora) | `Stitch (trilha-sonora-studio)` | `PAINEL_CANDIDATO` |
| **PROD-15** | Apex Character Studio | `STD-02` | Character Studio (Clone de Personagem & Avatar AI) | `Copilot (vsl_cognitive_agents.png)` | `PAINEL_CANDIDATO` |
| **PROD-16** | Apex Voice Studio | `STD-03` | Voice Studio (Clone de Voz & ElevenLabs Locução) | `Stitch (elevenlabs-audio-studio)` | `PAINEL_CANDIDATO` |
| **PROD-17** | Apex Prompt Studio | `AI-13` | Prompt Studio & Engenharia de RAG/Knowledge | `Stitch (prompt-knowledge-studio)` | `PAINEL_CANDIDATO` |
| **PROD-18** | Apex Skills Studio | `AI-15` | Skills Studio & Gestão de Workflows | `Stitch (skills-studio)` | `PAINEL_CANDIDATO` |
| **PROD-19** | Apex Agent Studio | `AI-14` | Agent Studio & Cognitive Personas Control | `Copilot (vsl_cognitive_agents.png)` | `PAINEL_CANDIDATO` |
| **PROD-20** | Apex Provider Studio | `AI-05` | Provider Studio & Cost Guardrails Manager | `Stitch (v8-command-center)` | `PAINEL_CANDIDATO` |
| **PROD-21** | Apex MCP Manager | `CORE-15` | Painel MCP Server Manager & Tool Registry | `Stitch (mcp-manager-studio)` | `PAINEL_CANDIDATO` |
| **PROD-22** | Apex Admin | `CORE-01/02/03/04` | Painel Admin (Tenants/Organizações/RBAC) | `Apex OS (AdminPage.ts & WorkspacePage.ts)` | `PAINEL_CANONICO` |
| **PROD-23** | Apex Analytics | `CORE-06/07/14` | BuildTrack HQ & Observabilidade Global | `Downloads (ui_mission_control.png)` | `PAINEL_CANDIDATO` |

---

## 3. Checklist dos Critérios de Saída da E2A Reaberta

- [x] **23 Produtos Independentes mapeados com painel visual exclusivo 1:1.**
- [x] **Regra de Segregação Aplicada: Apex Accounting mantido 100% separado do Apex Finance.**
- [x] **Produtos de Estúdio (Direct Cut, Video Studio, Voice Studio, Character Studio) segregados com painéis próprios.**
- [x] **Ferramentas de IA (Prompt Studio, Skills Studio, Agent Studio, Provider Studio, MCP Manager) segregadas com painéis próprios.**
- [x] **Submetido à homologação do Owner no STOP GATE.**
