# Definition of Done
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

- Documento: revisado, consistente, links válidos, decisão/risco explícitos.
- Módulo: contrato, owner, segurança, telemetry, testes e docs.
- API: schema, auth, tenancy, idempotência, erros, rate limit e contract tests.
- Agente: requisitos do AGENT_STANDARD e avaliação.
- Workflow: estados, retry/compensação, custo, auditoria e teste.
- Integração: registry, credentials policy, timeout, fallback, budget e runbook.
- Produto: ICP, value, entitlements, unit economics, suporte e E2E.
- Fronteira: nenhuma dependência direta entre Produtos, contratos documentados, ownership definido e testes arquiteturais quando aplicável.
- Kernel/Core: Domain, Organization, owner, responsibility, lifecycle, autorização deny-by-default, eventos no passado e separação Audit/Telemetry verificados.
- Migração: scorecard, proveniência, adaptação, segurança, testes e aprovação.

Nada é Done apenas porque compila ou existe. Nenhum código começa sem os requisitos mínimos do [ADR-0015](../architecture/adr/ADR-0015-ARCHITECTURE-BEFORE-CODE.md).
