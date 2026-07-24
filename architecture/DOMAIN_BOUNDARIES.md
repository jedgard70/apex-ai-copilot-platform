# Fronteiras de domínio

**Status:** Proposta
**Versão:** 1.0.0
**Data:** 2026-07-20

- **Core:** autoridades compartilhadas e invariantes.
- **Shared Service:** capability reutilizável com contrato e SLO.
- **Platform Service:** execução, integração ou infraestrutura por interface neutra.
- **Produto vertical:** problema, dados e workflows de um mercado.
- **Integração:** adaptador controlado para sistema externo.
- **Conhecimento:** conteúdo versionado com origem e validade.
- **Agente:** ator de software governado que decide/coordena dentro de escopo.
- **Skill:** instrução/capacidade declarativa; pode não executar.
- **Ferramenta:** operação invocável com schema, permissão e efeito.
- **Workflow:** estado e sequência auditável.
- **Infraestrutura:** compute, rede e persistência substituíveis por contrato.

Produtos não leem bancos nem importam internals de outros produtos. Shared Services não assumem regra vertical. Core não depende de produto, Shared Service ou implementação de IA. Estruturas internas de produto são guiadas por domínio; `backend/frontend` não são divisões obrigatórias. Consulte [ADR-0008](adr/ADR-0008-DOMAIN-ISOLATION.md), [ADR-0009](adr/ADR-0009-APEX-OS-CORE-SHARED-SERVICES-BOUNDARIES.md) e o [glossário](../docs/GLOSSARY.md).
