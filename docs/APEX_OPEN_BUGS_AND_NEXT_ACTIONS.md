# APEX Open Bugs And Next Actions

Audit date: 2026-06-15

Branch: `feature/image-generation-connector`

Commit audited: `7a788f2`

## Ordered Fix Plan

### A. UX attach / composer / side panel

Status: open.

Bug:

- Upload currently executes automatically because `handleFile()` sets the active file and calls `askCopilot('', intake)`.
- Composer does not reliably clear stale attachment context after send.
- Side panels can squeeze chat, and more than one workflow can feel active too early.

Acceptance:

- Attach only places a pending file in the composer.
- Execution happens only after Enter/send.
- After send, composer text and active attachment clear deterministically.
- Old PDF/file cannot be reused accidentally.
- One active drawer/panel is visible at a time.
- Chat keeps a usable minimum width on desktop and mobile.

10. Separar claramente simulação de background agents / WebGPU da comunicação de produto — Motivo: evitar que demos/simulações confundam testes de produção

Notes on priority

- Highest priority: (1) build/preview reproducible locally and (2) M2 PDF real flow
- Next: (3) H7 proof with worker and keys, (4) Supabase round-trip, (5) DOCX/XLSX/IFC proofs
