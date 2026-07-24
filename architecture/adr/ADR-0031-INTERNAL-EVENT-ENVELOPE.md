# ADR-0031 — Envelope de Eventos Internos
**Versão:** 1.0.0 | **Status:** Accepted para Sprint 1.1 | **Data:** 2026-07-20

## Contexto
Fatos precisam de forma consistente sem introduzir event bus ou protocolo externo.

## Decisão
Representar eventos como objetos TypeScript imutáveis com ID, name literal, version, occurredAt, domain, Organization, actor, target, correlation e metadata segura. Payload específico não é necessário neste slice. Eventos são projetados em Audit; não existe transporte distribuído.

## Alternativas
Classes por evento; strings soltas; protocolo cloud; commands como events.

## Consequências positivas
Semântica uniforme, teste e evolução versionada.

## Consequências negativas
Envelope não resolve entrega/atomicidade.

## Riscos
Metadata virar payload arbitrário; limitar valores escalares seguros.

## Critérios de revisão
Antes de event bus, persistência produtiva ou integração externa.

## Documentos afetados
Event Model, shared events, Audit e testes.
