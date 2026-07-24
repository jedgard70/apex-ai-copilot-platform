# Glossário oficial proposto do Apex OS

**Versão:** 1.0.0
**Status:** proposto para aprovação; não altera decisões vigentes
**Data:** 2026-07-20

## Convenção

Usar o termo em português no texto normativo e preservar o identificador técnico em inglês quando ele fizer parte de contrato, código futuro ou nome próprio. Não usar “módulo”, “serviço”, “produto”, “capability”, “skill” e “agente” como sinônimos.

| Termo oficial | Definição | Não significa |
|---|---|---|
| Apex Global | Empresa responsável pelo ecossistema e por suas decisões empresariais | aplicação, produto ou runtime |
| Apex OS | Plataforma oficial compartilhada da nova geração; sua composição exata entre Core e Shared Services requer ADR | empresa ou produto vertical |
| Core | Conjunto mínimo de autoridades e invariantes compartilhados, independente de produtos | coleção irrestrita de funcionalidades comuns |
| Shared Service / Serviço compartilhado | Capacidade reutilizável exposta por contrato, com owner, SLO, custo e isolamento | biblioteca interna sem fronteira ou produto vertical |
| Produto | Oferta orientada a um público e problema de mercado, com dados, capabilities, entitlements e unit economics próprios | serviço compartilhado apenas porque pode ser vendido |
| Apex Intelligence | Serviço compartilhado proposto para gateway, avaliação, roteamento e governança de IA | todo o Core ou um modelo específico |
| Apex Growth | Serviço compartilhado definido pelo ADR-0005 para aquisição, CRM, lifecycle e atribuição; sua eventual oferta comercial separada exige nova fronteira | campanha isolada ou produto por presunção |
| Finance & BI | Serviço compartilhado analítico para custos, receita, margem e previsões | Billing, contabilidade societária ou Apex Accounting |
| Módulo | Unidade coesa dentro de uma camada, com fronteira, autoridade de dados, contrato, owner e ciclo de vida | pasta arbitrária |
| Domínio | Área de responsabilidade com linguagem, regras e autoridade próprias | diretório ou equipe por si só |
| Bounded context | Limite no qual um modelo e seus termos têm significado consistente | permissão para acesso direto entre bancos |
| Contrato | Interface versionada de API, evento, schema ou comportamento observável entre fronteiras | dependência em implementação interna |
| Capability / Capacidade | Resultado contratual que a plataforma declara poder oferecer, independentemente do executor específico | tool, skill ou marketing claim automaticamente operacional |
| Agent / Agente | Ator de software governado que decide ou coordena dentro de objetivo, escopo e permissões definidos | prompt isolado ou persona documental |
| Skill | Conhecimento ou procedimento versionado que orienta uma execução; pode não ser executável | agente operacional por definição |
| Prompt | Instrução fornecida a um modelo em determinado contexto | skill completa, agente ou prova de operação |
| Tool / Ferramenta | Operação invocável com schema, permissões, efeitos, erros e executor definidos | capability abstrata ou instrução textual |
| Executor | Runtime responsável por efetivamente executar agente, skill executável ou ferramenta | definição documental |
| Workflow | Definição auditável de estados, transições, entradas, saídas, retries e compensações | sequência informal de prompts |
| Registry / Registro canônico | Autoridade catalogadora de identidade, versão, owner, estado e contratos de uma classe de entidades | diretório de arquivos sem validação |
| Identity | Autoridade sobre identidades humanas ou de máquina e seus meios de autenticação | perfil vertical completo ou autorização |
| User / Usuário | Representação mínima de uma pessoa no contexto compartilhado | membro de toda organização automaticamente |
| Organization / Organização | Entidade cliente ou operacional que agrupa membros e responsabilidades | sinônimo automático de tenant |
| Tenant | Fronteira de isolamento aplicada a dados, execução, custos, logs e políticas | apenas um filtro de interface |
| Permission / Permissão | Direito de executar ação sobre recurso em contexto definido | entitlement comercial |
| RBAC | Modelo de autorização baseado em papéis, complementado por contexto e políticas quando decidido | autenticação ou plano de assinatura |
| Entitlement | Direito comercial/contratual de acesso ou quota decorrente de plano, compra ou concessão | permissão de segurança isoladamente |
| Billing | Autoridade operacional sobre clientes de cobrança, assinaturas, faturas e pagamentos | contabilidade geral ou BI |
| Audit / Auditoria | Registro de evidência de ações relevantes, protegido contra alteração e com retenção controlada | log de debug |
| Telemetry / Telemetria | Logs, métricas e traces usados para operação e confiabilidade | evidência jurídica imutável por padrão |
| Cost Registry | Registro versionado de rates e alocação de custos sobre eventos de uso | preço comercial final ou sistema contábil |
| Migração | Incorporação individual, avaliada e aprovada de conhecimento ou componente legado | cópia de diretório |
| Legado | Todo projeto, regra, skill, arquitetura ou componente anterior ao Apex OS, sem autoridade futura automática | conteúdo necessariamente inútil ou destinado a exclusão |
| Operacional | Estado respaldado por executor, permissões, telemetria, tratamento de falha e evidência repetível | documentado, proposto ou demonstrativo |
| Owner / Responsável | Papel accountable por decisões, risco e ciclo de vida de uma entidade | necessariamente autor do arquivo |
| SLI | Indicador medido de comportamento de serviço | meta ou compromisso |
| SLO | Objetivo interno mensurável para um ou mais SLIs | SLA contratual automaticamente |
| COGS | Custo direto para entregar e operar uma oferta | todo custo da empresa |
| CAC | Custo de aquisição de cliente segundo regra de atribuição aprovada | gasto total de marketing sem atribuição |
| LTV | Valor econômico esperado do relacionamento com cliente sob hipóteses declaradas | receita bruta vitalícia sem custos ou churn |

## Estados de ciclo de vida

Há conflito entre a skill oficial e `AGENT_STANDARD.md`; portanto, nenhum conjunto é ratificado por este glossário. Uma decisão normativa deve escolher nomes, significado, transições e evidências exigidas antes da implementação dos registries.
