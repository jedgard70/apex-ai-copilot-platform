# Padrão de API
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

APIs têm contrato versionado, autenticação/autorização server-side, tenancy, schemas, erros estáveis, paginação, idempotência em mutações, rate limit, timeout, correlation ID, auditoria e documentação. Nunca retornam segredo ou stack trace. Compatibilidade e depreciação são testadas. REST/eventos/RPC serão escolhidos por ADR.

APIs e eventos entre Produtos respeitam isolamento de domínio; não expõem tabelas ou internals. Ownership e consumidores são documentados conforme [ADR-0008](../architecture/adr/ADR-0008-DOMAIN-ISOLATION.md).
