# Constituição de Ownership de Objetos
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Registro constitucional mínimo

Todo objeto governado declara:

| Campo | Obrigação |
|---|---|
| Domain | linguagem e regras que dão significado |
| Owner | accountability por risco, qualidade e lifecycle |
| Organization | entidade responsável e autoridade de transferência |
| Lifecycle | estado e transições permitidas |
| Responsibility | propósito exclusivo e limites |
| Visibility | quem pode descobrir/ver metadados/conteúdo |
| Dependencies | contratos consumidos, nunca internals implícitos |
| Events | fatos publicados/consumidos e owner dos schemas |
| Audit | ações/decisões que exigem evidência e retenção |

## Matriz de ownership

- Core object: Organization Apex Global; owner do domínio Core.
- Shared/Platform Service object: Organization operadora; owner do serviço.
- Product object: Organization responsável pelo tenant/produto; owner vertical.
- Customer data: Organization cliente responsável ou controladora conforme contrato/finalidade; Apex opera somente sob papel declarado.
- Agent/Tool/Workflow: Organization publicadora e owner registrado; executor não se torna owner automaticamente.
- Event: Organization do agregado fonte e schema owner; consumidor não adquire ownership do fato.

## Transferência e órfãos

Transferência exige autorização, aceite do novo owner, escopo, data e evento no passado. Exclusão/arquivamento respeita retenção e referências. Se owner individual sair, a Organization assume custódia até reassignment; o objeto nunca fica ownerless.

## Lifecycle base

Cada domínio define estados próprios compatíveis com `proposed → active/operational → suspended/deprecated → archived`. Não forçar lifecycle de agentes sobre invoices ou identities; exigir apenas estados e transições explícitos.

**Riscos:** owner simbólico, duas Organizations reivindicarem autoridade, transferências parciais e dados órfãos.
