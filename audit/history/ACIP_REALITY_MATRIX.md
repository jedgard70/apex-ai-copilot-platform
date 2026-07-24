# Matriz de Realidade ACIP

- Versão: 1.0.0
- Status: auditoria canônica, somente leitura
- Data: 2026-07-22
- Escopo: Apex OS e patrimônio legado Apex Global

## Regra de evidência

Ordem aplicada: código executável e testes; documentos canônicos atualizados; inventários secundários; roadmaps históricos. Um arquivo, prompt, painel ou rota isolada não prova operação ponta a ponta. Os estados desta matriz são os exigidos pelo Owner.

## Resposta executiva

O produto executável em `D:/AI-constr/apex-os` não é a plataforma legada de 65/67/78/85 capacidades. É um núcleo novo em TypeScript/Node com uma capacidade de IA integrada (`architectural-humanization`), jornada comercial local, API pública inicial, registros de conhecimento e um adapter fal.ai. O legado `apex-ai-copilot-platform` possui grande superfície de código (100 arquivos API `.mjs`, 168 server `.mjs` e 95 componentes TS/TSX), mas as alegações de produção não foram revalidadas nesta rodada e não podem ser herdadas pelo Apex OS.

## Reconciliação das contagens conflitantes

| Número | O que realmente conta | Fonte | Conclusão |
|---:|---|---|---|
| 65 | taxonomia histórica M1–M65 | tracker legado, seção “Resumo” | catálogo documental, não teste de integração |
| 67 | capacidades documentadas, 63 alegadamente verificadas e 4 planejadas | `APEX_PLATFORM_CURRENT_STATE.md` | mistura runtime e planejamento |
| ~78 | expansão v7 com submódulos Mxx.y e infraestrutura | arquitetura legada, anexos | muda a unidade de contagem |
| 85/86 | telas/itens de navegação em inventários intermediários | documentos e exports Stitch históricos | não equivale a módulos nem rotas |
| 102 | entradas no `stitch/manifest.json` atual | manifesto local | ativos de design; há 100 HTML e 12 PNG |
| 260+ | agentes/prompts alegados em inventários anteriores | patrimônio distribuído | não comprovados como agentes operacionais |
| 1.150+/1.848 | skills alegadas em docs legados | catálogos históricos | definição e escopo variam |
| 4.114 | ocorrências físicas `SKILL.md` nos oito roots auditados | censo 2026-07-22 | soma bruta, inclui duplicação: 2.024 em `D:/APEX AI`, 2.021 em marketing, 66 no copilot, demais 3 |

Não há um “número verdadeiro” único porque as fontes contam entidades diferentes. O baseline oficial passa a usar cinco métricas independentes: produto, capability, módulo, tela e ativo cognitivo.

## Matriz consolidada

| Domínio/capacidade | Apex OS atual | Legado observado | Estado canônico | Evidência principal | Lacuna para produção |
|---|---|---|---|---|---|
| Apex Intelligence / roteamento | contratos, registry e router | vários providers e chat monolítico | INTEGRATED_PARTIAL | `src/providers/*`, `src/execution/ExecutionOrchestrator.ts` | somente fal.ai tem adapter executável comprovado |
| Intelligent Intake | upload de imagem no projeto | classificadores PDF/DWG/IFC | INTEGRATED_PARTIAL | `src/app/server.ts:354`, `src/capabilities/ArchitecturalHumanization.ts` | MIME estreito, sem pipeline documental completo |
| ArchVis | fluxo de imagem, execução, custódia e download | ArchVisPanel e dois endpoints | FUNCTIONAL_LOCAL | `src/providers/adapters/fal/FalProviderAdapter.ts`, testes fase 3 | aceite E2E humano e ambiente de produção pendentes |
| Director's Cut | ausente | painel e pipelines de vídeo | LEGACY | `DirectCutPanel.tsx`, `videoRenderPipeline.mjs` no legado | decisão formal de migração e validação |
| BIM/3D / APS / IFC | ausente | UI e endpoints dedicados | LEGACY | `Bim3DPanel.tsx`, `api/aps`, `api/ifc` | prova E2E, segurança, custo e contrato de destino |
| Digital Twin / IoT | apenas tela Stitch pública | serviço/painel legado | UI_ONLY | `src/app/server.ts:129`, `DigitalTwinPanel.tsx` legado | sem modelo de dados/executor atual |
| Clash / Qualidade / NCI / RDO | ausentes | APIs, painéis e serviços legados | LEGACY | diretórios `api/bim-clash`, `api/qualidade`, `server/service/rdo.mjs` | auditoria específica antes de migração |
| Budget / SINAPI | promessa comercial marcada planejada | BudgetPanel e dados legados | PLANNED | `src/app/products/ServiceCatalog.ts` | capability e contrato inexistentes no OS |
| NR / permits / contratos | páginas ou promessas; sem engine | APIs e painéis legados | LEGACY | `api/nr`, `api/permits`, `ContractsPanel.tsx` | separar jurisdições e responsabilidade profissional |
| Legal | documento de produto apenas | LegalStudio/GlobalLegal/legalização | LEGACY | `products/LEGAL.md`; legado `api/legalizacao` | produto independente, tenancy e validação jurídica |
| Accounting CRC | documento de produto apenas | projeto separado e módulo no copilot | LEGACY | `products/ACCOUNTING.md`; `D:/Apex-Accounting` | não misturar ERP e painel demonstrativo |
| Finance / OS / invoice | ledger de uso e política de margem | serviços finance/invoice/order | BACKEND_ONLY | `src/finance/*`; legado `server/service/*` | persistência e UI operacional |
| Checkout / pagamento | pedido em memória e confirmação simulada | Stripe legado | MOCK | `src/app/products/OrderManager.ts`, `src/app/server.ts:336` | gateway, webhook, idempotência e conciliação reais |
| Stock market / Travel | documentos de produto | APIs/painéis legados | LEGACY | `products/INVEST.md`, `products/TRAVEL.md`; legado `api/stock`, `api/trip` | fora do release inicial |
| AI cost / infra cost | estimativa, ledger e políticas | dashboards/serviços legados | INTEGRATED_PARTIAL | `src/finance/*`, `ai/AI_COST_GOVERNANCE.md` | saldos iniciais hard-coded; reconciliação real ausente |
| Marketing / VSL / CRM | páginas Stitch e arquitetura documental | módulos legados amplos | INTEGRATED_PARTIAL | `src/app/server.ts:129`, `marketing/*` | CRM e publicação não integrados ao runtime atual |
| Training / audio / image studio | Image via ArchVis; demais ausentes | vários painéis/providers | LEGACY | `AvatarVoicePanel.tsx`, `RenderEngineStudio.tsx` legado | decisão de produto e adapters governados |
| Revit MCP / Google Workspace | ausentes | conectores/agentes legados | LEGACY | `api/mcp`, `api/google`, `server/agent` | autorização externa, OAuth, tenancy e testes |
| Owner/Admin | rotas administrativas locais | consoles legados | INTEGRATED_PARTIAL | `src/app/server.ts:582` | autorização e persistência ainda incompletas |
| Support/Security | políticas e suporte comercial | serviços e painéis legados | BACKEND_ONLY | `governance/SECURITY_STANDARD.md`, core auth | operação, incidentes e evidência de controles |
| API pública | `/v1` com health, capabilities, chat/jobs/usage | `api/v1` legado | FUNCTIONAL_LOCAL | `src/app/api/V1Routes.ts` | persistência de jobs/keys e teste externo |

## Root cause do erro Supabase observado

O frontend legado usa `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (`src/lib/supabaseClient.ts`). O Apex OS atual, por sua vez, usa `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no servidor (`src/app/auth/AuthService.ts`). Portanto, transportar o `.env` de um projeto para outro ou iniciar o projeto errado produz exatamente a divergência observada. Nenhum valor foi lido ou registrado nesta auditoria.

## Decisão

O release deve partir do Apex OS atual e migrar capacidades uma a uma. Nenhuma declaração LIVE_PRODUCTION do legado é promovida sem teste repetível, ambiente identificado, tenancy, persistência e aceite do Owner.
