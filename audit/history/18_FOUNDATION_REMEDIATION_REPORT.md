# Relatório de Remediação da Foundation
**Versão:** 1.0.0 | **Status:** concluído | **Data:** 2026-07-20

| Achado | Severidade original | Documentos afetados | Correção | ADR | Status |
|---|---|---|---|---|---|
| AR-01 diretórios vazios | Alta | products, agents, ai, business, marketing, roadmap | 45 documentos de domínio criados | 0008–0015 | Resolvido |
| AR-02 Growth ambíguo | Alta | README, Charter, produtos, marketing | Growth removido dos Produtos Verticais e fixado como Shared Service | 0010 | Resolvido |
| AR-03 Capability Registry depende de Produtos/Agentes | Alta | Core Modules | dependência substituída por registries/contratos neutros | 0013 | Resolvido |
| AR-04 Entitlements/Cost dependem de Produtos/IA | Alta | Core Modules | Product Registry e eventos neutros substituem implementações | 0011–0013 | Resolvido |
| AR-05 ordem de Registries | Alta | Core Modules, agents, roadmap | ordem Product→Integration→Tool→Capability→Agent→Workflow | 0013 | Resolvido |
| AR-06 fronteira Apex OS | Média | arquitetura, skill, README | composição Core/Shared/Platform/Produtos formalizada | 0009 | Resolvido |
| AR-07 lifecycle divergente | Média | skill, governance, agents | nove estados oficiais unificados | 0014 | Resolvido |
| AR-08 Billing/Finance | Média | Core, Shared Services, business | autoridades e fluxo unidirecional separados | 0011 | Resolvido |
| AR-09 Workflow | Média | Core, agents | Registry separado de engine e definições verticais | 0013 | Resolvido conceitualmente |
| AR-10 Notifications/Communications | Média | Core/Shared Services | permanece questão de refinamento, sem bloqueio Alto | futura ADR | Aberto |
| AR-11 Knowledge/Intelligence | Média | Core, Shared Services, ai | persistência e IA separadas | 0012 | Resolvido |
| AR-12 Studio | Média | catálogo/produtos | confirmado Produto Vertical proposto | 0008/0009 | Resolvido |
| AR-13 autoridade legada residual | Média | skill oficial | removida precedência de qualquer skill legada | 0007 | Resolvido |
| AR-14 vocabulário misto | Baixa | múltiplos | glossário oficial criado | 0009/0014 | Resolvido |

Nenhum documento declara capacidade implementada. Nenhum código funcional, legado ou serviço externo foi utilizado.
