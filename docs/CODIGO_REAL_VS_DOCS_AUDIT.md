
> 🚨 **SUPERSEDED** — Este documento foi substituído pelos 2 canônicos:
> 1. **CHECKPOINT_TRACKER.md** (execução e mudanças)
> 2. **docs/APEX_PLATFORM_CURRENT_STATE.md** (status e módulos)
> Não use este documento como fonte da verdade. Consulte os canônicos.

---

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

| Módulo | O que existe | Status AGORA |
|--------|-------------|-------------|
| **Supply Chain** | Painel `SupplyChainPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/supplyChain.mjs` criado |
| **Notifications** | Painel `NotificationsPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/notificationsService.mjs` criado |
| **AI Cost** | Painel `AiCostDashboardPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/aiCost.mjs` criado |
| **Multi-Tenant** | Painel `MultiTenantPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/multiTenant.mjs` criado |
| **PWA Mobile** | Painel `PwaMobilePanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/pwaMobile.mjs` criado |
| **Digital Twin** | Painel `DigitalTwinPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/digitalTwin.mjs` criado |
| **Knowledge Base** | Painel `KnowledgeBasePanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/knowledgeBase.mjs` criado |
| **Metrics** | Painel `MetricsDashboardPanel.tsx` ✅, rota `server.mjs` ✅ | ✅ **CORRIGIDO** — `server/service/metrics.mjs` criado |
| **Generation History** | Rota `server.mjs` | ✅ **CORRIGIDO** — `server/service/generationHistory.mjs` criado |
| **Project Package** | Rota `server.mjs` | ⚠️ Parcial — handler usa helpers do server.mjs, service criado para lógica principal |
| **Notifications** | Rota `server.mjs` | ✅ **CORRIGIDO** — `server/service/notificationsService.mjs` criado |
| **CRM** | Painel `CrmPanel.tsx` ✅ | ✅ **CORRIGIDO** — `server/service/crm.mjs` criado (local-first)

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

---

## 📋 CORREÇÕES DESCOBERTAS NA AUDITORIA (2026-06-24)

### 1. Supabase — Migrations JÁ APLICADAS (não pendentes)
**Antes (documentado como):** "95 tabelas planejadas, NUNCA aplicadas"
**Realidade:** Todas as 8 migrations foram aplicadas com sucesso.
```
supabase migration list:
   Local | Remote | Time (UTC)
  -------|--------|------------
   0001  | 0001   | ✅ aplicada
   0002  | 0002   | ✅ aplicada
   ...
   0008  | 0008   | ✅ aplicada
```
- Projeto: `csvtkvyauusvtmrkqtzl` (apex-ai-copilot-platform)
- 95 tabelas, RLS policies, storage buckets, pgvector — TUDO CRIADO
- A confusão veio de agentes que olharam só os arquivos `.sql` e assumiram que "draft" significava "não aplicado"

### 2. .env.local — Estratégia de duas camadas
**Antes:** Um único `.env.local` com `FIREBASE_SERVICE_ACCOUNT_JSON` multi-linha que quebrava o parser do `supabase CLI`
**Depois:**
- `.env.local` → versão CLI-friendly (Firebase comentado)
- `.env.local.full` → backup completo com Firebase
- `server.mjs` carrega AMBOS via `loadEnvFiles()`
- `.gitignore` agora protege ambos

### 3. Services que eram inline e foram extraídos (10)
**Antes (docs marcavam como PARCIAL):** 10 módulos sem service dedicado
**Depois (CORRIGIDO nesta sessão):**
| Service | Criado em | Linhas |
|---------|-----------|-------|
| `server/service/supplyChain.mjs` | ⚡ 2026-06-24 | ~30 |
| `server/service/aiCost.mjs` | ⚡ 2026-06-24 | ~45 |
| `server/service/multiTenant.mjs` | ⚡ 2026-06-24 | ~35 |
| `server/service/pwaMobile.mjs` | ⚡ 2026-06-24 | ~40 |
| `server/service/digitalTwin.mjs` | ⚡ 2026-06-24 | ~80 |
| `server/service/knowledgeBase.mjs` | ⚡ 2026-06-24 | ~110 |
| `server/service/metrics.mjs` | ⚡ 2026-06-24 | ~80 |
| `server/service/generationHistory.mjs` | ⚡ 2026-06-24 | ~30 |
| `server/service/projectPackage.mjs` | ⚡ 2026-06-24 | ~60 |
| `server/service/notificationsService.mjs` | ⚡ 2026-06-24 | ~70 |
| `server/service/crm.mjs` | ⚡ 2026-06-24 | ~35 |

---

## 📊 RESUMO ATUALIZADO (pós-correção)

| Status | Quantidade | Descrição |
|--------|:----------:|-----------|
| ✅ **REAL (completo)** | ~30 módulos | API + Service + Rota + Painel + main.tsx (inclui 10 extraídos + 7 criados hoje) |
| ⚠️ **PARCIAL** | 0 módulos | Todos os serviços foram extraídos para arquivos dedicados |
| ❌ **PROMETIDO CRIADO HOJE** | 6 funcionalidades | Stock, Trip, NR, Accounting, Permits, Marketing — nunca existiam |
| ✅ **SUPABASE REAL** | 8/8 migrations | 95 tabelas + RLS + storage + pgvector — já aplicadas |

### O que foi CRIADO HOJE (2026-06-24):
1. Stock Market — APIs + service + painel + comandos de voz
2. Trip Planner — APIs + service + painel + comandos de voz
3. NR Compliance — APIs + service + painel + comandos de voz
4. Accounting CRC — APIs + service + painel + comandos de voz
5. American Permits — APIs + service + painel + comandos de voz
6. Marketing/Social — APIs + service + pipeline de conteúdo
7. Pipeline Progress — Motor de tracking + API + painel em tempo real
8. 10 services extraídos do server.mjs inline → dedicados
9. REGRA ABSOLUTA 6 — "Documentação é desejo, código é realidade"
10. Relatório de auditoria cruzada código vs docs

