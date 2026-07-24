# ADR-0027 — Organização de Código Orientada a Domínio
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
Separar primeiro por frontend/backend ou camada global pode misturar domínios e criar ciclos.

## Decisão
Organizar `src/core/<domain>/{domain,application,contracts}`, compartilhados mínimos em `src/shared`, adapters fora do domínio e composition root explícito. Imports apontam para dentro: adapters dependem de contracts; domínio nunca depende de adapter.

## Alternativas
Pastas globais por camada; pacote único; arquitetura hexagonal genérica completa.

## Consequências positivas
Ownership, testes e substituição de adapter claros.

## Consequências negativas
Alguns tipos pequenos ficam próximos/duplicados até transversalidade comprovada.

## Riscos
Barrels ocultarem ciclos e shared virar depósito; mitigar com verificador de imports.

## Critérios de revisão
Segundo slice comprovar que a estrutura impede coesão ou composição.

## Documentos afetados
Boundaries, source tree e Architecture Conformance.
