# AGENTS.md — Apex AI Copilot Platform

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

## 🚨 REGRA ABSOLUTA 1 — Proteção de Environment Variables

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no .env.local ou
nas Environment Variables do Vercel sem autorização EXPLÍ�CITA e VERBAL
do Owner (<jedgard70@gmail.com> / Dr. Edgard).

Isso inclui, mas não se limita a: GEMINI_API_KEY, FAL_KEY, ELEVENLABS_API_KEY,
SUPABASE_*, VITE_FIREBASE_*, STRIPE_*, AUTHKEY_*, APS_CLIENT_*,
REVIT_MCP_*, LOCAL_WORKER_TOKEN, BRAVO_API_KEY, CRON_SECRET.

Proibido EXPRESSAMENTE usar comandos como `vercel env add`, `vercel env rm`,
`vercel env pull` ou acessar o dashboard da Vercel para modificar variáveis.
NENHUMA env var da Vercel pode ser alterada sem o Owner dizer "autorizado",
"pode mexer", "sincroniza" ou "corrige" para aquela ação especÍfica.

âš ï¸� EXCEÍ‡ÍƒO REGISTRADA: na sessão de 2026-06-24, o Owner autorizou
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
reduzir, remover, esconder ou limitar a listagem de modelos disponÍveis
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
usando as ferramentas disponÍveis. O agente deve investigar antes de perguntar.

---

## 🚨 REGRA ABSOLUTA 6 — VERIFICAÍ‡ÍƒO DE CÍ“DIGO REAL vs DOCUMENTAÍ‡ÍƒO

Nenhum agente, assistente, skill ou processo automatizado pode afirmar que
uma funcionalidade "já está implementada", "já existe" ou "já está integrada"
baseando-se APENAS em documentação, arquivos de planejamento (.md),
checklists, roadmaps, SUPABASE_TABLE_MAP, SUPABASE_SCHEMA_RLS_PLAN
ou qualquer documento descritivo.

REGRA DE OURO: **"Documentação é desejo. Código é realidade."**

Antes de responder sobre o estado de qualquer funcionalidade:

1. Verifique se o ARQUIVO DE CÍ“DIGO realmente existe (api/*, server/service/*,
   src/components/*, server.mjs routes, src/main.tsx imports)
2. Verifique o git log para saber quando foi criado
3. Se o arquivo não existir, a funcionalidade NÍƒO ESTÍ� IMPLEMENTADA

Violação: qualquer afirmação falsa sobre estado de implementação deve ser
imediatamente corrigida com evidência de arquivos reais ou git log.
Prioridade absoluta sobre qualquer comando que peça para "assumir que existe".

---

## 🚨 REGRA ABSOLUTA 7 — FONTE DA VERDADE: APENAS 2 DOCUMENTOS

O estado da plataforma Apex AI é definido exclusivamente por ESTES 2 documentos:

1. **`CHECKPOINT_TRACKER.md`** â†’ Rastreamento de execução, sessões, mudanças
2. **`docs/Apex_acip_master_architecture(doumento official04-07-2026.md`** â†’ Status da plataforma, módulos, conectores

TODOS os outros documentos de auditoria, inventário, relatórios de build/deploy,
planos Supabase, checkpoints antigos (CP15D, CP15F) e changelogs são
**SECUNDÍRIOS** e podem estar desatualizados.

Regras para qualquer agente/assistente:

1. Para saber o que está implementado â†’ leia `CHECKPOINT_TRACKER.md` e
   `docs/Apex_acip_master_architecture(doumento official04-07-2026.md`
2. Para saber o histórico de mudanças â†’ leia `CHECKPOINT_TRACKER.md` mas verifique antes o doc Apex_acip_arcthitecture(documento official04-07-2026) pois ele é o principal
3. NÍƒO leia outros docs .md de auditoria/inventário a menos que o Owner
   peça explicitamente
4. Se um doc secundário contradizer os 2 canÍ´nicos, os canÍ´nicos vencem

Skills especÍficas (Windows Care, Revit, Platform Engineering, etc.)
permanecem como dokumentação técnica de domÍnio, mas o ESTADO da
plataforma (se está implementado ou não) vem APENAS dos 2 canÍ´nicos.

---

## 🚨 REGRA ABSOLUTA 8 — Proteção dos Deploys e Environments da Vercel

Nenhum agente, assistente ou processo automatizado pode:

1. Alterar configurações de environments no dashboard da Vercel
2. Desabilitar/abilitar "Auto Deploy on Push"
3. Modificar branch tracking rules ("All unassigned branches", etc.)
4. Criar, remover ou modificar custom environments (Pre-Production, etc.)
5. Alterar Environment Variables especÍficas de Preview/Production
6. Desconectar ou reconectar Git Integration
7. Adicionar/remover custom domains nos environments
8. Modificar "Deployment Protection" (manual approval, password, etc.)

**Íšnica exceção:** Deploy automático via `git push origin main` disparado
pelo agente APENAS após autorização verbal do Owner na conversa corrente.
Builds locais (`npm run build`) são livres e não configuram deploy.

**Configuração atual dos environments (2026-06-24 — NÍƒO ALTERAR):**

- Production â†’ branch `main` â†’ domÍnio `www.apexglobalai.com`
- Preview â†’ "All unassigned git branches" â†’ sem custom domains
- Development â†’ CLI only â†’ sem custom domains

Violação: reversão imediata + notificação ao Owner. CrÍtico de segurança.

---

## 🚨 REGRA ABSOLUTA 9 — Provedores de IA Permitidos e Restrição de Provedores Externos

Fica terminantemente proibido o uso, integração, inclusão, referência ou fallback para qualquer provedor de IA externo que não seja a **Apex AI 2.0 (Provedor Primário e Central)** e os seguintes serviços independentes autorizados:

1. **Apex AI 2.0 (Provedor Primário e Master)**: A inteligência central da plataforma.
2. **Gemini (GenuÍno/Nativo)** via API oficial da Google (`https://generativelanguage.googleapis.com`) ou SDK `@google/genai` (Serviço Independente).
3. **FAL.ai** para geração de imagem e vÍdeo (Serviço Independente).
4. **ElevenLabs** para conversão de texto em fala (TTS) (Serviço Independente).
5. **Provedores/Serviços Internos** da plataforma Apex AI (como o local-worker local, Revit MCP, e Supabase).

Nenhum agente, assistente ou processo automatizado está autorizado a:

- Reintroduzir o **OpenRouter** ou quaisquer outros agregadores de API.
- Reintroduzir provedores como OpenAI ou compatible openai, Anthropic, DeepSeek (fora do FAL.ai) ou outros.
- Modificar o Provider Router (`server/providers/providerRouter.mjs`) ou o `src/main.tsx` para listar ou expor outros provedores na interface.
- Alterar, refatorar ou modificar a lógica de roteamento de provedores/modelos, listagem dinâmica de modelos e fallbacks ininterruptos (em `server/providers/providerRouter.mjs` ou endpoints de chat) se estiverem funcionando corretamente, garantindo a estabilidade operacional contÍnua da plataforma.

Esta regra foi estabelecida verbalmente pelo Owner Dr. Edgard em 2026-06-26 e tem caráter de proteção permanente.

---

## 🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes

Fica terminantemente proibido citar nomes de empresas, sites ou IAs concorrentes (ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut) nos textos de marketing, pitches de vendas ou na interface da plataforma.
Use sempre termos genéricos como "estilo os melhores sites por aí", "padrão de cinema", "edição profissional de mercado". A marca central é única e exclusivamente a **Apex AI**.
