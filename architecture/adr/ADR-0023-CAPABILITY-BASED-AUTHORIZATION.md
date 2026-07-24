# ADR-0023 — Capability-Based Authorization
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
RBAC isolado não expressa produto, projeto, tenant, risco, recurso, finalidade ou capacidade executável.

## Decisão
Autorizar por decisão híbrida: identidade autenticada + membership/role/permission (RBAC) + capability grant + políticas contextuais + scope. Deny by default. Capability descreve resultado oferecido; capability grant é a concessão autorizativa e não altera o Capability Registry. Entitlement comercial é pré-condição possível, nunca permissão de segurança.

## Alternativas
RBAC puro; listas por recurso; capability token sem políticas; autorização em UI.

## Consequências positivas
Menor privilégio e decisão explicável por Organization, Workspace, Produto e Projeto.

## Consequências negativas
Políticas e testes tornam-se mais complexos.

## Riscos
Conflitos de política e privilege creep; mitigar com precedência, expiração e decisão auditada.

## Critérios de revisão
Evidência de que o modelo não representa requisito legítimo ou é impossível de operar com segurança.

## Documentos afetados
Authorization, Security, Identity, Organization, registries e Sprint 1.
