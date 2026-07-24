# Linguagem Canônica de Domínio
**Versão:** 1.0.0 | **Status:** vocabulário técnico congelado | **Data:** 2026-07-20

Cada termo abaixo possui uma definição. Mudança estrutural exige ADR conforme ADR-0025.

| Termo | Definição única |
|---|---|
| Product | Produto Vertical/oferta que resolve problema de mercado em domínio isolado |
| Module | unidade coesa dentro de domínio, com responsibility, owner e contracts |
| Capability | resultado contratual que Tool, Agent ou Service pode oferecer |
| Feature | comportamento percebido pelo usuário composto por capabilities; não define domínio |
| Workflow | definição versionada de estados/transições, aprovações e compensações |
| Tool | operação invocável com schema, executor, permissions, efeitos e falhas |
| Agent | ator governado que decide/coordena com Identity, executor, grants e lifecycle |
| Persona | lente de especialidade; não possui executor nem autoridade |
| Skill | conhecimento/procedimento versionado; executável somente quando ligado a executor e grants |
| Executor | runtime abstrato responsável por realizar operação |
| Provider | organização/sistema que fornece capacidade externa por contrato |
| Workspace | espaço colaborativo pertencente a Organization e protegido por Tenant/Scope |
| Organization | entidade responsável por memberships e objetos |
| Identity | identificador estável de sujeito humano ou não humano |
| Tenant | fronteira de isolamento atribuída a uma Organization |
| Service | unidade que oferece comportamento por contract e declara camada |
| Platform Service | serviço técnico que implementa execução/integração/infraestrutura neutra |
| Shared Service | serviço transversal de negócio/inteligência consumido por contratos |
| Core | autoridades e invariantes independentes de domínios verticais |
| Knowledge | fontes/conteúdo com provenance, versão, acesso, validade e retenção |
| Memory | estado persistido derivado/autorizado para continuidade; não é Knowledge fonte |
| Context | conjunto temporário, autorizado e mínimo de fatos para decisão/execução |
| AI Session | contexto delimitado de interação com IA; não é Identity nem memória ilimitada |
| Prompt | instrução versionada a modelo dentro de contexto/policy |
| Policy | regra avaliável de decisão/restrição |
| Contract | interface versionada de comportamento, dados, API, command ou event |
| Event | fato concluído e imutável expresso no passado |
| Owner | Identity ou papel accountable designado pela Organization para um objeto |

## Termos relacionados

Role agrupa permissions; Permission permite ação abstrata; Capability Grant autoriza invocar capability sob scope; Entitlement representa direito comercial. Esses quatro não são sinônimos.

Domain é fronteira de significado e responsabilidade. **Everything Is A Domain**: Feature, tela, arquivo ou integração não justifica existência sem domínio proprietário.

**Riscos:** empréstimos linguísticos e termos antigos recriarem entidades paralelas. O [glossário](../docs/GLOSSARY.md) deve apontar para esta fonte.
