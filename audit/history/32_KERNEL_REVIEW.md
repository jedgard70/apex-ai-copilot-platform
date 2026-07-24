# Revisão do Kernel
**Versão:** 1.0.0 | **Status:** aprovado | **Data:** 2026-07-20

## Escopo

Revisados Kernel Constitution, Identity, Organization, Authorization, Observability, Domain Language, Object Ownership, Event Philosophy, ADR-0020 a ADR-0025 e documentos arquiteturais afetados.

## Perguntas fundamentais

| Pergunta | Resposta constitucional |
|---|---|
| Quem existe? | Identities, Organizations e objetos de domínio definidos pela Linguagem Canônica |
| Quem pertence a quem? | objeto→Organization; membership liga Identity→Organization; Workspace/Project têm relações explícitas |
| Quem pode fazer o quê? | decisão híbrida RBAC + capability grant + context policy + exact scope |
| Quem é dono de quê? | todo objeto tem Organization responsável e owner accountable |
| Como pensa? | domínio→contexto→fatos/inferência→policy/capability→explicação/ação |
| Como registra? | eventos para fatos, Audit para evidência, Telemetry para operação |
| Como aprende? | Knowledge com proveniência e mudança versionada/avaliada; nunca adaptação produtiva silenciosa |
| Como cresce? | novos domínios/contratos e extração transversal somente por evidência/ADR |

## Dependências

O ciclo conceitual anterior `Users→Tenancy→Organizations→Users` foi removido. Ordem atual: Identity → Organizations/memberships → Tenancy → Authorization. Organization ativa responde por si, evitando regressão de ownership; parent/Holding não herda acesso.

Não foi encontrada dependência do Core sobre Produtos, Shared Services ou IA específica.

## Ambiguidades resolvidas

Capability versus Capability Grant; Identity versus User; Organization versus Tenant; Owner como relação; Event versus Command; Audit versus Telemetry; Knowledge versus Memory/Context; Persona versus Agent.

## Riscos residuais

Implementação pode divergir da Constituição; serão necessários contract tests, architectural tests e decision logs na Sprint 1. Nenhuma tecnologia foi escolhida.
