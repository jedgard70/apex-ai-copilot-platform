# 40 — Conformidade arquitetural

| Autoridade | Conformidade observada |
|---|---|
| Constituição e Kernel | Linguagem e entidades seguem Identity, Organization, Membership, Role, Permission, Scope, Policy, Audit e Telemetry. |
| ADR-0007 | Somente Apex OS é destino; legado permaneceu fonte não copiada e não alterada. |
| ADR-0008 | Core precede produtos; nenhum produto foi iniciado. |
| ADR-0015 | Fronteiras são explícitas e verificadas por script; adapters dependem de contratos, não o inverso. |
| ADR-0022 | Objetos possuem ownership e contexto organizacional explícitos. |
| ADR-0023 | Authorization é contextual, não uma checagem booleana global. |
| ADR-0024 | Eventos representam fatos concluídos e usam envelope imutável. |
| ADR-0026 | TypeScript e Node ESM foram usados conforme decidido. |
| ADR-0027 | Organização por domínio e camadas internas foi aplicada. |
| ADR-0028 | Persistência em memória está isolada atrás de contratos e declarada não produtiva. |
| ADR-0029 | Testes usam o runner nativo do Node. |
| ADR-0030 | IDs e tempo são portas injetáveis. |
| ADR-0031 | Eventos internos seguem envelope comum com versão e correlação. |

## Dependências

O grafo respeita: shared sem domínio; domain dependente apenas do kernel/errors; application dependente de domain, contracts e shared; adapters dependentes de contracts/domain; composition root conecta todos. Identity não depende de Organization. Organization referencia Identity por ID. Membership referencia ambas. Authorization consulta snapshots através de contratos.

O validador confirmou ausência de ciclos e violações de fronteira.

## Escopo negativo confirmado

Não foram criados Products, Growth, Intelligence, Billing, registries, API, UI, provider de autenticação, banco, broker, deploy ou integração externa. Nenhuma decisão arquitetural preexistente foi modificada; novas decisões registram escolhas de implementação necessárias.

## Veredito

Conforme com a fundação vigente para o escopo da Sprint 1.1.
