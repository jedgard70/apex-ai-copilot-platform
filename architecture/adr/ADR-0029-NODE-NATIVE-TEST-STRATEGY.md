# ADR-0029 — Estratégia de Testes com Runner Nativo
**Versão:** 1.0.0 | **Status:** Accepted para Sprint 1.1 | **Data:** 2026-07-20

## Contexto
O slice requer unitário, casos de uso e integração sem framework adicional desnecessário.

## Decisão
Usar `node:test` e assertions nativas sobre JavaScript compilado. TypeScript compila testes junto; matriz risco→teste complementa resultados. Lint local verifica regras arquiteturais e higiene.

## Alternativas
Framework de testes; scripts ad hoc; apenas integração.

## Consequências positivas
Menos dependências, execução previsível e testes próximos ao runtime.

## Consequências negativas
Menos ergonomia/plugins e mocks avançados.

## Riscos
Suite crescer além do runner; revisar com evidência.

## Critérios de revisão
Complexidade de testes ou targets múltiplos justificarem framework.

## Documentos afetados
package scripts, tests e matriz 38.
