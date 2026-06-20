# APEX Module Audit

Checkpoint: CP-LIVE-2

## Legenda oficial de status

- **REAL 100%**: Implementado e com evidência local ou remota verificável neste checkpoint.
- **IMPLEMENTADO MAS NÃO COMPROVADO**: Código e wiring existem, mas o fluxo real ainda não foi provado em preview/produção ou no runtime alvo.
- **SIMULADO**: Demonstração, stub ou UX sem backend real equivalente comprovado.
- **QUEBRADO**: Há falha conhecida de execução, caminho, runtime ou contrato.
- **FALTANDO INTEGRAÇÃO**: Arquivo/skill existe, mas ainda não está ligado ao runtime/catálogo operacional principal.
- **DEPENDE DE CREDENCIAL**: O fluxo precisa de segredo, conector ou ambiente externo que não foi comprovado neste checkpoint.

## Matriz oficial de auditoria por módulo

| Módulo / Superfície | Status | Evidência | Observação objetiva |
| --- | --- | --- | --- |
| **Chat/Copilot principal** | **IMPLEMENTADO MAS NÃO COMPROVADO** | `server.mjs`, `api/copilot/chat.mjs`, testes locais verdes | Routing e respostas foram ajustados para Live Agent, mas a conversa em produção com o novo fluxo ainda não foi provada neste checkpoint. |
| **Upload + intake de arquivos** | **IMPLEMENTADO MAS NÃO COMPROVADO** | Código em `src/main.tsx` e testes locais verdes | Falta prova real em Preview/produção com evidência HTTP/browser. |
| **M2 — PDF upload/extraction** | **IMPLEMENTADO MAS NÃO COMPROVADO** | `pdfExtractor`, fluxo local e docs existentes | Falta prova ponta a ponta em ambiente real. |
| **M3 — DOCX generation** | **IMPLEMENTADO MAS NÃO COMPROVADO** | Componentes e export code presentes | Falta prova real de geração no runtime alvo. |
| **M5 — XLSX / SINAPI** | **IMPLEMENTADO MAS NÃO COMPROVADO** | Código e testes existentes | Falta prova real com arquivo/export no ambiente final. |
| **M6 — IFC / BIM / 3D** | **IMPLEMENTADO MAS NÃO COMPROVADO** | `IfcViewer`, loaders e worker no código | Falta prova com arquivos reais em ambiente final (browser). |
| **Background agents** | **SIMULADO** | `backgroundTasksConnector`, `AgentsPanel` | Camada demonstrativa; não tratar como automação real completa. |
| **WebGPU / GPU UI** | **SIMULADO** | Componentes/UI | Não é backend de inferência comprovado. |
| **Local Worker** | **IMPLEMENTADO MAS NÃO COMPROVADO** | Auditoria de skills indicou `ONLINE` na porta `8787` | Há sinal local, mas os fluxos críticos ainda não foram auditados ponta a ponta. |
| **Revit MCP** | **QUEBRADO** | Auditoria de skills: `OFFLINE`, `fetch failed` | Não tratar como integração ativa no estado atual. |
| **Supabase schema/RLS/storage** | **DEPENDE DE CREDENCIAL** | Migrations e docs existentes | Falta round-trip remoto comprovado neste checkpoint. |
| **GitHub/Vercel live flow** | **DEPENDE DE CREDENCIAL** | Exige PR/checks/deploy observados agora | Depende das credenciais espelhadas no ambiente alvo; não assumir acesso sem prova. |

## Recomendações de governança

1. Manter a separação estrita de simulação de background agents e WebGPU para não confundir testes de produção.
2. Preparar ambiente com credenciais espelhadas nos repositórios para executar live validators.
3. Seguir a regra de PR obrigatório e checklist para cada novo avanço de status.

---

## Legacy Module Audit Backup (For Reference)

# APEX Module Audit

Status legend (use these tags exactly):

- IMPLEMENTADO
- VALIDADO
- COMPROVADO
- SIMULADO
- QUEBRADO
- NÃO PROVADO

## Audit per module / checkpoint

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

## Recommendations

1. Mark clearly which UI panels are simulation-only in the app and docs.
2. Prepare a test environment with required env vars for live validators (LOCAL_WORKER_URL/TOKEN, SUPABASE keys, VERCEL token, OPENAI keys).
3. Execute manual browser flows for M2/M3/M5/M6 and record evidence.
