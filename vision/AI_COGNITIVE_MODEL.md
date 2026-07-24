# Modelo Cognitivo de IA
**Versão:** 1.0.0 | **Status:** visão conceitual; nenhuma persona é agente operacional | **Data:** 2026-07-20

## Separação oficial

| Conceito | Papel |
|---|---|
| Persona | perspectiva de domínio e estilo de análise; não executa |
| Agente | ator governado com objetivo, executor, permissões e lifecycle |
| Executor | runtime que realiza a execução |
| Workflow | estados/transições que coordenam trabalho |
| Tool | operação invocável com efeitos e schema |
| Capability | resultado contratual oferecido por agente, tool ou serviço |

## Personas legadas reinterpretadas

As antigas 13 designações são **Domain Expert Personas**: Engenharia Civil, Arquitetura, Estruturas, Orçamento, Gestão de Obra, Mercado, Vendas, Investimentos, Compliance, Automação, Conselho Executivo, Simulação e Coordenação Sistêmica. “Construction AGI” é renomeada conceitualmente como Coordenação Sistêmica para não alegar inteligência geral.

Personas fornecem lentes, critérios e perguntas; não recebem status `implemented`, `validated` ou `operational`. Um futuro agente pode usar uma ou mais personas somente após registro, executor, ferramentas, permissões, custo, telemetria e avaliação.

## Coordenação

Raciocínio multi-perspectiva deve expor conflitos, fontes, incerteza e decisão humana. Não simular consenso nem atribuir credenciais profissionais inexistentes.

**Riscos:** antropomorfismo, autoridade falsa, multiplicação de prompts como agentes e custo de orquestração.
