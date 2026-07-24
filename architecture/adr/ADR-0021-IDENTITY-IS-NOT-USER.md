# ADR-0021 — Identity Is Not User
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
Confundir Identity, User, Organization e papéis cria autenticação acoplada a perfil e produto.

## Decisão
Identity apenas identifica um sujeito humano ou não humano. User é perfil/apresentação de uma Human Identity; Machine, Agent, API, Worker, System Account e Service Account são tipos ou sujeitos não humanos. Owner, Administrator, Customer, Partner, Consultant e Guest são relações/papéis contextuais, nunca tipos fundamentais de identidade. Identity não representa Produto ou Organization.

## Alternativas
User como raiz universal; contas por produto; Organization como login.

## Consequências positivas
Autenticação separada de perfil, membership e autorização.

## Consequências negativas
Mais relações explícitas no modelo.

## Riscos
Contas órfãs e impersonation indevida; mitigar com lifecycle, credenciais, vínculo e auditoria.

## Critérios de revisão
Novo tipo de sujeito que não possa ser modelado sem quebrar invariantes.

## Documentos afetados
Identity, Organization, Authorization, Core Modules, glossário e Sprint 1.
