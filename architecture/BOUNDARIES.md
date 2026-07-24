# Fronteiras de Implementação — Sprint 1.1
**Versão:** 1.0.0 | **Status:** aprovado | **Data:** 2026-07-20

Dependências permitidas: `shared → nada de domínio`; `domain → shared kernel/errors`; `application → domain/contracts/shared`; `adapters → contracts/domain`; composition root → todos. Domínio e application não importam adapters. Identity não depende de Organization; Organization referencia ID de Identity; Membership referencia ambos; Authorization consulta snapshots por contratos.

Audit e Telemetry possuem contracts e stores distintos. Testes podem importar composition root e módulos públicos. Nenhum Core importa legado, produto ou serviço externo.

**Riscos:** barrel exports ocultarem ciclos; validação de imports verificará caminhos proibidos.
