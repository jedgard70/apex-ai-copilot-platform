# ADR-0013 — Dependências e ordem dos Registries

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

A ordem anterior colocava Agent Registry antes das autoridades que ele referencia.

## Decisão

Adotar a ordem: Product Registry, Integration Registry, Tool Registry, Capability Registry, Agent Registry e Workflow Registry. Cada registro referencia apenas entidades já catalogáveis: produto/owner; integrações/adapters; ferramentas executáveis; capacidades oferecidas; agentes com capacidades/ferramentas; workflows que compõem os anteriores.

## Alternativas

Agent Registry primeiro com referências pendentes; registro único; ordem livre.

## Consequências positivas

Integridade referencial, estados verificáveis e claims auditáveis.

## Consequências negativas

Metadados fundamentais precisam existir antes de composições superiores.

## Riscos

Dependências cíclicas e registros burocráticos; mitigar com contratos mínimos e DAG validado.

## Critérios de revisão

Revisar se casos reais exigirem referências pendentes seguras ou novas classes de registro.

## Documentos afetados

Core Modules, `agents/*`, roadmap, Definition of Done e glossário.
