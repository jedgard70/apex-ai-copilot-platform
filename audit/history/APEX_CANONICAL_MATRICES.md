# Matrizes de Canonicalização e Consolidação do Ecossistema — Fase E2A

- **Versão:** 1.0.0
- **Data:** 2026-07-22
- **Status:** Canonicalizado & Consolidado (Fase E2A Concluída)
- **Autoridade:** Aprovado pelo Owner

---

## 1. Matriz Canônica de Painéis & Interfaces de UX (14 Painéis)

| ID | Painel / Interface | Capability Associada | Origem Canônica Definida | Status | Destino Definido | Justificativa Técnica |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **PANEL-01** | Mission Control / BuildTrack HQ | `CORE-14 / ENG-06` | `C:\Users\apexg\Downloads\ui_mission_control_1783949884072.png` | `CANONICAL` | Migrar para Stitch/screens preview | Única fonte visual do BuildTrack HQ |
| **PANEL-02** | Dashboard Executivo V1 / V2 | `CORE-14 / BI-01` | `stitch_apex_intelligence_design_system\dashboard-executivo-v2` | `CANONICAL` | Manter V2 como oficial, eliminar V1/Regen | Versão V2 contém métricas completas |
| **PANEL-03** | Intelligence Core / V8 Command Center | `AI-04 / CORE-14` | `stitch_apex_intelligence_design_system\v8-command-center` | `CANONICAL` | Usar V8 Command Center como oficial | Interface completa de telemetria AI |
| **PANEL-04** | BIM Intelligence / BIM-Ops | `ENG-02 / ENG-04` | `apex-ai-copilot-platform\public\pillars\vsl_engineering_bim_1783705680065.png` | `CANONICAL` | Visual da VSL V2 como oficial | Layout limpo com suporte IFC |
| **PANEL-05** | CRM / Marketing / Redes Sociais | `GROWTH-01` | `apex-ai-copilot-platform\public\pillars\vsl_crm_sales_1783705806203.png` | `CANONICAL` | Painel VSL CRM Sales como oficial | Atribuição de leads integrada |
| **PANEL-06** | Orçamento / SINAPI | `ENG-11` | `stitch_apex_intelligence_design_system\orcamento-sinapi` | `CANONICAL` | Interface Stitch SINAPI | Curva ABC e quantitativos |
| **PANEL-07** | RDO / Diário de Obra | `ENG-09` | `stitch_apex_intelligence_design_system\rdo-diario-de-obra` | `CANONICAL` | Interface Stitch RDO | Clima, equipes e fotos |
| **PANEL-08** | Jurídico / Legal | `LEGAL-01` | `stitch_apex_intelligence_design_system\juridico-legal` | `CANONICAL` | Interface Stitch Legal | Minutas e pareceres normativos |
| **PANEL-09** | ArchVis Studio | `ENG-01` | `apex-ai-copilot-platform\public\pillars\vsl_archvis_directcut_1783705788959.png` | `CANONICAL` | Tela VSL ArchVis DirectCut | Pipeline de humanização completo |
| **PANEL-10** | Agentes Cognitivos | `AI-14` | `apex-ai-copilot-platform\public\pillars\vsl_cognitive_agents_1783705697822.png` | `CANONICAL` | Painel VSL Cognitive Agents | Monitoramento de runtime |
| **PANEL-11** | Digital Twin / IoT | `ENG-06 / ENG-07` | `apex-ai-copilot-platform\public\pillars\vsl_digital_twin_1783705814438.png` | `CANONICAL` | Painel VSL Digital Twin | Integração IoT e visualizador 3D |
| **PANEL-12** | Gestão de Projetos | `CORE-04` | `apex-os\src\app\pages\WorkspacePage.ts` | `CANONICAL` | Apex OS WorkspacePage canônica | Código TypeScript já integrado |
| **PANEL-13** | Gestão de Usuários e Permissões | `CORE-03 / CORE-14` | `apex-os\src\app\pages\AdminPage.ts` | `CANONICAL` | Apex OS AdminPage RBAC | Controle RBAC e permissões |
| **PANEL-14** | Financeiro / BI Executivo | `FIN-01` | `apex-ai-copilot-platform\public\pillars\vsl_accounting_dashboard_1783705688313.png` | `CANONICAL` | Painel VSL Accounting Dashboard | Faturamento, ledger e margens |

---

## 2. Matriz Canônica de Componentes UI React/TSX (211 Componentes)

| Módulo | Versões Existentes Descobertas | Componente Canônico Selecionado | Destino E2B | Status |
| :--- | :---: | :--- | :--- | :---: |
| **Auth / Login** | 5 variantes (Login, LoginV2, LoginStitch) | `src/app/pages/LoginPage.ts` (Apex OS) | Manter e evoluir no Core | `CANONICAL` |
| **Workspace** | 4 variantes (Workspace, WorkspaceV2, Dashboard) | `src/app/pages/WorkspacePage.ts` (Apex OS) | Manter e evoluir no Core | `CANONICAL` |
| **Catalog / Services**| 3 variantes (ServiceCatalog, ServicesView) | `src/app/products/ServiceCatalog.ts` | Manter e evoluir no Core | `CANONICAL` |
| **BIM Viewer** | 3 componentes (BimViewer, IfcViewer, ApsBridge) | `src/components/BimViewer.tsx` (Copilot) | Migrar para Apex OS | `MIGRATED_TARGET` |
| **Digital Twin 3D** | 2 componentes (DigitalTwin, TwinViewer) | `pages/digital-twin.tsx` (ACIP) | Migrar para Apex OS | `MIGRATED_TARGET` |
| **Diário de Obra RDO**| 2 componentes (RdoForm, FieldOps) | `pages/rdo.tsx` (ACIP) | Migrar para Apex OS | `MIGRATED_TARGET` |

---

## 3. Matriz Canônica de APIs e Routers (634 Handlers)

| Categoria da API | Quantidade Descoberta | Contrato Canônico Selecionado | Destino E2B | Status |
| :--- | :---: | :--- | :--- | :---: |
| **Autenticação & Sessão** | 18 handlers | `/api/auth/*` (`src/app/server.ts`) | Manter no Apex OS | `CANONICAL` |
| **Serviços & Catálogo** | 12 handlers | `/api/services` (`src/app/server.ts`) | Manter no Apex OS | `CANONICAL` |
| **Execução ArchVis** | 25 handlers | `/v1/archvis` (`CoreFoundation.ts`) | Manter no Apex OS | `CANONICAL` |
| **Public API v1** | 15 handlers | `/v1/*` (`src/app/server.ts`) | Manter no Apex OS | `CANONICAL` |
| **Legado ACIP / Copilot**| 564 handlers `.mjs` | Mapear sob demanda em `/api/*` | Somente leitura | `LEGADO_CONSULTA` |

---

## 4. Matriz Canônica de Skills e Agentes (116 Skills / 15 Agentes)

| Categoria | Arquivos Brutos | Hashes Únicos | Skill / Agente Canônico | Status |
| :--- | :---: | :---: | :--- | :---: |
| **Governança Apex OS** | 1 | 1 | `apex-os-genesis-governance` | `CANONICAL` |
| **Plugins Científicos**| 42 | 42 | `science/*` plugins | `CANONICAL` |
| **Android Development**| 2 | 1 | `android-cli-plugin` | `CANONICAL` |
| **Antigravity SDK** | 3 | 2 | `antigravity-guide` | `CANONICAL` |
| **Acervos Copilot** | 68 | 67 | Agentes e Skills do Copilot | `MAPPED_CANONICAL` |

---

## 5. Checklist de Verificação dos Critérios de Saída da E2A

- [x] **100% dos 14 painéis candidatos possuem versão canônica definida.**
- [x] **Localização oficial de cada ativo estabelecida.**
- [x] **Dependências técnicas conhecidas.**
- [x] **Destino definido para cada componente (Canônico / Migrar / Eliminar / Arquivar).**
- [x] **Responsável atribuído (Jedgard / Owner).**
- [x] **Capability associada a cada item (`CORE-*`, `AI-*`, `ENG-*`, `GROWTH-*`, etc.).**
- [x] **Submetido à aprovação do Owner no STOP GATE.**
