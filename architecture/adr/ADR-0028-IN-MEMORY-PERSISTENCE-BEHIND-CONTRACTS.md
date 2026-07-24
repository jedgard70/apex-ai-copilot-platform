# ADR-0028 — Persistência In-Memory atrás de Contratos
**Versão:** 1.0.0 | **Status:** Accepted somente para Sprint 1.1 | **Data:** 2026-07-20

## Contexto
O modelo precisa provar invariantes sem decidir banco, cloud ou migração.

## Decisão
Usar repositories in-memory implementando contratos de domínio. Não persistem reinício, não oferecem transação/concurrency produtiva e não serão apresentados como produção.

## Alternativas
Banco local; banco remoto; entidades sem repositories.

## Consequências positivas
Teste determinístico, velocidade e substituição explícita.

## Consequências negativas
Não prova durabilidade, concorrência ou atomicidade Audit/mutação.

## Riscos
Adapter virar produção por inércia; mitigar com nome, documentação e gate de substituição.

## Critérios de revisão
Obrigatória antes de qualquer ambiente persistente ou multi-processo.

## Documentos afetados
Contracts, adapters, usage e relatórios.
