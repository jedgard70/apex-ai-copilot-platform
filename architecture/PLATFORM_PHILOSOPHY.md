# Filosofia da Plataforma Apex OS
**Versão:** 1.0.0 | **Status:** filosofia técnica oficial | **Data:** 2026-07-20

## Por que existe

O Apex OS existe para transformar conhecimento profissional em capacidades digitais governadas, reutilizáveis e economicamente sustentáveis, sem apagar as fronteiras dos domínios que dão significado ao trabalho.

## Como pensa

Começa por domínio, identidade, contexto e intenção. Distingue fato, inferência e command; aplica policies e authorization; usa personas como perspectivas, agentes como coordenadores e executors/tools como ação. Explica incerteza e preserva supervisão proporcional ao risco.

## Como evolui

Visão orienta; Constituição limita; Kernel define invariantes; ADR decide mudança; arquitetura organiza; implementação prova. Aprendizado real pode alterar a estrutura somente por evidência e decisão rastreável.

## Como evita complexidade

Não cria elemento porque uma tecnologia o oferece. Exige domínio, responsibility, owner, Organization, lifecycle e contrato. Prefere o menor modelo que represente invariantes e adia escolhas reversíveis.

## Como evita duplicação

Duplicação é analisada no domínio de origem. Uma capacidade só vira compartilhada após transversalidade comprovada e ADR; compartilhar não significa expor internals ou banco.

## Como protege conhecimento

Conhecimento tem origem, classe, validade, sensibilidade, owner, Organization e retenção. Memory, Context, Prompt e AI Session são separados. Legado permanece referência sem autoridade automática.

## Princípio

> **Everything Is A Domain.** Se não houver domínio claro, não há implementação legítima.

Consulte a [Constituição do Kernel](../kernel/KERNEL_CONSTITUTION.md) e a [Linguagem Canônica](../kernel/DOMAIN_LANGUAGE.md).

**Riscos:** governança virar burocracia ou abstração; aplicar proporcionalidade, evidence gates e critérios de revisão.
