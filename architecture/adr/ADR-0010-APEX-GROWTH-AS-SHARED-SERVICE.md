# ADR-0010 — Apex Growth como Shared Service

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Apex Growth aparecia simultaneamente como produto vertical e serviço compartilhado.

## Decisão

Apex Growth é Shared Service transversal para aquisição, CRM, conteúdo, lifecycle, atribuição e expansão. Atende produtos por contratos e eventos, sem acessar internals ou assumir regras verticais. Pode futuramente ter oferta comercial independente, sem mudar sua classificação arquitetural.

## Alternativas

Produto vertical; marketing duplicado por produto; dois componentes homônimos.

## Consequências positivas

Reuso, consentimento consistente, atribuição comum e isolamento preservado.

## Consequências negativas

Requer contratos de eventos, segmentação e controles cross-product.

## Riscos

Vazamento de dados, centralização excessiva e regras verticais absorvidas; mitigar com tenancy, consentimento, minimização e ownership.

## Critérios de revisão

Revisar se evidência comercial exigir bounded context separado, mantendo nomes e autoridades inequívocos.

## Documentos afetados

`README.md`, Charter, Shared Services, catálogo de produtos, `marketing/*`, `business/*` e glossário.
