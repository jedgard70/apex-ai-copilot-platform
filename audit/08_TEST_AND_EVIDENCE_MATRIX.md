# 08 — Matriz de testes e evidências

| Capability | Comando | Resultado 2026-07-20 | Prova/limite |
|---|---|---|---|
| Vitest | npm test -- --run | PASS: 11 arquivos, 116 testes | unidades; não E2E |
| Docs LIVE | npm run validate:docs-live | PASS: 83 caminhos | existência, não comportamento |
| DirectCut | npm run validate:directcut-pipeline | PASS | connector-ready e FFmpeg local |
| Supabase SQL | npm run validate:supabase-sql | PASS: 3/3, 95/95, 10/10 | contrato estático |
| Build | npm run build | BLOQUEADO | gravaria dist fora do escopo |
| E2E | npm run test:e2e | BLOQUEADO | browser e test-results |
| Owner/live connectors | — | BLOQUEADO | auth, serviço live/custo |

Descoberta: git status/remote/log/branch, git grep, rg, PowerShell, SHA-256. Nenhum deploy, commit, checkout, migration ou chamada paga.