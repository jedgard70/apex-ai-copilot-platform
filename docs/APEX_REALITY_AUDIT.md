# APEX Reality Audit

Checkpoint: CP-LIVE-2  
Audit date: 2026-06-19  
Branch audited: `feature/image-generation-connector`

## Resumo executivo

Status geral da plataforma: **YELLOW**.

O repositório tem base técnica funcional, mas produção e integrações externas ainda não estão provadas ponta a ponta neste checkpoint. A principal melhoria desta fase é separar claramente o que já é real, o que ainda depende de prova e o que está apenas empacotado como skill sem integração operacional.

## Evidências coletadas neste checkpoint

| Evidência | Resultado |
| --- | --- |
| `node scripts/execute-skill-action.mjs docsedgard-skill summary` | **GREEN** — comando executou com inventário real de `D:\AI Jedgard\skill` e gerou resumo com 3449 artefatos. |
| `node scripts/execute-skill-action.mjs marketing-generate baseline-audit` | **GREEN** — gerou `D:\AI-constr\EBOOK_APEX_HOTMART\campaigns\baseline-audit_plan.md`. |
| `node scripts/execute-skill-action.mjs revit-generate baseline_audit` | **GREEN** — gerou `dist\revit-boilerplates\baseline_audit.pushbutton\script.py`. |
| `node scripts/execute-skill-action.mjs code-analyze` | **GREEN** — ação local executou e listou arquivos grandes/TODOs. |
| `node scripts/execute-skill-audit.mjs` | **GREEN/PARCIAL** — confirmou Local Worker online, Revit MCP offline e `roadmapExists: false` antes desta fase. |
| `npx tsc -b` | **GREEN** |
| `npm test` | **GREEN** — 82 testes passaram. |

## Taxonomia oficial aplicada

| Status | Uso nesta auditoria |
| --- | --- |
| **REAL 100%** | Existe wiring real e evidência executada neste checkpoint. |
| **IMPLEMENTADO MAS NÃO COMPROVADO** | Código existe, mas falta prova em preview/produção ou no runtime alvo. |
| **SIMULADO** | UX/demo/stub sem backend real equivalente comprovado. |
| **QUEBRADO** | Há falha atual de execução ou contrato. |
| **FALTANDO INTEGRAÇÃO** | O artefato existe, mas ainda não foi ligado ao runtime principal. |
| **DEPENDE DE CREDENCIAL** | O fluxo depende de segredo ou ambiente externo não comprovado agora. |

## Matriz oficial por superfície

| Superfície | Status | Evidência | Observação objetiva |
| --- | --- | --- | --- |
| Chat/Copilot principal | **IMPLEMENTADO MAS NÃO COMPROVADO** | `server.mjs`, `api\copilot\chat.mjs`, testes locais verdes | Routing e respostas foram ajustados, mas a conversa em produção ainda não foi provada neste checkpoint. |
| Upload + intake de arquivos | **IMPLEMENTADO MAS NÃO COMPROVADO** | código e testes locais | Falta prova real em Preview/produção com evidência HTTP/browser. |
| PDF upload/extraction/resumo (M2) | **IMPLEMENTADO MAS NÃO COMPROVADO** | `pdfExtractor`, fluxo local e docs existentes | Falta prova ponta a ponta em ambiente real. |
| DOCX export (M3) | **IMPLEMENTADO MAS NÃO COMPROVADO** | componentes e export code presentes | Falta prova real de geração no runtime alvo. |
| XLSX/SINAPI (M5) | **IMPLEMENTADO MAS NÃO COMPROVADO** | código e testes existentes | Falta prova real com arquivo/export no ambiente final. |
| IFC/BIM/3D (M6) | **IMPLEMENTADO MAS NÃO COMPROVADO** | viewer/loader/worker no código | Falta prova com arquivo IFC/GLB real em preview/produção. |
| Background agents | **SIMULADO** | `backgroundTasksConnector`, `AgentsPanel` | Camada demonstrativa; não marcar como automação real completa. |
| WebGPU / GPU UI | **SIMULADO** | componentes/UI | Não é backend de inferência comprovado. |
| Local Worker | **IMPLEMENTADO MAS NÃO COMPROVADO** | auditoria de skills indicou `ONLINE` na porta `8787` | Há sinal local, mas os fluxos críticos ainda não foram auditados ponta a ponta. |
| Revit MCP | **QUEBRADO** | auditoria de skills: `OFFLINE`, `fetch failed` | Não tratar como integração ativa no estado atual. |
| GitHub PR/checks | **DEPENDE DE CREDENCIAL** | docs históricas + CLI disponível | Precisa de PR/checks observados neste checkpoint para subir de status. |
| Vercel Preview/produção | **DEPENDE DE CREDENCIAL** | `CP15F_VERCEL_PRODUCTION_DEPLOYMENT_REPORT.md` | Existe prova histórica de deploy, mas o Preview do próximo PR ainda não foi verificado. |
| Supabase Auth/RLS/storage | **DEPENDE DE CREDENCIAL** | migrations/docs existentes | Falta round-trip remoto comprovado neste checkpoint. |
| Skills knowledge injection (`src\lib\apexSkillKnowledge`) | **REAL 100%** | imports e seleção por domínio no runtime | O catálogo de conhecimento já entra no runtime local por código. |
| Catálogo `skills/index.json` | **QUEBRADO** antes desta fase | arquivo apontava catálogo incompleto | Deve ser corrigido para virar catálogo canônico sem path ambíguo. |

## Matriz oficial das skills

| Skill canônica | Status | Tipo | Evidência |
| --- | --- | --- | --- |
| `skills/SKILLS_APEX/apex-global-orchestrator-unificada/SKILL.md` | **IMPLEMENTADO MAS NÃO COMPROVADO** | governança/orquestração | Existe no repositório; falta prova de carregamento universal automático. |
| `skills/imported/docsedgard_reintegrada/SKILL.md` | **REAL 100%** | skill operacional + manifesto | Comando `docsedgard-skill summary` executado com sucesso. |
| `skills/imported/marketing_dispatcher/SKILL.md` | **FALTANDO INTEGRAÇÃO** | wrapper de script | O wrapper existe, mas o runtime comprovado usa `marketing-generate`, não o wrapper importado diretamente. |
| `skills/imported/create_revit_checklist_pdf/SKILL.md` | **FALTANDO INTEGRAÇÃO** | wrapper de script | O wrapper existe; falta binding operacional real para o script importado. |
| `skills/imported/autonomous_sales_agent/SKILL.md` | **FALTANDO INTEGRAÇÃO** | wrapper de script | Existe como pacote importado, sem execução real comprovada no runtime. |
| `skills/imported/skills_index/SKILL.md` | **IMPLEMENTADO MAS NÃO COMPROVADO** | inventário/referência | Wrapper presente; uso é documental. |
| `skills/imported/README/SKILL.md` | **IMPLEMENTADO MAS NÃO COMPROVADO** | wrapper documental | Wrapper presente; não é ferramenta operacional. |
| `docs/APEX_PLATFORM_ENGINEERING_SKILL.md` | **REAL 100%** | skill de conhecimento | Contexto refletido em `src\lib\apexSkillKnowledge\platformEngineering.ts`. |
| `docs/APEX_REVIT_CUSTOMIZATION_SKILL.md` | **REAL 100%** | skill de conhecimento | Contexto refletido em `src\lib\apexSkillKnowledge\revitCustomization.ts`. |
| `docs/APEX_WINDOWS_CARE_CODING_SKILL.md` | **REAL 100%** | skill de conhecimento | Contexto refletido em `src\lib\apexSkillKnowledge\windowsCare.ts`. |
| `docs/APEX_INTERNATIONAL_MARKET_STRATEGY.md` | **REAL 100%** | skill de conhecimento | Contexto refletido em `src\lib\apexSkillKnowledge\internationalMarketStrategy.ts`. |
| `docs/APEX_CONVERSA_REAL_SKILL.md` | **IMPLEMENTADO MAS NÃO COMPROVADO** | skill comportamental | Documento existe e regras foram espelhadas no chat, mas não há loader dedicado comprovado. |

## Conclusões objetivas

1. A plataforma não está pronta para ser chamada de totalmente comprovada.
2. O repositório já contém skills reais de conhecimento e pelo menos uma skill operacional comprovada (`docsedgard_reintegrada`).
3. Os wrappers importados de scripts ainda precisam de integração explícita ao runtime principal para subir de status.
4. GitHub, Vercel e Supabase continuam bloqueados por evidência externa pendente neste checkpoint.
5. A documentação-mãe precisava existir e ser atualizada antes de qualquer novo selo de prontidão.
