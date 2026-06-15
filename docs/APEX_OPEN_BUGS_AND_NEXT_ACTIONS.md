APEX Open Bugs And Next Actions
===============================

Blockers and next actions (honest, ordered):

1. Corrigir build/preview do PR #24 se ainda estiver quebrado
   - Motivo: sem build/preview não é possível provar mudanças no fluxo UI/prod

2. Corrigir validate-vercel.mjs e validate-supabase-live.mjs por falta de `dotenv`
   - Motivo: validadores live exigem variáveis de ambiente para conectar a Vercel/Supabase

3. Corrigir fallback/idioma do productionConversationRouter
   - Motivo: validação validate-cp15x-h44 revelou problemas com respostas curtas/ambíguas em português

4. Provar upload PDF → "resuma este pdf" com conteúdo real
   - Motivo: extração e envio do conteúdo para o backend devem ser validados end-to-end

5. Provar geração DOCX real (ContractsPanel)

6. Provar export XLSX / integração SINAPI (BudgetPanel)

7. Provar IFC / web-ifc.wasm no browser com arquivo IFC real (IfcViewer, ifcWorker)

8. Provar H7 HTTP path com provider key (Local Worker / approval gated execution)

9. Provar Supabase remote round-trip (upload → storage → retrieval → file context preserved)

10. Separar claramente simulação de background agents / WebGPU da comunicação de produto
    - Motivo: evitar que demos/simulações confundam testes de produção

Notes on priority
- Highest priority: (1) build/preview reproducible locally and (2) M2 PDF real flow
- Next: (3) H7 proof with worker and keys, (4) Supabase round-trip, (5) DOCX/XLSX/IFC proofs
