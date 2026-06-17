# APEX Module Status — Continuity Package

Checkpoint: CP-LIVE-1

High level module status (short):

- PDF (M2): VALIDADO (extração implementada, não comprovada end-to-end)
- DOCX (M3): VALIDADO (geração implementada, DOCX real não comprovado)
- XLSX / SINAPI (M5): VALIDADO (export implementado, integração não comprovada)
- IFC / BIM (M6): VALIDADO (ifcWorker/IfcViewer compila, não comprovado com IFC real)
- Background agents: SIMULADO
- Vercel / Supabase live: QUEBRADO (validators depend on dotenv/keys)
- Supabase persistence: VALIDADO (migrations present), NÃO PROVADO (round-trip remoto)
- Local Worker: VALIDADO (server present), NÃO PROVADO (execution end-to-end)
- MCP stdio: FOUNDATION (initial), NÃO PROVADO
- WebGPU: SIMULADO (UI/demo)
- Local LLM interfaces (Ollama/vLLM): NÃO PROVADO
- pgvector: FOUNDATION (migrations), NÃO PROVADO

Actionable next steps are listed in the main continuity package and APEX_OPEN_BUGS_AND_NEXT_ACTIONS.md
