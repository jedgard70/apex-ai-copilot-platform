# ADR-0026 — TypeScript e Node.js como Runtime Inicial
**Versão:** 1.0.0 | **Status:** Accepted para Sprint 1.1 | **Data:** 2026-07-20

## Contexto
O slice exige type safety, testes rápidos, portabilidade para web/API/workers e baixo custo operacional.

## Decisão
Usar TypeScript estrito, ESM e Node.js 24 para o primeiro Core. A decisão é inicial, não escolha definitiva de toda a plataforma. Domínio evita APIs específicas do runtime.

## Alternativas
JavaScript/JSDoc; linguagens compiladas alternativas; runtime web-first.

## Consequências positivas
Tipos explícitos, ecossistema maduro, execução/teste simples e compatibilidade futura.

## Consequências negativas
Compilação e dependências de desenvolvimento; tipos não substituem validação runtime.

## Riscos
Acoplamento ao runtime e falsa segurança de tipos; mitigar com contratos puros e validação de invariantes.

## Critérios de revisão
Performance, segurança, contratação ou targets futuros demonstrarem inadequação.

## Documentos afetados
Proposta, usage, package/tsconfig e código Sprint 1.1.
