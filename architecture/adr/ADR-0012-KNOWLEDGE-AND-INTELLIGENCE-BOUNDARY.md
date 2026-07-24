# ADR-0012 — Fronteira entre Knowledge e Apex Intelligence

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Conhecimento persistente e processamento por IA apareciam acoplados.

## Decisão

Knowledge pertence ao Core e governa fontes, documentos, metadados, indexação lógica, proveniência, versões, acesso, retenção, políticas e recuperação abstrata. Apex Intelligence pertence aos Shared Services e governa modelos, prompts, inferência, roteamento, avaliações, embeddings, geração, raciocínio e multimodalidade. Intelligence consulta Knowledge por contratos; Knowledge não depende de modelos ou provedores.

## Alternativas

Knowledge dentro de Intelligence; armazenamento específico por modelo; duplicação por produto.

## Consequências positivas

Portabilidade, proveniência e substituição de modelos.

## Consequências negativas

Contratos de recuperação e autorização mais explícitos.

## Riscos

Vazamento por retrieval e embeddings órfãos; mitigar com tenancy, lineage, retenção e exclusão propagada.

## Critérios de revisão

Revisar diante de evidência técnica de que a separação inviabiliza requisitos legítimos.

## Documentos afetados

Core Modules, Shared Services, `ai/*`, Data Principles, segurança e glossário.
