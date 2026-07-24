# ADR-0024 — Events Represent Facts
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
Misturar comando e evento torna histórico ambíguo, incentiva efeitos ocultos e quebra reprocessamento.

## Decisão
Eventos representam fatos concluídos e imutáveis, nomeados no passado: `invoice.created`, `render.finished`, `project.approved`, `agent.executed`. Pedidos como `generate.invoice` ou `start.workflow` são commands/requests e não eventos. Todo evento possui owner de schema, origem, Organization, tenant/contexto, versão, tempo, correlation/causation e classificação de dados.

## Alternativas
Eventos imperativos; mensagens sem tipo; chamadas diretas como integração padrão.

## Consequências positivas
Histórico compreensível, desacoplamento e auditoria causal.

## Consequências negativas
Commands e events exigem contratos separados.

## Riscos
Evento falso antes de commit, semântica vaga e dados sensíveis; mitigar com critérios de emissão e minimização.

## Critérios de revisão
Caso real em que fato passado não represente adequadamente integração assíncrona.

## Documentos afetados
Event Philosophy, API Standard, Workflow, Domain Language e integrações.
