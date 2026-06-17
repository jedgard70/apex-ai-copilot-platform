# APEX Reality Audit

Date da auditoria: 2026-06-15
Branch auditada: fix/m2-m3-m5-m6-deep
Commit auditado (informado): 7ae36ab3e5c595c3ab79c7eaf53528f2eeffc14e

## Limitação importante

O executável `git` não estava disponível neste ambiente de auditoria. A branch e o commit acima foram inferidos a partir de metadados locais (arquivos .git). Não foi possível executar comandos git (`status`, `diff`, `commits`) aqui.

## Resumo objetivo

- Build: PASSOU (tsc + vite build)
- Validações locais que passaram (executadas durante a auditoria):
  - validate-cp15x-h5
  - validate-cp15x-h6
  - validate-cp15x-final
  - validate-cp15x-h43b

- Validações que falharam ou não provaram o fluxo:
  - validate-cp15x-h44: falhou inicialmente por fallback/idioma; parte corrigida durante auditoria e validação reexecutada
  - validate-vercel: falhou por falta de `dotenv` (dependências de ambiente não injetadas)
  - validate-supabase-live: falhou por falta de `dotenv`
  - validate-cp15x-h7: a via HTTP só foi parcialmente comprovada sem provider key; requer ambiente com chaves/worker para execução completa

## Observações centrais

- Muitos módulos estão implementados no código, porém não foram comprovados em preview ou produção (ainda precisam de validação de runtime real).
- Background agents e WebGPU aparecem no código como camadas de simulação/demonstração, não como execução de produção comprovada.
- Algumas integrações dependem de variáveis de ambiente (ex: LOCAL_WORKER_URL/TOKEN, VERCEL/SUPABASE keys, OPENAI_API_KEY). Sem essas variáveis, os validadores live/report falham ou retornam modo "unavailable".

## Matriz de módulo (resumo)

Formato: Módulo | Implementado | Validado | Comprovado Preview | Comprovado Produção | Simulado | Status | Evidência | Próxima ação

src/main.tsx | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado em browser) | build + validações locais | Provar em browser com upload real
src/styles.css | IMPLEMENTADO | VALIDADO | NÃO APLICÁVEL | NÃO APLICÁVEL | NÃO | VALIDADO | build | n/a
src/components/Bim3DPanel.tsx | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado com Supabase remoto) | build | Provar com Supabase remoto e IFC real
src/components/IfcViewer.tsx | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado com IFC real) | build | Testar com IFC real no browser
src/lib/ifcLoader.ts / src/lib/ifcWorker.ts | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado no browser) | build | Testar web-ifc.wasm no browser com IFC
src/lib/pdfExtractor.ts | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado no fluxo M2) | build | Provar fluxo upload→extração→resumo
src/components/ContractsPanel.tsx | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (DOCX real precisa prova) | build | Provar geração de DOCX real
src/components/BudgetPanel.tsx | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (XLSX/SINAPI precisa prova) | build | Provar export XLSX / integração SINAPI
src/components/AgentsPanel.tsx | IMPLEMENTADO | SIMULADO | NÃO APLICÁVEL | NÃO APLICÁVEL | SIMULADO | SIMULADO | Demo UI | Separar simulação de execução real
server/agent/backgroundTasksConnector.mjs | IMPLEMENTADO | SIMULADO | NÃO APLICÁVEL | NÃO APLICÁVEL | SIMULADO | SIMULADO | Simulação de agentes | Conectar agent runtime real (se aplicável)
api/copilot/chat.mjs | IMPLEMENTADO | VALIDADO (parcial) | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO parcial | validações H5/H6/H7 parciais | Provar rota HTTP com worker/keys
server/agent/apexOperatorRuntime.mjs | IMPLEMENTADO | VALIDADO (parcial) | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO parcial | validações H6/H7 (local) | Provar no ambiente com Local Worker
server/agent/productionConversationRouter.mjs | IMPLEMENTADO | QUEBRADO parcial | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | QUEBRADO parcial (fallback/idioma) | validate-cp15x-h44 mostrou problema inicial; corrigido parcialmente | Revisar mensagens/fallback e testar cenários reais de idioma curto/ambíguo
local-worker/server.mjs | IMPLEMENTADO | VALIDADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (não comprovado execução real) | build + modo read-only | Executar worker real e provar integrações
supabase/migrations/*.sql | IMPLEMENTADO | VALIDADO (rascunho SQL) | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | VALIDADO (SQL draft) | schemas presentes | Aplicar em instância Supabase de teste
scripts/validate-vercel.mjs | N/A | QUEBRADO | N/A | N/A | N/A | QUEBRADO (depends on dotenv) | erro: Cannot find package 'dotenv' | Fornecer env local ou instalar dotenv
scripts/validate-supabase-live.mjs | N/A | QUEBRADO | N/A | N/A | N/A | QUEBRADO (depends on dotenv) | erro: Cannot find package 'dotenv' | Fornecer env local ou instalar dotenv
webgpu (UI) | N/A | SIMULADO | NÃO COMPROVADO | NÃO COMPROVADO | SIMULADO | SIMULADO | UI-only simulation | Separar WebGPU demo da infra real
pgvector integration | N/A | FOUNDATION (esqueleto) | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | FOUNDATION | código de inicialização (supabase/migrations) | Provar com instância pgvector
MCP stdio | N/A | FOUNDATION | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | FOUNDATION | implementação inicial | Provar com ambiente MCP/desktop
OPENAI_API_BASE / Ollama / vLLM | N/A | NÃO PROVADO | NÃO COMPROVADO | NÃO COMPROVADO | NÃO | NÃO PROVADO | variável presente, provedores não testados | Provar com backends locais (Ollama/vLLM) ou configuração API

## Próximas ações recomendadas (breve)

- Executar testes manuais no browser para upload PDF → extração → resumo.
- Configurar variáveis de ambiente necessárias para validar Vercel/Supabase/Local Worker.
- Testar H7 HTTP path com provider key / Local Worker executando ações (commit/push pipeline).
- Separar componentes simulados e documentar claramente as áreas simuladas.
