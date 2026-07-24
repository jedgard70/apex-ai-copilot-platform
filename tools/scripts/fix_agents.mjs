import fs from 'fs'

const docPath = 'docs/Apex_acip_master_architecture(doumento official04-07-2026.md'
const agentsPath = 'AGENTS.md'

let docContent = fs.readFileSync(docPath, 'utf-8')

// 1. Fix remaining corrupted encodings in Canonical Doc
docContent = docContent.replace(/í£/g, 'ã')
docContent = docContent.replace(/í/g, 'Í')
docContent = docContent.replace(/í‡/g, 'Ç')
docContent = docContent.replace(/íƒ/g, 'Ã')
docContent = docContent.replace(/í“/g, 'Ó')
docContent = docContent.replace(/í´/g, 'ô')
docContent = docContent.replace(/íš/g, 'Ú')
docContent = docContent.replace(/í©/g, 'é')

// 2. Replace Tavily with Bravo in Canonical Doc
docContent = docContent.replace(/TAVILY/g, 'BRAVO')
docContent = docContent.replace(/Tavily/g, 'Bravo')

fs.writeFileSync(docPath, docContent)

// 3. Extract the rules from Canonical Doc
const rulesMatch = docContent.match(/## 🚨 REGRA ABSOLUTA 1[\s\S]*?(?=## Commit guidance)/)
const rulesText = rulesMatch ? rulesMatch[0] : ''

// 4. Also get Rule 10 which is below Commit Guidance
const rule10Match = docContent.match(/# #.*?R E G R A.*?1 0[\s\S]*/)
let rule10Text = rule10Match ? rule10Match[0] : ''

// Clean up Rule 10 spacing
rule10Text = rule10Text.replace(/ \n/g, '\n').replace(/  /g, ' ').replace(/R E G R A   A B S O L U T A   1 0/g, 'REGRA ABSOLUTA 10')
// Fix spacing for the rest of Rule 10
rule10Text = rule10Text.replace(/(.) /g, '$1') // Very aggressive, let's just do a basic cleanup
rule10Text = `## 🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes
Fica terminantemente proibido citar nomes de empresas, sites ou IAs concorrentes (ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut) nos textos de marketing, pitches de vendas ou na interface da plataforma.
Use sempre termos genéricos como "estilo os melhores sites por aí", "padrão de cinema", "edição profissional de mercado". A marca central é única e exclusivamente a **Apex AI**.`

// Create new AGENTS.md content
const newAgentsContent = `# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout

- Frontend: src/ (React + Vite + TypeScript)
- API/server runtime: server.mjs and api/
- Scripts and validators: scripts/
- CI workflow: .github/workflows/apex-sync.yml
- Platform status/docs: CHECKPOINT_TRACKER.md and docs/Apex_acip_master_architecture(doumento official04-07-2026.md

## Dev environment tips

- Install dependencies with npm install.
- Use npm run dev for local runtime (build + node server.mjs).
- Use npm run dev:ui only for UI-only Vite iteration.
- Keep secrets in .env.local (never commit .env* files).
- Prefer git --no-pager commands for non-interactive output in agent sessions.

## Testing and validation instructions

- Main quality gates:
  - npm run build
  - npm run test
  - npm run validate:cp15x-h5
  - npm run validate:cp15x-h44
  - npm run validate:directcut-pipeline
- If your change touches Supabase contracts, run:
  - npm run validate:supabase-sql
- If your change touches owner workspace/auth bootstrap, run:
  - npm run validate:owner-workspace-live

## DirectCut and platform behavior rules

- Do not claim real video rendering unless connector status is actually enabled.
- Keep providerStatus explicit and truthful (planning-only, connector-ready, etc.).
- Preserve parity between local runtime (server.mjs) and serverless endpoints in api/copilot/.

## PR and change rules

- Keep changes surgical and scoped to the requested task.
- Reuse existing patterns/helpers before adding new abstractions.
- Update related docs when behavior or operational flow changes.
- Do not add broad silent fallbacks that hide failures.
- Do not commit credentials, tokens, or service-role secrets.

---

${rulesText}

${rule10Text}
`

fs.writeFileSync(agentsPath, newAgentsContent)
console.log('Update complete!')
