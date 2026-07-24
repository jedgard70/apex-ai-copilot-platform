# Constituição do Kernel do Apex OS
**Versão:** 1.0.0 | **Status:** Constituição Técnica Accepted | **Data:** 2026-07-20

## Autoridade

Esta Constituição define invariantes conceituais anteriores a software. Constituição empresarial define propósito; Kernel define leis técnicas; ADRs registram decisões; arquitetura organiza componentes; implementação realiza contratos. Nenhuma camada inferior contradiz a superior sem ADR aprovada.

## Princípio fundamental

> **Everything Is A Domain.**

Nada nasce porque “precisa de uma tela”, endpoint, tabela ou job. Antes de existir, responde: a qual domínio pertence, qual problema resolve, quem responde por ele e quais contratos respeita. Sem domínio claro, não é implementado.

## Entidades fundamentais

Identity identifica sujeitos. Organization assume responsabilidade. Tenant delimita isolamento. Owner responde pelo objeto. Domain atribui significado. Policy decide restrições. Contract define interação. Capability descreve resultado. Tool executa operação. Agent decide/coordena. Workflow governa estados. Event registra fato. Audit preserva evidência. Telemetry observa operação. Knowledge preserva fontes; Memory preserva estado autorizado; Context delimita informação de uma decisão.

## Invariantes

1. Todo objeto governado possui Domain, Organization, Owner, Responsibility, Visibility, Lifecycle, Dependencies, Events e Audit policy.
2. Identity não é User, Organization, Produto, Role ou entitlement.
3. Organization é a unidade responsável; Tenant é fronteira de isolamento, não sinônimo obrigatório.
4. Autorização é deny by default e combina identidade, RBAC, capability grant, policy, scope e contexto.
5. Core não depende de domínios verticais ou implementação de IA.
6. Produtos não acessam internals de outros Produtos.
7. Eventos são fatos passados; commands são pedidos.
8. Audit, Telemetry, Metrics, Tracing, Business Analytics, AI Costs, Security Events e Compliance têm responsabilidades distintas.
9. Conhecimento possui origem, validade, classificação e acesso; documentação não prova execução.
10. Aprendizado altera conhecimento/modelos/políticas somente por workflow autorizado, versionado, reversível e auditável.
11. Crescimento ocorre por contratos e domínios explícitos, não por acoplamento ou duplicação silenciosa.
12. Linguagem canônica precede nomes técnicos.

## Como o sistema pensa

Recebe contexto autorizado, distingue fato/inferência/intenção, identifica domínio, avalia políticas/capabilities, explica incerteza, propõe ação e exige aprovação proporcional ao efeito. Persona orienta perspectiva; agente coordena; executor e tool realizam.

## Como registra e aprende

Fatos de negócio tornam-se eventos; decisões sensíveis tornam-se Audit; comportamento operacional torna-se Telemetry. Feedback não altera comportamento produtivo silenciosamente: vira Knowledge com proveniência, avaliação e eventual mudança versionada.

## Como cresce

Novos domínios entram por owner, linguagem, fronteira, contracts, lifecycle, custo, segurança e observabilidade. Reuso comprovadamente transversal migra por ADR para Core/Shared/Platform Service; não é promovido por conveniência.

## Regra de mudança

Alteração constitucional exige ADR que declare cláusula substituída, alternativas, migração, riscos e aceite do proprietário.

**Riscos:** rigidez, abstração excessiva e compliance apenas documental. Revisar por evidência, manter leis mínimas e testar invariantes na implementação futura.
