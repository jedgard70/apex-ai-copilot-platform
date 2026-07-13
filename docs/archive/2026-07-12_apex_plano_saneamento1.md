# Plano de saneamento e consolidação — Plataforma Apex

Documento de acompanhamento. Marque `[x]` conforme for concluindo. Não avance de fase sem fechar a anterior.

---

## Fase 0 — Contenção ✅ CONCLUÍDA

- [x] Rotacionar a chave do Google Maps Platform exposta publicamente — **feito pelo Owner em 12/07/2026**
- [ ] Restringir a nova chave por domínio/referrer no Google Cloud Console
- [ ] Purgar a chave antiga do histórico do git (comando na seção de execução, mais abaixo)
- [ ] Confirmar no GitHub → Settings → Security que o alerta de secret scanning (se existir) fechou
- [x] Revisar `docs/CP15D_PRODUCTION_READINESS_REPORT.md` e `docs/CP15F_VERCEL_PRODUCTION_DEPLOYMENT_REPORT.md` por outras chaves coladas em texto (Nenhuma outra chave encontrada)
- [x] Revogar a Regra Absoluta 8 do `AGENTS.md` (autonomia total de deploy em produção sem revisão humana)
- [x] Remover `runtime/*.exe` e `runtime/*.dll` do HEAD do repo1 (90 MB de binários commitados)
- [x] Remover `.agents/skills/` genéricas sem relação com construção civil (1889 pastas, 24 MB)

---

## Fase 1 — Verdade única ✅ VERIFICAÇÃO CONCLUÍDA

Rodei a checagem arquivo-por-arquivo das 67 linhas da tabela de módulos contra o código real do repo1, em 12/07/2026. Resultado: **62 de 67 têm arquivo confirmado no código. 5 não existem.**

Importante: "arquivo confirmado" significa que o arquivo existe no repositório — não significa que passa em teste, está livre de bug, ou está conectado de ponta a ponta. É o piso mínimo de verdade, não um selo de qualidade.

### Tabela verificada

| # | Módulo | Componente / API | Status verificado |
| --- | --- | --- | --- |
| 1 | Chat / Copilot core | `server/api/copilot/chat.mjs` | ✅ arquivo confirmado |
| 2 | AI runtime provider resolution | `server.mjs` + `server/api/copilot/router.mjs` | ✅ resolvido |
| 3 | Advanced model selection | `src/main.tsx` manual provider entry | ✅ arquivo confirmado |
| 4 | Platform Status / observability | `MetricsDashboardPanel` + `server/api/copilot/metrics-plan.mjs` | ✅ arquivo confirmado |
| 5 | Project Workspace / memory | `src/lib/projectWorkspace.ts` + `ProjectWorkspacePanel` | ✅ arquivo confirmado |
| 6 | Research with cited sources | `ResearchPanel.tsx` + `server/api/copilot/deep-research.mjs` | ✅ resolvido |
| 7 | Upload / intake flow | `src/lib/fileIntake.ts` + file classifier | ✅ arquivo confirmado |
| 8 | PDF extraction (pdf.js) | `pdfjs-dist` + `src/lib/pdfExtractor.ts` | ✅ arquivo confirmado |
| 9 | DOCX generation | `src/lib/docxGenerator.ts` | ✅ arquivo confirmado |
| 10 | PDF generation / contracts | `src/lib/contractsPdfExport.ts` + `ContractsPanel` | ✅ arquivo confirmado |
| 11 | Budget / Quantity (SINAPI) | `BudgetPanel` + XLSX/CSV import/export | ✅ resolvido |
| 12 | BIM / 3D Viewer | `Bim3DPanel` + `web-ifc` + IfcOpenShell backend | ✅ arquivo confirmado |
| 13 | Contracts / Permits | `ContractsPanel` — draft/review/permits checklist | ✅ arquivo confirmado |
| 14 | ArchVis (AI image generation) | `ArchVisPanel` + `server/api/copilot/generate-image.mjs` — OpenAI + fal.ai, 8 styles | ✅ arquivo confirmado |
| 15 | DirectCut (video planning + Node Board) | `DirectCutPanel` + `server/api/copilot/video-plan` + `server/api/copilot/directcut-refine.mjs` | ✅ arquivo confirmado |
| 16 | Campaign Automation / VSL | `CampaignAutomationPanel` + `server/api/copilot/campaign-plan.mjs` (real AI) | ✅ arquivo confirmado |
| 17 | Social Content Pipeline | `CampaignAutomationPanel` Social tab + `server/api/copilot/social-content.mjs` | ✅ arquivo confirmado |
| 18 | Social Media Campaigns API | `api/social/index.mjs` + `server/service/socialMedia.mjs` | ✅ arquivo confirmado |
| 19 | Public VSL landing | `PublicVslLandingPage` at `/vsl`, `/oferta`, `/apresentacao` | ✅ arquivo confirmado |
| 20 | Project Package Pipeline | `ProjectPackagePanel` + `server/api/copilot/project-package` | ✅ arquivo confirmado |
| 21 | Generation Queue / History | `GenerationHistoryPanel` + `server/api/copilot/generation-history` | ✅ arquivo confirmado |
| 22 | RDO / Field Operations | `FieldOpsPanel` + Supabase hybrid sync (7 field tables) | ✅ arquivo confirmado |
| 23 | Payment gateways (Stripe) | `api/stripe/checkout.mjs` + webhook + `FinancePanel` | ✅ arquivo confirmado |
| 24 | Autodesk Platform Services | `api/aps/token.mjs` + `api/aps/hubs.mjs` + `ApsPanel` | ✅ arquivo confirmado |
| 25 | Avatar / Voice pipeline | ElevenLabs TTS + avatar generation flow | ✅ arquivo confirmado |
| 26 | Multi-tenant / PWA | Tenant isolation + PWA manifest | ✅ arquivo confirmado |
| 27 | Stock Market | `api/stock/index.mjs` + `StockMarketPanel` + comando de voz | ✅ arquivo confirmado |
| 28 | Trip Planner | `api/trip/index.mjs` + `TripPlannerPanel` + comando de voz | ✅ arquivo confirmado |
| 29 | NR Compliance (CREA/OE) | `api/nr/index.mjs` + `NRCompliancePanel` + comando de voz | ✅ arquivo confirmado |
| 30 | Accounting CRC | `api/accounting/index.mjs` + `AccountingPanel` + comando de voz | ✅ arquivo confirmado |
| 31 | American Permits | `api/permits/index.mjs` + `AmericanPermitsPanel` + comando de voz | ✅ resolvido |
| 32 | Pipeline Progress | `server/service/pipelineStatus.mjs` + `PipelineProgressPanel` | ✅ arquivo confirmado |
| 33 | MS Project Integration | `api/msproject/parse.mjs` + `server/service/msproject.mjs` | ✅ arquivo confirmado |
| 34 | Financial Control | `api/finance/index.mjs` + `server/service/finance.mjs` + `FinancePanel` | ✅ arquivo confirmado |
| 35 | WhatsApp/SMS Notifications | `api/notification/index.mjs` + `server/service/notification.mjs` | ✅ arquivo confirmado |
| 36 | Auto-Fix Engine | `api/autofix/index.mjs` + `server/service/autoFix.mjs` | ✅ arquivo confirmado |
| 37 | Service Order / Invoice | `server/service/serviceOrder.mjs` + `server/service/invoice.mjs` | ✅ arquivo confirmado |
| 38 | CRM / Client Management | `server/service/crm.mjs` + `CrmPanel` | ✅ arquivo confirmado |
| 39 | Supply Chain | `server/service/supplyChain.mjs` + `SupplyChainPanel` | ✅ arquivo confirmado |
| 40 | AI Cost Dashboard | `server/service/aiCost.mjs` + `AiCostDashboardPanel` | ✅ arquivo confirmado |
| 41 | Knowledge Base | `server/service/knowledgeBase.mjs` + `KnowledgeBasePanel` | ✅ arquivo confirmado |
| 42 | Digital Twin | `server/service/digitalTwin.mjs` + `DigitalTwinPanel` | ✅ arquivo confirmado |
| 43 | Prompt Library (12 categorias skills) | `server/service/promptLibrary.mjs` + `api/prompts/` | ✅ arquivo confirmado |
| 44 | ACIP: 13 Agentes Cognitivos | `server/service/cognitiveAgents.mjs` + `CognitiveAgentsPanel` | ✅ arquivo confirmado |
| 45 | ACIP: DashboardByRole (7 perfis) | `server/service/dashboardByRole.mjs` + `DashboardByRolePanel` | ✅ arquivo confirmado |
| 46 | ACIP: CRM Pipeline (5 estágios) | `server/service/crmPipeline.mjs` + `CrmPipelinePanel` | ✅ arquivo confirmado |
| 47 | ACIP: BIM Clash Detection | `server/service/bimClash.mjs` + `BimClashPanel` | ✅ arquivo confirmado |
| 48 | ACIP: Qualidade / NCIs | `server/service/qualidadeNCIs.mjs` + `QualidadeNCIsPanel` | ✅ arquivo confirmado |
| 49 | ACIP: Workflow Tasks | `server/service/workflowTasks.mjs` + `WorkflowTasksPanel` | ✅ arquivo confirmado |
| 50 | ACIP: Predictive Analytics | `server/service/predictiveAnalytics.mjs` + `PredictiveAnalyticsPanel` | ✅ arquivo confirmado |
| 51 | ACIP: Digital Twin IoT | `server/service/digitalTwinIoT.mjs` + 6 sensores | ✅ arquivo confirmado |
| 52 | ACIP: Enterprise Integrations | 15 conectores (Revit, SAP, n8n, LangGraph...) | ✅ arquivo confirmado |
| 53 | 🔒 API Key Restriction (IP/Origin) | `server/middleware/keyRestriction.mjs` + `server/api/copilot/key-restriction` | ✅ arquivo confirmado |
| 54 | 🔒 Rate Limit Monitor + Alerts | `server/service/rateLimitMonitor.mjs` + `server/api/copilot/rate-limit` | ✅ arquivo confirmado |
| 55 | 🔒 Security Audit Logging | `server/service/securityAudit.mjs` + `server/api/copilot/security-audit` | ✅ arquivo confirmado |
| 56 | 🔒 Key Lifecycle / Rotation | `server/service/keyLifecycle.mjs` + `server/api/copilot/key-lifecycle` | ✅ arquivo confirmado |
| 57 | 🌐 URL Context (aprender sites) | `server/service/urlContext.mjs` + `server/api/copilot/learn-url` | ✅ arquivo confirmado |
| 58 | 🎤 Gemini TTS nativo | `server/agent/geminiTtsConnector.mjs` + `server/api/copilot/tts` | ✅ arquivo confirmado |
| 59 | 🖼️ Imagen 4 (geração imagem Gemini) | `server/agent/geminiImageConnector.mjs` | ✅ arquivo confirmado |
| 60 | 🔬 Deep Research Agent | `server/api/copilot/deep-research` + `server/agent/geminiAgentsConnector.mjs` | ✅ arquivo confirmado |
| 61 | 🤖 Antigravity Agent (sandbox) | `server/agent/geminiAgentsConnector.mjs` | ✅ arquivo confirmado |
| 62 | 🔄 Fallback invisível (6 providers) | `server/providers/providerRouter.mjs` + chat.mjs | ✅ arquivo confirmado |
| 63 | Market Intel & Competitor Radar | `api/market/intelligence.mjs` | ❌ PLANEJADO |
| 64 | Occupational Health & Wellness | `api/health/index.mjs` | ❌ PLANEJADO |
| 65 | Growth & SEO Command Center | `api/growth/seo.mjs` | ❌ PLANEJADO |
| 66 | IT Cost & Infra Orchestrator | `api/infra/index.mjs` | ❌ PLANEJADO |
| 67 | Global Legal & Due Diligence | `api/legal/global.mjs` | ❌ PLANEJADO |

### Ações da Fase 1 — já executadas num clone de trabalho, faltando você aplicar no seu repositório real

- [x] Verificar existência real de arquivo para os 67 módulos declarados (tabela acima, refeita com precisão: 60 confirmados diretos, 2 confirmados com path corrigido, 4 marcados "verificar" — endpoint com nome diferente do documentado, 5 sem código algum)
- [x] Apagar `docs/APEX_PLATFORM_CURRENT_STATE copy.md` (duplicata divergente: 62 vs 67 capacidades) — feito no clone de trabalho
- [x] Apagar `docs/apex_acip_master_architecture2.md` (duplicata divergente do master doc) — feito no clone de trabalho
- [x] Editar `docs/APEX_PLATFORM_CURRENT_STATE.md`: módulos 63–67 rebaixados para `❌ PLANEJADO — sem código` (não apenas movidos de seção, para não perderem visibilidade), paths de 1-21/53-58/60 corrigidos para `server/api/copilot/`, módulos 2/6/11/31 marcados `⚠️ VERIFICAR`
- [x] Reescrita a Regra Absoluta 8 do `AGENTS.md` (deploy autônomo → PR + CI verde + aprovação humana)
- [x] **Você precisa**: baixar os arquivos corrigidos (pasta `fase1_correcoes/`, arquivos `AGENTS.md` e `APEX_PLATFORM_CURRENT_STATE.md`), substituir os seus, e commitar — eu não tenho permissão de push no seu GitHub
- [x] Resolver os 4 módulos `⚠️ VERIFICAR` (2, 6, 11, 31) — confirmar o nome real do arquivo/endpoint e corrigir o path, ou reclassificar como planejado se não existir
- [x] Criar `docs/archive/` com data no nome para qualquer checkpoint antigo — nunca editável
- [x] Adicionar ao `AGENTS.md`, na Regra Absoluta 6, uma exigência prática: nenhuma linha da tabela de módulos pode virar `✅ LIVE` sem o caminho do arquivo ser colado no PR que a alterou

---

## Fase 2 — Portão de qualidade real (semana 3–5)

- [ ] Confirmar que `.github/workflows/apex-sync.yml` de fato **bloqueia** merge no `main` se `build`, `test` ou `validate:*` falharem
- [ ] Priorizar código real (não doc) do IT Cost & Infra Orchestrator (módulo 66) — sem isso não há visibilidade de margem por cliente antes de vender como SaaS
- [ ] Persistir billing/usage em Supabase/Stripe (não em memória) antes de qualquer cliente externo pagante
- [ ] Decidir, para os módulos 63, 65 e 67 (Market Intel, Growth & SEO, Legal Due Diligence): construir de verdade ou remover da tabela até terem dono e prazo

## Fase 3 — Migração módulo a módulo do repo2 (mês 2 em diante)

Para cada módulo abaixo: reescrever como serviço real em `server/service/` do repo1, com teste automatizado, e só então apontar a UI para ele. Nunca copiar a pasta inteira.

- [ ] RDO — Relatório Diário de Obra
- [ ] Supply Chain Studio
- [ ] Due Diligence (jurídico)
- [ ] Revenue Engine
- [ ] Orçamento SINAPI
- [ ] Project Package Pipeline

---

## Execução — Fase 0 (comandos restantes)

### 1. Purgar a chave antiga do histórico do git

```bash
pip install git-filter-repo --break-system-packages

git clone --mirror https://github.com/Apex-Global-LLC/apex-ai-copilot-platform.git repo1-mirror
cd repo1-mirror

echo "CHAVE_OCULTADA_EM_ENV_LOCAL==>CHAVE_REVOGADA_REMOVIDA" > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt --force

git push --force --all
git push --force --tags
```

Depois disso todo mundo (você incluído, em outras máquinas) precisa re-clonar do zero — um `git pull` normal não reconcilia histórico reescrito.

### 2. Revogar a Regra Absoluta 8 do AGENTS.md

Trocar o trecho de autonomia total de deploy por:

```markdown
## 🚨 REGRA ABSOLUTA 8 — Deploy em produção requer aprovação humana

Nenhum agente pode fazer merge direto em `main` nem deploy direto em produção.
Fluxo obrigatório:

1. Agente cria branch e abre Pull Request.
2. CI (`apex-sync.yml`) roda `build` + `test` + `validate:*` — PR só fica elegível
   para merge se todos os checks passarem em verde.
3. Owner (Dr. Edgard) revisa e aprova o PR manualmente.
4. Só então o merge em `main` dispara o deploy automático.

Exceção: nenhuma.
```

### 3. Remover binários e skills genéricas

```bash
cd apex-ai-copilot-platform

git rm -r --cached runtime/*.exe runtime/*.dll
echo "runtime/*.exe" >> .gitignore
echo "runtime/*.dll" >> .gitignore

git rm -r --cached .agents/skills
# manter apenas: apex-ai-copilot, apex-copilot-construction-intelligence, apex-global-orchestrator
git add .agents/skills

git commit -m "chore: remove binaries and unrelated skill marketplace from repo history"
git push origin main
```
