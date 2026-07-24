# Constituição de Observabilidade
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Separação de responsabilidades

| Domínio | Pergunta | Autoridade | Não deve virar |
|---|---|---|---|
| Audit | quem fez o quê, sob qual autoridade e resultado? | evidência de ações/decisões relevantes | log de debug |
| Telemetry | como a operação se comporta? | sinais operacionais brutos e correlacionados | registro jurídico integral |
| Metrics | quanto/qual tendência agregada? | séries e agregações operacionais | fonte transacional |
| Tracing | qual caminho causal uma execução percorreu? | spans/correlation/causation | conteúdo sensível completo |
| Business Analytics | o negócio está criando valor? | métricas derivadas de produto/receita | Billing ou ledger operacional |
| AI Costs | quanto custou uso de IA e por quê? | usage, rate, allocation e budget | conteúdo de prompt por padrão |
| Security Events | que fato relevante de segurança ocorreu? | detecção/resposta de segurança | decisão final de compliance |
| Compliance | quais obrigações/controles/evidências se aplicam? | avaliação e evidência de controle | todos os logs indiscriminadamente |

## Leis

Cada sinal tem owner, Organization, finalidade, classificação, retenção, acesso, schema, correlation e lifecycle. Um mesmo fato pode gerar projeções distintas, mas não é duplicado sem lineage. Audit é append-oriented e protegido; Telemetry pode ser amostrada/retida por operação. Business Analytics deriva de contratos de dados; não altera fatos fonte.

PII, segredos e conteúdo profissional são minimizados/redigidos. Tenant/Organization permanecem isolados. Relógio, ordem e entrega podem ser imperfeitos; consumidores tratam duplicidade, atraso e ausência explicitamente.

## Audit versus Security/Compliance

Security Event pode originar Audit e incidente; Compliance pode referenciar Audit como evidência. Nenhum deles é sinônimo. Acesso a Audit é mais restrito que observação operacional comum.

**Riscos:** coleta excessiva, custo, correlação cross-tenant, métricas sem origem e Audit mutável.
