# Inventário de Agentes, Skills e Prompts Apex

- Versão: 1.0.0
- Status: censo físico; operação não presumida
- Data: 2026-07-22

## Censo de arquivos `SKILL.md`

| Root | Quantidade bruta |
|---|---:|
| `D:/APEX AI` | 2.024 |
| `D:/apex-marketing-squads` | 2.021 |
| `D:/AI-constr/apex-ai-copilot-platform` | 66 |
| `D:/AI-constr/apex-os` | 1 |
| `D:/AI-PLATAFORM/AI-Construction-Intelligence-Platform` | 1 |
| `D:/SKILLS_APEX` | 1 |
| `D:/Apex-Accounting` | 0 |
| `D:/Prompts J Edgard` | 0 |
| **Total físico bruto** | **4.114** |

O total não representa 4.114 capacidades únicas. A proximidade 2.024/2.021 é forte sinal de espelhamento; hashes e identidade semântica ainda precisam de deduplicação.

## Classes canônicas

| Entidade | Critério | Estado observado |
|---|---|---|
| Skill | instrução/conhecimento com metadados | milhares catalogados/legados |
| Prompt | texto parametrizável | distribuído em acervos e no ArchVis |
| Agent | objetivo + executor + ferramentas + permissões + custo + telemetria + falhas + teste | nenhum agente Apex OS classificado `operational` |
| Tool | contrato de ação invocável | registries especificados; poucos executores atuais |
| Workflow | composição versionada e observável | schemas/migrations existem; operação não comprovada |
| Capability | valor entregue por contrato | `architectural-humanization` é a única integrada ponta a ponta no OS atual |

## Evidência atual no Apex OS

- Especificações: `agents/*` e `governance/AGENT_STANDARD.md`.
- Persistência proposta: registries em migration `0016` e assets em `0017`.
- Descoberta/roteamento: `BehaviorRepository.ts`, `CapabilityRouter.ts`.
- Execução governada: `ExecutionOrchestrator.ts`, policy, idempotency, ledger e telemetry.
- Não há um catálogo validado de agentes com executor, permissões, custo, telemetria e testes completos; portanto a contagem operacional é **0**.

## Plano de consolidação

1. Inventariar metadados e hashes sem copiar conteúdo ao OS.
2. Deduplicar por hash, origem, licença e equivalência semântica.
3. Separar prompt/skill/tool/agent/workflow/capability.
4. Avaliar licença, segredo embutido, risco e custo.
5. Promover apenas itens aprovados ao registry canônico.
6. Exigir executor e teste antes de `implemented`; telemetria/custo/validação antes de `operational`.
