# ADR-0014 — Estados do ciclo de vida de agentes

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Documentos usavam vocabulários incompatíveis, tornando status operacional ambíguo.

## Decisão

Usar exclusivamente: `proposed`, `cataloged`, `experimental`, `implemented`, `validated`, `operational`, `suspended`, `deprecated` e `archived`. `operational` exige executor, permissões, telemetria, política de custo e evidência de validação. Transições e significados são definidos em `agents/AGENT_LIFECYCLE.md`.

## Alternativas

Estados livres; vocabulário traduzido; estados diferentes por registry.

## Consequências positivas

Comparabilidade, gates claros e alegações verificáveis.

## Consequências negativas

Migrações futuras precisarão mapear estados legados.

## Riscos

Status inflado sem evidência; mitigar com gates e auditoria.

## Critérios de revisão

Revisar quando transições reais demonstrarem lacuna semântica.

## Documentos afetados

Skill oficial, Agent Standard, `agents/*`, Skill Standard, Definition of Done e glossário.
