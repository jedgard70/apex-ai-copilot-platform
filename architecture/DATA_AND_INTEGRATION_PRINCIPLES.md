# Princípios de dados e integrações

**Status:** Proposta
**Versão:** 1.0.0
**Data:** 2026-07-20

Dados têm domínio proprietário, classificação, finalidade, tenant, retenção e trilha. Contratos são versionados. Eventos incluem ID, timestamp, tenant, schema version, correlation e idempotency key.

Retries usam backoff, limite e DLQ; falhas não são ocultadas. Webhooks são autenticados, deduplicados e reprocessáveis. Integrações possuem owner, budget, timeout, circuit breaker e plano de saída.

LGPD: minimização, base legal, transparência, direitos do titular, retenção, exclusão, portabilidade, incident response e governança de operadores/suboperadores.

Produtos publicam fatos e consomem capacidades por contratos; não acessam persistência de outro produto. Adapters externos são Platform Services e não vazam modelos de provider para o domínio. Consulte [ADR-0008](adr/ADR-0008-DOMAIN-ISOLATION.md).
