# Apex OS — Arquitetura do núcleo compartilhado

**Status:** Proposta Foundation
**Versão:** 1.1.0
**Data:** 2026-07-20

## Responsabilidade

O Apex OS é a plataforma completa composta por Core, Shared Services, Platform Services e Produtos Verticais. O Core fornece autoridades e invariantes: identidade, organizações, tenancy, permissões, billing, entitlements, registries, auditoria, telemetria e Knowledge. Não contém regras específicas de engenharia, contabilidade, jurídico, investimentos, viagens ou Studio.

## Limites

O Core não depende de Shared Services, Produtos ou IA específica. Shared Services dependem do Core por contratos. Produtos dependem de Core e Shared Services por interfaces versionadas, nunca diretamente de outros Produtos. Platform Services implementam portas técnicas neutras. Dependências inversas e acesso direto a internals de outro domínio são proibidos conforme [ADR-0008](adr/ADR-0008-DOMAIN-ISOLATION.md) e [ADR-0009](adr/ADR-0009-APEX-OS-CORE-SHARED-SERVICES-BOUNDARIES.md).

## Modularidade e extensibilidade

Módulos possuem owner, autoridade de dados, API/eventos, SLO, política de falha e ciclo de vida. Extensões são registradas; não injetam privilégios implicitamente.

## Multi-tenancy

Organização e tenant fazem parte do contexto de toda operação. Autorização é aplicada no servidor e na camada de dados. Cache, logs, jobs, arquivos, memória e custos preservam isolamento.

## Governança e interoperabilidade

Contratos são compatíveis por versão, idempotentes quando aplicável e acompanhados de evidência. Integrações externas passam pelo Integration Registry. Formatos abertos são preferidos, sem selecionar tecnologia definitiva nesta etapa.

Consulte [DOMAIN_BOUNDARIES.md](DOMAIN_BOUNDARIES.md), [CORE_MODULES.md](CORE_MODULES.md), [SHARED_SERVICES.md](SHARED_SERVICES.md), [PLATFORM_SERVICES.md](PLATFORM_SERVICES.md), o [glossário](../docs/GLOSSARY.md) e os [ADRs](adr/).

Toda implementação e evolução respeita a [Constituição do Kernel](../kernel/KERNEL_CONSTITUTION.md). Arquitetura organiza componentes; não redefine as leis de Identity, Organization, Authorization, Ownership, Events ou Observability.
