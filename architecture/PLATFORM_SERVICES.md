# Platform Services
**Versão:** 1.0.0 | **Status:** catálogo conceitual; não implementado | **Data:** 2026-07-20

Platform Services são capacidades técnicas compartilhadas que implementam portas neutras requeridas pelo Core e Shared Services: API gateway, event bus, job runner, storage adapters e provider adapters. Não contêm regras de produto, negócio ou IA específica.

Dependências apontam para contratos estáveis; domínios não importam implementações. Integrações externas ficam atrás de adapters/gateways com timeout, retry, idempotência, custo, segurança e telemetria. Consulte [ADR-0009](adr/ADR-0009-APEX-OS-CORE-SHARED-SERVICES-BOUNDARIES.md).

**Riscos:** infraestrutura dominar o modelo de domínio, lock-in e abstrações prematuras.
