# ADR-0009 — Fronteiras entre Apex OS, Core e Serviços

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Os documentos anteriores não definiam uniformemente se Shared Services pertenciam ao Apex OS.

## Decisão

Apex OS é a plataforma completa e contém Core, Shared Services, Platform Services e Produtos Verticais. Core guarda invariantes; Shared Services oferecem capacidades transversais de negócio e inteligência; Platform Services executam integração e infraestrutura por interfaces neutras; Produtos Verticais resolvem domínios de mercado.

Core não depende das demais camadas. Shared Services dependem do Core por contratos. Produtos dependem de Core e Shared Services por contratos, nunca entre si. Platform Services implementam portas requeridas sem introduzir dependência de domínio. Integrações externas ficam atrás de adapters ou gateways.

## Alternativas

Shared Services fora do Apex OS; monólito único; plataforma apenas como Core.

## Consequências positivas

Vocabulário único, ownership claro e direção de dependência verificável.

## Consequências negativas

Exige contratos e revisão rigorosa de classificação.

## Riscos

Camadas virarem categorias vagas; mitigar com padrões de módulo e ADR de exceção.

## Critérios de revisão

Revisar diante de evidência operacional de que a composição impede isolamento, escala ou governança.

## Documentos afetados

`README.md`, `company/APEX_CHARTER.md`, `architecture/APEX_OS.md`, `architecture/SYSTEM_CONTEXT.md`, `architecture/DOMAIN_BOUNDARIES.md`, `architecture/SHARED_SERVICES.md`, `governance/MODULE_STANDARD.md`, `docs/GLOSSARY.md` e a skill oficial.
