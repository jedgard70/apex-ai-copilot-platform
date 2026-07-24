# 39 — Revisão de segurança e isolamento

## Conclusão

O slice atende ao modelo de segurança previsto para execução local: **negação por padrão, autorização contextual e isolamento por Organization**. Isso não equivale a prontidão de produção, pois autenticação e persistência durável ainda não existem.

## Controles confirmados

- Toda autorização exige Identity ativa e Membership ativa na Organization solicitada.
- Permission e Scope são explícitos; não existe permissão genérica `all` ou wildcard.
- Membership de uma Organization não concede acesso a outra.
- Policies recebem contexto e podem negar mesmo quando a Permission existe.
- A criação da primeira Membership de owner deriva do ownership validado da Organization; convites posteriores exigem `membership.manage`.
- Suspender Membership remove a capacidade de autorização subsequente.
- Suspensão de Identity no slice somente pode ser iniciada pela própria Identity.
- Consulta de Audit exige `audit.read`; negações também geram fato auditável.
- Audit é append-only por contrato.
- Telemetry contém metadados operacionais mínimos e não recebe payload de negócio.
- IDs, relógio e correlation IDs são abstraídos e testáveis.

## Verificações estáticas

- Imports entre fronteiras e ciclos: limpos.
- Busca por valores atribuídos a API keys, secrets, passwords, access tokens e private keys: nenhuma ocorrência.
- Busca por eventos com semântica imperativa: nenhuma ocorrência.
- Busca por marcadores técnicos pendentes no código: nenhuma ocorrência.

## Riscos residuais

| Risco | Severidade atual | Tratamento futuro |
|---|---:|---|
| Persistência em memória perde estado no restart | Alta para produção | ADR e adapter durável em sprint posterior |
| Não existe autenticação criptográfica | Alta para produção | Próximo incremento de Identity, sem confundir autenticação com autorização |
| Não há controle de concorrência distribuída | Alta para produção | versionamento/optimistic concurrency no adapter durável |
| Bootstrap do owner depende de composition root confiável | Média | formalizar boundary de provisioning |
| Audit não possui storage imutável externo | Alta para produção | adapter append-only durável e política de retenção |
| Telemetry não está exportada | Baixa nesta sprint | adapter futuro com política de dados |

Nenhum desses riscos invalida a finalidade local e limitada da Sprint 1.1; todos impedem declarar o slice production-ready.
