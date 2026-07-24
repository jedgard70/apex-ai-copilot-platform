---
name: apex-os-provider-vault
description: Regras de roteamento de IA, Vault de Provedores e Fallback de Motores do ecossistema Apex OS. Use quando o assunto for provedores de LLM, Gemini, OpenAI, Groq, FAL.ai, roteamento de custos, ou fallback local.
---

# Apex OS — Provider Vault & Cost Strategy

Esta skill documenta a estratégia de arquitetura definitiva da **Apex AI** em relação a motores LLM e provedores na nuvem.

## 1. Princípio Fundamental de Fallback e Independência
O ecossistema **Apex OS** não depende exclusivamente de nenhum provider comercial (nem Gemini, nem OpenAI). 
Sempre que uma chamada de IA for feita, a ordem de prioridade de roteamento (Provider Chain) é, de forma estrita:

1. **Apex Runtime (Local Engine)** - Tentativa primária usando o motor nativo customizado (`apex-ai-custom` ou `gemma-12b`).
2. **Gemini** - Fallback primário, caso o motor local esteja desligado ou indisponível.
3. **OpenAI / Groq** - Fallback secundário e APIs comerciais.
4. **FAL.ai** - Provedor focado em inferência paralela (fallback final para modelos OpenSource como Llama e DeepSeek).

## 2. Proteção do `.env` (Regra de Ouro do Owner)
- É terminantemente **PROIBIDO** que agentes ou ferramentas automatizadas alterem, sobrescrevam ou excluam as chaves armazenadas no `.env` (ex: `GEMINI_API_KEY`, `OPENAI_API_KEY`) sem permissão explícita do Owner (Dr. Edgard).
- O arquivo `.env` do Apex OS é espelhado a partir da raiz segura.

## 3. Roteador de Custo (Cost Generation Strategy)
- O sistema varre todos os provedores listados em `providerRouter.mjs`.
- Se o motor local (Apex Runtime) falhar, ele tentará iterar pela lista. 
- O frontend/UI consumirá as chaves da API diretamente pelo ambiente local, evitando interrupções para o usuário (nunca mostrando erros puros, sempre roteando silenciosamente).

## 4. Onde Configurar os Motores?
Toda a orquestração do roteamento e ordem de fallbacks localiza-se estritamente no arquivo:
`services/copilot-api/server/providers/providerRouter.mjs`

Para acionar chamadas sem se preocupar com provedores específicos no backend, basta utilizar:
`chatWithFallback({ messages, preferredModel: "apex-ai-custom", toolRound: 0 })`
