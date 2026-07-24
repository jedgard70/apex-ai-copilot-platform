# Padrão de módulo
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

Módulo declara domínio proprietário, owner, propósito, fronteira, autoridade de dados, dependências permitidas e proibidas, contratos expostos, eventos publicados/consumidos, permissões, SLO, custo, riscos, testes e ciclo de vida. Não acessa internals de outro domínio. O Core é independente; Shared Services consomem Core; Produtos consomem Core/Shared Services e nunca outros Produtos. Platform Services implementam portas neutras. Consulte [ADR-0008](../architecture/adr/ADR-0008-DOMAIN-ISOLATION.md) e [ADR-0009](../architecture/adr/ADR-0009-APEX-OS-CORE-SHARED-SERVICES-BOUNDARIES.md).
