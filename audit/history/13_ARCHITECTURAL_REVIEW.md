# Revisão arquitetural da fundação — Sprint 0.1

**Versão:** 1.0.0
**Status:** concluída com bloqueios documentais
**Data:** 2026-07-20

## Escopo e método

Foram revisados os 42 documentos Markdown existentes em `company/`, `architecture/`, `architecture/adr/`, `governance/`, `migration/` e `README.md`. Também foi verificada a existência de conteúdo em `products/`, `agents/`, `ai/`, `business/`, `marketing/` e `roadmap/`.

A análise foi exclusivamente documental e estática. Nenhum código, dependência, serviço externo ou decisão arquitetural foi criado ou alterado.

## Resultado executivo

A fundação apresenta princípios coerentes de isolamento, evidência, segurança, custo e migração controlada, mas ainda não satisfaz o gate de aprovação constitucional. Os seis domínios documentais que conectariam arquitetura, produtos e negócio estão vazios. Isso impede validar coerência comercial, fronteiras de IA, arquitetura de agentes, Growth e roadmap.

| ID | Severidade | Inconsistência | Documentos afetados | Recomendação |
|---|---|---|---|---|
| AR-01 | Alta | `products/`, `agents/`, `ai/`, `business/`, `marketing/` e `roadmap/` não contêm documentos | README e seis diretórios | Concluir a documentação prevista na Sprint 0 antes da Sprint 1 |
| AR-02 | Alta | Apex Growth é listado como produto e definido por ADR como Shared Service | `README.md`, `company/APEX_CHARTER.md`, `architecture/SHARED_SERVICES.md`, ADR-0005 | Decidir se Growth é serviço compartilhado, produto comercial ou ambos com bounded contexts distintos |
| AR-03 | Alta | `Capability Registry` depende de `Products/Agents`, invertendo a regra de que o Core não depende de produtos | `architecture/CORE_MODULES.md`, `architecture/APEX_OS.md`, ADR-0002 | Definir contratos de registro submetidos pelos produtos sem dependência do Core sobre implementações verticais |
| AR-04 | Alta | `Entitlements` declara dependência de `Products`; `Cost Registry`, de `AI` | `architecture/CORE_MODULES.md` | Substituir dependências de implementação por contratos/eventos neutros ou reclassificar módulos mediante ADR |
| AR-05 | Alta | Ordem proposta da Sprint 1 inicia Agent Registry antes de Capability e Tool Registry, embora o catálogo diga que Agent Registry depende de ambos | missão Sprint 0.1, `architecture/CORE_MODULES.md` | Resolver o grafo e registrar a ordem em ADR/roadmap antes da implementação |
| AR-06 | Média | Fronteira entre Apex OS, Core e Shared Services não é uniforme | `README.md`, `architecture/APEX_OS.md`, `architecture/SYSTEM_CONTEXT.md`, skill oficial | Fixar se “Apex OS” inclui Core + Shared Services ou se Shared Services são irmãos externos |
| AR-07 | Média | Estados de agentes são incompatíveis | skill oficial, `governance/AGENT_STANDARD.md` | Adotar um único vocabulário de ciclo de vida e transições permitidas |
| AR-08 | Média | Billing, Finance & BI, Cost Registry e contabilidade vertical têm limites insuficientes | `architecture/CORE_MODULES.md`, `architecture/SHARED_SERVICES.md`, ADR-0006 | Criar ADR de fronteiras financeiras e autoridade de dados |
| AR-09 | Média | Workflow aparece como módulo do Core sem decisão que o diferencie de orquestração de agentes/produtos | `architecture/CORE_MODULES.md`, padrões de agentes/workflows | Criar ADR sobre workflow engine, definições verticais e execução |
| AR-10 | Média | Notifications no Core sobrepõe Communications em Shared Services | `architecture/CORE_MODULES.md`, `architecture/SHARED_SERVICES.md` | Separar preferência/consentimento, solicitação de entrega e transporte por contratos explícitos |
| AR-11 | Média | Knowledge e Memory estão no Core sem justificativa suficiente contra Apex Intelligence | `architecture/CORE_MODULES.md`, `architecture/SHARED_SERVICES.md` | Decidir por ADR quais dados são autoridades comuns e quais são capacidades de IA |
| AR-12 | Média | Apex Studio aparece como produto inicial, mas não há catálogo, modelo de negócio nem presença na ordem declarada para a próxima fase | Charter, README, skill oficial, missão Sprint 0.1 | Confirmar seu estado: proposto, adiado ou removido do catálogo inicial |
| AR-13 | Média | A skill oficial ainda afirma que uma skill legada “prevalece” em seu workspace, expressão incompatível com a governança oficial única | skill oficial, ADR-0007 | Em uma sprint de correção aprovada, reformular como ausência total de autoridade sobre decisões futuras |
| AR-14 | Baixa | Uso misto de termos em português e inglês sem política lexical | múltiplos documentos | Aprovar o glossário e convenção de linguagem |
| AR-15 | Baixa | ADRs 0001–0006 têm títulos sem o prefixo/ID no corpo e versões diferentes do ADR-0007 | `architecture/adr/` | Uniformizar apresentação sem alterar decisões |

## Módulos duplicados ou sobrepostos

- **Apex Growth × Produto Growth:** duplicidade nominal e de classificação.
- **Notifications × Communications:** autoridade de consentimento e entrega não separada.
- **Cost Registry × Finance & BI × Billing:** medição, preço, faturamento e análise ainda se cruzam.
- **Knowledge/Memory × Apex Intelligence:** persistência governada e inteligência aplicada não têm limite formal.
- **Workflow × agentes/produtos:** definição, execução e lógica vertical ainda não foram particionadas.

## Dependências e fronteiras

A direção pretendida é `Core → Shared Services → Produtos`, entendida como permissão de consumo: Produtos consomem Shared Services/Core, e Shared Services consomem Core. A notação do `MODULE_STANDARD.md` pode ser lida como direção de dependência oposta; o glossário desta auditoria remove essa ambiguidade, mas a documentação normativa ainda precisa ser corrigida mediante aprovação.

O catálogo do Core contém dependências nominadas como `Products`, `Agents` e `AI`. Enquanto representarem implementações externas, são violações do ADR-0002. Se representarem apenas contratos ou eventos de submissão, isso precisa estar explícito.

## Diagramas Mermaid

Os três diagramas encontrados têm cercas Markdown balanceadas e sintaxe básica coerente por inspeção estática. Não foi executado renderizador Mermaid. O diagrama de contexto não resolve a fronteira de implantação entre Apex OS e Shared Services, reproduzindo a ambiguidade AR-06.

## Critério de aceite

**Não atendido.** Existem achados de severidade Alta e documentos obrigatórios ausentes. A Constituição não deve ser declarada aprovada e a Sprint 1 não deve começar até a remediação documental e nova verificação do gate.

## Confirmações

- Nenhum código foi criado.
- Nenhuma funcionalidade foi adicionada.
- Nenhuma decisão arquitetural foi alterada.
- Nenhum arquivo legado foi modificado.
- Nenhum deploy ou acesso externo foi executado.
