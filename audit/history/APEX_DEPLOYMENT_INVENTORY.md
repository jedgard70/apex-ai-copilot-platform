# Inventário de Deployments Apex

- Versão: 1.0.0
- Status: auditoria local sem consulta externa
- Data: 2026-07-22

## Ambientes e processos

| Aplicação | Caminho | Branch/commit | Comando/porta declarada | Deployment observado | Estado |
|---|---|---|---|---|---|
| Apex OS | `D:/AI-constr/apex-os` | `continuity/commercial-flow` / `a702654` | `npm run start:app`; `PORT` ou 3010 | somente runtime local; PID não promovido a evidência | FUNCTIONAL_LOCAL |
| Apex AI Copilot | `D:/AI-constr/apex-ai-copilot-platform` | `main` / `a20bcc1` | Vite/Node/Electron; docs alegam 3000 | workflows Vercel/Electron existem; estado remoto não consultado | LEGACY |
| ACIP histórico | `D:/AI-PLATAFORM/AI-Construction-Intelligence-Platform` | `main` / `ae99609` | package scripts não executados | workflows production/preview/CI existem | LEGACY |
| Apex AI assets | `D:/APEX AI` | `main` / `c40f907` | não identificado como app única | UNKNOWN | LEGACY |
| Accounting | `D:/Apex-Accounting` | sem Git raiz | múltiplos subprojetos | UNKNOWN | LEGACY |

Não foram iniciados/parados processos, alterados envs, consultados dashboards, executados deploys ou testadas URLs de produção. “Último deploy” permanece UNKNOWN.

## Configuração do Apex OS

- Runtime: Node >=24, TypeScript, servidor `node:http`.
- Build: `npm run build`; start carrega `.env.local` com `--env-file-if-exists`.
- Banco/auth: Supabase por adapters, condicionado às variáveis server-side.
- Storage de geração: filesystem local sob custódia Apex; storage remoto não implementado.
- Provider de geração: fal.ai, protegido por flag/policy/key/model/storage.
- Observabilidade: contratos e records existem; operação centralizada/alertas não comprovados.
- CI/CD do repositório atual: não foi encontrado workflow próprio no censo de arquivos.

## Riscos de release

1. Estado de negócio em memória impede escala horizontal e recuperação.
2. Filesystem local não é storage durável para serverless/containers efêmeros.
3. Ausência de pipeline CI/CD próprio e gates de migration/deploy.
4. Variáveis do legado (`VITE_*`) não são as mesmas do servidor Apex OS (`SUPABASE_*`).
5. Sem runbook de rollback, backup/restore, rotação de segredos e incidente.
6. Testes locais não substituem smoke de staging isolado.

## Gate mínimo

Staging identificado; migrations versionadas e verificadas; storage durável; health/readiness; secrets por ambiente; CI com typecheck/lint/test/security; deploy imutável; rollback ensaiado; observabilidade; smoke da jornada sem cobrança real; aprovação do Owner.
