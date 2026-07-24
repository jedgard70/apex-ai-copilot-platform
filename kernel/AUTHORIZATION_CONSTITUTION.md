# Constituição de Autorização
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Lei central

Autorização é decisão contextual, explícita e deny by default. UI, posse de credencial, membership, entitlement ou capability isoladamente não autorizam ação.

## Termos

| Termo | Definição |
|---|---|
| Role | conjunto nomeado de permissions dentro de Organization/scope |
| Permission | ação abstrata permitida sobre classe de recurso |
| Capability | resultado que sistema pode oferecer; não é permissão |
| Capability Grant | concessão a uma Identity para invocar capability sob scope/condições |
| Policy | regra avaliável que permite, nega ou exige condição |
| Scope | limite de Organization, Tenant, Workspace, Produto, Project, recurso e ação |
| Context | fatos atuais autorizados usados na decisão: identidade, risco, finalidade, tempo, dispositivo, estado e delegação |

## Modelo híbrido

```text
authenticated identity
+ active membership
+ role/permission
+ capability grant quando aplicável
+ entitlement quando comercialmente necessário
+ context policies
+ exact scope
− explicit deny
= authorization decision
```

Exemplo: uma Human Identity pode executar capability BIM somente na Organization A, Tenant A1, Workspace X, Produto Engineering e Project Y, durante membership ativa e sob política de risco.

## Precedência

Explicit deny vence allow. Scope mais restrito não é ampliado por role genérica. Delegação não ultrapassa autoridade original. Ações sensíveis podem exigir step-up, aprovação humana, separação de funções ou limite de custo.

## Decisão e evidência

Toda decisão relevante registra subject, action, resource, capability/grant, scope, policies avaliadas, resultado, razão, correlation e tempo, com minimização. Negativas são observáveis; decisões sensíveis entram em Audit.

## Invariantes

- Agent/Worker usa sua própria Identity e grants; contexto do usuário não é copiado integralmente.
- Product não define bypass do Core authorization.
- Entitlement responde “foi contratado?”, permission responde “pode agir?”.
- Capability Registry descreve; Authorization concede invocation.

**Riscos:** policy conflict, privilege creep, grants longos, confused deputy e decisão impossível de explicar.
