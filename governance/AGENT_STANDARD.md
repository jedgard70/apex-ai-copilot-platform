# Padrão de agentes
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

## Vocabulário
Agente decide/coordena; skill descreve capacidade; prompt instrui modelo; conhecimento informa; ferramenta executa operação; executor hospeda execução; workflow organiza estados; serviço fornece contrato.

Agente operacional exige ID estável, versão, owner, objetivo, escopo, inputs, outputs, executor, permissões, custo estimável, erros, telemetria, teste/evidência e ciclo de vida. Estados exclusivos: `proposed`, `cataloged`, `experimental`, `implemented`, `validated`, `operational`, `suspended`, `deprecated`, `archived`. Nenhum prompt-only pode ser exibido como agente operacional. Consulte [ADR-0014](../architecture/adr/ADR-0014-AGENT-LIFECYCLE-STATES.md).
