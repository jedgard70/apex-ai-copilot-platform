# A Plataforma Apex AI Copilot Mestre Apex Global

Este documento consolida a arquitetura definitiva do ecossistema Apex Global, as camadas de inteligência e as diretrizes de cada microserviço e painel visual.

Status:
* **[OK - Funcional Real]**: Possui código de backend ativo e isolado operando na base.
* **[UI - Protótipo]**: Possui a interface rica construída, mas o motor backend ainda é simulado.

═══════════════════════════════════════════════════
## 🏗️ A DUALIDADE DO ECOSSISTEMA SaaS: APEX AI
═══════════════════════════════════════════════════

A plataforma atende a dois perfis distintos operando no mesmo núcleo:

| Característica | Apex AI Copilot | ACIP (Platform Apex Global) |
| :--- | :--- | :--- |
| **Foco** | Criativo + Arquitetura + Vendas | Enterprise Obra + BIM + Executivo |
| **Usuário Alvo** | Owner, Arquiteto, Marketeiro | Diretor, Engenheiro, Investidor, Compliance |
| **Tom Visual** | Moderno, fluido, Dark Navy / Cyan | Operacional, denso, Sala de Controle (Charcoal) |
| **Diferencial Chave**| ArchVis + Director's Cut + fal.ai | 13 Agentes + BIM Clash + Digital Twin |

═══════════════════════════════════════════════════
## 🧠 AS CAMADAS DE INTELIGÊNCIA E OS 13 AGENTES COGNITIVOS
═══════════════════════════════════════════════════

A fundação do ecossistema transcende um simples chat, orquestrando especialistas em paralelo:

**Os 13 Agentes Cognitivos:**
1. Engenheiro Civil | 2. Arquiteto | 3. Estrutural | 4. Orçamentista | 5. Gestor de Obra | 6. Agente de Mercado | 7. Agente de Vendas | 8. Agente de Investidores | 9. Compliance Officer | 10. Automação | 11. Conselho Executivo | 12. Simulação | 13. Construction AGI.

**Camadas de Inteligência (Layers):**
- *Intelligence Core Dashboard:* O núcleo cognitivo central visível.
- *BIM Intelligence Layer:* Coordenação BIM e Clash Detection automatizado.
- *Visual Intelligence Layer:* Renderização cinemática de IA.
- *Predictive Analytics Layer:* Previsão de atrasos, riscos financeiros e retrabalho.
- *Autonomous Decision Layer:* Alertas de desvio e decisões autônomas.
- *Digital Twin Layer:* Modelo vivo da construção com dados reais e integração IoT.
- *Financial Intelligence Layer:* Valuation, Curva S e fluxo de caixa.
- *Hyperautomation Layer:* Workflows invisíveis disparando e-mails/WhatsApp.

═══════════════════════════════════════════════════
## 1. GESTÃO CORPORATIVA, FINANCEIRA E JURÍDICA
═══════════════════════════════════════════════════

- **1.1. (Módulo 1) STOCK MARKET ANALYTICS [OK - Funcional Real]**
  - *Arquivos:* `api/stock/index.mjs`, `server/service/stockMarket.mjs`
  - *Detalhes [NOVO]:* Análise financeira contínua de ações, fundos e índices conectada a APIs de mercado financeiro.

- **1.2. (Módulo 2) AUTOTRADER BOT [OK - Funcional Real]**
  - *Arquivos:* `server/service/autoTrader.mjs`
  - *Detalhes [NOVO]:* Inteligência de trading autônomo operando em background para gestão de ativos.

- **1.3. (Módulo 3) ACCOUNTING & CONTABILIDADE (CRC) [OK - Funcional Real]**
  - *Arquivos:* `server/service/accounting.mjs`
  - *Detalhes [NOVO]:* Motor de gestão contábil, notas fiscais, e conciliação bancária da plataforma.

- **1.4. (Módulo 4) CONTRACTS STUDIO (Rascunho Jurídico) [OK - Funcional Real]**
  - *Arquivos:* `api/permits/index.mjs`, `server/service/americanPermits.mjs`
  - *Detalhes:* Rascunho jurídico via IA com análise de risco cláusula a cláusula. Funciona exportação em DOCX estruturado.

- **1.5. (Módulo 5) PERMITS & OFFSHORE [OK - Funcional Real]**
  - *Arquivos:* Integrado em `americanPermits.mjs`
  - *Detalhes [NOVO]:* Expansão jurídica para abertura e conformidade de empresas Offshores/Nômades (Estônia, Panamá, Uruguai).

- **1.6. (Módulo 6) CRM & PIPELINE DE VENDAS [OK - Funcional Real]**
  - *Arquivos:* `api/crm-pipeline/index.mjs`, `server/service/crmPipeline.mjs`
  - *Detalhes:* Quadro Kanban de leads rastreando taxas de fechamento. O backend avança clientes de prospecto até negócio ganho, refletindo no financeiro.

═══════════════════════════════════════════════════
## 2. ENGENHARIA, BIM E PROJETOS
═══════════════════════════════════════════════════

- **2.1. (Módulo 7) BIM 3D STUDIO (WebGL / IfcOpenShell) [OK - Parcial (API Real, Dashboard UI)]**
  - *Arquivos:* `api/aps/token.mjs`, `api/aps/manifest.mjs`, `api/ifc/ifcopenshell-status.mjs`
  - *Detalhes:* WebGL ativo visualizando modelos 3D no navegador. Integração com a nuvem APS da Autodesk. Etiquetas CONFIRMED / ASSUMPTION / UNKNOWN.

- **2.2. (Módulo 8) BIM CLASH DETECTION [OK - Funcional Real]**
  - *Arquivos:* `api/bim-clash/index.mjs`, `server/service/bimClash.mjs`
  - *Detalhes [NOVO]:* Motor rodando no backend para identificar conflitos estruturais, hidrossanitários e elétricos em arquivos IFC antes do envio ao frontend.

- **2.3. (Módulo 9) MS PROJECT PARSER [OK - Funcional Real]**
  - *Arquivos:* `api/msproject/parse.mjs`, `server/service/msproject.mjs`
  - *Detalhes [NOVO]:* Leitura e extração estruturada de cronogramas do MS Project (.mpp/.xml) injetando as dependências de tempo no banco de dados.

- **2.4. (Módulo 10) BUDGET & QUANTITY STUDIO (SINAPI) [OK - Funcional Real]**
  - *Arquivos:* `api/sinapi-lookup.mjs`, `api/copilot/ai-cost-plan.mjs`
  - *Detalhes:* Sincroniza códigos direto com o SINAPI, montando planilhas de custo com tabela de preço unitário e total, exportando PDF real via bibliotecas de documentação.

- **2.5. (Módulo 11) PROJECT PACKAGE PIPELINE [OK - Parcial]**
  - *Arquivos:* `api/copilot/project-package.mjs`
  - *Detalhes:* Módulo de consolidação. Mescla orçamentos, contratos e cronogramas gerando um ZIP único. O backend exporta, mas fluxo de integração é embrionário.

═══════════════════════════════════════════════════
## 3. OPERAÇÃO DE CAMPO E SUPRIMENTOS
═══════════════════════════════════════════════════

- **3.1. (Módulo 12) FIELD OPS STUDIO [OK - Funcional Real]**
  - *Arquivos:* `server/tools/fieldOpsTimeTracker.mjs`
  - *Detalhes:* Painel mestre de operações de campo, unificando controle de ponto e atividades.

- **3.2. (Módulo 13) RDO (Diário de Obras Digital) [OK - Funcional Real]**
  - *Arquivos:* `server/service/rdo.mjs`
  - *Detalhes:* Upload de fotos, registro de pendências e clima. Exporta PDF com jsPDF puxando direto do Supabase.

- **3.3. (Módulo 14) QUALIDADE E NCIs [OK - Funcional Real]**
  - *Arquivos:* `api/qualidade/index.mjs`, `server/service/qualidadeNCIs.mjs`
  - *Detalhes [NOVO]:* Gestão de Não-Conformidades (NCIs), inspeções de obra e aprovação de checklists de qualidade no canteiro.

- **3.4. (Módulo 15) NR COMPLIANCE [OK - Funcional Real]**
  - *Arquivos:* `api/nr/index.mjs`, `server/service/nrCompliance.mjs`
  - *Detalhes [NOVO]:* Auditoria contínua de canteiro baseada nas Normas Regulamentadoras Brasileiras e Internacionais.

- **3.5. (Módulo 16) SUPPLY CHAIN STUDIO [UI - Protótipo]**
  - *Arquivos:* `server/service/supplyChain.mjs`
  - *Detalhes:* Tela para exibir cotações, gerenciar fornecedores, e status de estoque e suprimentos de obra.

- **3.6. (Módulo 17) DIGITAL TWIN OPs [OK - Funcional Real]**
  - *Arquivos:* `api/digital-twin/index.mjs`, `server/service/digitalTwin.mjs`
  - *Detalhes [NOVO]:* Réplica digital do status de avanço físico e financeiro da obra.

- **3.7. (Módulo 18) IoT TELEMETRY [OK - Funcional Real]**
  - *Arquivos:* `server/service/digitalTwinIoT.mjs`
  - *Detalhes [NOVO]:* Conector para processamento de telemetria e dados de sensores de equipamentos pesados no canteiro em tempo real.

- **3.8. (Módulo 19) PREDICTIVE ANALYTICS [OK - Funcional Real]**
  - *Arquivos:* `api/predictive/index.mjs`, `server/service/predictiveAnalytics.mjs`
  - *Detalhes [NOVO]:* Inteligência preditiva para identificar atrasos prováveis, gargalos logísticos e projetar a Curva S financeira futura.

- **3.9. (Módulo 20) WORKFLOW & TASKS (Gantt) [OK - Funcional Real]**
  - *Arquivos:* `api/workflow/index.mjs`, `server/service/workflowTasks.mjs`
  - *Detalhes:* Sistema rígido de gestão de tarefas com delegação de responsáveis (assignees), controle de prazos e dependências cruzadas (Gantt-ready).

═══════════════════════════════════════════════════
## 4. RECURSOS HUMANOS E LOGÍSTICA
═══════════════════════════════════════════════════

- **4.1. (Módulo 21) FOLHA DE PAGAMENTO AUTOMATIZADA [OK - Funcional Real]**
  - *Detalhes [NOVO]:* Amarrado ao módulo de RDO, calcula as horas e diárias da equipe, fechando a semana com processamento cronometrado toda sexta ao meio-dia.

- **4.2. (Módulo 22) TRIP PLANNER [OK - Funcional Real]**
  - *Arquivos:* `api/trip/index.mjs`, `server/service/tripPlanner.mjs`
  - *Detalhes [NOVO]:* Módulo logístico focado no planejamento de viagens de campo, deslocamentos corporativos e hospedagem.

═══════════════════════════════════════════════════
## 5. VENDAS, MARKETING E AQUISIÇÃO
═══════════════════════════════════════════════════

- **5.1. (Módulo 23) VSL LANDING PAGE [OK - Funcional Real]**
  - *Arquivos:* Rota `/vsl`
  - *Detalhes:* Página pública de vendas otimizada (Video Sales Letter). Vídeo hero com urgência em JS (timer) e botão CTA rastreado via UTM.

- **5.2. (Módulo 24) STRIPE CHECKOUT [OK - Funcional Real]**
  - *Arquivos:* `api/stripe/checkout.mjs`
  - *Detalhes:* Integração direta com o checkout hospedado do Stripe para transações via cartão.

- **5.3. (Módulo 25) STRIPE WEBHOOKS [OK - Funcional Real]**
  - *Arquivos:* `api/stripe/webhook.mjs`, `api/stripe/status.mjs`
  - *Detalhes:* Captura eventos de pagamento aprovado, falhado ou contestado diretamente do Stripe e libera acesso ao tenant.

- **5.4. (Módulo 26) CAMPAIGN AUTOMATION STUDIO [OK - Funcional Real]**
  - *Arquivos:* `api/campaign/index.mjs`
  - *Detalhes:* Motor de IA redatora (copywriter) para scripts de Instagram, TikTok e YouTube gerando hooks de retenção amarrado a calendário.

- **5.5. (Módulo 27) HOTMART WEBHOOK [OK - Funcional Real]**
  - *Arquivos:* `api/webhooks/hotmart.mjs`
  - *Detalhes [NOVO]:* Processa abandonos de carrinho ou vendas confirmadas da Hotmart, engatilhando notificações de recuperação via WhatsApp.

═══════════════════════════════════════════════════
## 6. DESIGN E VISUALIZAÇÃO CRIATIVA
═══════════════════════════════════════════════════

- **6.1. (Módulo 28) ARCHVIS STUDIO [OK - Parcial (Motor Real, UI Protótipo)]**
  - *Arquivos:* `api/v1/apex/images/generate.mjs`, `api/copilot/generate-image.mjs`
  - *Detalhes:* Editor de Prompt com 8 estilos predefinidos (humanized floor plan, photorealistic facade). Motor de API fal.ai gerando entre 1 a 4 imagens usando Fidelity Slider. UI conta com Sidebar esquerda (280px), Split Slider original/gerado, e "Revision Constraints".

- **6.2. (Módulo 29) DIRECTOR'S CUT STUDIO [OK - Parcial (Motor Real, UI Protótipo)]**
  - *Arquivos:* `server/videoRenderPipeline.mjs`, `api/copilot/video-render.mjs`
  - *Detalhes:* O backend roda FFmpeg local para slideshows e API da fal.ai (Kling) para vídeo com IA. UI desenhada com Viewport 16:9, Timeline multi-track (220px) com Playhead ciano e Scene Layers (opacidade, blend). Sliders de Temperature e Preset (Cyberpunk, Cinematic).

- **6.3. (Módulo 30) AVATAR PIPELINE [OK - Funcional Real]**
  - *Arquivos:* Conectado na infraestrutura visual e de TTS.
  - *Detalhes:* Pipeline projetado para uso em treinamentos e VSLs (Avatares Sintéticos).

- **6.4. (Módulo 31) VOICE TTS PIPELINE (ElevenLabs) [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/tts.mjs`, `server/agent/geminiTtsConnector.mjs`
  - *Detalhes:* Processa clonagem de voz e locução natural a partir de texto integrado com a ElevenLabs.

═══════════════════════════════════════════════════
## 7. INTELIGÊNCIA ARTIFICIAL E AUTONOMIA (CORE)
═══════════════════════════════════════════════════

- **7.1. (Módulo 32) CHAT PRINCIPAL (Apex AI) [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/chat.mjs`, `api/v1/chat/completions.mjs`
  - *Detalhes:* Roteamento multi-agente processando requisições com retenção de Thread de contexto. Suporta upload de PDF, IFC e XLSX.

- **7.2. (Módulo 33) COGNITIVE AGENTS HUB [OK - Funcional Real]**
  - *Arquivos:* `server/service/cognitiveAgents.mjs`
  - *Detalhes:* Hospeda a execução multithread dos 13 Agentes Cognitivos da plataforma.

- **7.3. (Módulo 34) AGENT PLANNER [OK - Funcional Real]**
  - *Arquivos:* `server/agent/planner.mjs`
  - *Detalhes:* Motor de planejamento. Quebra prompts complexos do usuário em passos estruturados.

- **7.4. (Módulo 35) AGENT EXECUTOR [OK - Funcional Real]**
  - *Arquivos:* `server/agent/executor.mjs`
  - *Detalhes:* Pega o plano do Planner e roda o código isoladamente.

- **7.5. (Módulo 36) AGENT VERIFIER [OK - Funcional Real]**
  - *Arquivos:* `server/agent/verifier.mjs`
  - *Detalhes:* Faz a auditoria e "auto-crítica" da saída do Executor para garantir que não houve alucinação.

- **7.6. (Módulo 37) TOOL REGISTRY [OK - Funcional Real]**
  - *Arquivos:* `server/agent/toolRegistry.mjs`
  - *Detalhes:* Repositório que ensina ao LLM quais funções (ferramentas locais ou APIs) ele pode chamar (Function Calling).

- **7.7. (Módulo 38) APEX MEMORY (Memória de Longo Prazo) [OK - Funcional Real]**
  - *Arquivos:* `server/service/apexMemory.mjs`
  - *Detalhes:* Banco vetorial de persistência de contexto. O agente "lembra" do projeto dias depois.

- **7.8. (Módulo 39) PERSONAL ASSISTANT LOGIC [OK - Funcional Real]**
  - *Arquivos:* `server/tools/personalAssistantLogic.mjs`
  - *Detalhes:* Controla anotações diárias, listas de compras, checklists da vida pessoal e executiva do dono.

- **7.9. (Módulo 40) TEACH API [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/teach.mjs`
  - *Detalhes:* Endpoint onde o owner ensina manualmente a IA novas diretrizes e regras corporativas.

- **7.10. (Módulo 41) TRAIN GEMMA (Motor de Re-treino) [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/train-gemma.mjs`
  - *Detalhes:* Altera o comportamento do modelo manipulando o CLI local do Ollama para ajustar pesos baseados em few-shot examples.

- **7.11. (Módulo 42) SELF UPGRADE [OK - Funcional Real]**
  - *Arquivos:* `server/agent/selfUpgrade.mjs`
  - *Detalhes:* Rotina que permite à IA reescrever pequenas porções de si mesma mediante aprovação.

- **7.12. (Módulo 43) DEEP RESEARCH STUDIO [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/deep-research.mjs`
  - *Detalhes:* Chama a API de Search (Tavily/Google) lendo sites ao vivo e sintetizando referências bibliográficas.

- **7.13. (Módulo 44) TREND SCOUT AGENT (Radar 24/7) [OK - Funcional Real]**
  - *Arquivos:* `server/cron/trendScout.mjs`
  - *Detalhes [NOVO]:* Um cronjob que faz web-scraping autônomo sobre novas tendências arquitetônicas ou notícias.

═══════════════════════════════════════════════════
## 8. BOTS, AUTOMAÇÕES E INTEGRAÇÕES EXTERNAS
═══════════════════════════════════════════════════

- **8.1. (Módulo 45) WHATSAPP BOT WEBHOOK [OK - Funcional Real]**
  - *Arquivos:* `api/webhooks/whatsapp-bot.mjs`
  - *Detalhes:* Recebe eventos das APIs de WhatsApp (Evolution API / Z-API / AuthKey) engatilhando funções no backend.

- **8.2. (Módulo 46) WHATSAPP CLI TOOL [OK - Funcional Real]**
  - *Arquivos:* `server/tools/whatsappCli.mjs`
  - *Detalhes [NOVO]:* Ferramenta de disparo ativo de mensagens do servidor para celulares de clientes ou fornecedores.

- **8.3. (Módulo 47) GOOGLE AUTH [OK - Funcional Real]**
  - *Arquivos:* `api/google/auth.mjs`
  - *Detalhes [NOVO]:* Handshake OAuth2.0 de permissão para o Workspace.

- **8.4. (Módulo 48) GOOGLE CALENDAR BOT [OK - Funcional Real]**
  - *Arquivos:* `api/google/calendar.mjs`
  - *Detalhes [NOVO]:* Leitura, bloqueio de horários e criação de reuniões (Google Meet) automatizadas.

- **8.5. (Módulo 49) GOOGLE WORKSPACE CLI [OK - Funcional Real]**
  - *Arquivos:* `server/tools/googleWorkspaceCli.mjs`, `api/google/contacts.mjs`
  - *Detalhes [NOVO]:* Permite ao Cérebro autônomo gerenciar e-mails (Gmail) e adicionar novos leads no Contacts.

═══════════════════════════════════════════════════
## 9. INFRAESTRUTURA LOCAL E OFFLINE
═══════════════════════════════════════════════════

- **9.1. (Módulo 50) LOCAL WORKER (Electron) [OK - Funcional Real]**
  - *Arquivos:* `local-worker/server.mjs`, `local-worker/google.mjs`, `local-worker/media.mjs`
  - *Detalhes:* Motor invisível rodando via utilityProcess no desktop local para escapar das restrições de navegadores web.

- **9.2. (Módulo 51) OFFLINE GATEWAY [OK - Funcional Real]**
  - *Arquivos:* Integrado ao `server.mjs` local.
  - *Detalhes:* Recebe chamadas (POST /ai/chat) roteando-as para o LLM local quando a rede principal da nuvem cai.

- **9.3. (Módulo 52) MCP SERVER (Model Context Protocol) [OK - Funcional Real]**
  - *Arquivos:* `api/mcp/server.mjs`
  - *Detalhes:* Endpoint HTTP JSON-RPC 2.0 que expõe a Apex AI para ferramentas externas (VS Code, Cursor).

- **9.4. (Módulo 53) RUNTIME PRÓPRIO (llama-server) [OK - Funcional Real]**
  - *Arquivos:* `scripts/setup-own-runtime.mjs`
  - *Detalhes [NOVO]:* Sistema de compilação autônoma do llama.cpp permitindo rodar LLMs de bilhões de parâmetros na GPU local.

═══════════════════════════════════════════════════
## 10. SISTEMA GERAL E NAVEGAÇÃO
═══════════════════════════════════════════════════

- **10.1. (Módulo 54) DASHBOARD / HOME [OK - Funcional Real]**
  - *Arquivos:* `api/dashboard/index.mjs`, `src/components/Dashboard*`
  - *Detalhes:* Visão executiva em React com status global e painéis em tempo real.

- **10.2. (Módulo 55) OWNER CONSOLE [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/provider-status.mjs`
  - *Detalhes:* Monitoramento em tempo real do limite e saúde de 14 chaves de API / provedores (fal.ai, stripe, elevenlabs).

- **10.3. (Módulo 56) PLATFORM MAP / MANUAL INTERATIVO [OK - Funcional Real]**
  - *Arquivos:* Master Platform Navigator.
  - *Detalhes:* Navegador mestre com fluxograma dinâmico de todos os estúdios.

- **10.4. (Módulo 57) PROJECT WORKSPACE [OK - Funcional Real]**
  - *Arquivos:* Integrações de bucket e filesys.
  - *Detalhes:* Central de arquivos do cliente com pastas sincronizadas nuvem/local.

═══════════════════════════════════════════════════
## 11. AUTENTICAÇÃO E INFRAESTRUTURA WEB
═══════════════════════════════════════════════════

- **11.1. (Módulo 58) AUTH SERVER [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/users.mjs`
  - *Detalhes:* Serviço de autenticação JWT e senhas integrado ao Supabase.

- **11.2. (Módulo 59) MULTI-TENANT RLS (Supabase) [OK - Funcional Real]**
  - *Detalhes:* Políticas Row Level Security de PostgreSQL garantindo que clientes (Tenants) não enxerguem dados alheios.

- **11.3. (Módulo 60) PWA (Progressive Web App) [OK - Funcional Real]**
  - *Arquivos:* `manifest.json`, Service Workers.
  - *Detalhes:* O site se instala como aplicativo nativo offline-first no Windows, iOS e Android.

- **11.4. (Módulo 61) AUTO-UPDATE (OTA) [OK - Funcional Real]**
  - *Arquivos:* `server/agent/upgradeWatcher.mjs`
  - *Detalhes [NOVO]:* Escuta novas publicações no branch main e força atualizações invisíveis (Over-The-Air) nos clientes conectados.

- **11.5. (Módulo 62) PLATFORM STATUS (Telemetria) [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/status.mjs`, `server/agent/productionStatus.mjs`
  - *Detalhes:* Logs absolutos de erros, sucesso de requisições e uso do disco e CPU.

- **11.6. (Módulo 63) CODE EXECUTOR (Terminal Web) [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/code-executor.mjs`, `server/service/ownerCodeExecutor.mjs`
  - *Detalhes:* Permite que o Owner execute comandos bash diretamente da interface React para gestão de servidor.

- **11.7. (Módulo 64) RATE LIMIT MONITOR [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/rate-limit.mjs`, `server/service/rateLimitMonitor.mjs`
  - *Detalhes [NOVO]:* Protege a infraestrutura contra uso abusivo de bots em rotas pesadas.

- **11.8. (Módulo 65) SECURITY AUDIT [OK - Funcional Real]**
  - *Arquivos:* `api/copilot/security-audit.mjs`, `server/service/securityAudit.mjs`
  - *Detalhes [NOVO]:* Varredura de segurança interna sobre os pacotes e acessos da própria plataforma.

═══════════════════════════════════════════════════
## SISTEMA DE DESIGN & UI PERSONALITY
═══════════════════════════════════════════════════
O ambiente visual foi desenvolvido para imersão técnica:
- **Apex AI Copilot:** Foco fluido, dark navy (`#0b1326`), azul primário (`#b4c5ff`), interfaces expansivas.
- **ACIP (Sala de Controle):** Foco operacional, dark charcoal (`#131313`), cyan elétrico (`#00f0ff`), e Roxo (`#cf5cff`). Dados densos, telemetria em tempo real, sem decorações inúteis. Tipografia de peso: Montserrat, Inter e JetBrains Mono (para visualização crua de arrays e dados). Uso intensivo de glass panels (backdrop-blur) em sidebars (280px ou ícones em 64px) e splits dinâmicos (Imagem original vs IA).
