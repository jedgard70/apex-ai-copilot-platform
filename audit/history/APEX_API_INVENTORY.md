# Inventário de APIs Apex

- Versão: 1.0.0
- Status: baseline estático auditado
- Data: 2026-07-22

## Convenções

Handler principal: `src/app/server.ts`; API pública: `src/app/api/V1Routes.ts`. Persistência “memória” significa que o dado desaparece no restart. Nenhuma rota foi chamada contra produção.

## API da jornada do cliente

| Método e rota | Handler/linhas | Auth/tenancy | Persistência/integração | Consumidor | Estado |
|---|---|---|---|---|---|
| POST `/api/auth/login` | `server.ts:223` / `AuthService.loginWithPassword` | Supabase + sessão local | Supabase Auth / memória | Login | INTEGRATED_PARTIAL |
| POST `/api/auth/magic-link` | `server.ts:235` / `sendMagicLink` | e-mail | Supabase Auth | Login | INTEGRATED_PARTIAL |
| POST `/api/auth/forgot-password` | `server.ts:243` | e-mail | Supabase Auth | Login | INTEGRATED_PARTIAL |
| POST `/api/auth/verify-otp` | `server.ts:251` | OTP | Supabase + memória | Login | INTEGRATED_PARTIAL |
| POST `/api/auth/session` | `server.ts:261` | bearer Supabase | memória | Login callback | INTEGRATED_PARTIAL |
| GET `/api/auth/me` | `server.ts:270` | bearer sessão | memória | Workspace | FUNCTIONAL_LOCAL |
| POST `/api/auth/logout` | `server.ts:287` | bearer sessão | memória | Workspace | FUNCTIONAL_LOCAL |
| GET `/api/auth/oauth/callback` | `server.ts:296` | query token | Supabase | Login | INTEGRATED_PARTIAL |
| GET `/api/auth/oauth/:provider` | `server.ts:303` | público | redirect Supabase | Login | INTEGRATED_PARTIAL |
| POST `/api/login` | `server.ts:315` | credencial local | memória | legado de tela | MOCK |
| POST `/api/signup` | `server.ts:320` | entrada pública | não comprovada | Signup Stitch | MOCK |
| POST `/api/password-recovery` | `server.ts:326` | entrada pública | não comprovada | Recovery Stitch | MOCK |
| GET `/api/services` | `server.ts:331` | público | catálogo estático | Services/checkout | FUNCTIONAL_LOCAL |
| POST `/api/checkout` | `server.ts:336` | sessão | OrderManager em memória | Checkout | MOCK |
| POST `/api/checkout/:id/pay` | `server.ts:343` | sessão | muda status local para paid | Checkout | MOCK |
| GET `/api/orders` | `server.ts:350` | sessão | memória | Workspace | FUNCTIONAL_LOCAL |
| POST `/api/projects` | `server.ts:354` | sessão | memória + execução fal.ai | Workspace | FUNCTIONAL_LOCAL |
| GET `/api/projects/:id` | `server.ts:377` | sessão/proprietário | memória | Workspace | FUNCTIONAL_LOCAL |
| GET `/api/projects/:id/result` | `server.ts:383` | sessão/proprietário | memória | Workspace | FUNCTIONAL_LOCAL |
| GET `/api/projects/:id/artifacts/:name` | `server.ts:398` | sessão/proprietário | arquivo local/memória | download | FUNCTIONAL_LOCAL |
| POST `/api/projects/:id/adjust` | `server.ts:404` | sessão/proprietário | nova execução | Workspace | FUNCTIONAL_LOCAL |
| POST `/api/projects/:id/share` | `server.ts:411` | sessão/proprietário | token em memória | Workspace | FUNCTIONAL_LOCAL |

## Runtime, conhecimento e administração

| Grupo | Rotas | Auth/tenancy | Persistência | Estado |
|---|---|---|---|---|
| Assets | GET `/api/runtime/assets/search` | token e filtros | Supabase adapter quando configurado | INTEGRATED_PARTIAL |
| Execução | POST `/api/runtime/execute`; GET `/api/runtime/executions[/:id]`; GET stats | token/capability | repositories configuráveis | INTEGRATED_PARTIAL |
| Scan | POST `/api/runtime/scan` | Owner esperado | filesystem + Supabase | INTEGRATED_PARTIAL |
| Capability | POST `/api/capability/route` | contexto | registry/router | FUNCTIONAL_LOCAL |
| Knowledge | GET search/assets/stats/status; POST ingest | autorização desigual a revisar | Supabase | INTEGRATED_PARTIAL |
| Admin UI | GET `/admin`, `/admin/users` | sessão/permissões | memória/Supabase | INTEGRATED_PARTIAL |
| Locale | GET `/api/locales/:locale` | público | estático | FUNCTIONAL_LOCAL |
| Assets públicos | GET `/assets/sovereign/:file` | público com validação de path | filesystem | FUNCTIONAL_LOCAL |
| Compartilhamento | GET `/shared/:token[/artifacts/:name]` | token obscuro | memória/filesystem | FUNCTIONAL_LOCAL |

## API pública v1

| Método e rota | Contrato | Auth | Persistência | Estado |
|---|---|---|---|---|
| GET `/v1/health` | saúde/versionamento | público | nenhuma | FUNCTIONAL_LOCAL |
| GET `/v1/capabilities` | catálogo | API key/sessão conforme ramo | registry | FUNCTIONAL_LOCAL |
| POST `/v1/chat` | job/capability request | API key `apx_` ou bearer | job runtime | INTEGRATED_PARTIAL |
| GET `/v1/jobs/:id` | status de job | chave/organização | repository | INTEGRATED_PARTIAL |
| GET `/v1/usage` | consumo | chave/organização | usage ledger | INTEGRATED_PARTIAL |

## Legado

Foram encontrados 100 arquivos `.mjs` sob `api/`, distribuídos por 36 domínios, e 168 sob `server/`. Eles são candidatos, não endpoints do Apex OS. Antes de qualquer migração, cada rota precisa de método inequívoco, schema, auth, organization ownership, idempotência, teste, custo e consumidor confirmado.

## Gaps críticos

- Persistir sessões, pedidos, projetos, shares e jobs.
- Substituir confirmação de pagamento simulada por gateway + webhook verificado.
- Aplicar schema validation uniforme, limites de upload, rate limit e CSRF/origin policy.
- Remover aliases antigos somente após mapear consumidores.
- Criar teste de contrato por rota e teste E2E da jornada.
