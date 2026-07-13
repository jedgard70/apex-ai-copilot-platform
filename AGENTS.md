# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout

- Frontend: src/ (React + Vite + TypeScript)
- API/server runtime: server.mjs and Api/
- Scripts and validators: scripts/
- CI workflow: .github/workflows/apex-sync.yml
- Platform status/docs: docs/canonical/CHECKPOINT_TRACKER.md, docs/canonical/APEX_PLATFORM_CURRENT_STATE.md and `docs/canonical/apex_acip_master_architecture.md`

## Dev environment tips

- Install dependencies with
`npm install`.
- Use
`npm run dev` for local runtime (Build + node server.mjs).
- Use
`npm run dev:ui` only for UI-only Vite iteration.
- Keep secrets in .env.local (never commit .env* files).
- Prefer git --no-pager commands for non-interactive output in agent sessions.

## Testing and validation instructions

# Main quality gates

- `npm run build`
- `npm run test`
- `npm run validate:cp15x-h5`
- `npm run validate:cp15x-h44`
- `npm run validate:directcut-pipeline`

- If your change touches Supabase contracts, run:
  - `npm run validate:supabase-sql`

- If your change touches owner workspace/auth bootstrap, run:
  - `npm run validate:owner-workspace-live`

## DirectCut and platform behavior rules

- Do not claim real video rendering unless connector status is actually enabled.
- Keep providerStatus explicit and truthful (planning-only, connector-ready, etc.).
- Preserve parity between local runtime (server.mjs) and serverless endpoints in Api/copilot/.

## PR and change rules

- Keep changes surgical and scoped to the requested task or change if necessarily to run perfectly.
- Reuse existing patterns/helpers before adding new abstractions or replace it.
- Update related docs when behavior or operational flow changes.
- Do not add broad silent fallbacks that hide failures.
- Do not commit credentials, tokens, or service-role secrets.

---

## 🚨 REGRA ABSOLUTA 1 — Proteção de Environment Variables

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no .env.local ou
nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
do Owner (<jedgard70@gmail.com> / Dr. Edgard).

Isso inclui, mas não se limita a: GEMINI_API_KEY, FAL_KEY, ELEVENLABS_API_KEY,
SUPABASE_*, VITE_FIREBASE_*, STRIPE_*, AUTHKEY_*, APS_CLIENT_*,
REVIT_MCP_*, LOCAL_WORKER_TOKEN, BRAVE_SEARCH_API_KEY, CRON_SECRET, DUFFEL_ACCESS_TOKEN.

Proibido EXPRESSAMENTE usar comandos como `vercel env add`, `vercel env rm`,
`vercel env pull` ou acessar o dashboard da Vercel para modificar variáveis.
NENHUMA env var da Vercel pode ser alterada sem o Owner dizer "autorizado",
"pode mexer", "sincroniza" ou "corrige" para aquela ação específica, se for preciso pergunte ou peça autorizaçao.

⚠️ EXCEÇÃO REGISTRADA 1: na sessão de 2026-06-24, o Owner autorizou
explicitamente a sincronização das seguintes variáveis no Vercel:

- LOCAL_WORKER_URL (correção de casing)
- ALLOW_RAW_SHELL_IN_ANY_ENV (adição)

⚠️ EXCEÇÃO REGISTRADA 2: na sessão atual (2026-07-11), o Owner autorizou
exclusivamente o agente principal Antigravity a injetar, modificar ou 
sincronizar variáveis de ambiente no Vercel (como VERCEL_SUPPORT_LARGE_FUNCTIONS) 
para correções de build e deploy. Nenhum outro agente, skill ou 
processo automatizado possui essa permissão.

Proteção estendida também a:

- Modelos de IA e provedores de API configurados
- Rotas e endpoints da API
- ProviderStatus e indicadores de cada módulo, nuca usar mock ou falsa funcionalidade sempre live real
- Qualquer configuração alterada na sessão de 2026-06-23 (ver docs/CHANGELOG_2026-06-23.md)

Violação: qualquer alteração não autorizada deve ser revertida imediatamente
e reportada ao Owner. Prioridade máxima sobre qualquer outro comando.

---

## 🚨 REGRA ABSOLUTA 2 — Proteção do Catálogo de Modelos

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
reduzir, remover, esconder ou limitar a listagem de modelos disponíveis
no seletor da interface ou nas APIs internas sem antes perguntar se pode.

Arquivos protegidos:

- src/main.tsx — constantes DIRECT_GEMINI_MODELS, FAL_CHAT_MODELS, ELEVENLABS_MODELS
- api/copilot/chat.mjs — mesmas constantes
- server.mjs — mesmas constantes

Regras:

1. Modelos só podem ser ADICIONADOS, nunca removidos ou ocultados
2. Timeout de fetchJsonWithTimeout não pode ser menor que 60 segundos
3. API live, usar sempre live nunca fallback, pode trocar automaticamente o modelo

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
usando as ferramentas disponíveis. O agente deve investigar antes de perguntar e resolver.

---

## 🚨 REGRA ABSOLUTA 6 — VERIFICAÇÃO DE CÓDIGO REAL vs DOCUMENTAÇÃO

Nenhum agente, assistente, skill ou processo automatizado pode afirmar que
uma funcionalidade "já está implementada", "já existe", "já está integrada"
ou "for Real 100%" baseando-se APENAS em documentação, arquivos de planejamento (.md),
checklists, roadmaps, SUPABASE_TABLE_MAP, SUPABASE_SCHEMA_RLS_PLAN
ou qualquer documento descritivo.

REGRA DE OURO: **"Documentação é desejo. Código é realidade."**

Antes de responder sobre o estado de qualquer funcionalidade:

1. Verifique se o ARQUIVO DE CÓDIGO realmente existe (api/*, server/service/*,
   src/components/*, server.mjs routes, src/main.tsx imports)
2. Verifique o git log para saber quando foi criado
3. Se o arquivo não existir, a funcionalidade NÃO ESTÁ IMPLEMENTADA,
   caso nao esteja implantada implante execute a integraçao faça commit e deploypara que funcione.

Violação: qualquer afirmação falsa sobre estado de implementação deve ser
imediatamente corrigida e ou implantada com evidência de arquivos reais ou git log.
Prioridade absoluta sobre qualquer comando que peça para "assumir que existe".

4. Nenhuma linha da tabela de módulos (ex: no APEX_PLATFORM_CURRENT_STATE.md) pode virar ✅ LIVE sem o caminho exato do arquivo ser colado no PR que a alterou.
---

## 🚨 REGRA ABSOLUTA 7 — FONTE DA VERDADE: APENAS 2 DOCUMENTOS

O estado da plataforma Apex AI é definido exclusivamente por ESTES 2 documentos:

1. **`docs/canonical/CHECKPOINT_TRACKER.md`** → Rastreamento de execução, sessões, mudanças
2. **`docs/canonical/APEX_PLATFORM_CURRENT_STATE.md`** → Status da plataforma, módulos, conectores
3. **`docs/canonical/apex_acip_master_architecture.md`** → Estrutura Completa da plataforma, módulos, conectores, objetivo final

TODOS os outros documentos de auditoria, inventário, relatórios de build/deploy,
planos Supabase, checkpoints antigos (CP15D, CP15F) e changelogs são
**SECUNDÁRIOS** e podem estar desatualizados.

Regras para qualquer agente/assistente:

1. Para saber o que está implementado → leia `docs/canonical/CHECKPOINT_TRACKER.md`,
   `docs/canonical/APEX_PLATFORM_CURRENT_STATE.md` e `docs/canonical/apex_acip_master_architecture.md`
2. Para saber o histórico de mudanças → leia `docs/canonical/CHECKPOINT_TRACKER.md`
3. NÃO leia outros docs .md de auditoria/inventário a menos que o Owner
   peça explicitamente
4. Se um doc secundário contradizer os 3 canônicos, os canônicos vencem

Skills específicas (Windows Care, Revit, Platform Engineering, etc.)
permanecem como documentação técnica de domínio, mas o ESTADO da
plataforma (se está implementado ou não) vem APENAS dos 3 canônicos.

---

## 🚨 REGRA ABSOLUTA 8 — Deploy em produção requer aprovação humana

Nenhum agente pode fazer merge direto em `main` nem deploy direto em produção.
Fluxo obrigatório:

1. Agente cria branch e abre Pull Request.
2. CI (`apex-sync.yml`) roda `build` + `test` + `validate:*` — PR só fica elegível
   para merge se todos os checks passarem em verde.
3. Owner (Dr. Edgard) revisa e aprova o PR manualmente.
4. Só então o merge em `main` dispara o deploy automático.

Exceção: nenhuma. Mesmo correções urgentes passam por este fluxo.

---

## 🚨 REGRA ABSOLUTA 9 — Provedores de IA Permitidos e Restrição de Provedores Externos

Fica terminantemente proibido o uso, integração, inclusão, referência ou fallback para qualquer provedor de IA externo que não seja:

1. **Gemini (Genuíno/Nativo)** via API oficial da Google (`https://generativelanguage.googleapis.com`) ou SDK `@google/genai`.
2. **FAL.ai** para geração de imagem e vídeo.
3. **ElevenLabs** para conversão de texto em fala (TTS).
4. **Provedores/Serviços Internos** da plataforma Apex AI (como o local-worker local, Revit MCP, e Supabase).

Nenhum agente, assistente ou processo automatizado está autorizado a:

- Reintroduzir o **OpenRouter** ou quaisquer outros agregadores de API.
- Reintroduzir provedores como OpenAI compatible (exceto endpoints internos compatíveis de uso estrito do Gemini), Anthropic, DeepSeek (fora do FAL.ai) ou outros.
- Modificar o Provider Router (`server/providers/providerRouter.mjs`) ou o `src/main.tsx` para listar ou expor outros provedores na interface.
- Alterar, refatorar ou modificar a lógica de roteamento de provedores/modelos, listagem dinâmica de modelos ininterruptos (em `server/providers/providerRouter.mjs` ou endpoints de chat) se estiverem funcionando corretamente, garantindo a estabilidade operacional contínua da plataforma.

Esta regra foi estabelecida verbalmente pelo Owner Dr. Edgard em 2026-06-26 e tem caráter de proteção permanente.

---

## Commit guidance

- Use clear commit titles describing user-visible impact and validate.
- Ensure CI checks in apex-sync.yml stay green before merge/deploy.

## 🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes

Fica terminantemente proibido incluir no codigo nomes de empresas, sites ou IAs concorrentes
(ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut) nos textos
de marketing, pitches de vendas ou na interface da plataforma.

Use sempre termos genéricos como "estilo dos melhores sites por aí", "padrão de
cinema", "edição profissional de mercado". A marca central é única e exclusivamente
a **Apex AI**.

## 🚨 REGRA ABSOLUTA 11 — Proteção da Integridade das Regras e Leis

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
editar, modificar, remover, truncar, ofuscar, ocultar, sobrescrever ou
injetar caracteres nulos (null bytes, zero-width chars, \0, \x00) entre
as letras de qualquer regra, lei, diretriz ou instrução contida:

1. Neste arquivo (`AGENTS.md`)
2. No `docs/canonical/CHECKPOINT_TRACKER.md`
3. No `docs/canonical/APEX_PLATFORM_CURRENT_STATE.md`
4. No `docs/canonical/apex_acip_master_architecture.md`
5. Em quaisquer arquivos `.md` que definem regras ou estado da plataforma
6. Nas variáveis de ambiente (`.env.local` e Environment Variables do Vercel)
7. Nos provedores configurados (`api/copilot/chat.mjs`, `server.mjs`, `src/main.tsx`)
8. Em toda a plataforma — endpoints, middlewares, services, componentes

**Regras específicas:**

1. Nenhum caractere nulo (\0, null byte, \x00) pode ser inserido no meio de palavras
   para tentar "esconder" ou "disfarçar" o texto de regras
2. Nenhum caractere de largura zero (zero-width joiner, zero-width space, etc.)
   pode ser usado para separar letras de regras existentes ou futuras
3. Nenhuma regra pode ser truncada parcialmente — ou está completa ou removida
4. Nenhum provedor de IA, rota de API, variável de ambiente ou serviço pode
   ser desativado, ocultado ou substituído por placeholder sem autorização explícita

**Penalidade:** qualquer violação detectada deve ser revertida imediatamente.
O agente infrator deve ser reportado ao Owner e todo o diff revisado.
Prioridade máxima sobre qualquer outro comando — superior inclusive às
Regras 1-10.

**Exceção:** apenas o Owner Dr. Edgard (<jedgard70@gmail.com>) com autorização
verbal explícita na conversa corrente pode autorizar alterações nas regras
deste documento.

---

## 🚨 REGRA ABSOLUTA 12 — Uso Exclusivo da API Nativa do Gemini (Proibido Endpoint OpenAI-Compatible)

Fica terminantemente proibido o uso do formato OpenAI-compatible
(`/openai/chat/completions` com `Authorization: Bearer`) para
comunicação com a API do Gemini.

**Padrão obrigatório (chat e geração de conteúdo):**

1. Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
2. Header: `X-goog-api-key` com o valor da chave da API Gemini
3. Formato do body: `{ contents: [{ role: "user"|"model", parts: [{ text: "..." }] }], system_instruction: { parts: [{ text: "..." }] } }`
4. A variável `GEMINI_API_BASE` em `.env.local` deve apontar para `https://generativelanguage.googleapis.com/v1beta` (sem `/openai`)
5. O provider router deve usar `nativeGemini: true` para habilitar o formato nativo

**⚡ EXCEÇÕES AUTORIZADAS PELO OWNER (Dr. Edgard — 2026-07-08):**

As seguintes integrações de serviços e APIs do ecossistema Google/Gemini são
PERMITIDAS e devem ser integradas como conectores paralelos, sem substituir
o endpoint `generateContent` para modelos compatíveis:

1. **API Interactions (`/v1beta/interactions`)** — Autorizada para uso exclusivo
   com os novos agentes nativos do Google que não suportam `generateContent`:
   - `deep-research-preview-04-2026`, `deep-research-max-preview-04-2026`
   - `antigravity-preview-05-2026`, `veo-3.1`, `nano-banana-2`, `nano-banana-pro`
   - `lyria-3-pro-preview`, `lyria-3-clip-preview`, `gemini-robotics`
   - Conector: `server/providers/interactionsConnector.mjs`
   - Header obrigatório: `X-goog-api-key` (nunca `Authorization: Bearer`)

2. **Google Maps Platform** — API Key: `[CHAVE_OCULTADA_EM_ENV_LOCAL]`
   - Componente UI: `src/components/MapPlacePicker.tsx`
   - Tool invocável pela IA via `functionDeclarations` no chat

3. **Firebase AI Logic / Firebase Admin** — Via SDK oficial (`firebase-admin`)
   - Arquivo: `server/lib/firebaseAdmin.mjs`
   - Requer: `FIREBASE_SERVICE_ACCOUNT` no ambiente

4. **Vertex AI Agent Engine** (`aiplatform.googleapis.com`) — Via ADC
   (Application Default Credentials) no backend local

5. **Qualquer serviço ou produto do ecossistema Google/Gemini** que melhore
   a plataforma pode ser integrado, desde que use autenticação `X-goog-api-key`
   ou ADC (nunca `Authorization: Bearer` com formato OpenAI-compat)

**Arquivos protegidos:**

- `server/providers/providerRouter.mjs` — lógica de roteamento dos providers
- `server/providers/interactionsConnector.mjs` — conector da API Interactions
- `.env.local` — variáveis de ambiente com `GEMINI_API_BASE` e `GEMINI_API_KEY`
- `api/copilot/chat.mjs` — handler HTTP do chat
- `server.mjs` — runtime do servidor

Violação: qualquer reintrodução do formato OpenAI-compatible para Gemini
deve ser revertida imediatamente e reportada ao Owner. Prioridade máxima
sobre qualquer outro comando — superior inclusive às Regras 1-11.
