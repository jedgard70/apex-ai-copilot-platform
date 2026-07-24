# Módulos do Core

**Status:** Catálogo conceitual
**Versão:** 1.0.0
**Data:** 2026-07-20

Todo módulo terá autoridade de dados, entradas/saídas contratuais, dependências permitidas, exclusões, riscos e métricas.

| Módulo | Autoridade e entradas/saídas | Dependências permitidas | Não pertence | Risco/métrica mínima |
|---|---|---|---|---|
| Identity | identidades e credenciais/sessões | Security/Audit por contrato | perfil, organização ou autorização | takeover; auth success |
| Users | perfil global mínimo | Identity | membership e dados verticais | PII; active users |
| Organizations | organizações e memberships por Identity | Identity/Audit | projetos | isolamento; org count |
| Tenancy | contexto e fronteira | Organizations | autorização fina | cross-tenant; violations |
| Permissions | roles/permissions/grants/policies/decisions | Identity/Tenancy | capabilities e regras verticais | privilege escalation; denials |
| Billing | planos/assinaturas/uso faturável/invoices/pagamentos | Organizations/Audit | Finance & BI/contabilidade geral | revenue leakage; recovery |
| Entitlements | direitos/quotas | Billing/Product Registry | permissões de segurança | overuse; denied usage |
| Knowledge | fontes/chunks/proveniência | Storage/Search | memória pessoal | poisoning; retrieval quality |
| Memory | estado autorizado e retenção | Identity/Knowledge | transcript ilimitado | leakage; retention |
| Workflow Registry | definições/versionamento | Agent/Capability/Tool Registry | engine/lógica vertical | duplication; integrity |
| Agent Registry | identidade/versão/status | Capability/Tool Registry | execução | fake-live; verified ratio |
| Tool Registry | ferramentas/permissões | Integration Registry/Security | prompts | unsafe action; failure |
| Capability Registry | contratos de capacidade | Tool Registry/Product Registry | implementações verticais | ambiguity; coverage |
| Storage | objetos/metadados/retention | Tenancy/Audit | interpretação | leakage; egress |
| Search | índices/queries | Knowledge/Tenancy | source truth | stale index; precision |
| Notifications | consent/delivery/status | Users/Integrations | campanha Growth | spam; delivery |
| Security | policy/secrets/risk | todos por contrato | bypass | incidents/MTTR |
| Audit | eventos imutáveis | Identity/Tenancy | logs debug | tampering; coverage |
| Telemetry | logs/metrics/traces | todos | dados sensíveis | blind spots; SLO |
| Cost Registry | rates/usage/allocation | Telemetry/Billing | Finance & BI/preço comercial | margin drift; unit cost |
| Product Registry | produtos/versões/owners | Identity/Audit | runtime vertical | orphan product; adoption |
| Integration Registry | integrações/adapters/status | Security/Cost Registry | implementations/secrets | outage; availability |

Ordem dos Registries: Product → Integration → Tool → Capability → Agent → Workflow, conforme [ADR-0013](adr/ADR-0013-REGISTRY-DEPENDENCY-ORDER.md). Apex Intelligence oferece AI Gateway como Shared Service e consulta Knowledge; o Core não depende de modelos ou providers.
