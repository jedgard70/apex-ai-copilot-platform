# ADR-0011 — Fronteira entre Billing e Finance & BI

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Cobrança operacional e análise financeira estavam sobrepostas.

## Decisão

Billing pertence ao Core e governa planos, assinaturas, uso faturável, entitlements, invoices, cobranças, estados de pagamento e porta abstrata de pagamentos. Finance & BI pertence aos Shared Services e governa receita analítica, custos, margens, orçamento, unit economics, previsões e rentabilidade. Finance & BI consome eventos de Billing; Billing não depende de Finance & BI.

## Alternativas

Um módulo financeiro único; Billing em Shared Services; BI dentro de cada produto.

## Consequências positivas

Autoridades claras e ciclo de cobrança independente de analytics.

## Consequências negativas

Reconciliação eventual e contratos de eventos adicionais.

## Riscos

Divergência entre ledger operacional e relatórios; mitigar com IDs, versões, reconciliação e proveniência.

## Critérios de revisão

Revisar por exigência fiscal, contábil ou regulatória comprovada.

## Documentos afetados

Core Modules, Shared Services, `business/*`, observabilidade, produtos e glossário.
