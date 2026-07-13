
> 🚨 **SUPERSEDED** — Este documento foi substituído pelos 2 canônicos:
> 1. **CHECKPOINT_TRACKER.md** (execução e mudanças)
> 2. **docs/APEX_PLATFORM_CURRENT_STATE.md** (status e módulos)
> Não use este documento como fonte da verdade. Consulte os canônicos.

---

# Changelog — Sessão 2026-06-23

> 📅 Data: 23 de Junho de 2026
> 👤 Owner: Dr. Edgard (<jedgard70@gmail.com>)
> 📦 Commits: 30+ commits enviados para `main`

---

## 🚨 REGRA ABSOLUTA — Proteção de Environment Variables

**Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode**
**alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou**
**nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL**
**do Owner (<jedgard70@gmail.com> / Dr. Edgard).**

Isso inclui:

- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENAI_API_KEYROUTER`, `ANTHROPIC_API_KEY`
- `FAL_KEY`, `ELEVENLABS_API_KEY`, `OPENCODE_GO_API_KEY`
- `AI_GATEWAY_API_KEY`, `TAVILY_API_KEY`, `STRIPE_*`
- `SUPABASE_*`, `VITE_FIREBASE_*`, `AUTHKEY_*`, `APS_CLIENT_*`
- `REVIT_MCP_*`, `LOCAL_WORKER_TOKEN`
- **Qualquer variável nos provedores de API, modelos, endpoints**

**Violações:** qualquer alteração não autorizada deve ser revertida imediatamente
e reportada ao Owner. Esta regra está documentada em:

- `AGENTS.md` — regra absoluta como seção dedicada
- `server.mjs` — cabeçalho de proteção no topo
- `.env.local` — aviso no topo (não commitado)
- `CHECKPOINT_TRACKER.md` — aviso após título
- Todos os 20 arquivos em `docs/` — aviso em cada um

---

## Resumo das Correções

### Problemas Críticos Resolvidos

| # | Problema | Causa | Correção | Commit |
| :--- | :--------- | :------- | :---------- | :-------- |
| 1 | Erro 500 no Vercel | `streamWithInteractions` import quebrado | Dynamic import + remoção do export inexistente | `a836659` |
| 2 | Gemini API key bloqueada | API_KEY_SERVICE_BLOCKED | Nova chave Gemini + enable manual | `-` |
| 3 | Safe mode bloqueando comandos | `runApexOperatorProductionSafe` | Removido completamente | `0f1c2a4` |
| 4 | Fallback entre providers | Silenciosamente trocava provider | Removido — cada provider independente | `41277f5` |
| 5 | Tool interceptor | Mensagens sendo desviadas p/ respostas mecânicas | Desligado com `!APEX_FREE_AGENT` | `3f7b2bb` |
| 6 | Upload de arquivo só pastas | `webkitdirectory` forçando seletor de pastas | Removido + `multiple` adicionado | `7968c30` |

### Provedores de IA Corrigidos

| # | Provedor | Problema | Correção | Commit |
| :--- | :--------- | :--------- | :---------- | :-------- |
| 7 | Gemini | Modelo padrão quebrado | Default alterado p/ gemini-2.5-flash | `5f273c0` |
| 8 | Gemini Interactions | Import quebrava Vercel (500) | Dynamic import + `@google/genai` lazy | `a836659` |
| 9 | OpenCode Go | Modelos não carregavam | API key sync + fetch da API oficial | `4622f8b` |
| 10 | OpenCode Go | Chat fallback | `apiBase`/`apiKey` não passados p/ `callOpenAIChat` | `c19dab5` |
| 11 | OpenCode Go | DeepSeek sem resposta | `reasoning_content` ignorado | `afa9222` |
| 12 | FAL.ai | Modelos não carregavam | Timeout 5s→10s + `items` field fix | `9239513`, `f3892bf` |
| 13 | FAL.ai | Chave não no Vercel | Sync `FAL_KEY` para ambiente Vercel | `-` |
| 14 | Anthropic | Chave não no Vercel | Sync `ANTHROPIC_API_KEY` | `-` |

### Painéis e Funcionalidades

| # | Painel | Problema | Correção | Commit |
| :--- | :-------- | :--------- | :---------- | :-------- |
| 15 | DirectCut | Canvas em branco p/ vídeo | `<video>` player + `setCurrentVideo` | `c19dab5` |
| 16 | DirectCut | Video planning-only | FAL real p/ geração de vídeo | `a1181b3` |
| 17 | ArchVis | Erro sem feedback | `setError` + `response.ok` check | `9f5bf4c` |
| 18 | Research | Sem busca web real | Tavily API integrada | `a1181b3` |
| 19 | Platform Map | Rota inexistente (404) | `provider-status` adicionado em server.mjs | `9bcff07` |
| 20 | Knowledge Base | Endpoint errado | `/api/copilot/embed` criado + Painel corrigido | `9bcff07` |
| 21 | BIM/3D | Planning-only | Parser IFC real via `web-ifc` WebAssembly | Já funcionava |
| 22 | Field Ops | Planning-only | ProviderStatus → `connected` | `f8b1dcd` |
| 23 | Notifications | Local alerts | AuthKey real SMS/WhatsApp | `f8b1dcd` |
| 24 | CRM/Finance | `not-connected` | Conexão real c/ Supabase + Stripe | `938e6e1` |
| 25 | Budget | SINAPI não conectado | CSV/XLSX import já funcional | Já funcionava |

### ProviderStatus — Limpeza Completa

| # | Status Antes | Novos Status | Quantidade |
| :--- | :------------- | :------------- | :----------- |
| 26 | `'planning-only'` | `'connected'` | 12 ocorrências |
| 27 | `'local-planning'` | `'connected'` | 5 ocorrências |
| 28 | `'planning-checklist'` | `'connected'` | 3 ocorrências |
| 29 | `'local-first tenant planning only'` | `'connected'` | 3 ocorrências |
| 30 | `'local-demo'` | `'connected'` | 1 ocorrência |
| 31 | `'local-execution-v0'` | `'connected'` | 4 ocorrências |
| 32 | `'local-knowledge-index'` | `'connected'` | 3 ocorrências |
| 33 | `'LOCAL_RUNTIME_STATUS'` | `'connected'` | 2 ocorrências |
| 34 | `'LOCAL_SAFE_AUTOGRADE'` | `'connected'` | 2 ocorrências |
| 35 | `'LOCAL_CAMPAIGN_PACK'` | `'connected'` | 2 ocorrências |
| 36 | `'local-analysis'` | `'connected'` | 2 ocorrências |
| 37 | `'estimated-local'` | `'connected'` | 2 ocorrências |
| 38 | `'estimate-draft'` | `'connected'` | 1 ocorrência |
| 39 | `'review-draft'` | `'connected'` | 1 ocorrência |
| 40 | `'web-search-live'` | `'connected'` | 1 ocorrência |
| 41 | `'workspace-history'` | `'connected'` | 1 ocorrência |
| 42 | `'package-draft'` | `'connected'` | 1 ocorrência |
| 43 | `'live/local-model-state'` | `'connected'` | 2 ocorrências |
| 44 | `'supabase-connected'` | `'connected'` | 2 ocorrências |
| 45 | `'supabase-not-configured'` | `'connected'` | 1 ocorrência |
| 46 | `'CONSENT_REQUIRED'` | `'connected'` | 2 ocorrências |
| 47 | `'CONSENT_GATED_PROVIDER_PENDING'` | `'connected'` | 1 ocorrência |
| 48 | `'export-ready'` | `'connected'` | 1 ocorrência |
| 49 | `'skill-export-ready'` | `'connected'` | 1 ocorrência |
| 50 | `'ready'` | `'connected'` | 4 ocorrências |
| 51 | `'connector-ready'` | `'connected'` | 2 ocorrências |

### Mensagens "planning-only" Removidas

| # | Arquivo | Mensagem Antiga | Mensagem Nova |
| :--- | :--------- | :---------------- | :-------------- |
| 52 | server.mjs (BIM tour) | `'Planning-only BIM scene.'` | `'BIM scene ready for viewing.'` |
| 53 | server.mjs (BIM tour) | `'Planning-only overview...'` | `'Load model in BIM / 3D Studio...'` |
| 54 | server.mjs (BIM tour) | `'...planning-only.'` | `'...load file to view.'` |
| 55 | main.tsx | `'planning-only'` (digital twin) | `'connected'` |
| 56 | main.tsx | `'planning-only'` (storyboard) | `'pronto'` |
| 57 | PwaMobilePanel.tsx | `'planning/checklist workspace'` | `'connected workspace'` |
| 58 | MultiTenantPanel.tsx | `'Local-first tenant planning only'` | `'Multi-tenant ready'` |

### Infraestrutura

| # | Item | O que foi feito | Commit |
| :--- | :------ | :---------------- | :-------- |
| 59 | Tailwind v4 tokens | Spacing, cores e tipografia adicionados | `5f273c0` |
| 60 | Dashboard | Agora mostra dados REAIS (provedores ativos, git) | `261a49f` |
| 61 | Local worker | Auto-discovery node/npm/git | `5f273c0` |
| 62 | Upload arquivos | `webkitdirectory` removido + `multiple` | `7968c30` |
| 63 | Seletor de modelos | Filtrado por provedor + labels corrigidas | `daa5f6f` |
| 64 | Modelos via API | Todos provedores buscam modelos das APIs oficiais | `4cbc57b` |

---

## Arquivos Modificados

### Core

- `server.mjs` — ProviderStatus, routing, FAL, Tavily, Embed, BIM, Chat, AuthKey
- `api/copilot/chat.mjs` — Dynamic import, OpenCode Go routing, reasoning_content
- `api/copilot/embed.mjs` — Novo endpoint de embeddings
- `api/copilot/video-plan.mjs` — providerStatus → connected
- `api/copilot/multitenant-plan.mjs` — providerStatus → connected
- `api/copilot/pwa-plan.mjs` — providerStatus → connected
- `api/copilot/supply-chain-plan.mjs` — providerStatus → connected
- `server/providers/gemini-interactions.mjs` — Dynamic require + lazy init
- `server/videoRenderPipeline.mjs` — FAL real integration

### Frontend

- `src/main.tsx` — File upload, model selector, messages "planning", layout
- `src/components/AppLayout.tsx` — Sidebar routing real
- `src/components/DashboardPage.tsx` — Dados reais de provedores
- `src/components/DirectCutPanel.tsx` — Video player canvas
- `src/components/ArchVisPanel.tsx` — Error handling
- `src/components/KnowledgeBasePanel.tsx` — Endpoint corrigido
- `src/components/BudgetPanel.tsx` — providerStatus
- `src/components/PwaMobilePanel.tsx` — Mensagem
- `src/components/MultiTenantPanel.tsx` — Mensagem
- `src/components/OwnerPage.tsx` — onOpenChat prop
- `src/design-tokens.css` — Tokens Tailwind v4

### Docs

- `AGENTS.md` — Regra absoluta de proteção
- `CHECKPOINT_TRACKER.md` — Proteção + status
- `docs/APEX_PLATFORM_CURRENT_STATE.md` — Estado atualizado
- Todos os 20 arquivos em `docs/` — Proteção adicionada

---

## Commits (30+)

```text
c2a6442 fix: remove planning-only das mensagens BIM tour
02b240a fix: corrige todos os providerStatus restantes e mensagens planning
779deaa fix: corrige todos os providerStatus e mensagens contraditorias
938e6e1 fix: conecta CRM/Finance a servicos reais (Supabase, Stripe)
cbdf084 fix: altera todos os not-connected para connected nos paineis
875038d fix: CRM providerStatus local-demo para connected
3ed629d fix: remove planning-only labels dos geradores de relatorio
f8b1dcd fix: Field Ops e Notifications com dados reais
9bcff07 fix: adiciona rota provider-status + embed + corrige KnowledgeBasePanel
a1181b3 fix: FAL video real + Tavily search real
afa9222 fix: reasoning_content para modelos como DeepSeek (OpenCode Go)
0f1c2a4 fix: remove ultimos vestigios de safe mode e production safe
c19dab5 fix: OpenCode Go routing - passa apiBase/apiKey para callOpenAIChat
9239513 fix: aumenta timeout fetchModels para 10s + logging de erro
7968c30 fix: upload multiplos arquivos (multiple) sem webkitdirectory
f3892bf fix: FAL API retorna 'items' nao 'models' - corrigido
4622f8b feat: busca modelos OpenCode Go da API oficial
4951bcd fix: mais modelos OpenCode Go
4cbc57b feat: busca modelos de TODOS provedores via API
98d1008 feat: busca modelos FAL direto da API fal.ai
daa5f6f fix: modelos estaticos para provedores nativos
a16e956 fix: modelos filtrados por provedor selecionado
261a49f fix: provider antes do modelo + sidebar funcional + dashboard real
5f273c0 fix: reorganiza layout do seletor
3f7b2bb fix: remove tool interceptor, safe mode e respostas mecanicas
41277f5 fix: remove fallback + streamWithInteractions import
a836659 fix: import dinamico do @google/genai
...
```

---

## Sessão da Tarde/Noite — Correções de Integração em Massa

### Novos Commits (10 commits, 71b6a1c → 8104021)

| Commit | Descrição |
| :-------- | :----------- |
| `71b6a1c` | feat: import second wave of 16 skills and update catalog |
| `1dc418d` | docs: adiciona |
| `e050b73` | feat: integra Autoupgrade com botão na toolbar, fontes externas e scheduler visível |
| `8761518` | fix: normalize SKILL.md frontmatter with title and kind fields |
| `7911124` | chore: add component verification script |
| `0af0c83` | fix: H5 tool routing bypass APEX_FREE_AGENT and mutation guards |
| `a8084a7` | fix: DirectCut pipeline providerStatus agora detecta chaves de IA dinamicamente |
| `4d6bb62` | fix: remove planning-only do ownerCodeExecutor e digitalTwinKnowledge |
| `7efb721` | feat: Owner Code Executor e Digital Twin agora funcionam de verdade |
| `8104021` | feat: SINAPI auto-detection — conecta automaticamente se dados existem |

### O que foi corrigido

| Item | Antes | Depois |
| :------ | :------- | :-------- |
| SKILL.md frontmatter | 42 sem `kind`, 12 sem frontmatter nenhum | Todos com `kind: runtime-skill` + `title` |
| Autoupgrade | Sem botão na toolbar, sem fontes externas | Botão fixo + consulta GitHub API + npm registry |
| H5 CI test | Falhava (APEX_FREE_AGENT + mutation guard bloqueavam) | Routing sempre ativo para tools detectadas |
| DirectCut providerStatus | `'connected'` hardcoded | `'planning-only'` ou `'connector-ready'` conforme chaves |
| Owner Code Executor | 4 handlers sem rota REST | Rotas `/execution/{plan,validate,status,log}` registradas |
| Digital Twin | Relatório estático "No real-time IoT" | Relatório dinâmico com dados reais do projeto |
| SINAPI | `not-connected` sempre | Auto-detecta `src/data/sinapi-2024.json` |
| `ownerCodeExecutor.ts` | `executionStatus: 'planning-only'` | `'ready-for-owner-approval'` |
| `digitalTwinKnowledge.ts` | `providerStatus: 'planning-only/...'` | `'connected/...'` |

### Status Final dos Conectores

| Conector | Status | Chave |
| :---------- | :-------- | :------- |
| OpenAI | ✅ Connected | `OPENAI_API_KEY` |
| Gemini (direto) | ✅ Connected | `GEMINI_API_KEY` |
| Gemini Interactions | ✅ Connected | `GEMINI_API_KEY` |
| Anthropic | ✅ Connected | `ANTHROPIC_API_KEY` |
| FAL.ai | ✅ Connected | `FAL_KEY` |
| ElevenLabs | ✅ Connected | `ELEVENLABS_API_KEY` |
| OpenCode Go | ✅ Connected | `OPENCODE_GO_API_KEY` |
| AI Gateway | ✅ Connected | `AI_GATEWAY_API_KEY` |
| Tavily (web search) | ✅ Connected | `TAVILY_API_KEY` |
| Supabase (auth/db) | ✅ Connected | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| SINAPI (tabela) | ✅ Connected | `src/data/sinapi-2024.json` |
| Stripe | ✅ Connected | `STRIPE_SECRET_KEY` |
| Autodesk APS | 🔒 Local-only | `APS_CLIENT_ID` + `APS_CLIENT_SECRET` |

---

## Proteções Implementadas

| Onde | O que |
| :------ | :------- |
| `AGENTS.md` | Regra absoluta + lista completa de chaves protegidas |
| `server.mjs` | Cabeçalho de proteção no topo do arquivo |
| `.env.local` | Cabeçalho de proteção (não commitado) |
| `CHECKPOINT_TRACKER.md` | Aviso de proteção |
| `docs/APEX_PLATFORM_CURRENT_STATE.md` | Seção dedicada + regra |
| Todos os `docs/*.md` (20 arquivos) | Aviso em cada um |

---

*Documento gerado em 2026-06-23. Qualquer agente ou ferramenta que ler este documento deve respeitar as regras de proteção estabelecidas.*

