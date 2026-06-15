APEX Module Audit
=================

Status legend (use these tags exactly):
- IMPLEMENTADO
- VALIDADO
- COMPROVADO
- SIMULADO
- QUEBRADO
- NÃO PROVADO

Audit per module / checkpoint
-----------------------------

H1–H22: Implementação geral → ver código e scripts de validação.

M2 — PDF upload / extraction
- Status: VALIDADO
- Observação: extração e código implementado (pdfExtractor). Fluxo real upload→extração→resumo não comprovado em preview.

M3 — DOCX generation
- Status: VALIDADO
- Observação: ContractsPanel e export estão implementados, geração DOCX real ainda precisa prova.

M5 — XLSX / SINAPI
- Status: VALIDADO
- Observação: BudgetPanel implementado, export XLSX e integração SINAPI reais não comprovadas.

M6 — IFC / BIM / 3D
- IfcViewer: VALIDADO (não comprovado com IFC real)
- ifcLoader / ifcWorker: VALIDADO (compilam, não comprovados no browser com arquivos IFC reais)

Background agents
- Status: SIMULADO
- Observação: backgroundTasksConnector e AgentsPanel são camadas demonstrativas/simuladas.

Vercel / Supabase live validators
- Status: QUEBRADO (local validator scripts dependem de dotenv/keys)
- Observação: validate-vercel.mjs e validate-supabase-live.mjs falham por falta de credenciais/variáveis de ambiente.

Supabase persistence (BIM, files)
- Status: VALIDADO (SQL draft)
- Observação: migrações existem, mas round-trip e storage remoto não comprovados.

Local Worker
- Status: VALIDADO (não comprovado em execução real completa)
- Observação: local-worker/server.mjs presente; health/status paths retornam availability when configured.

MCP stdio
- Status: FOUNDATION
- Observação: suporte inicial de stdio/agent, não comprovado em ambiente real.

WebGPU / GPU UI
- Status: SIMULADO
- Observação: WebGPU usage appears as UI/demo; not a production inference backend.

Local LLM / OPENAI_API_BASE / Ollama / vLLM
- Status: NÃO PROVADO
- Observação: OPENAI_API_BASE exists in code, but Ollama/vLLM local providers not proven.

pgvector
- Status: FOUNDATION
- Observação: pgvector migration code present, not proven against a remote instance.

Revit/BIM connector
- Status: VALIDADO (knowledge-only)
- Observação: connector route exists; live integration requires connector keys and runtime.

Recommendations
---------------
1. Mark clearly which UI panels are simulation-only in the app and docs.
2. Prepare a test environment with required env vars for live validators (LOCAL_WORKER_URL/TOKEN, SUPABASE keys, VERCEL token, OPENAI keys).
3. Execute manual browser flows for M2/M3/M5/M6 and record evidence.
