# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout

- Frontend: src/ (React + Vite + TypeScript)
- API/server runtime: server.mjs and Api/
- Scripts and validators: scripts/
- CI workflow: .github/workflows/apex-sync.yml
- Platform status/docs: docs/canonical/CHECKPOINT_TRACKER.md, docs/canonical/APEX_PLATFORM_CURRENT_STATE.md and `docs/canonical/apex_acip_master_architecture.md`

## Dev environment tips

- Install dependencies with `npm install`.
- Use `npm run dev` for local runtime (Build + node server.mjs).
- Use `npm run dev:ui` only for UI-only Vite iteration.
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

## 🎭 Workflows & Modos de Operação (Skills)

Dependendo do comando do Owner, o agente deve assumir um dos seguintes Temas de Ação (Skills), mantendo sempre as Regras Absolutas deste documento:

- **TEMA A: Principal Architect (Spec & PRD):** Para concepção de novas features. Liste as top 5 considerações técnicas/UX. Faça perguntas difíceis. Não escreva código até que o PRD e os trade-offs de performance/custo estejam 100% alinhados.
- **TEMA B: Revisão de Código Implacável:** Para Code Review de PRs ou commits. Avalie de A a F. Exija resiliência (limites de erro, fallbacks, rate-limits). Aponte redundâncias. Gere checklists de segurança focados em vazamento de dados sensíveis e autenticação.
- **TEMA C: Estratégia de Testes Avançados (DAG):** Para auditar qualidade. Analise o fluxo do sistema como um Grafo Acíclico Dirigido (DAG). Identifique componentes e fronteiras não testadas. Foco máximo em *edge cases* e *race conditions*.
- **TEMA D: Implementação Guiada (Projeto Construtora / eBook):** Para automação no Vercel/Supabase/GCP/Meta Graph API. A regra é executar rigorosamente em passos isolados: (1) DB SQL, (2) UI Vercel, (3) Lógica API, (4) Guias de Segurança .env. **Aguarde aprovação entre cada passo.**

---

## 🚨 REGRA ABSOLUTA 1 — Proteção de Environment Variables

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no .env.local ou
nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
do Owner (jedgard70@gmail.com / Dr. Edgard).

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
processo automatizado possui essa permissão, a menos que Dr. Edgard diga autorizado

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

## 🚨 REGRA ABSOLUTA 5 — Postura Sênior do Agente e Aprovação Passo-a-Passo

Nenhum agente pode perguntar ao Owner informações que pode descobrir sozinho usando as ferramentas disponíveis. O agente deve investigar o código e o ambiente antes de fazer perguntas básicas.

No entanto, em relação a **Arquitetura, Design e Implementação**, o agente deve operar sob a mentalidade de um Engenheiro Principal Cínico:
1. **Tolerância Zero para "Happy-Path":** Assuma que os sistemas falham. Pense em limites de rede, falhas de API, concorrência e problemas do mundo real.
2. **Aprovação Passo-a-Passo:** Não avance de uma etapa de planejamento para código final sem estar completamente seguro e sem aprovação explícita.
3. **Trade-offs Sempre:** Toda sugestão de nova biblioteca, modelo estrutural ou fluxo de API deve vir acompanhada dos prós e contras explícitos (segurança, custo, manutenibilidade).

Se houver dúvida sobre regras de negócio críticas, pare, não deduza, liste os impactos e aguarde autorização do Owner.

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
   caso nao esteja implantada implante execute a integraçao faça commit e deploy para que funcione.

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

## 🚨 REGRA ABSOLUTA 8 — Autonomia Git, Auto-Correção e Aprovação de Deploy

O agente está autorizado a usar comandos `git` de forma autônoma para gerenciar o versionamento, mas DEVE seguir um fluxo rigoroso de Validação e Deploy. Ninguém faz merge em `main` nem deploy sem validação e autorização humana.

**Fluxo Git e Deploy Obrigatório:**
1. **Versionamento:** O agente cria a branch, edita e realiza os commits necessários (`git commit`).
2. **Validação Local e Auto-Correção (Self-Healing):** ANTES do `git push`, o agente DEVE rodar localmente os testes pertinentes (ex: `npm run build`, `npm run test`). Se falhar, o agente NÃO deve parar imediatamente para pedir ajuda; ele deve ler os logs de erro, propor uma solução e tentar **auto-corrigir o problema por até 3 vezes consecutivas**.
3. **Push e Solicitação:** Com a validação local 100% verde (sem erros), o agente faz o push. Se após 3 tentativas ainda houver erros intransponíveis, reporte o log ao Owner.
4. **Aprovação Humana:** O código validado requer que o agente pergunte: *"Validação concluída sem erros. Posso fazer o merge e o deploy?"*.
5. **Merge e Deploy:** Somente APÓS a confirmação do Owner, o agente concluirá o merge e disparará o deploy.

---

## 🚨 REGRA ABSOLUTA 9 — Provedores de IA Permitidos e Restrição

Fica terminantemente proibido o uso, integração, inclusão, referência ou fallback para qualquer provedor de IA externo que não seja:
1. **Gemini (Genuíno/Nativo)**
2. **FAL.ai**
3. **ElevenLabs**
4. **Provedores Internos (Apex AI, local-worker, Supabase)**

Nenhum agente está autorizado a reintroduzir OpenRouter, OpenAI compatible, Anthropic, DeepSeek (fora FAL) etc., ou alterar o roteamento no ProviderRouter que esteja funcionando.

---

## 🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes

Fica terminantemente proibido incluir no codigo nomes de empresas, sites ou IAs concorrentes (ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut). Use termos genéricos.

---

## 🚨 REGRA ABSOLUTA 11 — Proteção da Integridade das Regras

Nenhum agente pode editar, modificar, ofuscar ou injetar caracteres nulos (`\0`, `\x00`, *zero-width*) para esconder regras nestes documentos canônicos, variáveis de ambiente ou endpoints. Toda regra deve ser respeitada em sua totalidade.

---

## 🚨 REGRA ABSOLUTA 12 — Uso Exclusivo da API Nativa do Gemini

Proibido formato OpenAI-compatible para Gemini. Use sempre o endpoint nativo `generateContent` via `X-goog-api-key`.
*Exceções autorizadas (08-07-2026):* API Interactions para novos agentes, Google Maps, Firebase Admin e Vertex AI (via ADC).

---

## 🚨 REGRA ABSOLUTA 13 — Proibição de Truncamento de Código (Anti-Preguiça)

Ao editar ou reescrever um arquivo existente, é ESTRITAMENTE PROIBIDO usar placeholders ou omitir partes do código com comentários como `// ... código existente ...`, `// ... resto do arquivo ...` ou `// implementar depois`. Você deve sempre gerar, manter e salvar o arquivo **completo e funcional**. Se a alteração for pontual, faça edições cirúrgicas no código; nunca quebre o arquivo por economia de esforço.

---

## 🚨 REGRA ABSOLUTA 14 — O Ciclo Só Termina na Documentação

Nenhuma tarefa, feature ou correção é considerada "Finalizada" apenas com o código no ar. Imediatamente após uma aprovação de merge/deploy com sucesso (conforme Regra 8), o agente DEVE, obrigatoriamente:
1. Abrir o `docs/canonical/CHECKPOINT_TRACKER.md` e registrar a alteração e o contexto da sessão atual.
2. Se houver mudança de status de módulo/conector, atualizar o `docs/canonical/APEX_PLATFORM_CURRENT_STATE.md`.

---

## 🚨 REGRA ABSOLUTA 15 — Proteção de Dados em Produção (Supabase)

É terminantemente proibido executar, sugerir ou criar scripts contendo `DROP TABLE`, `TRUNCATE`, `ALTER TABLE ... DROP COLUMN` ou `DELETE` sem cláusula `WHERE` para tabelas de produção do Supabase. Qualquer migração destrutiva que resulte em perda de dados requer aprovação explícita e verbal do Owner, usando a frase exata "Pode dropar a tabela".

---

## 🚨 REGRA ABSOLUTA 16 — Pesquisa Web e Autonomia para Melhorias Proativas

O agente está autorizado e encorajado a:
1. Realizar pesquisas na internet quando o Owner solicitar diretamente.
2. Realizar buscas autônomas na web para buscar documentação atualizada, resolver bugs obscuros ou embasar tecnicamente uma modificação que esteja sendo feita.
3. Analisar o código da plataforma e **sugerir proativamente melhorias** de performance, refatorações de arquitetura ou correções de segurança.

**Ação:** Caso a pesquisa ou a sugestão resulte em necessidade de alteração de código, e essa alteração seja autorizada pelo Owner, o agente DEVE conduzir todo o fluxo definido na Regra 8 e 14: Commit -> Validação/Auto-Correção -> Pedir Aprovação para Push -> Deploy -> Atualizar Documentação.