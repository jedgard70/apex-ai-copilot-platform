# Validação da Linguagem de Domínio
**Versão:** 1.0.0 | **Status:** aprovada | **Data:** 2026-07-20

## Fonte canônica

`kernel/DOMAIN_LANGUAGE.md` substitui definições técnicas informais. `docs/GLOSSARY.md` é índice humano e aponta para o Kernel.

## Termos obrigatórios

| Grupo | Termos validados |
|---|---|
| Estrutura | Product, Module, Feature, Service, Platform Service, Shared Service, Core |
| Execução | Capability, Workflow, Tool, Agent, Executor, Provider |
| Cognição | Persona, Skill, Knowledge, Memory, Context, AI Session, Prompt |
| Autoridade | Workspace, Organization, Identity, Tenant, Policy, Owner |
| Integração | Contract, Event |

## Distinções testadas

- Feature compõe capabilities; não cria domínio.
- Capability descreve resultado; Permission/Grant autorizam.
- Persona não executa; Agent coordena; Tool opera; Executor realiza.
- Knowledge é fonte; Memory é estado autorizado; Context é temporário; AI Session delimita interação.
- Provider fornece externamente; Platform Service implementa porta técnica interna.
- Event é fato passado; Command é intenção dirigida.

## Resultado

Zero termos obrigatórios sem definição e zero sinônimos usados como entidades equivalentes nos documentos do Kernel. Mudanças futuras exigem ADR-0025.
