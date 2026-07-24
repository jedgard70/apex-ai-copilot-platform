# Shared Services

**Status:** Proposta
**Versão:** 1.0.0
**Data:** 2026-07-20

- **Apex Intelligence:** AI Gateway, avaliação, routing e oversight.
- **Apex Growth:** aquisição, CRM, lifecycle e atribuição; é Shared Service mesmo se futuramente comercializado separadamente.
- **Finance & BI:** usage, custos, receita, margem e previsões.
- **Document Processing:** intake, OCR, classificação e extração com proveniência.
- **Communications:** e-mail, mensagens, voz e consentimento.
- **Media Generation:** imagem, vídeo, áudio e assets com custo/rights.
- **Integration Hub:** governança lógica de integrações; adapters técnicos pertencem a Platform Services.

Cada serviço expõe contrato, tenancy, permissions, SLO, custo, tratamento de falha e auditoria. Depende do Core, nunca de internals de Produtos. Nenhum está implementado nesta Sprint. Consulte [ADR-0009](adr/ADR-0009-APEX-OS-CORE-SHARED-SERVICES-BOUNDARIES.md), [ADR-0010](adr/ADR-0010-APEX-GROWTH-AS-SHARED-SERVICE.md), [ADR-0011](adr/ADR-0011-BILLING-AND-FINANCE-BOUNDARY.md) e [ADR-0012](adr/ADR-0012-KNOWLEDGE-AND-INTELLIGENCE-BOUNDARY.md).
