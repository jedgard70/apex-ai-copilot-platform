# Matriz de consistência documental

**Versão:** 1.0.0
**Status:** concluída
**Data:** 2026-07-20

## Matriz por tema

| Tema | Fontes principais | Resultado | Severidade | Observação |
|---|---|---|---|---|
| Identidade Apex Global/Apex OS | Charter, README, APEX_OS, ADR-0007 | Parcial | Média | Empresa e plataforma estão claras; composição exata do Apex OS não |
| Core independente | Principles, APEX_OS, ADR-0002, Module Standard | Conflito | Alta | Catálogo introduz dependências sobre Products e AI |
| Shared Services | APEX_OS, SHARED_SERVICES, SYSTEM_CONTEXT | Parcial | Média | Serviços definidos, mas não está claro se pertencem ao Apex OS |
| Produtos independentes | Charter, PRODUCT_ARCHITECTURE, ADR-0004 | Parcial | Alta | Regra é coerente, porém catálogo e documentos de produtos não existem |
| Apex Growth | Charter, README, SHARED_SERVICES, ADR-0005 | Conflito | Alta | Produto e Shared Service ao mesmo tempo, sem duas fronteiras explícitas |
| Apex Intelligence | README, SHARED_SERVICES, CORE_MODULES | Parcial | Média | AI Gateway e Intelligence se sobrepõem sem contrato formal |
| Agentes e skills | Skill oficial, AGENT_STANDARD, SKILL_STANDARD | Conflito | Média | Conceitos básicos coerentes; estados de ciclo de vida divergem |
| Workflows | CORE_MODULES, WORKFLOW_STANDARD, AGENT_STANDARD | Parcial | Média | Padrão existe; ownership de definição e execução não |
| Tools/Capabilities | CORE_MODULES, DOMAIN_BOUNDARIES | Parcial | Alta | Registries existem, mas dependências e contratos estão ausentes |
| Identity/Organizations/Tenancy | APEX_OS, CORE_MODULES, Security | Parcial | Alta | Catálogo existe; modelos, invariantes e ADRs não |
| Permissions/RBAC | CORE_MODULES, Security Standard | Parcial | Alta | Regras gerais existem; modelo decisório e escopos não |
| Audit/Telemetry | Core Modules, Observability, Security | Parcial | Média | Separação conceitual existe, sem ADR de retenção/PII/evidência |
| Billing/Entitlements/Finance & BI | Core Modules, Shared Services, ADR-0006 | Conflito | Média | Autoridade de preço, invoice, usage e margem não está particionada |
| Migração | ADR-0001, 0003 e 0007; migration/* | Consistente | Baixa | Fluxo e proibições estão alinhados; faltam schema e autoridade dos gates |
| Segurança/LGPD | Charter, Security Architecture/Standard, Data Principles | Consistente | Baixa | Baseline coerente, ainda conceitual |
| Business Model | Charter, ADR-0006 | Não verificável | Alta | `business/` está vazio |
| Marketing/Growth operacional | ADR-0005, Shared Services | Não verificável | Alta | `marketing/` está vazio |
| Roadmap/Sprint 1 | README e missão Sprint 0.1 | Não verificável | Alta | `roadmap/` está vazio e o grafo dos registries conflita com a ordem proposta |

## Referências Markdown

Foram encontradas sete referências quebradas, todas em `README.md`:

| Destino inexistente | Causa |
|---|---|
| `products/PRODUCT_CATALOG.md` | diretório sem documentos |
| `agents/AGENT_ARCHITECTURE.md` | diretório sem documentos |
| `ai/AI_STRATEGY.md` | diretório sem documentos |
| `business/BUSINESS_MODEL.md` | diretório sem documentos |
| `marketing/GROWTH_ENGINE.md` | diretório sem documentos |
| `roadmap/MASTER_ROADMAP.md` | diretório sem documentos |
| `audit/OPEN_DECISIONS.md` | arquivo não criado na Sprint 0 |

Os links existentes entre arquitetura, ADR-0007, skill oficial e migração foram resolvidos corretamente.

## Qualidade documental

Todos os 42 documentos revisados possuem título, status, versão e data. Entretanto, o padrão exige riscos e distinção entre estado atual e proposta; vários documentos curtos não apresentam essas seções explicitamente. Isso é uma inconsistência de processo de severidade Média, pois não altera a arquitetura, mas impede afirmar conformidade integral com `DOCUMENTATION_STANDARD.md`.

## Sobreposições documentais

| Sobreposição | Avaliação |
|---|---|
| Charter × Principles × Values | Aceitável, desde que Charter permaneça constitucional e os demais detalhem linguagem normativa |
| APEX_OS × Domain Boundaries × Core Modules | Útil, porém requer uma definição canônica da composição do Apex OS |
| Security Architecture × Security Standard | Aceitável: arquitetura define direção; padrão define requisitos |
| Migration Funnel × Policy × Scorecard | Aceitável: processo, regras e decisão quantitativa têm papéis distintos |
| Skill oficial × ADR-0007 | Parcialmente conflitante na autoridade atribuída ao legado |

## Conclusão

A matriz não está limpa. Os itens de alta severidade precisam ser resolvidos documentalmente antes do gate constitucional.
