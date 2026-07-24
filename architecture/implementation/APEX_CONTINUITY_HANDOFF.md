# Apex OS — Handoff operacional

**Data:** 2026-07-21  
**Escopo:** continuidade do fluxo comercial local; sem alegação de produção.

## Estado atual verificável

O runtime local está funcional para estes pontos:

- `/` — Landing oficial do Stitch;
- `/login` — Login Stitch → `POST /api/login` → `/dashboard`;
- `/signup` — Cadastro Stitch → `POST /api/signup` → `/dashboard`;
- `/recover` e `/password-recovery` — Recuperação Stitch → `POST /api/password-recovery`;
- `/dashboard` — Dashboard Stitch;
- `/roadmap` — Roadmap Stitch;
- `/checkout` — Checkout Stitch → `POST /api/checkout` → intenção de pedido;
- `/workspace` — Workspace funcional para upload e execução da capability de Humanização Arquitetônica;
- `/stitch` — catálogo interno das telas aprovadas;
- `/health` — health check do runtime.

O cadastro, a recuperação e o checkout são integrações locais. Identidade/sessão são em memória; recuperação não envia e-mail; checkout cria `checkout_intent_created`, sem cobrança real, webhook ou confirmação financeira externa.

## Como executar

```text
npm install
npm run typecheck
npm test
npm run lint
npm run validate:imports
$env:PORT="3010"; npm run start:app
```

Abrir `http://127.0.0.1:3010`. O `start:app` carrega `.env.local` quando presente e o listener informa a porta efetiva.

## Commits e continuidade

- **Commit estável:** `3dd5060` (runtime comercial + contrato de ambiente local).
- **Branch de continuidade:** `continuity/commercial-flow`, criada a partir do commit estável.

## Arquivos principais

- `src/app/server.ts` — rotas Stitch, sessão local, pedidos e runtime;
- `src/app/stitch.ts` — catálogo, carregamento semântico e bridge de ações;
- `src/app/page.ts` — Workspace de Engenharia;
- `src/capabilities/CapabilityRuntime.ts` — ciclo prepare/approve/delivery;
- `src/capabilities/ArchitecturalHumanization.ts` — capability inicial;
- `src/adapters/in-memory/CapabilityRuntimeAdapters.ts` — provider local e adapters;
- `stitch/manifest.json` e `stitch/screens/` — exportação aprovada do Stitch;
- `legacy_inventory/22_CORPORATE_ASSET_CONSOLIDATION_MATRIX.md` — matriz de patrimônio e variáveis por nome;
- `legacy_inventory/21_ARCHVIS_DISCOVERY_REPORT.md` — evidência do ArchVis legado;
- `docs/canonical/apex_acip_master_architecture.md` — ACIP Master.

## Regras não negociáveis

- Stitch é a fonte exata da interface: não inventar, redesenhar ou simplificar telas.
- Legado é somente leitura: nunca mover, apagar ou editar; reutilizar apenas por cópia seletiva.
- Procurar no patrimônio antes de criar; fluxos completos têm prioridade sobre módulos isolados.
- Relatórios registram execução; nenhum ciclo termina apenas com documentação.
- Apex AI 2.0 é a identidade exibida ao cliente; providers são internos, substituíveis e escolhidos por custo, qualidade e disponibilidade, sob a allowlist operacional vigente.
- Nunca expor, copiar para commit ou registrar em log qualquer secret/token/chave.

## Mapa factual para o próximo ciclo

| Item | Origem candidata | Maturidade observada | Ação recomendada |
|---|---|---|---|
| Catálogo de serviços | `business/PRODUCT_CAPABILITY_MATRIX.md`, telas Stitch e portfólio | Documentação/interface; não há catálogo transacional no runtime | Adaptar e integrar ao Dashboard/checkout |
| Checkout/pagamento | `stitch/screens/d47ef2...html`; `core`/Billing legado catalogado | Checkout local cria intenção; cobrança externa não configurada | Integrar Billing real após contrato e aprovação |
| Autenticação/cadastro | `src/app/server.ts`; legado em `D:\AI-constr\apex-ai-copilot-platform` e matriz R01 | Sessão local reproduzida; produção não comprovada | Adaptar para Identity/provider aprovado |
| Pedidos | `src/app/server.ts` (`orders` em memória) | Intenção local reproduzida | Integrar persistência, idempotência e estado financeiro |
| Workspace/upload | `src/app/page.ts`, `/api/projects` | Execução local reproduzida com capability raster | Integrar histórico e storage persistente |
| Execução | `src/capabilities/*`, `CapabilityRuntime` | Testes e fluxo local verdes | Preservar; conectar provider/capability real quando validado |
| Resultado/entrega | `DeliveryPackage`, rotas de artifacts/share | Entrega local reproduzida | Conectar histórico, notificações e download comercial |
| Histórico/nova compra | `legacy_inventory/21_ARCHVIS_DISCOVERY_REPORT.md` e contratos de delivery | Evidência legada parcial; não integrado ao produto novo | Copiar/adaptar contratos, sem duplicar UI |

## Ambiente e providers (somente nomes)

Usar como referência os ambientes catalogados em `legacy_inventory/22_CORPORATE_ASSET_CONSOLIDATION_MATRIX.md`. Variáveis relevantes: `GEMINI_*`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_*`, `STRIPE_*`, `LOCAL_WORKER_URL`, `LOCAL_WORKER_TOKEN`, `STITCH_MCP_URL`, `STITCH_API_KEY`, `META_*`, `N8N_WEBHOOK_URL`. Valores não pertencem a este arquivo. Cada variável ainda precisa de validação de estado antes de uso.

## Próximo objetivo obrigatório

Continuar pelo fluxo comercial completo, nesta ordem:

`Landing → seleção de serviço → checkout/pagamento → pedido → conta/workspace → upload → execução → status → resultado → aprovação/ajuste → entrega/download → histórico → nova compra`.

Não iniciar Router econômico isoladamente. O roteamento deve nascer junto com uma capability real e registrar custo, qualidade, disponibilidade e fallback de forma auditável.

## Bloqueios reais

- Billing externo e confirmação de pagamento ainda não estão configurados neste runtime local.
- Autenticação, recuperação, pedidos e histórico ainda não possuem persistência de produção.
- O ArchVis legado completo (UI/API/provider) continua candidato de migração; somente o conhecimento/guided flow e o runtime local estão consolidados.
- Os repositórios legados consultados permanecem intactos e não são dependências estruturais do Apex OS.
