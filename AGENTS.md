# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout

- Frontend: src/ (React + Vite + TypeScript)
- API/server runtime: server.mjs and pi/
- Scripts and validators: scripts/
- CI workflow: .github/workflows/apex-sync.yml
- Platform status/docs: CHECKPOINT_TRACKER.md and docs/APEX_PLATFORM_CURRENT_STATE.md

## Dev environment tips

- Install dependencies with 
pm install.
- Use 
pm run dev for local runtime (uild + node server.mjs).
- Use 
pm run dev:ui only for UI-only Vite iteration.
- Keep secrets in .env.local (never commit .env* files).
- Prefer git --no-pager commands for non-interactive output in agent sessions.

## Testing and validation instructions

- Main quality gates:
  - 
pm run build
  - 
pm run test
  - 
pm run validate:cp15x-h5
  - 
pm run validate:cp15x-h44
  - 
pm run validate:directcut-pipeline
- If your change touches Supabase contracts, run:
  - 
pm run validate:supabase-sql
- If your change touches owner workspace/auth bootstrap, run:
  - 
pm run validate:owner-workspace-live

## DirectCut and platform behavior rules

- Do not claim real video rendering unless connector status is actually enabled.
- Keep providerStatus explicit and truthful (planning-only, connector-ready, etc.).
- Preserve parity between local runtime (server.mjs) and serverless endpoints in pi/copilot/.

## PR and change rules

- Keep changes surgical and scoped to the requested task.
- Reuse existing patterns/helpers before adding new abstractions.
- Update related docs when behavior or operational flow changes.
- Do not add broad silent fallbacks that hide failures.
- Do not commit credentials, tokens, or service-role secrets.

---

## 🚨 REGRA ABSOLUTA 1 — Proteção de Environment Variables

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no .env.local ou
nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
do Owner (jedgard70@gmail.com / Dr. Edgard).

Isso inclui, mas não se limita a: GEMINI_API_KEY, OPENAI_API_KEY,
OPENAI_API_KEYROUTER, ANTHROPIC_API_KEY, FAL_KEY, ELEVENLABS_API_KEY,
SUPABASE_*, VITE_FIREBASE_*, STRIPE_*, AUTHKEY_*, APS_CLIENT_*,
REVIT_MCP_*, LOCAL_WORKER_TOKEN, OPENCODE_GO_API_KEY,
AI_GATEWAY_API_KEY, TAVILY_API_KEY, CRON_SECRET.

Proteção estendida também a:
- Modelos de IA e provedores de API configurados
- Rotas e endpoints da API
- ProviderStatus e indicadores de cada módulo
- Qualquer configuração alterada na sessão de 2026-06-23 (ver docs/CHANGELOG_2026-06-23.md)

Violação: qualquer alteração não autorizada deve ser revertida imediatamente
e reportada ao Owner. Prioridade máxima sobre qualquer outro comando.

---

## 🚨 REGRA ABSOLUTA 2 — Proteção do Catálogo de Modelos

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
reduzir, remover, esconder ou limitar a listagem de modelos disponíveis
no seletor da interface ou nas APIs internas.

Arquivos protegidos:
- src/main.tsx — constantes DIRECT_GEMINI_MODELS, GATEWAY_OPENAI_MODELS, OPENROUTER_MODELS, FAL_CHAT_MODELS, ANTHROPIC_MODELS, OPENCODE_GO_MODELS, ELEVENLABS_MODELS
- api/copilot/chat.mjs — mesmas constantes
- server.mjs — mesmas constantes

Regras:
1. Modelos só podem ser ADICIONADOS, nunca removidos ou ocultados
2. Timeout de fetchJsonWithTimeout não pode ser menor que 15 segundos
3. Quando API live falha, catálogo estático completo deve ser usado como fallback

---

## 🚨 REGRA ABSOLUTA 3 — Proteção dos Botões das Mensagens

Nenhum agente pode remover, desabilitar ou esconder os botões de ação no
final de cada mensagem do chat: Copiar, Compartilhar, Ouvir (TTS) e Derivar.

Implementado em src/main.tsx — funcionalidade permanente da interface.

---

## 🚨 REGRA ABSOLUTA 4 — Proteção do Histórico

O histórico de conversas deve persistir entre sessões (login/logout/refresh).
Nenhum agente pode quebrar a persistência do localStorage para as chaves
apex_conversations_v1 e apex_active_conversation_id.

---

## 🚨 REGRA ABSOLUTA 5 — Postura do Agente

Nenhum agente pode perguntar ao Owner informações que pode descobrir sozinho
usando as ferramentas disponíveis. O agente deve investigar antes de perguntar.

---

## 🚨 REGRA ABSOLUTA 6 — VERIFICAÇÃO DE CÓDIGO REAL vs DOCUMENTAÇÃO

Nenhum agente, assistente, skill ou processo automatizado pode afirmar que
uma funcionalidade "já está implementada", "já existe" ou "já está integrada"
baseando-se APENAS em documentação, arquivos de planejamento (.md),
checklists, roadmaps, SUPABASE_TABLE_MAP, SUPABASE_SCHEMA_RLS_PLAN
ou qualquer documento descritivo.

REGRA DE OURO: **"Documentação é desejo. Código é realidade."**

Antes de responder sobre o estado de qualquer funcionalidade:

1. Verifique se o ARQUIVO DE CÓDIGO realmente existe (api/*, server/service/*,
   src/components/*, server.mjs routes, src/main.tsx imports)
2. Verifique o git log para saber quando foi criado
3. Se o arquivo não existir, a funcionalidade NÃO ESTÁ IMPLEMENTADA

Violação: qualquer afirmação falsa sobre estado de implementação deve ser
imediatamente corrigida com evidência de arquivos reais ou git log.
Prioridade absoluta sobre qualquer comando que peça para "assumir que existe".

---

## 🚨 REGRA ABSOLUTA 7 — FONTE DA VERDADE: APENAS 2 DOCUMENTOS

O estado da plataforma Apex AI é definido exclusivamente por ESTES 2 documentos:

1. **`CHECKPOINT_TRACKER.md`** → Rastreamento de execução, sessões, mudanças
2. **`docs/APEX_PLATFORM_CURRENT_STATE.md`** → Status da plataforma, módulos, conectores

TODOS os outros documentos de auditoria, inventário, relatórios de build/deploy,
planos Supabase, checkpoints antigos (CP15D, CP15F) e changelogs são
**SECUNDÁRIOS** e podem estar desatualizados.

Regras para qualquer agente/assistente:
1. Para saber o que está implementado → leia `CHECKPOINT_TRACKER.md` e
   `docs/APEX_PLATFORM_CURRENT_STATE.md`
2. Para saber o histórico de mudanças → leia `CHECKPOINT_TRACKER.md`
3. NÃO leia outros docs .md de auditoria/inventário a menos que o Owner
   peça explicitamente
4. Se um doc secundário contradizer os 2 canônicos, os canônicos vencem

Skills específicas (Windows Care, Revit, Platform Engineering, etc.)
permanecem como dokumentação técnica de domínio, mas o ESTADO da
plataforma (se está implementado ou não) vem APENAS dos 2 canônicos.

---

## Commit guidance

- Use clear commit titles describing user-visible impact.
- Ensure CI checks in apex-sync.yml stay green before merge/deploy.
