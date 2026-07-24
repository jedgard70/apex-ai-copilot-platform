# Glossário Oficial do Apex OS
**Versão:** 2.0.0 | **Status:** índice humano; Kernel é canônico | **Data:** 2026-07-20

Usar português em texto normativo e manter identificadores técnicos em inglês quando fizerem parte de contratos. Termos não são sinônimos. Para termos técnicos, a fonte definitiva é [DOMAIN_LANGUAGE.md](../kernel/DOMAIN_LANGUAGE.md); em conflito, o Kernel prevalece.

| Termo | Definição oficial |
|---|---|
| Apex Global | Empresa responsável pelo ecossistema |
| Apex OS | Plataforma completa: Core, Shared Services, Platform Services e Produtos Verticais |
| Core | Autoridades e invariantes compartilhados, independentes de domínios e IA específica |
| Shared Service | Capacidade transversal de negócio/inteligência exposta por contrato |
| Platform Service | Capacidade técnica de execução, integração ou infraestrutura que implementa interfaces neutras |
| Produto Vertical | Solução isolada para domínio profissional, com regras, dados e ciclo próprios |
| Produto | Oferta comercial; no catálogo arquitetural atual, refere-se aos Produtos Verticais |
| Domínio | Área com linguagem, regras e autoridade próprias |
| Módulo | Unidade coesa com owner, fronteira, dados, contratos e lifecycle |
| Serviço | Unidade que oferece comportamento por contrato; sua camada deve ser declarada |
| Agente | Ator governado que decide ou coordena dentro de escopo e permissões |
| Skill | Conhecimento/procedimento versionado; não é executável automaticamente |
| Prompt | Instrução a modelo em contexto definido |
| Conhecimento | Fontes e conteúdo versionados, com proveniência, acesso e retenção |
| Ferramenta (Tool) | Operação invocável com executor, schema, permissões, efeitos e falhas |
| Executor | Runtime que efetivamente executa agente, tool ou skill executável |
| Capability | Resultado contratual oferecido por agente, tool ou serviço |
| Registry | Autoridade de catálogo para identidade, versão, owner, estado e relações |
| Workflow | Estados e transições auditáveis que compõem capacidades e operações |
| Integração | Relação governada com sistema externo ou outra fronteira |
| Adapter | Implementação que traduz contrato externo para porta interna |
| Gateway | Ponto governado de entrada/roteamento para uma classe de capacidades |
| Billing | Core de planos, assinaturas, uso faturável, entitlements, invoices, cobrança e pagamento |
| Finance & BI | Shared Service de receita analítica, custos, margem, orçamento, previsões e rentabilidade |
| Knowledge | Core de fontes, documentos, metadados, proveniência, versões, acesso, retenção e recuperação abstrata |
| Apex Intelligence | Shared Service de modelos, prompts, inferência, roteamento, avaliação, embeddings, geração e multimodalidade |
| Apex Growth | Shared Service de aquisição, CRM, conteúdo, lifecycle, vendas e atribuição |
| Tenant | Fronteira de isolamento de dados, execução, custo, logs e políticas |
| Organization | Entidade cliente/operacional que agrupa membros e responsabilidades; não é automaticamente tenant |
| Entitlement | Direito comercial/contratual de acesso ou quota; não é permissão de segurança |
| Operational | Estado autorizado após executor, permissões, telemetria, custo e validação comprovados |
| Intelligent Intake | experiência que recebe ativo/intenção, explica entendimento, confirma objetivo e roteia por contratos |
| Persona de Domínio | lente de especialidade usada para análise; não é agente nem executa |
| Business Studio | área funcional da empresa; não é Core, Produto ou runtime por definição |
| Agency | fase de entrega assistida usada para validar problema, valor, processo e economics |
| Platform | fase de internalização de padrões repetíveis e capacidades compartilhadas |
| SaaS | oferta padronizada e operável como software/serviço recorrente |
| Vision | classe de conhecimento que define propósito, direção e hipóteses, sem provar execução |
| Constitution | classe de princípios e limites máximos aprovados |
| Architecture | classe de decisões sobre responsabilidades, fronteiras e dependências |
| Business | classe de valor, receita, custo e operação empresarial |
| Products | classe de problema, público, domínio e oferta dos produtos |
| Knowledge | classe de fatos, referências e aprendizados com proveniência |
| Implementation | classe de artefatos executáveis e evidência técnica; documentação isolada não basta |

O ciclo oficial completo está em [Agent Lifecycle](../agents/AGENT_LIFECYCLE.md). As fronteiras estão nos [ADRs](../architecture/adr/) e as leis em [KERNEL_CONSTITUTION.md](../kernel/KERNEL_CONSTITUTION.md).

**Risco:** uso coloquial recriar ambiguidade; documentos normativos devem referenciar este glossário.
