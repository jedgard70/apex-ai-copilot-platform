# Matriz Constitucional de Ownership
**Versão:** 1.0.0 | **Status:** aprovada | **Data:** 2026-07-20

| Entidade/objeto | Organization responsável | Owner | Lifecycle mínimo | Responsibility |
|---|---|---|---|---|
| Identity humana | Apex Global como autoridade do Core; dados vinculados por finalidade | owner do domínio Identity | proposed/active/suspended/disabled/archived | identificar pessoa |
| Machine/Agent/API/Worker Account | Organization que patrocina execução | responsável técnico/operacional | proposed/active/suspended/disabled/archived | identificar sujeito técnico |
| Organization | ela própria após ativação | papel de governança designado | proposed/active/suspended/closing/archived | responder por objetos/memberships |
| Workspace | Organization proprietária | workspace owner | proposed/active/suspended/archived | colaboração delimitada |
| Tenant | Organization isolada | tenancy owner | proposed/active/suspended/migrating/archived | isolamento |
| Project | Organization/Workspace definidos | project owner | proposed/active/on-hold/closed/archived | agregado de trabalho |
| Product | Apex Global ou Organization licenciada conforme contrato | product owner | proposed/active/deprecated/archived | oferta vertical |
| Module/Service | Organization operadora | domain/service owner | proposed/active/suspended/deprecated/archived | responsabilidade coesa |
| Capability | Organization publicadora | capability owner | proposed/cataloged/validated/deprecated/archived | resultado contratual |
| Tool | Organization publicadora | tool owner | proposed/cataloged/implemented/validated/operational/suspended/deprecated/archived | operação invocável |
| Agent | Organization publicadora | agent owner | lifecycle ADR-0014 | decisão/coordenação |
| Workflow | Organization publicadora | workflow owner | proposed/cataloged/implemented/validated/operational/suspended/deprecated/archived | estados/transições |
| Knowledge | Organization responsável pela fonte/finalidade | knowledge owner | proposed/active/stale/deprecated/archived | preservar fonte/proveniência |
| Memory | Organization do contexto autorizado | memory owner | active/expired/deleted/held | continuidade controlada |
| Context/AI Session | Organization do tenant/workspace | session/context owner | created/active/closed/expired | decisão temporária |
| Prompt/Policy/Contract | Organization publicadora | domain owner | draft/active/deprecated/archived | instrução/regra/interface versionada |
| Event | Organization do agregado fonte | schema/domain owner | emitted/superseded-by-correction/retained/expired | registrar fato |
| Provider/Integration | Organization contratante/operadora | integration owner | proposed/validated/active/suspended/deprecated/archived | relação externa governada |

Estados podem ser especializados por domínio, mas owner, Organization, responsibility, visibility, dependencies, events e Audit nunca são opcionais.
