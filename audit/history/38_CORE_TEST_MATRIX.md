# 38 — Matriz de testes do Core

| Risco ou comportamento | Evidência automatizada | Resultado |
|---|---|---|
| Permissão explícita autoriza | Authorization allows explicit permission and denies by default | Aprovado |
| Ausência de permissão nega por padrão | Mesmo teste de Authorization | Aprovado |
| Isolamento entre Organizations | Membership in one Organization never authorizes another | Aprovado |
| Ciclo de vida e idempotência de Identity | Identity enforces lifecycle and idempotent transitions | Aprovado |
| Transição inválida de Membership | Membership cannot suspend before activation | Aprovado |
| Roles sem wildcard e sem duplicatas | Roles require explicit permissions and reject duplicates | Aprovado |
| Fluxo vertical e separação Audit/Telemetry | Core vertical slice executes with separated Audit and Telemetry | Aprovado |
| Convite repetido idempotente | Repeated identical invitation is idempotent | Aprovado |
| Ator não pode suspender outra Identity | SuspendIdentity rejects another actor and records the successful self transition | Aprovado |
| Owner inativo não cria Organization | CreateOrganization rejects an inactive owner | Aprovado |
| Suspensão exige gestão e revoga acesso | SuspendMembership requires membership.manage and disables later authorization | Aprovado |

Observação: são 10 testes; o primeiro cobre tanto autorização positiva quanto negação por padrão. Execução final: 10 pass, 0 fail, 0 skipped, 0 todo.

## Cobertura de aceite

- Identity humana e machine: cobertas pelo modelo; o fluxo exercita Identity humana.
- Organization e owner ativo: cobertos.
- Membership com Role, Permission e Scope explícitos: cobertos.
- Multi-organização e isolamento: cobertos por teste cruzado.
- Authorization contextual e deny-by-default: cobertos.
- Audit append-only: exercitado no fluxo; contrato não expõe update/delete.
- Telemetry sem payload de negócio: exercitada e validada por forma tipada.
- Idempotência: coberta em transições e convite repetido.

## Lacunas deliberadas

Não há testes de concorrência distribuída, persistência durável, autenticação, transporte HTTP, RLS, filas ou integração externa porque esses elementos não pertencem à Sprint 1.1.
