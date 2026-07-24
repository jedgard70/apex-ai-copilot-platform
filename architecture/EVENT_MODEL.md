# Modelo de Eventos Internos — Sprint 1.1
**Versão:** 1.0.0 | **Status:** aprovado | **Data:** 2026-07-20

Evento interno é objeto imutável com `id`, `name`, `version`, `occurredAt`, `domain`, `organizationId`, `actorIdentityId`, `target`, `correlationId` e metadata segura. Nomes usam fatos no passado. Commands não circulam como eventos.

Nesta Sprint, Domain Events são projetados imediatamente em Audit pelo application service; não há event bus, entrega distribuída ou garantia transacional produtiva. Duplicidade é evitada por idempotência do caso de uso onde definida e IDs estáveis.

**Riscos:** falha entre mutação e Audit no adapter in-memory; persistência futura exigirá unidade atômica/outbox por ADR.
