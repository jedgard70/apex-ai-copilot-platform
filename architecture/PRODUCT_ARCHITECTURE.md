# Arquitetura de produtos

**Status:** Proposta
**Versão:** 1.0.0
**Data:** 2026-07-20

Um Produto Vertical possui owner, ICP, proposta de valor, bounded context, dados, capabilities, entitlements, unit economics, riscos e roadmap. Consome Core e Shared Services por SDK/API/eventos futuros, nunca por tabela interna ou import de outro produto.

A organização interna prioriza domínio e pode usar `domain/`, `application/`, `infrastructure/`, `interfaces/`, `contracts/` e `tests/` conforme necessidade. `backend/` e `frontend/` não são obrigatórios nem a primeira divisão conceitual.

A criação passa por discovery, business case, threat/privacy assessment, contratos, MVP mensurável e gate de comercialização. Produtos podem ter ciclo de deploy próprio; compatibilidade e isolamento são validados por contract tests e testes arquiteturais. Consulte [ADR-0008](adr/ADR-0008-DOMAIN-ISOLATION.md).
