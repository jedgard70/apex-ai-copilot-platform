# Proposta Técnica — Sprint 1.1 Core Foundation Vertical Slice
**Versão:** 1.0.0 | **Status:** aprovada para implementação nesta missão | **Data:** 2026-07-20

## Objetivo

Provar um fluxo completo e local: criar/ativar/suspender Identity; criar Organization com owner; convidar/ativar/suspender Membership; decidir autorização contextual; listar Audit somente com autorização; observar operações por Telemetry separada.

## Limites

Sem login, credenciais, HTTP, UI, banco, cloud, provider externo, produtos, Billing, registries ou multi-tenancy de produção. Persistência in-memory é adapter de teste/demonstração, não solução produtiva.

## Entidades

Identity (human/machine), Organization, Membership, Role, Permission, Scope, Policy, AuthorizationContext/Decision, DomainEvent, AuditEvent e TelemetryRecord. Identity não é User; Organization ativa responde por si; Membership é relação contextual.

## Casos de uso

CreateIdentity, ActivateIdentity, SuspendIdentity, CreateOrganization, InviteMembership, ActivateMembership, SuspendMembership, AuthorizeAction e ListAuditEvents. Cada operação é instrumentada por wrapper de Telemetry e fatos aprovados geram Audit append-only.

## Contratos

Repositories por agregado; AuditWriter/AuditReader; TelemetrySink; Clock; IdGenerator; EventFactory. Application depende de contratos/domínio; adapters in-memory dependem dos contratos.

## Eventos

`identity.created`, `identity.activated`, `identity.suspended`, `organization.created`, `membership.invited`, `membership.activated`, `membership.suspended`, `authorization.allowed` e `authorization.denied`. Eventos são fatos passados, versionados e correlacionados.

## Autorização

Deny by default. A decisão exige Identity ativa, Membership ativa na Organization, permission explícita derivada de role, scope compatível e policies satisfeitas. Nenhuma permission `all`; nome de role isolado não autoriza. Capability opcional permanece contexto, sem Registry.

## Audit e Telemetry

Audit preserva actor, Organization, action, target, result, reason, permission, scope, correlation e metadata segura. Telemetry registra apenas use case, duração, success/failure, error code e correlation. Stores e contratos são distintos.

## Estratégia técnica

TypeScript estrito sobre Node.js 24; módulos ESM; teste nativo `node:test`; compilador TypeScript para typecheck/build; lint local mínimo para regras do repositório. Não usar framework. Instalar somente `typescript` e `@types/node` como devDependencies.

## Estrutura

`src/core/<domain>/{domain,application,contracts}`, `src/shared/{kernel,errors,ids,time,events}`, `src/adapters/in-memory`, `src/tests` e `src/index.ts`. Testes ficam centralizados por fluxo para evitar import do domínio para testes.

## Alternativas

- JavaScript/JSDoc: zero dependência, mas type safety inferior.
- Linguagem compilada alternativa: bom type safety, custo operacional inicial maior e menor alinhamento com web/workers próximos.
- Framework de testes: ergonomia maior, dependência desnecessária para este slice.
- Banco local: maior realismo, porém introduz persistência antes de contrato estabilizar.

## Testes e riscos

Unitários para transições/invariantes; casos de uso para ownership/idempotência; allow/deny e isolamento; Audit append-only; Telemetry sem dados sensíveis; integração ponta a ponta. Riscos: adapter in-memory mascarar concorrência/durabilidade, roles virarem autorização implícita e Audit falhar após mutação. Mitigar com contratos, decisão explícita e documentação da atomicidade ausente.

## Aceite

Todos os dez casos obrigatórios, fluxo de demonstração, typecheck, lint, testes, verificação de ciclos/imports/segredos e documentação verdes; zero stage/commit/remote/deploy.

## Rollback

Como o Git ainda não possui commit, rollback consiste em remover apenas os arquivos da Sprint 1.1 listados no relatório, após autorização explícita. Nenhuma migração, dado externo ou estado produtivo existe.
