# Contexto do sistema

**Status:** Proposta C4 — nível de contexto
**Versão:** 1.0.0
**Data:** 2026-07-20

Atores: usuários profissionais, organizações clientes, administradores autorizados, equipe Apex, parceiros e auditores. Sistemas externos incluem identidade, pagamentos, IA, comunicação, storage, BIM/CAD e analytics, todos futuros e condicionais.

```mermaid
flowchart TB
 U[Usuários profissionais] --> P[Produtos Apex]
 O[Organizações] --> P
 A[Administradores Apex] --> OS[Apex OS]
 OS --> C
 OS --> G
 OS --> I
 OS --> BI
 OS --> PS
 PA[Parceiros] --> IH[Integration Hub]
 P --> C[Core]
 P --> G[Apex Growth — Shared Service]
 P --> I[Apex Intelligence — Shared Service]
 C --> PS[Platform Services]
 G --> C
 I --> C
 G --> BI[Finance e Business Intelligence]
 I --> BI
 BI --> C
 C --> IH
 IH --> E[Sistemas externos controlados]
 C --> AU[Auditoria e Segurança]
```

Estado atual: estrutura documental. Nenhum sistema acima foi implementado neste repositório.
