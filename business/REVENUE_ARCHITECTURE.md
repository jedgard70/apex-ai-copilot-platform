# Arquitetura de Receita
**Versão:** 1.0.0 | **Status:** proposta | **Data:** 2026-07-20

Produto define oferta e preço comercial; Billing aplica planos, assinatura, entitlement, uso e cobrança; Finance & BI consome eventos e calcula receita, margem e previsão. Receita deve ser atribuível a produto, cliente, plano e período sem acoplar Billing à análise.

**Riscos:** leakage, dupla contagem, descontos sem owner e reconhecimento inadequado.
