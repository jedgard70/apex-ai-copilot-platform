# Apex Open Bugs And Next Actions

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

### B. M2 PDF pipeline

Status: open.

Bug:

- PDF can appear as 0 bytes or stale.
- Summary requests can run before extraction is finished.
- Extracted context is not guaranteed to reach the Copilot.
- Upload fallback can still say "You can upload a file..." instead of using the active file.

Acceptance:

- PDF attach remains pending until user sends.
- Extraction has `idle/loading/ready/error` state.
- Page/text count is displayed.
- "Resuma" is blocked or queued until extraction is ready.
- Copilot receives the active extracted PDF context.
- English fallback is replaced/localized where the user is operating in Portuguese.

### C. M3 automatic DOCX

Status: open.

Bug:

- Contract/proposal/document intent opens Contracts Studio but does not generate the first draft automatically.

Acceptance:

- "Gerar proposta DOCX" opens Contracts Studio and auto-generates the first proposal draft.
- User is not told to click a second button for the initial draft.
- Draft includes project context, assumptions, scope, evidence labels, and disclaimer.
- DOCX-ready export path is present or clearly marked pending.

### D. M5 automatic XLSX / Budget

Status: open.

Bug:

- Budget/SINAPI/XLSX prompt can fall through to commercial fallback.
- Budget Studio does not automatically create the first estimate from chat intent.
- Real XLSX export and SINAPI source handling are not proven.

Acceptance:

- "Gerar orçamento XLSX com BDI" opens Budget Studio and creates an initial estimate.
- BDI, assumptions, pricing source, date/source confidence, and missing inputs are visible.
- XLSX-ready output is generated and validated.
- SINAPI is never faked: status must be uploaded source, live connector, or not-connected.

### E. M6 web-ifc.wasm

Status: open.

Bug:

- Real IFC loading failed with `Aborted(both async and sync fetching of the wasm failed)`.

Acceptance:

- `web-ifc.wasm` path is served correctly in dev and production.
- `LINS.ifc` renders real geometry.
- Viewer shows model metadata/object tree where available.
- Parser/loader errors are surfaced in the UI without fake geometry.

### F. Real execution via Local Worker / Operator

Status: open.

Bug:

- Controlled execution exists, but final "Apex executes" loop is not complete.
- Local Worker must be configured, reachable, and integrated with evidence logs.

Acceptance:

- Backend can read Local Worker health with token auth.
- Allowlisted actions run with fixed args, timeout, cwd restriction, and redacted output.
- Every execution returns command, status, exit code, duration, and evidence.
- Mutations require preview, approval, validation, and rollback.

### G. Revit MCP

Status: open.

Bug:

- Revit knowledge/routing exists, but no real Revit MCP bridge or Revit-side execution proof exists.

Acceptance:

- Local Revit bridge has explicit status endpoint.
- Apex can verify bridge availability without launching unsafe actions.
- Model check/export/plugin generation flows have approval and evidence.
- Revit-side tests are documented with exact version and command output.

## Additional Open Bugs

- Some fallbacks remain in English.
- Apex sometimes says it did not execute when the expected approved behavior is to execute.
- GitHub/Vercel/Supabase read-only status depends on env/network; write paths must remain approval-gated.
- Production API health is not fully proven even though the public domain responds.
- Remote Supabase restore is not implemented.
- Cron upgrade watcher route is missing.

## Highest-Leverage Next Checkpoint

Fix A first: attach/composer/side-panel UX.

Reason: M2, M3, M5, and M6 all depend on reliable active-file state, explicit send semantics, and one clear active workflow surface.

