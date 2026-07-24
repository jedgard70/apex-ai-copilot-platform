# Filosofia de Eventos
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Lei

Eventos representam fatos que já ocorreram. São registros declarativos no passado, não instruções para produzir efeito.

Corretos: `invoice.created`, `render.finished`, `project.approved`, `agent.executed`. Incorretos como eventos: `generate.invoice`, `render.image`, `start.workflow`; estes são commands/requests.

## Estrutura conceitual

Todo evento inclui ID, name, version, occurred-at, producer, schema owner, Domain, Organization, Tenant quando aplicável, subject/resource, correlation, causation, actor Identity, data classification e payload mínimo. Event time difere de ingestion/processing time.

## Emissão

Emitir somente depois de o domínio fonte aceitar o fato segundo suas invariantes. O produtor não promete que consumidores agirão. Consumidores são idempotentes, toleram duplicidade/atraso/ordem parcial e não reescrevem o evento. Correções geram novo fato, não mutação silenciosa.

## Naming

Usar `domain.entity.past_participle` quando a clareza exigir namespace; exemplos curtos são permitidos dentro de bounded context inequívoco. Nomes descrevem fato de negócio, não tecnologia ou consumidor.

## Privacidade e evolução

Payload não replica objeto inteiro por conveniência. Schemas são versionados e compatibilidade é declarada. Eventos sensíveis aplicam minimização, visibility, retenção e access policy. Event não é Audit automaticamente; ações relevantes projetam evidência de Audit separada.

## Commands

Command expressa intenção dirigida, possui requester, target, scope, deadline/idempotency e pode ser aceito/rejeitado. Aceitação produz fatos distintos, nunca resposta falsamente chamada evento.

**Riscos:** event storm, semântica vaga, dual write, PII disseminada e consumidores acoplados ao payload.
