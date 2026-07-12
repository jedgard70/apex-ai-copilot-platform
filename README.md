# Plataforma Apex AI Copilot

Reconstrução completa da plataforma Apex AI Copilot, o sistema operacional da construção inteligente.

## Princípios da Arquitetura:

- O chat é a plataforma principal de interação.
- O Apex AI Copilot é o agente central de orquestração.
- Os 67 módulos operacionais (como Budget, BIM 3D, Contracts, RDO, DirectCut, Digital Twin) são ferramentas acionadas autonomamente pelo Copiloto.
- Sem painéis/cartões como principal fonte de informação. As ferramentas são ativadas na interface conforme o contexto da conversa.
- Inteligência Multimodal: Integração nativa com Gemini (Interactions API / `@google/genai`), FAL.ai (imagens/vídeo), e ElevenLabs (Áudio/Avatar).
- Ambiente Unificado: Funciona via Web (Vercel), Desktop App (Electron Windows) e Mobile PWA (Service Worker v2 offline).

**Referência Canônica e Status da Plataforma:**
A fonte de verdade operacional (atualmente com 67 capabilities LIVE e verificadas) encontra-se nos seguintes arquivos:
- `docs/APEX_PLATFORM_CURRENT_STATE.md`
- `CHECKPOINT_TRACKER.md`
- `docs/apex_acip_master_architecture.md`

## Motores de IA e Provedores

A plataforma evoluiu além de dependências antigas (como Ollama), consolidando a inteligência primária na stack avançada do Google Gemini e em um motor local próprio:

- **Gemini (Primário)**: Modelos avançados (`gemini-3.5-flash`, `gemini-3.1-pro-preview`, etc.) consumidos via API oficial.
- **Gemini Interactions (Agentes Avançados)**: Suporte aos modelos de agente inteligente `deep-research`, `antigravity-preview` e `veo-3.1`.
- **Apex Runtime (Local/Offline)**: Motor secundário proprietário servindo modelos GGUF (`apex-ai-2.0`, `gemma-2b-it-gguf`, `phi-3-mini-gguf`) localmente, totalmente isolado e compatível com o OpenAI spec (porta 1337).
- **Ecossistema Gráfico e Voz**: Integrados diretamente via FAL.ai para gerações pesadas de IA e ElevenLabs para vozes neurais hiper-realistas.

## Implantação, CI/CD e Autonomia de Deploy

- A esteira de integração e deploy (CI/CD) possui total autonomia para os agentes da plataforma (Engine Antigravity). Os agentes podem ler, reescrever e compilar códigos localmente para garantir o funcionamento.
- O GitHub Actions executa a validação de testes E2E antes da Vercel assumir a implantação na branch `main`.
- Nenhum agente ou IA está autorizado a alterar os ambientes no dashboard web da Vercel ou modificar as **Variáveis de Ambiente** (`.env.local`) sem permissão expressa e verbal do Owner.

## Tempo de Execução Local

Configuração base para rodar o projeto `.env.local` (apenas variáveis estruturais listadas, credenciais não versionadas):

```env
VITE_SENTRY_DSN=
SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_TRACES_SAMPLE_RATE=0.2
APEX_RUNTIME_ENABLED=true
```

**Para iniciar o servidor web (Frontend Vite + Backend Node integrados):**

```bash
npm run dev
```

**Para compilar e gerar o aplicativo nativo para Windows (Electron):**

```bash
npm run electron:build
```
*(O App Desktop roda com `electron-main.cjs`, levantando o servidor interno Node sem depender de nenhum navegador local, conectando local workers perfeitamente.)*

**Para compilar e rodar testes estruturais E2E no Playwright (sem travar processos Node):**

```bash
npm run test:e2e
```

## Segurança e Sincronização de Dados

A plataforma utiliza um ecossistema escalável focado em multitenancy rigoroso (múltiplos projetos/clientes isolados):
- **Supabase**: Controle central de autenticação e banco de dados relacional poderoso via PostgreSQL + Row Level Security (RLS).
- Sincronização híbrida avançada: Módulos como o **Field Operations / RDO** salvam dados e mídias pesadas na API de projeto, sincronizando relatórios completos para a cloud com sucesso logo que o Bootstrap de Sessão de locatário (Tenant) termina o handshake.
