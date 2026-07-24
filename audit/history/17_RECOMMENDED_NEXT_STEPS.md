# Próximos passos recomendados após a Sprint 0.1

**Versão:** 1.0.0
**Status:** recomendação; execução não iniciada
**Data:** 2026-07-20

## Recomendação objetiva

**Não iniciar a Sprint 1 ainda.** Executar primeiro uma Sprint 0.2 curta, exclusivamente documental, para remover os bloqueios de alta severidade. Depois, repetir o gate arquitetural. A Sprint 1 poderá começar somente quando não houver achado Alto aberto.

## Sprint 0.2 recomendada — Foundation Remediation

1. Criar os documentos originalmente previstos em `products/`, `agents/`, `ai/`, `business/`, `marketing/` e `roadmap/`.
2. Resolver por ADR a composição de Apex OS, Core e Shared Services.
3. Resolver por ADR a classificação de Apex Growth e o estado de Apex Studio.
4. Corrigir o grafo conceitual do Core para eliminar dependências sobre implementações de Produtos e IA.
5. Definir os ADRs preparatórios de Identity, Organizations/Tenancy e RBAC.
6. Definir Audit versus Telemetry e o modelo comum dos Registries.
7. Fixar a ordem de implementação de Agent, Capability e Tool Registry conforme o grafo aprovado.
8. Unificar o ciclo de vida de agentes, skills, tools e capabilities.
9. Corrigir os sete links quebrados do README pela criação dos documentos previstos, sem mascarar ausências.
10. Aplicar o padrão documental a riscos, estado atual/proposta e links relativos.

## Gate para liberar a Sprint 1

| Critério | Evidência esperada |
|---|---|
| Nenhum achado Alto aberto | matriz revisada e aprovada |
| Todos os documentos obrigatórios existem | inventário sem diretórios de escopo vazios |
| Links Markdown válidos | verificação local com zero destinos ausentes |
| Growth e Studio classificados | ADRs aceitos e catálogo consistente |
| Core sem dependência invertida | grafo e catálogo revisados |
| Identity/Tenancy/RBAC decididos | ADRs aceitos, sem escolha prematura de stack |
| Audit/Telemetry separados | autoridades, retenção e acesso definidos |
| Registries ordenados | modelo e DAG aceitos |
| Glossário ratificado | termos normativos consistentes |
| Constituição aprovada pelo proprietário | decisão humana registrada |

## Ordem condicional da Sprint 1

Após o gate, a ordem empresarial desejada pode ser preservada para os seis primeiros módulos:

1. Identity
2. Organizations
3. Tenancy
4. Permissions (RBAC)
5. Audit
6. Telemetry

Para os registries, a ordem só deve ser fixada após o ADR do grafo. Se Agent Registry exigir referências existentes e válidas, a ordem técnica provável será Capability Registry, Tool Registry e então Agent Registry; outra ordem exigirá suporte explícito a referências pendentes e seus riscos.

## Critério de aceite desta revisão

- Cinco relatórios criados exclusivamente em `audit/`.
- Achados classificados por severidade e documentos afetados.
- Lacunas de ADR registradas sem tomar decisões.
- Glossário proposto sem esconder conflitos existentes.
- Nenhum código, dependência, deploy ou alteração do legado.
- Nenhum documento-fonte ou decisão arquitetural alterado.
