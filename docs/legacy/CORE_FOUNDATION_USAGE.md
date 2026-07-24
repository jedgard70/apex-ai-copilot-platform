# Uso do Core Foundation — Sprint 1.1
**Versão:** 1.0.0 | **Status:** implementação local validada; aguardando commit | **Data:** 2026-07-20

## O que existe

Entidades locais Identity, Organization e Membership; autorização contextual; Audit append-only por contrato; Telemetry mínima separada; adapters in-memory; composition root e testes.

## Casos de uso

`CreateIdentity`, `ActivateIdentity`, `SuspendIdentity`, `CreateOrganization`, `InviteMembership`, `ActivateMembership`, `SuspendMembership`, `AuthorizeAction` e `ListAuditEvents`. Rejeição de leitura não autorizada é comportamento de `ListAuditEvents`.

## Exemplo conceitual

```ts
const core = createCoreFoundation();
// IDs de ator, Organization raiz e correlation são fornecidos explicitamente.
// Execute casos de uso por core.useCases e inspecione adapters somente em testes locais.
```

O fluxo completo está em `src/tests/integration.test.ts`: Owner ativo cria Organization e Membership; autorização permite `organization.manage`; membro comum recebe deny para `audit.read`; Owner lista Audit; Telemetry registra apenas caso de uso, duração, sucesso/erro e correlation.

## Executar

```text
npm install
npm run typecheck
npm run lint
npm run validate:imports
npm test
npm run validate
```

## Interpretar Audit e Telemetry

Audit contém fatos e decisões com actor, Organization, target, resultado, razão, permission/scope e correlation. Telemetry não contém actor, target, Organization, permission ou metadata do domínio; contém somente desempenho/resultado operacional.

## Limitações

Não existem login, senha, OAuth, HTTP API, UI, banco, persistência após reinício, transação produtiva, concorrência distribuída, provider de autenticação, multi-tenancy completo, capability registry, produtos ou integração externa. Identity lifecycle é self-service no slice; administração delegada exigirá policy. A Organization raiz é configuração de bootstrap, não provisionamento implementado.

**Riscos:** in-memory não prova durabilidade/atomicidade e exemplos não autorizam produção.
