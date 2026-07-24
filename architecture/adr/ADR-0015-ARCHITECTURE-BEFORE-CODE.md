# ADR-0015 — Arquitetura antes do código

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Implementar antes de definir problema e fronteiras recriaria acoplamento e duplicação do legado.

## Decisão

Nenhuma implementação começa sem problema, domínio proprietário, contrato mínimo, critérios de teste, custo, segurança, observabilidade, riscos e aceite definidos proporcionalmente ao impacto. Stack tecnológica exige decisão própria quando estrutural. Documentação não prova implementação.

## Alternativas

Código exploratório irrestrito; documentação posterior; decisões implícitas.

## Consequências positivas

Menor retrabalho, evidência, segurança e previsibilidade econômica.

## Consequências negativas

Maior preparação inicial e risco de burocracia.

## Riscos

Paralisia por análise; mitigar com artefatos mínimos proporcionais e timeboxes aprovados.

## Critérios de revisão

Revisar quando métricas demonstrarem que o gate não reduz risco ou retrabalho.

## Documentos afetados

Contribution Process, Definition of Done, Technology Decision Process, roadmaps e padrões de módulos/produtos.
