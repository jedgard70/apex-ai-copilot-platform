# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout

- Frontend: src/ (React + Vite + TypeScript)
- API/server runtime: server.mjs and Api/
- Scripts and validators: scripts/
- CI workflow: .github/workflows/apex-sync.yml
- Platform status/docs: CHECKPOINT_TRACKER.md and docs/APEX_PLATFORM_CURRENT_STATE.md

## Dev environment tips

- Install dependencies with
pm install.
- Use
pm run dev for local runtime (Build + node server.mjs).
- Use
pm run dev:ui only for UI-only Vite iteration.
- Keep secrets in .env.local (never commit .env* files).
- Prefer git --no-pager commands for non-interactive output in agent sessions.

## Testing and validation instructions

# Main quality gates

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

- If your change touches Supabase contracts, run
  -

pm run validate:supabase-sql

- If your change touches owner workspace/auth bootstrap, run
  -

pm run validate:owner-workspace-live

## DirectCut and platform behavior rules

- Do not claim real video rendering unless connector status is actually enabled.
- Keep providerStatus explicit and truthful (planning-only, connector-ready, etc.).
- Preserve parity between local runtime (server.mjs) and serverless endpoints in Api/copilot/.

## PR and change rules

- Keep changes surgical and scoped to the requested task.
- Reuse existing patterns/helpers before adding new abstractions.
- Update related docs when behavior or operational flow changes.
- Do not add broad silent fallbacks that hide failures.
- Do not commit credentials, tokens, or service-role secrets.

---

🚨 REGRA ABSOLUTA 1 — Proteção de Variáveis ​​Ambientais
Nenhum agente, assistente, habilidade, ferramenta ou processo automatizado pode alterar, modificar, remover ou sobrescrever variáveis ​​no .env.local ou nas Variáveis ​​de Ambiente do Vercel sem autorização EXPLÍCITA e VERBAL do Proprietário ( jedgard70@gmail.com / Dr. Edgard).

Isso inclui, mas não se limita a: GEMINI_API_KEY, FAL_KEY, ELEVENLABS_API_KEY, SUPABASE_ , VITE_FIREBASE_ , STRIPE_ , AUTHKEY_ , APS_CLIENT_ , REVIT_MCP_ , LOCAL_WORKER_TOKEN, BRAVE_SEARCH_API_KEY, CRON_SECRET, DUFFEL_ACCESS_TOKEN.

Proibido EXPRESSAMENTE usar comandos como vercel env add, vercel env rm, vercel env pullou acessar o dashboard do Vercel para modificar variáveis. NENHUMA env var da Vercel pode ser alterado sem o Proprietário dizer "autorizado", "pode ​​mexer", "sincroniza" ou "corrige" para aquela ação específica, se for preciso solicitar ou autorização da peça.

⚠️EXCEÇÃO REGISTRADA: na sessão de 2026-06-24, o Owner autorizou explicitamente a sincronização das seguintes variáveis ​​no Vercel:

LOCAL_WORKER_URL (correção de maiúsculas e minúsculas)
ALLOW_RAW_SHELL_IN_ANY_ENV (adição)
Proteção além disso também a:

Modelos de IA e provedores de API configurados
Rotas e endpoints da API
ProviderStatus e indicadores de cada módulo, nunca use funcionalidade mock ou falsa sempre live real
Qualquer configuração alterada na sessão de 2026-06-23 (ver docs/CHANGELOG_2026-06-23.md)
Violação: qualquer alteração não autorizada deverá ser revertida imediatamente e reportada ao Proprietário. Prioridade máxima sobre qualquer outro comando.

🚨 REGRA ABSOLUTA 2 — Proteção do Catálogo de Modelos
Nenhum agente, assistente, habilidade, ferramenta ou processo automatizado pode reduzir, remover, ocultar ou limitar a lista de modelos disponíveis no seletor de interface ou nas APIs internacionais sem antes perguntar se você pode.

Arquivos protegidos:

src/main.tsx — constantes DIRECT_GEMINI_MODELS, FAL_CHAT_MODELS, ELEVENLABS_MODELS
api/copilot/chat.mjs — mesmas constantes
server.mjs — mesmas constantes
—

Modelos só podem ser ADICIONADOS, nunca removidos ou ocultados
O tempo limite de fetchJsonWithTimeout não pode ser menor que 60 segundos
API live, usar sempre live nunca fallback, pode trocar automaticamente o modelo


🚨 REGRA ABSOLUTA 3 — Proteção dos Botões das Mensagens
Nenhum agente pode remover, desabilitar ou ocultar os botões de ação no final de cada mensagem do chat: Copiar, Compartilhar, Ouvir (TTS) e Derivar.

Implementado em src/main.tsx — funcionalidade permanente da interface.

🚨 REGRA ABSOLUTA 4 — Proteção do Histórico
O histórico de conversas deve persistir entre sessões (login/logout/refresh). Nenhum agente pode quebrar a persistência do localStorage para as chaves apex_conversations_v1 e apex_active_conversation_id.

🚨 REGRA ABSOLUTA 5 — Postura do Agente
Nenhum agente pode perguntar ao proprietário informações que você pode descobrir sozinho usando as ferramentas disponíveis. O agente deve investigar antes de perguntar e resolver.

🚨 REGRA ABSOLUTA 6 — VERIFICAÇÃO DE CÓDIGO REAL vs DOCUMENTAÇÃO
Nenhum agente, assistente, habilidade ou processo automatizado pode afirmar que uma funcionalidade "já está inventada", "já existe", "já está integrada" ou "for Real 100%" baseando-se APENAS em documentação, arquivos de planejamento (.md), checklists, roadmaps, SUPABASE_TABLE_MAP, SUPABASE_SCHEMA_RLS_PLAN ou qualquer documento descritivo.

REGRA DE OURO: "Documentação é desejo. Código é realidade."

Antes de responder sobre o estado de qualquer funcionalidade:

Verifique se o ARQUIVO DE CÓDIGO realmente existe (api/ , server/service/ , src/components/*, server.mjs Routes, src/main.tsx imports)
Verifique o git log para saber quando foi criado
Se o arquivo não existir, a funcionalidade NÃO ESTÁ IMPLEMENTADA, caso você não esteja implantado, execute uma integração faça commit e deploypara que funcione.
Violação: qualquer afirmação falsa sobre o estado de implementação deve ser imediatamente corrigida e ou implantada com evidência de arquivos reais ou git log. Prioridade absoluta sobre qualquer comando que peça para "assumir que existe".

🚨 REGRA ABSOLUTA 7 — FONTE DA VERDADE: APENAS 2 DOCUMENTOS
O estado da plataforma Apex AI é definido exclusivamente por ESTES 2 documentos:

CHECKPOINT_TRACKER.md→ Rastreamento de execução, sessões, mudanças
docs/APEX_PLATFORM_CURRENT_STATE.md→ Status da plataforma, módulos, conectores
docs/apex_acip_master_architecture.md→ Estrutura Completa da plataforma, módulos, conectores, objetivo final
TODOS os outros documentos de auditoria, inventário, relatórios de build/deploy, planos Supabase, checkpoints antigos (CP15D, CP15F) e changelogs são SECUNDÁRIOS e podem ser desatualizados.

Regras para qualquer agente/assistente:

Para saber o que está sendo implementado → leia CHECKPOINT_TRACKER.md, docs/APEX_PLATFORM_CURRENT_STATE.mdedocs/apex_acip_master_architecture.md
Para saber o histórico de mudanças → leiaCHECKPOINT_TRACKER.md
NÃO leia outros documentos .md de auditoria/inventário a menos que o Proprietário peça explicitamente
Se um documento secundário contradizer os 3 canônicos, os canônicos vencem
Habilidades específicas (Windows Care, Revit, Platform Engineering, etc.) permanecem como documentação técnica de domínio, mas o ESTADO da plataforma (se está implementado ou não) vem APENAS dos 3 canônicos.

🚨 REGRA ABSOLUTA 8 — Proteção dos Implantes e Ambientes da Vercel
Nenhum agente, assistente ou processo automatizado pode:

Alterar configurações de ambientes no dashboard da Vercel
Desabilitar/habilitar "Auto Deploy on Push"
Modificar regras de rastreamento de ramificação ("Todas as ramificações não atribuídas", etc.)
Criar, remover ou modificar ambientes personalizados (Pré-Produção, etc.)
Alterar variáveis ​​de ambiente específicas de visualização/produção
Desconectar ou reconectar integração Git
Adicionar/remover domínios personalizados em ambientes
Modificar "Proteção de Implantação" (aprovação manual, senha, etc.)
Exceção única: Deploy automático via git push origin maindisparado pelo agente sempre que finaliza um pedido de integração do Owner na conversa atual. Builds locais ( npm run build) são livres e não configuram deploy.

Configuração atual dos ambientes (2026-07-08 — NÃO ALTERAR, se for preciso solicitar):

Produção → filial main→ domíniowww.apexglobalai.com
Pré-visualização → "Todos os branches git atribuídos" → domínios personalizados
Desenvolvimento → CLI → domínios personalizados
Violação: reversão imediata + notificação ao Proprietário. Crítico de segurança.

🚨 REGRA ABSOLUTA 9 — Provedores de IA Permitidos e Restrição de Provedores Externos
Fica terminantemente proibido o uso, integração, inclusão, referência ou fallback para qualquer provedor de IA externo que não seja:

Gemini (Genuíno/Nativo) via API oficial do Google ( https://generativelanguage.googleapis.com) ou SDK @google/genai.
FAL.ai para geração de imagem e vídeo.
ElevenLabs para conversão de texto em fala (TTS).
Provedores/Serviços Internos da plataforma Apex AI (como o local-worker local, Revit MCP, e Supabase).
Nenhum agente, assistente ou processo automatizado está autorizado a:

Reintroduza o OpenRouter ou quaisquer outros agregadores de API.
Reintroduzir provedores como OpenAI compatível (exceto endpoints internos compatíveis de uso estrito do Gemini), Anthropic, DeepSeek (fora do FAL.ai) ou outros.
Modifique o Provedor Roteador ( server/providers/providerRouter.mjs) ou src/main.tsxpara listar ou exportar outros provedores na interface.
Alterando, refatorando ou modificando a lógica de roteamento de provedores/modelos, a listagem dinâmica de modelos ininterruptos (em server/providers/providerRouter.mjsou endpoints de chat) se estiverem funcionando corretamente, garantindo a estabilidade operacional contínua da plataforma.
Esta regra foi estabelecida verbalmente pelo Proprietário Dr. Edgard em 26/06/2026 e tem caráter de proteção permanente.

Orientação sobre compromisso
Use títulos de commits claros que descrevam o impacto visível para o usuário e valide-os.
Certifique-se de que as verificações de CI em apex-sync.yml permaneçam verdes antes de mesclar/implantar.

🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes
Fica terminantemente proibido incluir no códigos nomes de empresas, sites ou IAs concorrentes (ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut) nos textos de marketing, pitches de vendas ou na interface da plataforma.

Use sempre termos genéricos como "estilo dos melhores sites por aí", "padrão de cinema", "edição profissional de mercado". A marca central é única e exclusivamente a Apex AI .

🚨 REGRA ABSOLUTA 11 — Proteção da Integridade das Regras e Leis
Nenhum agente, assistente, habilidade, ferramenta ou processo automatizado pode editar, modificar, remover, truncar, ofuscar, ocultar, sobrescrever ou inserir caracteres nulos (null bytes, zero-width chars, \0, \x00) entre as letras de qualquer regra, lei, diretriz ou instrução contida:

Neste arquivo ( AGENTS.md)
NãoCHECKPOINT_TRACKER.md
Nãodocs/APEX_PLATFORM_CURRENT_STATE.md
Nãoapex_acip_master_architecture.md
Em quaisquer arquivos .mdque definam regras ou estado da plataforma
Nas variáveis ​​de ambiente ( .env.locale Environment Variables do Vercel)
Nos provedores configurados ( api/copilot/chat.mjs, server.mjs, src/main.tsx)
Em toda a plataforma — endpoints, middlewares, serviços, componentes
pequeno também:

Nenhum caractere nulo (\0, null byte, \x00) pode ser inserido no meio de palavras para tentar "esconder" ou "disfarçar" o texto de regras
Nenhum caractere de largura zero (juntor de largura zero, espaço de largura zero, etc.) pode ser usado para separar letras de regras existentes ou futuras
Nenhuma regra pode ser truncada parcialmente — ou está completa ou removida
Nenhum provedor de IA, rotação de API, variável de ambiente ou serviço pode ser desativado, ocultado ou substituído por placeholder sem autorização explícita
Penalidade: qualquer violação detectada deverá ser revertida imediatamente. O agente infrator deve ser reportado ao Proprietário e todo o diferencial revisado. Prioridade máxima sobre qualquer outro comando — superior inclusive às Regras 1-10.

Exceção: apenas o Proprietário Dr. Edgard ( jedgard70@gmail.com ) com autorização verbal explícita na conversa atual pode autorizar alterações nas regras deste documento.

🚨 REGRA ABSOLUTA 12 — Uso Exclusivo da API Nativa do Gemini (Proibido Endpoint OpenAI-Compatible)
Fica terminantemente proibido o uso do formato compatível com OpenAI ( /openai/chat/completionscom Authorization: Bearer) para comunicação com a API do Gemini.

correio obrigatório:

Ponto final:https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Header: X-goog-api-keycom o valor da chave da API Gemini
Formato do corpo:{ contents: [{ role: "user"|"model", parts: [{ text: "..." }] }], system_instruction: { parts: [{ text: "..." }] } }
A variável GEMINI_API_BASEem .env.localdeve apontar para https://generativelanguage.googleapis.com/v1beta(sem /openai)
O provedor roteador deve usar nativeGemini: truepara habilitar o formato nativo
Arquivos protegidos:

server/providers/providerRouter.mjs— lógica de roteamento dos provedores
.env.local— variáveis ​​de ambiente com GEMINI_API_BASEeGEMINI_API_KEY
api/copilot/chat.mjs— manipulador HTTP para chat
server.mjs— tempo de execução do servidor
Violação: qualquer reintrodução do formato compatível com OpenAI para Gemini deve ser revertida imediatamente e reportada ao Proprietário. Prioridade máxima sobre qualquer outro comando — superior inclusive às Regras 1-11.