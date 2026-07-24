# 01 — Inventário de repositórios e pastas

Data: 2026-07-20. Somente leitura fora de audit/.

| Projeto | Caminho | Git/branch | Stack | Estado |
|---|---|---|---|---|
| Apex AI Copilot | D:\AI-constr\apex-ai-copilot-platform | jedgard70/apex-ai-copilot-platform; main a20bcc1 | React/Vite/Node/Electron/Supabase | principal |
| AI Construction Platform | D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform | jedgard70/AI-Construction-Intelligence-Platform; main ae99609 | Next/Three/web-ifc | legado com ativos |
| APEX-AI | D:\APEX AI | jedgard70/APEX-AI; main c40f907 | Python/Electron/GGUF/skills | runtime local |
| Accounting | D:\Apex-Accounting | Git raiz não confirmado | React/TS/Node | produto separado |
| Marketing squads | D:\apex-marketing-squads | Git não confirmado | skills | espelho exato |

Volumes filtrados: principal 1.797 físicos/1.860 versionados, 100 API, 168 server, 66 skills; legado 787; APEX-AI 9.139 e 2.021 skills; Accounting 137; Marketing 6.877 e 2.021 skills.

Já estavam modificados no principal src/__tests__/api-analyze.test.ts e api-plan.test.ts. Outros worktrees também estavam sujos. A auditoria não tocou neles.

Branches: principal possui muitas locais; legado possui dezenas remotas com storage, CRM, RLS, revenue engine, skill registry e Copilot/IFC. Nome não prova implementação; exige diff antes de arquivar.

Riscos por nome, sem abrir conteúdo: key.txt, D:\APEX AI\.env_source_copy, textos de login/Supabase no Accounting, .env.vercel.* no legado e perfis de navegador/WhatsApp. Confiança alta para presença, nenhuma sobre conteúdo.