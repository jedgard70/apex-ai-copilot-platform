# Apex AI Copilot — Inventory Report (34 capabilities)

## Status global
- Plataforma: **operacional e documentada**
- Build: **verde**
- Testes: **verde** (84/84)
- Deploy: **Vercel main branch com CI gating**

## Inventário consolidado

| # | Capability | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Chat / Copilot core | ✅ | `api/copilot/chat.mjs` |
| 2 | Runtime de providers e modelos | ✅ | `server.mjs` |
| 3 | Seletor avançado de modelo | ✅ | UI manual provider/model |
| 4 | Observabilidade / status da plataforma | ✅ | Metrics dashboard + endpoints |
| 5 | Workspace do projeto | ✅ | `src/lib/projectWorkspace.ts` |
| 6 | Pesquisa web com fontes | ✅ | `ResearchPanel` |
| 7 | Upload e intake unificado | ✅ | file classifier / intake |
| 8 | Extração de PDF | ✅ | `pdfjs-dist` |
| 9 | Geração DOCX | ✅ | `src/lib/docxGenerator.ts` |
| 10 | Geração PDF / contratos | ✅ | `src/lib/contractsPdfExport.ts` |
| 11 | Orçamento / quantidade | ✅ | `BudgetPanel` + SINAPI import |
| 12 | BIM / 3D Viewer | ✅ | `Bim3DPanel` + IFC/WebIFC |
| 13 | Contratos / permits | ✅ | `ContractsPanel` |
| 14 | ArchVis geração de imagem | ✅ | `api/copilot/generate-image.mjs` |
| 15 | DirectCut / node board | ✅ | `DirectCutPanel` |
| 16 | Campaign automation | ✅ | `api/copilot/campaign-plan.mjs` |
| 17 | Social content pipeline | ✅ | `api/copilot/social-content.mjs` |
| 18 | Landing page VSL pública | ✅ | `/vsl`, `/oferta`, `/apresentacao` |
| 19 | Project package pipeline | ✅ | `api/copilot/project-package` |
| 20 | Queue histórica / geração | ✅ | generation history |
| 21 | RDO / field operations | ✅ | Supabase hybrid sync |
| 22 | Pagamentos / Stripe | ✅ | `api/stripe/checkout.mjs` |
| 23 | APS / Autodesk | ✅ | `api/aps/token.mjs` |
| 24 | Avatar / voice | ✅ | ElevenLabs TTS + avatar |
| 25 | Multi-tenant PWA | ✅ | tenant isolation + manifest |
| 26 | Auth / tenant bootstrap | ✅ | Supabase Auth + tenant |
| 27 | Notificações WhatsApp / SMS | ✅ | `api/notify/whatsapp.mjs` |
| 28 | Supply chain / planning | ✅ | supply chain plan flow |
| 29 | CRM / pipeline comercial | ✅ | CRM panel + campaign automation |
| 30 | Knowledge / metrics live | ✅ | research + metrics endpoints |
| 31 | Observability / Sentry | ✅ | error boundary + monitoring |
| 32 | Digital twin / 7D | ✅ | runtime path active |
| 33 | Stakeholder routes | ✅ | stakeholder/client views |
| 34 | Auto-upgrade / versioning | ✅ | upgrade tracker + trigger |

## Observação de deploy
A causa mais provável de cancelamento recorrente não é o código em si, mas um fluxo de deploy sem gate de verificação confiável. Para resolver isso de forma duradoura:
1. manter branch `main` protegida;
2. exigir status checks do GitHub Actions antes de merge/deploy;
3. usar commits assinados (GPG/SSH) quando possível;
4. deixar o deploy do Vercel acoplado ao workflow aprovado.

## Source of truth
- `CHECKPOINT_TRACKER.md`
- `docs/APEX_PLATFORM_CURRENT_STATE.md`
- `skills/SKILLS_APEX/apex-global-orchestrator-unificada/references/platform-status.md`
