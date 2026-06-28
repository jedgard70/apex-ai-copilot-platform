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

Isso inclui, mas não se limita a: GEMINI_API_KEY, FAL_KEY, ELEVENLABS_API_KEY,
SUPABASE_*, VITE_FIREBASE_*, STRIPE_*, AUTHKEY_*, APS_CLIENT_*,
REVIT_MCP_*, LOCAL_WORKER_TOKEN, TAVILY_API_KEY, CRON_SECRET.

Proibido EXPRESSAMENTE usar comandos como `vercel env add`, `vercel env rm`,
`vercel env pull` ou acessar o dashboard da Vercel para modificar variáveis.
NENHUMA env var da Vercel pode ser alterada sem o Owner dizer "autorizado",
"pode mexer", "sincroniza" ou "corrige" para aquela ação específica.

⚠️ EXCEÇÃO REGISTRADA: na sessão de 2026-06-24, o Owner autorizou
explicitamente a sincronização das seguintes variáveis no Vercel:
- LOCAL_WORKER_URL (correção de casing)
- ALLOW_RAW_SHELL_IN_ANY_ENV (adição)

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
- src/main.tsx — constantes DIRECT_GEMINI_MODELS, FAL_CHAT_MODELS, ELEVENLABS_MODELS
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

## 🚨 REGRA ABSOLUTA 8 — Proteção dos Deploys e Environments da Vercel

Nenhum agente, assistente ou processo automatizado pode:
1. Alterar configurações de environments no dashboard da Vercel
2. Desabilitar/abilitar "Auto Deploy on Push"
3. Modificar branch tracking rules ("All unassigned branches", etc.)
4. Criar, remover ou modificar custom environments (Pre-Production, etc.)
5. Alterar Environment Variables específicas de Preview/Production
6. Desconectar ou reconectar Git Integration
7. Adicionar/remover custom domains nos environments
8. Modificar "Deployment Protection" (manual approval, password, etc.)

**Única exceção:** Deploy automático via `git push origin main` disparado
pelo agente APENAS após autorização verbal do Owner na conversa corrente.
Builds locais (`npm run build`) são livres e não configuram deploy.

**Configuração atual dos environments (2026-06-24 — NÃO ALTERAR):**
- Production → branch `main` → domínio `www.apexglobalai.com`
- Preview → "All unassigned git branches" → sem custom domains
- Development → CLI only → sem custom domains

Violação: reversão imediata + notificação ao Owner. Crítico de segurança.

---

## 🚨 REGRA ABSOLUTA 9 — Provedores de IA Permitidos e Restrição de Provedores Externos

Fica terminantemente proibido o uso, integração, inclusão, referência ou fallback para qualquer provedor de IA externo que não seja:
1. **Gemini (Genuíno/Nativo)** via API oficial da Google (`https://generativelanguage.googleapis.com`) ou SDK `@google/genai`.
2. **FAL.ai** para geração de imagem e vídeo.
3. **ElevenLabs** para conversão de texto em fala (TTS).
4. **Provedores/Serviços Internos** da plataforma Apex AI (como o local-worker local, Revit MCP, e Supabase).

Nenhum agente, assistente ou processo automatizado está autorizado a:
- Reintroduzir o **OpenRouter** ou quaisquer outros agregadores de API.
- Reintroduzir provedores como OpenAI (exceto se para mocks locais ou endpoints internos compatíveis de uso estrito do Gemini), Anthropic, DeepSeek (fora do FAL.ai) ou outros.
- Modificar o Provider Router (`server/providers/providerRouter.mjs`) ou o `src/main.tsx` para listar ou expor outros provedores na interface.
- Alterar, refatorar ou modificar a lógica de roteamento de provedores/modelos, listagem dinâmica de modelos e fallbacks ininterruptos (em `server/providers/providerRouter.mjs` ou endpoints de chat) se estiverem funcionando corretamente, garantindo a estabilidade operacional contínua da plataforma.

Esta regra foi estabelecida verbalmente pelo Owner Dr. Edgard em 2026-06-26 e tem caráter de proteção permanente.

---

## Commit guidance

- Use clear commit titles describing user-visible impact.
- Ensure CI checks in apex-sync.yml stay green before merge/deploy.

***REMOVED***
***REMOVED***#***REMOVED***#***REMOVED*** ***REMOVED***=ب� ***REMOVED***R***REMOVED***E***REMOVED***G***REMOVED***R***REMOVED***A***REMOVED*** ***REMOVED***A***REMOVED***B***REMOVED***S***REMOVED***O***REMOVED***L***REMOVED***U***REMOVED***T***REMOVED***A***REMOVED*** ***REMOVED***1***REMOVED***0***REMOVED*** ***REMOVED***  ***REMOVED***N***REMOVED***o***REMOVED***m***REMOVED***e***REMOVED***n***REMOVED***c***REMOVED***l***REMOVED***a***REMOVED***t***REMOVED***u***REMOVED***r***REMOVED***a***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***C***REMOVED***o***REMOVED***n***REMOVED***c***REMOVED***o***REMOVED***r***REMOVED***r***REMOVED***e***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED***s***REMOVED***
***REMOVED***F***REMOVED***i***REMOVED***c***REMOVED***a***REMOVED*** ***REMOVED***t***REMOVED***e***REMOVED***r***REMOVED***m***REMOVED***i***REMOVED***n***REMOVED***a***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED***m***REMOVED***e***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED*** ***REMOVED***p***REMOVED***r***REMOVED***o***REMOVED***i***REMOVED***b***REMOVED***i***REMOVED***d***REMOVED***o***REMOVED*** ***REMOVED***c***REMOVED***i***REMOVED***t***REMOVED***a***REMOVED***r***REMOVED*** ***REMOVED***n***REMOVED***o***REMOVED***m***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***e***REMOVED***m***REMOVED***p***REMOVED***r***REMOVED***e***REMOVED***s***REMOVED***a***REMOVED***s***REMOVED***,***REMOVED*** ***REMOVED***s***REMOVED***i***REMOVED***t***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***o***REMOVED***u***REMOVED*** ***REMOVED***I***REMOVED***A***REMOVED***s***REMOVED*** ***REMOVED***c***REMOVED***o***REMOVED***n***REMOVED***c***REMOVED***o***REMOVED***r***REMOVED***r***REMOVED***e***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***(***REMOVED***e***REMOVED***x***REMOVED***:***REMOVED*** ***REMOVED***M***REMOVED***a***REMOVED***g***REMOVED***n***REMOVED***i***REMOVED***f***REMOVED***i***REMOVED***c***REMOVED***,***REMOVED*** ***REMOVED***M***REMOVED***i***REMOVED***d***REMOVED***j***REMOVED***o***REMOVED***u***REMOVED***r***REMOVED***n***REMOVED***e***REMOVED***y***REMOVED***,***REMOVED*** ***REMOVED***V***REMOVED***e***REMOVED***o***REMOVED*** ***REMOVED***A***REMOVED***I***REMOVED***,***REMOVED*** ***REMOVED***C***REMOVED***h***REMOVED***a***REMOVED***t***REMOVED***G***REMOVED***P***REMOVED***T***REMOVED***,***REMOVED*** ***REMOVED***L***REMOVED***u***REMOVED***m***REMOVED***i***REMOVED***o***REMOVED***n***REMOVED***,***REMOVED*** ***REMOVED***V***REMOVED***-***REMOVED***R***REMOVED***a***REMOVED***y***REMOVED***,***REMOVED*** ***REMOVED***C***REMOVED***a***REMOVED***p***REMOVED***C***REMOVED***u***REMOVED***t***REMOVED***)***REMOVED*** ***REMOVED***n***REMOVED***o***REMOVED***s***REMOVED*** ***REMOVED***t***REMOVED***e***REMOVED***x***REMOVED***t***REMOVED***o***REMOVED***s***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***m***REMOVED***a***REMOVED***r***REMOVED***k***REMOVED***e***REMOVED***t***REMOVED***i***REMOVED***n***REMOVED***g***REMOVED***,***REMOVED*** ***REMOVED***p***REMOVED***i***REMOVED***t***REMOVED***c***REMOVED***h***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***v***REMOVED***e***REMOVED***n***REMOVED***d***REMOVED***a***REMOVED***s***REMOVED*** ***REMOVED***o***REMOVED***u***REMOVED*** ***REMOVED***n***REMOVED***a***REMOVED*** ***REMOVED***i***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED***r***REMOVED***f***REMOVED***a***REMOVED***c***REMOVED***e***REMOVED*** ***REMOVED***d***REMOVED***a***REMOVED*** ***REMOVED***p***REMOVED***l***REMOVED***a***REMOVED***t***REMOVED***a***REMOVED***f***REMOVED***o***REMOVED***r***REMOVED***m***REMOVED***a***REMOVED***.***REMOVED*** ***REMOVED***
***REMOVED***U***REMOVED***s***REMOVED***e***REMOVED*** ***REMOVED***s***REMOVED***e***REMOVED***m***REMOVED***p***REMOVED***r***REMOVED***e***REMOVED*** ***REMOVED***t***REMOVED***e***REMOVED***r***REMOVED***m***REMOVED***o***REMOVED***s***REMOVED*** ***REMOVED***g***REMOVED***e***REMOVED***n***REMOVED***�***REMOVED***r***REMOVED***i***REMOVED***c***REMOVED***o***REMOVED***s***REMOVED*** ***REMOVED***c***REMOVED***o***REMOVED***m***REMOVED***o***REMOVED*** ***REMOVED***"***REMOVED***e***REMOVED***s***REMOVED***t***REMOVED***i***REMOVED***l***REMOVED***o***REMOVED*** ***REMOVED***o***REMOVED***s***REMOVED*** ***REMOVED***m***REMOVED***e***REMOVED***l***REMOVED***h***REMOVED***o***REMOVED***r***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***s***REMOVED***i***REMOVED***t***REMOVED***e***REMOVED***s***REMOVED*** ***REMOVED***p***REMOVED***o***REMOVED***r***REMOVED*** ***REMOVED***a***REMOVED***�***REMOVED***"***REMOVED***,***REMOVED*** ***REMOVED***"***REMOVED***p***REMOVED***a***REMOVED***d***REMOVED***r***REMOVED***�***REMOVED***o***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***c***REMOVED***i***REMOVED***n***REMOVED***e***REMOVED***m***REMOVED***a***REMOVED***"***REMOVED***,***REMOVED*** ***REMOVED***"***REMOVED***e***REMOVED***d***REMOVED***i***REMOVED***�***REMOVED***�***REMOVED***o***REMOVED*** ***REMOVED***p***REMOVED***r***REMOVED***o***REMOVED***f***REMOVED***i***REMOVED***s***REMOVED***s***REMOVED***i***REMOVED***o***REMOVED***n***REMOVED***a***REMOVED***l***REMOVED*** ***REMOVED***d***REMOVED***e***REMOVED*** ***REMOVED***m***REMOVED***e***REMOVED***r***REMOVED***c***REMOVED***a***REMOVED***d***REMOVED***o***REMOVED***"***REMOVED***.***REMOVED*** ***REMOVED***A***REMOVED*** ***REMOVED***m***REMOVED***a***REMOVED***r***REMOVED***c***REMOVED***a***REMOVED*** ***REMOVED***c***REMOVED***e***REMOVED***n***REMOVED***t***REMOVED***r***REMOVED***a***REMOVED***l***REMOVED*** ***REMOVED***�***REMOVED*** ***REMOVED***�***REMOVED***n***REMOVED***i***REMOVED***c***REMOVED***a***REMOVED*** ***REMOVED***e***REMOVED*** ***REMOVED***e***REMOVED***x***REMOVED***c***REMOVED***l***REMOVED***u***REMOVED***s***REMOVED***i***REMOVED***v***REMOVED***a***REMOVED***m***REMOVED***e***REMOVED***n***REMOVED***t***REMOVED***e***REMOVED*** ***REMOVED***a***REMOVED*** ***REMOVED*******REMOVED*******REMOVED***A***REMOVED***p***REMOVED***e***REMOVED***x***REMOVED*** ***REMOVED***A***REMOVED***I***REMOVED*******REMOVED*******REMOVED***.***REMOVED******REMOVED***
***REMOVED***