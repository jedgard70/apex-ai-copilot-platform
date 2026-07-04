# 🧠 Apex AI 2.0 - Core Memory Update (v6.0)

Este documento registra as implementações, refatorações e integrações arquiteturais concluídas no ecossistema da APEX AI durante a mais recente janela de atualizações. Estes dados servem como Memória Base (RAG/Context) para a própria IA compreender a estrutura da plataforma.

## 1. O que foi integrado? (Visão Geral)
Nós evoluímos o **Daemon (Local Worker)** de um simples executor de scripts de terminal para um **Orquestrador Corporativo Local (Edge)** capaz de gerenciar finanças, marketing e renderização pesada, enquanto o banco de dados Supabase assumiu o controle do estado e da nuvem.
As principais entregas foram:
1. **WhatsApp Billing & Notificações:** Automação de WhatsApp "invisível" integrada ao servidor.
2. **Máquina de Vendas e Afiliados (RBAC):** Rastreio de leads via `?ref=` no front-end Vercel e cálculo de comissões via Banco de Dados Relacional.
3. **Fila de Renderização Nativa:** Sistema de enfileiramento (Render Queue) para rodar o Blender em background sem travar a interface da IA (Bypass de Gargalo de UI).
4. **Resumo de PDFs para PPTX:** Síntese autônoma e geração de slides corporativos.
5. **Backoffice e Marketing Skills:** Personas da IA especializadas em leitura de NF (OCR) e VSL/Landing Pages.

## 2. Onde mudou? (Mapeamento de Código)

### Backend Local (`local-worker/`)
- `local-worker/whatsapp.mjs`: [NOVO] Módulo isolado rodando o `whatsapp-web.js` para sequestrar a sessão do WPP local e injetar mensagens na rede.
- `local-worker/server.mjs`: [MODIFICADO] 
  - Criação da rota `POST /novo-projeto` para fechar vendas e disparar comissões no Supabase.
  - Criação da Fila de Renderização (Array Memory) com execução Assíncrona e aviso no WhatsApp quando o vídeo termina.
  - Exposição de `POST /whatsapp/send` para disparo de cobranças.

### Nuvem e Dados (`scripts/` e Supabase)
- `scripts/supabase_affiliates_rbac.sql`: [NOVO] A tabela-mãe. Cria `usuarios`, `projetos` e `comissoes`. Estrutura as regras de comissionamento de Afiliados de forma exata.
- `scripts/generate_pptx.mjs`: [NOVO] Ferramenta em Node para fabricar apresentações PowerPoint.
- `scripts/gerador_dataset.mjs`: [NOVO] Script focado em ler arquivos brutos da construtora (.txt, .pdf) e convertê-los via IA (LLM-as-a-Judge) para o formato exato JSONL exigido no Fine-tuning do Gemma com Unsloth.

### Front-end Vercel (`src/`)
- `index.html`: [MODIFICADO] Injeção da tag `<script>` na raiz para interceptar URLs com `?ref=` e salvar o código do parceiro comercial no `localStorage` do navegador do cliente.

### Personalidades (Skills) da IA (`.agents/skills/`)
- `marketing-automation`: IA focada em campanhas.
- `backoffice-automation`: IA com visão computacional para processar recibos, notas fiscais e gerar contratos de prestação de serviço.
- `blender-automation`: Otimizado para integrar VFX (Neon/Bloom) com a Fila de Renderização.

## 3. Para que serve tudo isso? (Impacto Estratégico)
Essa arquitetura fecha o ciclo completo de uma **Construtech Autônoma**:
- **Atração (Afiliados/Tracking):** Parceiros trazem clientes e o sistema rastreia e comissiona automaticamente, garantindo tráfego barato.
- **Fechamento (WhatsApp):** O disparo imediato de uma mensagem de comissão no celular do vendedor gera um forte ciclo de feedback positivo ("Injeção de Dopamina").
- **Produção (Render Queue):** O cliente quer maquetes pesadas (Neon/Cycles)? A IA codifica e envia para a fila; a máquina trabalha nas sombras enquanto a interface fica livre.
- **Soberania (Gemma Fine-tuning):** O `gerador_dataset.mjs` pavimenta a estrada para o Endgame, gerando os dados de base para treinar os pesos do nosso próprio modelo Open-Source local e zerar dependência de APIs em nuvem.

### Evolu��es Adicionadas em 03 de Julho de 2026:
1. **Trava de Seguran�a (HITL - Human in the Loop):** Rota /run/approve implementada no local-worker para aprova��o de postagens.
2. **Conectores do Google Cloud (Fase 4):** Cria��o do local-worker/google.mjs estruturado para receber google-credentials.json.
3. **M�quina Omnichannel:** Integrados ElevenLabs, FAL.ai e Brave Search.
4. **Motor Nativo:** Purifica��o do .env eliminando Ollama, utilizando motor Gemma nativo.
5. **Arquitetura Event-Driven (n8n + WhatsApp HITL):** A publica��o omnichannel agora � terceirizada para o n8n via Webhook. O processo passa obrigatoriamente por uma aprova��o ativa do CEO (Modo CEO) no WhatsApp antes do gatilho final, garantindo risco de imagem zero e escalabilidade infinita.
