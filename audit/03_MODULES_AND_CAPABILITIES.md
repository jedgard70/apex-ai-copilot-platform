# 03 — Módulos e capabilities

| Capability | Evidência | Status real |
|---|---|---|
| Chat/Copilot | api/copilot/chat.mjs, src/main.tsx | implementado/parcialmente validado |
| Intake | fileIntake.ts | implementado |
| PDF textual | pdfExtractor.ts | implementado, sem OCR |
| IFC viewer | ifcWorker.ts, IfcViewer.tsx | real, órfão |
| BIM panel | Bim3DPanel.tsx | mock/interface |
| BIM clash | server/service/bimClash.mjs | CRUD de dados fixos |
| APS/Revit | aps/translate.mjs, revitBimConnector.mjs | connector-ready |
| ArchVis | ArchVisPanel/generate-image | implementado, FAL externo |
| DirectCut | FFmpeg/endpoints | local validado, IA condicional |
| Export/package | exportCenter/projectPackage | implementado/parcial |
| Stripe/Supabase | endpoints/migrations | implementado, live não testado |

Divergência crítica: BIM/clash são declarados LIVE, mas Bim3DPanel contém “Mockup 3D Representation”, árvore fixa e “3 Issues”; bimClash inicializa oito conflitos fixos. Confiança alta.

validate:docs-live confirma 83 caminhos, não entrada, saída, wiring, ausência de mock ou E2E.