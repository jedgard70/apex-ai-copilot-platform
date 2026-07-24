# Padrão de Criação de Produtos
**Versão:** 1.0.0 | **Status:** obrigatório | **Data:** 2026-07-20

Todo produto declara problema, ICP, proposta de valor, domínio proprietário, dados, capabilities, dependências permitidas/proibidas, contratos, eventos, Shared Services, entitlements, monetização, métricas, riscos, owner e lifecycle. Produto consome Core e Shared Services por contrato e nunca outro produto diretamente ([ADR-0008](../architecture/adr/ADR-0008-DOMAIN-ISOLATION.md)).

A estrutura interna nasce da necessidade do domínio. Quando útil, preferir `domain/`, `application/`, `infrastructure/`, `interfaces/`, `contracts/` e `tests/`. Não tornar `backend/` e `frontend/` obrigatórios; interfaces são detalhes externos ao domínio.

O gate exige business case, privacidade/ameaças, unit economics, testes de fronteira e evidência antes de alegar operação. **Risco:** criar catálogo sem validação de mercado; mitigar com discovery e métricas.
