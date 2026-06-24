# Auditoria: Código Real vs Documentação

> Gerado em: 2026-06-24
> REGRA DE OURO: Documentação é desejo. Código é realidade.

## Metodologia

Cada módulo foi verificado contra 3 critérios:
1. **API** — `api/<modulo>/index.mjs` existe?
2. **Service** — `server/service/<modulo>.mjs` existe?
3. **Rota** — `server.mjs` tem rota registrada?
4. **Painel** — `src/components/<Panel>.tsx` existe?
5. **Integração** — `src/main.tsx` importa e renderiza?

---

## ✅ MÓDULOS REAIS (implementados HOJE 2026-06-24)

### Core (sempre existiu)
| Módulo | API | Service | Rota server.mjs | Painel | main.tsx |
|--------|:---:|:-------:|:----------------:|:------:|:--------:|
| Chat | `api/copilot/chat.mjs` ✅ | — | ✅ | — | ✅ |
| ArchVis | — | — | ✅ | `ArchVisPanel.tsx` ✅ | ✅ |
| DirectCut | — | — | ✅ | `DirectCutPanel.tsx` ✅ | ✅ |
| BIM/3D | — | — | ✅ | `Bim3DPanel.tsx` ✅ | ✅ |
| Budget | — | — | ✅ | `BudgetPanel.tsx` ✅ | ✅ |
| Contracts | — | — | ✅ | `ContractsPanel.tsx` ✅ | ✅ |
| Research | — | — | ✅ | `ResearchPanel.tsx` ✅ | ✅ |
| FieldOps | — | — | ✅ | `FieldOpsPanel.tsx` ✅ | ✅ |
| ProjectWorkspace | — | — | ✅ | `ProjectWorkspacePanel.tsx` ✅ | ✅ |
| GenerationHistory | — | — | ✅ | `GenerationHistoryPanel.tsx` ✅ | ✅ |
| Finance | `api/finance/index.mjs` ✅ | `finance.mjs` ✅ | ✅ | `FinancePanel.tsx` ✅ | ✅ |
| Stock Market | `api/stock/index.mjs` ✅ | `stockMarket.mjs` ✅ | ✅ | `StockMarketPanel.tsx` ✅ | ✅ |
| Trip Planner | `api/trip/index.mjs` ✅ | `tripPlanner.mjs` ✅ | ✅ | `TripPlannerPanel.tsx` ✅ | ✅ |
| NR Compliance | `api/nr/index.mjs` ✅ | `nrCompliance.mjs` ✅ | ✅ | `NRCompliancePanel.tsx` ✅ | ✅ |
| Accounting | `api/accounting/index.mjs` ✅ | `accounting.mjs` ✅ | ✅ | `AccountingPanel.tsx` ✅ | ✅ |
| American Permits | `api/permits/index.mjs` ✅ | `americanPermits.mjs` ✅ | ✅ | `AmericanPermitsPanel.tsx` ✅ | ✅ |
| Social/Marketing | `api/social/index.mjs` ✅ | `socialMedia.mjs` ✅ | ✅ | `SocialMediaPipeline.tsx` ✅ | ✅ |
| Campaign | `api/campaign/index.mjs` ✅ | `socialMedia.mjs` ✅ | ✅ | `CampaignAutomationPanel.tsx` ✅ | ✅ |
| Pipeline Status | — | `pipelineStatus.mjs` ✅ | ✅ | `PipelineProgressPanel.tsx` ✅ | ✅ |
| Auto-Fix | `api/autofix/index.mjs` ✅ | `autoFix.mjs` ✅ | ✅ | — | — |
| Notification | `api/notification/index.mjs` ✅ | `notification.mjs` ✅ | ✅ | `NotificationsPanel.tsx` ✅ | ✅ |
| MS Project | `api/msproject/parse.mjs` ✅ | `msproject.mjs` ✅ | ✅ | — | — |
| Service Order | — | `serviceOrder.mjs` ✅ | ✅ | — | — |
| Invoice | — | `invoice.mjs` ✅ | — | — | — |
| Client CRM | — | `client.mjs` ✅ | — | — | — |
| Stripe | `api/stripe/checkout.mjs` ✅ | — | ✅ | — | — |
| Stripe Webhook | `api/stripe/webhook.mjs` ✅ | — | ✅ | — | — |
| APS/Autodesk | `api/aps/*.mjs` (7) ✅ | — | ✅ | `ApsPanel.tsx` ✅ | ✅ |

### Painéis existentes (58 componentes)
- `AgentPanel`, `AiCostDashboard`, `ApsPanel`, `ArchVisPanel`, `AuthPanel`, `AutoupgradePanel`, `AvatarVoicePanel`
- `Bim3DPanel`, `BudgetPanel`, `CampaignAutomationPanel`, `ClientDashboard`, `ContractsPanel`, `CopilotExecutionPanel`
- `CrmPanel`, `DashboardPage`, `DeploymentFlowPage`, `DigitalTwinPanel`, `DirectCutPanel`
- `EvmSchedulerCompliancePanel`, `ExportCenterPanel`, `FieldOpsPanel`, `FinancePanel`, `GenerationHistoryPanel`
- `GovernanceHubPage`, `IfcViewer`, `KnowledgeBasePanel`, `MarketingAnalyticsPage`, `MetricsDashboardPanel`
- `ModelTrainingPage`, `MultiTenantPanel`, `NotificationsPanel`, `OwnerPage`, `PlatformMapPanel`
- `PlatformNavigatorPage`, `Profile`, `ProjectPackagePanel`, `ProjectWorkspacePanel`, `ProviderStatusPanel`
- `PublicVslLandingPage`, `PwaMobilePanel`, `ResearchPanel`, `SaasAdminPanel`, `SkillExportPanel`
- `SkillUpdatePanel`, `SocialMediaPipeline`, `StockMarketPanel`, `StudioPanelShell`, `SupplyChainPanel`
- `TechnicalDocumentationPage`, `TripPlannerPanel`, `UserAccountPanel`
- **NOVOS HOJE**: `NRCompliancePanel`, `AccountingPanel`, `AmericanPermitsPanel`, `PipelineProgressPanel`

---

## ⚠️ MÓDULOS PARCIAIS (código existe mas sem service dedicado)

| Módulo | O que existe | O que FALTA |
|--------|-------------|-------------|
| **Supply Chain** | Painel `SupplyChainPanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/supplyChain.mjs` — inline em server.mjs apenas |
| **Notifications** | Painel `NotificationsPanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/notifications.mjs` — usa `notification.mjs` que é WhatsApp-only |
| **CRM** | Painel `CrmPanel.tsx` ✅, `server/service/client.mjs` ✅ | ❌ **NÃO** tem rota dedicada `/api/crm/` em server.mjs |
| **AI Cost** | Painel `AiCostDashboardPanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/aiCost.mjs` — inline em server.mjs |
| **Multi-Tenant** | Painel `MultiTenantPanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/multiTenant.mjs` — inline em server.mjs |
| **PWA Mobile** | Painel `PwaMobilePanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/pwaMobile.mjs` — inline em server.mjs |
| **Digital Twin** | Painel `DigitalTwinPanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/digitalTwin.mjs` — inline em server.mjs |
| **Knowledge Base** | Painel `KnowledgeBasePanel.tsx` ✅, rota `server.mjs` ✅ | ❌ **NÃO** tem `server/service/knowledgeBase.mjs` — inline em server.mjs |
| **Metrics** | Painel `MetricsDashboardPanel.tsx` ✅, rota `server.mjs` ✅ | Inline em server.mjs |
| **RDO/FieldOps** | Painel `FieldOpsPanel.tsx` ✅ | ❌ **NÃO** tem `server/service/rdo.mjs` — inline em server.mjs |

---

## ❌ O QUE DOCS PROMETEM MAS NÃO EXISTE

### Documentos que afirmam "LIVE" mas NÃO são verdade:

| Promessa | Onde | Realidade |
|----------|------|-----------|
| "Social Content Pipeline — LIVE" | `docs/APEX_PLATFORM_CURRENT_STATE.md` item 17 | ❌ Criado HOJE 2026-06-24 (`api/social/index.mjs`). Antes NÃO EXISTIA |
| "Campaign Automation — LIVE" | `docs/APEX_PLATFORM_CURRENT_STATE.md` item 16 | ❌ Criado HOJE (`api/campaign/index.mjs` + `socialMedia.mjs`). Antes NÃO EXISTIA |
| "Multi-tenant/PWA — LIVE" | `docs/APEX_PLATFORM_CURRENT_STATE.md` item 25 | ⚠️ Parcial. Painéis existem, mas sem service dedicado |
| "Avatar/Voice — LIVE" | `docs/APEX_PLATFORM_CURRENT_STATE.md` item 24 | ⚠️ Painel existe |
| "Contracts/Permits — SUPABASE_TABLE_MAP" | `docs/SUPABASE_TABLE_MAP.md` | ⚠️ Contracts existe. Permits API criado HOJE |
| "Accounting — CRM/Sales/Finance/Accounting tables" | `docs/SUPABASE_TABLE_MAP.md` | ⚠️ Finance existe. Accounting API criado HOJE |
| "NR Compliance — FieldOps/NR tables" | `docs/SUPABASE_TABLE_MAP.md` / `docs/SUPABASE_SCHEMA_RLS_PLAN.md` | ❌ **NUNCA** existiu antes de HOJE |
| "Stock Market" | Nenhum doc, mas "34 capabilities" | ❌ Criado HOJE |
| "Trip Planner" | Nenhum doc, mas "34 capabilities" | ❌ Criado HOJE |
| "American Permits" | Nenhum doc | ❌ Criado HOJE |

### Funções específicas PROMETIDAS mas NÃO implementadas:

| Funcionalidade | Doc que promete | Status real |
|----------------|----------------|-------------|
| `handleCodeExecutor` | `server.mjs` | ❌ `api/copilot/code-executor.mjs` NÃO EXISTE |
| `handleProjectPackage` | `server.mjs` (inline) | ⚠️ Existe inline, mas `api/copilot/project-package.mjs` NÃO EXISTE |
| `handleGenerationHistory` | `server.mjs` (inline) | ⚠️ Existe inline, mas `api/copilot/generation-history.mjs` NÃO EXISTE |
| Migrations SQL aplicadas | `docs/SUPABASE_APPLY_REPORT.md` | ⚠️ 8 arquivos `.sql` existem em `supabase/migrations/` mas nunca foram aplicados via `supabase db push` |
| Tabelas Supabase (95 tabelas) | `docs/SUPABASE_TABLE_MAP.md` | ⚠️ Planejadas, NUNCA criadas no Supabase real |
| RLS Policies | `docs/SUPABASE_SCHEMA_RLS_PLAN.md` | ⚠️ Draft SQL existe, NUNCA aplicado |
| CrmPanel service backend | `docs/SUPABASE_TABLE_MAP.md` | ❌ `server/service/crm.mjs` NÃO EXISTE — só frontend |
| RDO service backend | `docs/SUPABASE_TABLE_MAP.md` | ❌ `server/service/rdo.mjs` NÃO EXISTE — só frontend |

---

## 📊 RESUMO

| Status | Quantidade | Descrição |
|--------|:----------:|-----------|
| ✅ **REAL (completo)** | ~25 módulos | API + Service + Rota + Painel + main.tsx |
| ⚠️ **PARCIAL** | ~10 módulos | Painel existe, mas sem service dedicado (inline em server.mjs) |
| ❌ **PROMETIDO** | ~6 funcionalidades | Citado em docs como "LIVE" mas nunca existiu antes de hoje |
| 📋 **PLANEJADO** | ~95 tabelas Supabase | SQL draft existe, NUNCA aplicado |

### O que foi CRIADO HOJE (2026-06-24) que docs diziam já existir:
1. Stock Market — APIs + painel + comandos de voz
2. Trip Planner — APIs + painel + comandos de voz
3. NR Compliance — APIs + service + painel + comandos de voz
4. Accounting CRC — APIs + service + painel + comandos de voz
5. American Permits — APIs + service + painel + comandos de voz
6. Marketing/Social — APIs + service + pipeline de conteúdo
7. Pipeline Progress — Motor de tracking + API + painel em tempo real
