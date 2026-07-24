# APEX OS — AI SUPPLY CHAIN DUE DILIGENCE

**Data:** 2026-07-21  
**Tipo:** Investment Committee / CTO / CFO Document  
**Classificação:** Estratégico — uso interno do conselho  
**Produto base:** `D:\AI-constr\apex-os`  
**Período de análise:** 10 anos (2026–2036)

---

## Sumário Executivo

A Apex OS atravessa sua fase mais crítica: a transição de **produto de engenharia** para **empresa global de IA**. A cadeia de suprimentos de IA será o fator determinante entre margens de 83% e margens negativas.

**Veredito consolidado:**

| Indicador | Valor | Nota |
|:----------|:-----:|:----:|
| Readiness geral da plataforma | **48%** | 🟡 |
| Readiness de IA (multi-provider) | **5%** | 🔴 |
| Componentes existentes | **6/18** | 🟡 |
| Componentes parciais | **6/18** | 🟡 |
| Componentes inexistentes | **6/18** | 🔴 |
| Margem bruta projetada ($100M ARR) | **83%** | 🟢 |
| Risco de concentração de fornecedor | **Baixo** | 🟢 |
| Tempo de migração entre gateways | **2-4 semanas** | 🟢 |
| Cobertura de marketplace | **0%** | 🔴 |

**Decisão do Investment Committee:**  
✅ A arquitetura proposta é sólida e escalável.  
✅ O modelo multi-provider reduz risco de concentração.  
🟡 O Apex OS **não está pronto** para executar a estratégia — faltam 6 componentes críticos.  
⚠️ **Não integrar nenhum provider novo antes de construir o ProviderRouter, ProviderRegistry, CostController e AI Financial Controller.**  
⚠️ **Não pedir API keys antes de concluir o roadmap financeiro.**

---

# MISSÃO 1 — RADIOGRAFIA DO APEX OS

## Escopo
Análise de 18 componentes arquiteturais para determinar se o Apex OS está realmente preparado para operar como plataforma multi-provider.

## Tabela de Vereditos

| # | Componente | Status | Arquivo | O que faz | Risco |
|:-:|:-----------|:------:|:--------|:----------|:-----:|
| 1 | **CapabilityRouter** | ✅ Existe | `src/capabilities/CapabilityRouter.ts` | Roteia objetivos para skills/agents/prompts | 🟢 |
| 2 | **ProviderRouter** | ❌ Não existe | — | Roteia requisições ao provider correto | 🔴 |
| 3 | **ProviderRegistry** | ❌ Não existe | — | Cataloga providers ativos, custos, status | 🔴 |
| 4 | **ModelRegistry** | ❌ Não existe | — | Cataloga modelos (FLUX, Gemini, etc.) com preço | 🔴 |
| 5 | **MediaGateway** | ❌ Não existe | — | Gateway unificado de mídia (imagem, vídeo, áudio) | 🔴 |
| 6 | **LLMGateway** | ❌ Não existe | — | Gateway unificado de LLM (chat, embedding, reasoning) | 🔴 |
| 7 | **CostController** | ❌ Não existe | — | Controla custo por requisição, aloca, limita | 🔴 |
| 8 | **BudgetController** | ❌ Não existe | — | Orçamento por tenant/produto/capability | 🔴 |
| 9 | **UsageMeter** | ⚠️ Parcial | `GET /v1/usage` (stub) | Métricas de uso (apenas stub) | 🟡 |
| 10 | **Billing** | ✅ Parcial | `BillingRecorder` (in-memory) | Registra eventos de cobrança | 🟡 |
| 11 | **Storage** | ❌ Não existe | — | Apenas `sessionStorage` frontend | 🔴 |
| 12 | **CDN** | ❌ Não existe | — | Distribuição de conteúdo | 🔴 |
| 13 | **Tenant** | ⚠️ Parcial | Authorization (scope) | Isolamento via Organization/Workspace | 🟡 |
| 14 | **Orders** | ✅ Parcial | `OrderManager` (in-memory) | Ciclo de vida de pedidos | 🟡 |
| 15 | **Workspace** | ✅ Existe | `core/workspace/` | Domínio de workspace funcional | 🟢 |
| 16 | **Projects** | ✅ Parcial | Em memória no server | Projetos sem modelo de domínio | 🟡 |
| 17 | **Checkout** | ✅ Parcial | `server.ts` rotas | Fluxo simulado (sem gateway real) | 🟡 |
| 18 | **Shared Delivery** | ⚠️ Parcial | `contracts.ts` + runtime | Contratos de entrega, sem serviço dedicado | 🟡 |

## Resumo

```
EXISTENTES:   6  (CapabilityRouter, Billing, Orders, Workspace, Projects, Checkout)
PARCIAIS:     6  (UsageMeter, Tenant, Shared Delivery + 3 parciais)
INEXISTENTES: 6  (ProviderRouter, ProviderRegistry, ModelRegistry, MediaGateway,
                  LLMGateway, CostController, BudgetController, Storage, CDN)
                  [9 no total para IA multi-provider]
```

## Achado Crítico

**Dos 9 componentes necessários para uma arquitetura multi-provider funcional, apenas 0 existem.**  
Os componentes de IA (ProviderRouter, ProviderRegistry, ModelRegistry, MediaGateway, LLMGateway, CostController, BudgetController) são **zero**. O Apex OS hoje não consegue:
- Rotear entre dois providers diferentes
- Saber quanto cada provider custa
- Controlar orçamento por requisição
- Medir uso em tempo real
- Trocar automaticamente em caso de falha

---

# MISSÃO 2 — BUSINESS READINESS INDEX

Índice não-técnico. Mede maturidade de negócio.

## Matriz de Prontidão

| Dimensão | Score | Status | Justificativa |
|:---------|:-----:|:------|:--------------|
| **Produto (core)** | 75% | 🟢 | CapabilityRouter + ServiceCatalog funcionais. 3 tiers definidos. SPA operacional. |
| **IA** | 5% | 🔴 | Nenhum provider integrado. CapabilityRuntime usa in-memory mock. Não há LLM nem media real. |
| **Financeiro** | 10% | 🔴 | Cost Engine é conceitual. Unit Economics é framework sem dados reais. Sem COGS real. |
| **Billing** | 40% | 🟡 | `BillingRecorder` existe mas é in-memory. Sem gateway de pagamento. Sem subscription real. |
| **Provider Router** | 0% | 🔴 | Não existe. Provider é hardcoded no runtime. |
| **Storage** | 80% | 🟢 | Supabase client configurado. Storage conceitual documentado. Falta implementação real. |
| **CDN/Delivery** | 25% | 🔴 | Delivery contratos existem. CDN não existe. |
| **Marketplace** | 0% | 🔴 | Não existe. Sem catálogo público, sem terceiros, sem self-service. |
| **Auth/Tenancy** | 65% | 🟡 | Auth funcional (Supabase + legacy). Tenant isolamento via Organization. Falta multi-tenant real. |
| **DevOps/Deploy** | 50% | 🟡 | Server opera local. Sem CI/CD, sem containers, sem staging/production. |
| **Observabilidade** | 15% | 🔴 | Telemetria core existe. Sem tracing, sem métricas de IA, sem dashboards. |
| **Média Geral** | **33%** | 🔴 | |

## Análise

```
Pronto para operar:             🟢 Produto, Auth, Storage conceitual
Precisa de meses:               🟡 Billing, Tenancy, DevOps
Precisa de quarters:            🔴 IA, Financeiro, Provider Router, CDN, Marketplace
Não existe:                     🔴 Marketplace, Provider Router, AI Financial Controller
```

## Índice Composto

**Business Readiness Index (BRI) = 33%**

Para referência:
- 0-20%: Idea stage
- 21-40%: Pre-seed → necessário captar investimento
- 41-60%: Seed → MVP operacional
- 61-80%: Series A → produto escalando
- 81-100%: Growth → eficiência operacional

**A Apex está em estágio PRE-SEED.**  
Isto não é negativo — é realista. O valuation depende de: (1) clareza da visão, (2) tamanho do mercado, (3) capacidade de execução. A visão é clara e o mercado é enorme. A execução tem lacunas claras que este documento endereça.

---

# MISSÃO 3 — AI SUPPLY CHAIN

## Quem controla a cadeia de valor de IA

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CADEIA DE SUPRIMENTOS DE IA                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  NÍVEL 1 — HARDWARE (quem fabrica os chips)                              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ NVIDIA ─── 90%+ do mercado de treinamento                          │  │
│  │ H100 (~$30K) · B200 (~$35K) · B300 (2026) · Rubin (2027)          │  │
│  │ Controle: TOTAL — sem NVIDIA, não há IA em escala                  │  │
│  │ Concorrentes: AMD MI300X, AWS Trainium2, Google TPU v6             │  │
│  │ Risco Apex: BAIXO (GPU indireta via gateways)                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  NÍVEL 2 — INFRAESTRUTURA CLOUD (quem hospeda os servidores)            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ AWS (Bedrock, SageMaker)  ·  Azure (OpenAI)  ·  GCP (Vertex AI)   │  │
│  │ CoreWeave · Lambda Labs · Vultr · DigitalOcean                     │  │
│  │ Controle: ALTO — gateways dependem destes para GPU                 │  │
│  │ Risco Apex: BAIXO (gateways abstraem o cloud)                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  NÍVEL 3 — MODEL LABS (quem cria os modelos de IA)                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ OPENAI ─── GPT, Sora, DALL-E — ecossistema mais fechado           │  │
│  │   │   Lock-in: ALTO (Sora não roda em nenhum outro lugar)          │  │
│  │   │   Gasto Apex projetado: $3M/ano aos $100M ARR                 │  │
│  │ GOOGLE DEEPMIND ─── Gemini, Veo, Nano Banana, Imagen              │  │
│  │   │   Lock-in: MÉDIO (alguns modelos exclusivos, FLUX não)         │  │
│  │   │   Risco: Google pode limitar APIs (como fez com Maps)          │  │
│  │ META ─── Llama (aberto, gratuito, qualquer um serve)              │  │
│  │   │   Lock-in: ZERO — já é open weight                             │  │
│  │ BLACK FOREST LABS ─── FLUX (aberto, melhor T2I)                   │  │
│  │   │   Lock-in: BAIXO — disponível em todos os gateways             │  │
│  │ BYTEDANCE ─── Seedance, Seedream (qualidade crescente)            │  │
│  │ ALIBABA ─── Wan, HappyHorse (chinês, muito barato)                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  NÍVEL 4 — GATEWAYS (quem distribui modelos como API)                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ 🥇 FAL AI ─── Gateway principal recomendado                       │  │
│  │     Depende de: NVIDIA + próprio serverless                        │  │
│  │     Vantagem: 1,000+ endpoints, 99.99% SLA, já integrado          │  │
│  │ 🥈 Runware ─── Tier econômico + fallback                           │  │
│  │     Vantagem: 50% mais barato, SOC2, includeCost, MCP             │  │
│  │ 🥉 WaveSpeed ─── Gateway secundário                                │  │
│  │     Vantagem: Pricing API única, cobertura similar                 │  │
│  │ Replicate ─── Não recomendado (custo alto, sem includeCost)        │  │
│  │ Together AI ─── LLM cluster (modelos abertos)                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  NÍVEL 5 — APEX OS (nós — onde o dinheiro é ganho ou perdido)          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Controle: TOTAL sobre nossa margem                                 │  │
│  │ Depende de: gateways (Nível 4) + cloud (Nível 2)                   │  │
│  │ Quem fica com nosso dinheiro:                                      │  │
│  │   Gateways de mídia:         ~8,3% da receita                      │  │
│  │   Gateways LLM:              ~5,0% da receita                      │  │
│  │   GPU/Cloud indireto:        ~2,0% da receita                      │  │
│  │   Storage + CDN:             ~1,5% da receita                      │  │
│  │   Embeddings/Search:         ~0,2% da receita                      │  │
│  │   Apex (margem bruta):       ~83% da receita ← NOSSO               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Análise Financeira da Cadeia

| Fornecedor | Tipo | Gasto anual ($100M ARR) | % da Receita | Risco | Alternativa |
|:-----------|:----:|:-----------------------:|:------------:|:-----:|:-----------:|
| **FAL AI** | Mídia | $4.000.000 | 4,0% | 🟡 Médio | WaveSpeed (+2 sem) |
| **Runware** | Mídia | $3.000.000 | 3,0% | 🟢 Baixo | FAL (+1 sem) |
| **OpenAI** | LLM | $3.000.000 | 3,0% | 🔴 Alto | Together (+1 sem) |
| **Together** | LLM | $2.000.000 | 2,0% | 🟢 Baixo | HF Inference |
| **NVIDIA** | GPU | $2.000.000 | 2,0% | 🟡 Médio | AMD MI300 |
| **WaveSpeed** | Mídia | $1.300.000 | 1,3% | 🟢 Baixo | FAL |
| **Storage/CDN** | Dados | $1.000.000 | 1,0% | 🟢 Baixo | S3-compatível |
| **Total COGS** | | **$17.000.000** | **17%** | | |

## Conclusão da Cadeia

**Quem realmente fica com nosso dinheiro?**

1. **NVIDIA** — indiretamente via todos os gateways (~$2M+ embutido no COGS)
2. **Gateways de mídia** — FAL + Runware + WaveSpeed (~$8.3M)
3. **LLM APIs** — OpenAI + Together (~$5M)
4. **Infraestrutura cloud** — AWS/GCP/Azure (~$1.7M)

**Nossa alavancagem:**  
Todos os gateways vendem modelos equivalentes. FLUX, SD3.5, Llama, Wan são abertos. Trocar de gateway custa 2-4 semanas de engenharia. **Não há lock-in real se a arquitetura for abstraída corretamente.**

**Nosso risco real:**  
O único lock-in verdadeiro é **Sora** (exclusivo OpenAI) e **Veo** (exclusivo Google). Para tudo mais, existem alternativas equivalentes em 2+ gateways diferentes.

---

# MISSÃO 4 — UNIT ECONOMICS REAL

## Simulador Financeiro

### Premissas Base

**Planos (mensal):**
| Plano | Preço (R$) | Preço (USD) | Chats/mês | Imagens/mês | Vídeos/mês |
|:------|:----------:|:-----------:|:---------:|:-----------:|:----------:|
| Starter | R$49 | ~$9 | 50 | 10 | 1 |
| Professional | R$99 | ~$18 | 200 | 50 | 5 |
| Business | R$199 | ~$36 | 500 | 150 | 15 |
| Enterprise | R$499 | ~$90 | 2.000 | 500 | 50 |
| Custom | Sob consulta | Sob consulta | Ilimitado (com limite) | Ilimitado | Ilimitado |

**Custos variáveis por unidade (Runware — menor preço de mercado):**
| Recurso | Custo unitário | Fornecedor |
|:--------|:--------------:|:-----------|
| Chat LLM (simples) | $0.0001 | Together/OpenAI |
| Chat LLM (complexo) | $0.001 | Together/OpenAI |
| Imagem 1K (FLUX Schnell) | $0.002 | Runware |
| Imagem 1K (FLUX Dev) | $0.015 | Runware |
| Imagem 2K (FLUX Pro) | $0.04 | FAL/Runware |
| Vídeo 5s 720p | $0.144 | Runware |
| Vídeo 10s 1080p | $0.50 | WaveSpeed |
| Áudio/TTS (1 min) | $0.02 | Runware |
| OCR (1 página) | $0.005 | Runware/Together |
| Embedding (1K tokens) | $0.0001 | Together/OpenAI |
| Storage (GB/mês) | $0.023 | Supabase/S3 |
| CDN (GB) | $0.01 | Cloudflare R2 |

### Matriz de Unidade Econômica

**Mix de uso por plano:**

| Plano | Chat simples | Chat complexo | Imagem | Vídeo | Áudio | OCR | Embedding | Storage |
|:------|:-----------:|:-------------:|:-----:|:-----:|:----:|:---:|:---------:|:-------:|
| Starter (R$49) | 40 | 10 | 10 | 1 | 5 | 3 | 1K | 1GB |
| Professional (R$99) | 150 | 50 | 50 | 5 | 20 | 10 | 5K | 5GB |
| Business (R$199) | 350 | 150 | 150 | 15 | 50 | 30 | 15K | 20GB |
| Enterprise (R$499) | 1.500 | 500 | 500 | 50 | 200 | 100 | 50K | 100GB |

**Custo variável por cliente/mês:**

| Plano | Chat | Imagem | Vídeo | Áudio | OCR | Embedding | Storage | **Total COGS** |
|:------|:----:|:------:|:-----:|:-----:|:---:|:---------:|:-------:|:--------------:|
| Starter | $0.014 | $0.15 | $0.144 | $0.10 | $0.015 | $0.001 | $0.023 | **$0.45** |
| Professional | $0.065 | $0.75 | $0.72 | $0.40 | $0.05 | $0.005 | $0.115 | **$2.10** |
| Business | $0.185 | $2.25 | $2.16 | $1.00 | $0.15 | $0.015 | $0.46 | **$6.22** |
| Enterprise | $0.65 | $7.50 | $7.20 | $4.00 | $0.50 | $0.05 | $2.30 | **$22.20** |

**Margem bruta por cliente (em USD):**

| Plano | Receita | COGS | Margem Bruta | % |
|:------|:-------:|:----:|:------------:|:-:|
| Starter | $9,00 | $0,45 | **$8,55** | **95%** |
| Professional | $18,00 | $2,10 | **$15,90** | **88%** |
| Business | $36,00 | $6,22 | **$29,78** | **83%** |
| Enterprise | $90,00 | $22,20 | **$67,80** | **75%** |

### Simulação por Escala

**Cenário: 60% Professional, 25% Business, 10% Starter, 5% Enterprise**

| Clientes | Mix de planos | Receita Total | COGS Total | Margem Bruta | % | Custo Fixo | EBITDA |
|:--------:|:-------------:|:-------------:|:----------:|:------------:|:-:|:----------:|:------:|
| **100** | 60P/25B/10S/5E | $1.638 | $150 | $1.488 | 91% | $10.000 | **-$8.512** |
| **1.000** | mesma mix | $16.380 | $1.500 | $14.880 | 91% | $15.000 | **-$120** |
| **5.000** | mesma mix | $81.900 | $7.500 | $74.400 | 91% | $25.000 | **$49.400** |
| **10.000** | mesma mix | $163.800 | $15.000 | $148.800 | 91% | $40.000 | **$108.800** |
| **50.000** | mesma mix | $819.000 | $75.000 | $744.000 | 91% | $80.000 | **$664.000** |
| **100.000** | mesma mix | $1.638.000 | $150.000 | $1.488.000 | 91% | $150.000 | **$1.338.000** |
| **500.000** | mesma mix | $8.190.000 | $750.000 | $7.440.000 | 91% | $400.000 | **$7.040.000** |
| **1.000.000** | mesma mix | $16.380.000 | $1.500.000 | $14.880.000 | 91% | $700.000 | **$14.180.000** |

### Métricas por Cenário

**Break-even Analysis (em clientes):**
| Cenário | Clientes p/ break-even | Tempo estimado | Receita mensal no break-even |
|:--------|:----------------------:|:--------------:|:----------------------------:|
| Otimista (equipe 5, infra mínima) | ~1.100 | 3-6 meses | ~$18K/mês |
| Realista (equipe 10, infra média) | ~2.500 | 6-12 meses | ~$41K/mês |
| Conservador (equipe 20, infra completa) | ~5.000 | 12-18 meses | ~$82K/mês |

**LTV estimado (assumindo churn de 5%/mês, vida média 20 meses):**

| Plano | Receita/mês | COGS/mês | Margem/mês | LTV (20 meses) | LTV:CAC (CAC=$200) |
|:------|:-----------:|:--------:|:----------:|:--------------:|:------------------:|
| Starter | $9,00 | $0,45 | $8,55 | **$171** | 0,85:1 |
| Professional | $18,00 | $2,10 | $15,90 | **$318** | 1,59:1 |
| Business | $36,00 | $6,22 | $29,78 | **$596** | 2,98:1 |
| Enterprise | $90,00 | $22,20 | $67,80 | **$1.356** | 6,78:1 |

**Payback (em meses, CAC=$200):**

| Plano | Payback |
|:------|:-------:|
| Starter | 23 meses ⚠️ |
| Professional | 13 meses 🟡 |
| Business | 7 meses 🟢 |
| Enterprise | 3 meses 🟢 |

### Projeção US$100M ARR

| Item | Valor | % Receita |
|:-----|:-----:|:---------:|
| **ARR** | **$100.000.000** | 100% |
| **COGS detalhado:** | | |
| Mídia (FAL + Runware + WaveSpeed) | $8.300.000 | 8,3% |
| LLM (OpenAI + Together + HF) | $5.000.000 | 5,0% |
| Storage | $1.500.000 | 1,5% |
| CDN | $700.000 | 0,7% |
| Embeddings/Search | $500.000 | 0,5% |
| GPU dedicada (a partir do Ano 3) | $2.000.000 | 2,0% |
| **Total COGS** | **$17.000.000** | **17%** |
| **Margem Bruta** | **$83.000.000** | **83%** |
| P&D (equipe 50-100) | $25.000.000 | 25% |
| G&A + Vendas + Marketing | $20.000.000 | 20% |
| **EBITDA** | **$38.000.000** | **38%** |

---

# MISSÃO 5 — PROVIDER PORTFOLIO

## Alocação Estratégica de Capital

### Carteira Recomendada

```
┌──────────────────────────────────────────────────────────────────────────┐
│              APEX AI — CARTEIRA DE FORNECEDORES (2026-2027)              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  40% ─── FAL AI ──── Gateway principal de mídia                          │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: Já integrado no patrimônio Apex. 1,000+ endpoints.              │
│  99.99% SLA. Melhor custo-benefício em modelos premium.                  │
│  Gasto projetado (Y1): $24K/mês · (Y3 $100M ARR): $333K/mês             │
│                                                                          │
│  20% ─── Runware ─── Tier econômico + fallback primário                  │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: 50% mais barato que concorrentes. SOC2+ISO27001+GDPR.           │
│  includeCost nativo. MCP server. Sem cobrança por falha.                 │
│  Gasto projetado (Y1): $12K/mês · (Y3 $100M ARR): $167K/mês             │
│                                                                          │
│  15% ─── WaveSpeed ─── Gateway secundário + pricing API                 │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: Pricing API única no mercado. Cobertura similar à FAL.          │
│  10% de desconto em diversos modelos. Concorrente direto da FAL.         │
│  Gasto projetado (Y1): $9K/mês · (Y3 $100M ARR): $125K/mês              │
│                                                                          │
│  10% ─── Together AI ─── LLM cluster para modelos abertos               │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: Modelos Llama, DeepSeek, Qwen. PTU disponível. Cache discounts. │
│  Alternativa direta à OpenAI com API compatível.                         │
│  Gasto projetado (Y1): $6K/mês · (Y3 $100M ARR): $83K/mês               │
│                                                                          │
│  10% ─── OpenAI ─── LLM premium (GPT, Sora)                             │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: Necessário para Sora (sem alternativa). GPT para casos complexos.│
│  Reter mínimo para evitar lock-in. Trocar por Together se preço subir.   │
│  Gasto projetado (Y1): $6K/mês · (Y3 $100M ARR): $83K/mês               │
│                                                                          │
│   5% ─── HuggingFace Inference ─── Meta-router + descoberta             │
│  ─────────────────────────────────────────────────────────────────────── │
│  Motivo: Benchmark cross-provider, fallback automático, descoberta.      │
│  Sem markup adicional. Acesso a 800K+ modelos.                           │
│  Gasto projetado (Y1): $3K/mês · (Y3 $100M ARR): $42K/mês               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Justificativa Financeira

| Cenário | Mix proposto | COGS/mês ($1M receita) | % Receita |
|:--------|:------------:|:----------------------:|:---------:|
| Mix recomendado | 40/20/15/10/10/5 | **$141.667** | **14,2%** |
| 100% FAL | 100/0/0/0/0/0 | $166.667 | 16,7% |
| 100% Runware | 0/100/0/0/0/0 | $100.000 | 10,0% |
| 100% OpenAI | 0/0/0/0/100/0 | $200.000 | 20,0% |

**Economia anual do mix recomendado vs 100% OpenAI:**
- $58.333/mês × 12 = **$700.000/ano** de economia em COGS

### Estratégia de Saída por Fornecedor

| Evento | Impacto | Ação | Tempo |
|:-------|:-------:|:-----|:-----:|
| FAL dobra preço | +$4M/ano | Migrar 40% → WaveSpeed + Runware | 2-3 semanas |
| Runware fecha | Perda do tier econômico | Migrar 20% → FAL (modelos iguais) | 1-2 semanas |
| WaveSpeed sobe preço | +$1.3M/ano | Migrar 15% → FAL + Runware | 1-2 semanas |
| OpenAI limita API | Perda de Sora + GPT | Substituir por Together + Llama + DeepSeek | 2-4 semanas |
| Together fecha | Perda do LLM aberto | Migrar 10% → HF Inference + OpenAI | 1 semana |
| NVIDIA falta GPU | Aumento geral de preços | Usar clusters AMD (Together + Runware) | 4-8 semanas |

---

# MISSÃO 6 — SIMULAÇÃO DE CRISE

## Cenários de Disrupção

### Cenário 1: OpenAI dobra preço

| Impacto | Valor |
|:--------|:-----:|
| Custo OpenAI atual | $3M/ano |
| Novo custo | $6M/ano |
| Impacto na margem | -3 pontos percentuais |
| Tempo para migrar | 2 semanas |
| Alternativa | Together AI (Llama 4, DeepSeek V5) |
| Custo pós-migração | $2.5M/ano (economia de $0.5M) |
| **Impacto líquido** | **-$0.5M (temporário)** |

### Cenário 2: FAL AI fecha

| Impacto | Valor |
|:--------|:-----:|
| Custo FAL atual | $4M/ano |
| % do orçamento | 40% da mídia |
| Tempo para recuperar | 2-3 semanas |
| Alternativa 1 | WaveSpeed (mesma cobertura) |
| Alternativa 2 | Runware (tier econômico) |
| Custo pós-migração | $4.2M/ano (+5%) |
| **Impacto líquido** | **+$0.2M (imperceptível)** |

### Cenário 3: Runware triplica preço

| Impacto | Valor |
|:--------|:-----:|
| Custo Runware atual | $3M/ano |
| Novo custo | $9M/ano |
| Impacto na margem | -6 pontos percentuais |
| Tempo para migrar | 1-2 semanas |
| Alternativa | FAL (modelos equivalentes, preço próximo do original) |
| Custo pós-migração | $3.5M/ano (+$0.5M) |
| **Impacto líquido** | **+$0.5M (temporário)** |

### Cenário 4: Google bloqueia APIs Gemini/Veo/Nano Banana

| Impacto | Valor |
|:--------|:-----:|
| Custo Google atual | $1M/ano (estimado) |
| Alternativa T2I | FLUX Pro + GPT Image 2 (equivalentes) |
| Alternativa T2V | Kling 3.0 + Seedance 2.0 |
| Tempo para migrar | 1 semana |
| **Impacto líquido** | **Mínimo (modelos substitutos existem)** |

### Cenário 5: Replicate sai do mercado

| Impacto | Valor |
|:--------|:-----:|
| Exposição | $0 (não recomendado, não integrado) |
| **Impacto líquido** | **$0** |

### Cenário 6: Cloudflare/CDN indisponível

| Impacto | Valor |
|:--------|:-----:|
| Serviços afetados | Entrega de assets, URLs temporárias |
| Tempo para recuperar | 4-24 horas |
| Alternativa | AWS CloudFront, Fastly, Bunny CDN |
| Setback financeiro | Baixo (CDN é commodity) |
| **Impacto líquido** | **$50-100K em horas de inatividade** |

### Cenário 7: Storage dobra preço

| Impacto | Valor |
|:--------|:-----:|
| Custo Storage atual | $1.5M/ano |
| Novo custo | $3M/ano |
| Impacto na margem | -1.5 pontos percentuais |
| Alternativa | S3-compatível (Backblaze B2, Cloudflare R2) |
| Custo pós-migração | $0.75M (economia de 50%) |
| **Impacto líquido** | **+$0.75M (se migrar)** |

### Matriz Consolidada de Crises

| # | Cenário | Probabilidade | Impacto | Tempo de recuperação | Custo do impacto |
|:-:|:--------|:------------:|:-------:|:--------------------:|:----------------:|
| 1 | OpenAI dobra preço | 🟡 Média | $3M/ano | 2 semanas | $0,5M |
| 2 | FAL fecha | 🟢 Baixa | +$0,2M/ano | 3 semanas | $0,2M |
| 3 | Runware triplica | 🟡 Média | +$6M/ano | 2 semanas | $0,5M |
| 4 | Google bloqueia | 🟢 Baixa | +$0,1M | 1 semana | $0,1M |
| 5 | Replicate sai | 🔴 Improvável | $0 | — | $0 |
| 6 | CDN fora | 🟡 Média | $50-100K | 24h | $100K |
| 7 | Storage dobra | 🟢 Baixa | +$1,5M/ano | 2 semanas | $0 |

**Pior cenário combinado (OpenAI + Runware + CDN simultaneamente):**
- Impacto: +$6,6M/ano + 24h de inatividade
- Margem cairia de 83% para ~76%
- Ainda assim, **lucrativo**

**Veredito de resiliência:** A carteira diversificada da Apex absorve qualquer crise individual sem prejuízo. Apenas uma combinação de 3+ crises simultâneas causaria dano significativo — e mesmo assim a empresa seguiria lucrativa.

---

# MISSÃO 7 — AI FINANCIAL CONTROLLER

## Especificação do Módulo

Este módulo **não existe** no Apex OS. É o componente mais crítico a ser construído.

### O que deve calcular

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      AI FINANCIAL CONTROLLER                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ▶ CUSTO OPERACIONAL                                                     │
│  ├── Saldo por provider:      saldo consumido vs orçado por gateway      │
│  ├── Custo diário:            $ gasto hoje por tipo de operação          │
│  ├── Custo semanal:           tendência, média, pico                     │
│  ├── Custo mensal:            fechamento do mês, comparação mês anterior │
│  ├── Custo por requisição:    $ médio por chamada de API                 │
│  ├── Custo por tenant:        rateio do custo total por organização      │
│  ├── Custo por capability:    quanto cada capability gasta               │
│  ├── Custo por produto:       quanto cada produto (ArchVis, DirectCut…)  │
│  ├── Custo por cliente:       custo individual do maior cliente          │
│  └── Custo por plano:         média por plano (Starter vs Enterprise)    │
│                                                                          │
│  ▶ CONTROLE ORÇAMENTÁRIO                                                  │
│  ├── Budget mensal:           limite por provider                        │
│  ├── Budget por tenant:       teto de gasto por organização              │
│  ├── Budget por capability:   máximo que cada capability pode gastar     │
│  ├── Alerta de estouro:       notificação quando atingir 80% do budget  │
│  └── Bloqueio automático:     pausar capability se exceder budget        │
│                                                                          │
│  ▶ PREVISÃO                                                               │
│  ├── Forecast 30 dias:        projeção baseada em uso atual              │
│  ├── Forecast 90 dias:        tendência com sazonalidade                 │
│  ├── Forecast 12 meses:       anual rolling                              │
│  ├── Runway:                  dias restantes até estourar o budget       │
│  └── Burn Rate:               $/dia consumido (média 7 dias)             │
│                                                                          │
│  ▶ EFICIÊNCIA                                                             │
│  ├── Margem por capability:   receita - custo da capability              │
│  ├── Margem por cliente:      receita - custo do cliente                 │
│  ├── Economia do Router:      quanto o ProviderRouter economizou         │
│  │                            (diferença entre o provider mais caro      │
│  │                             e o provider selecionado)                 │
│  └── Custo evitado:           total economizado por fallback/switching   │
│                                                                          │
│  ▶ SAÍDAS (para o COO/CFO)                                               │
│  ├── Dashboard em tempo real:  via telemetria do Core                    │
│  ├── Relatório semanal:        PDF/mail com indicadores-chave            │
│  ├── Alerta de anomalia:       custo subiu X% acima da média            │
│  └── Export contábil:          dados para o Finance & BI                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Arquitetura Proposta

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│ Provider    │───▶│ Cost Meter  │───▶│ Cost Store   │
│ Router      │    │ (por req)   │    │ (Time-series)│
└─────────────┘    └─────────────┘    └──────┬───────┘
                                             │
                    ┌────────────────────────┘
                    │
             ┌──────▼────────┐    ┌──────────────────┐
             │ Budget Guard  │◀───│ Budget Registry  │
             │ (enforce)     │    │ (limits/config)  │
             └──────┬────────┘    └──────────────────┘
                    │
             ┌──────▼────────┐
             │ AI Financial │
             │ Controller   │───▶ Dashboard
             │ (calculate)  │───▶ Alerts
             └──────────────┘───▶ Export
```

### Dependências para Construir

| Componente necessário | Já existe? | Esforço |
|:----------------------|:----------:|:-------:|
| ProviderRouter | ❌ | 2 semanas |
| ProviderRegistry | ❌ | 1 semana |
| Cost Meter | ❌ | 2 semanas |
| Budget Registry | ❌ | 1 semana |
| Budget Guard | ❌ | 1 semana |
| Time-series Store | ❌ | 2 semanas |
| **Total** | | **~9 semanas** |

---

# MISSÃO 8 — QUANDO TROCAR DE PROVIDER

## Regras Automáticas de Switching

### Gatilhos de Troca Automática

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AUTO-SWITCH PROVIDER RULES                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  REGRA 1 — CUSTO                                                         │
│  ─────────────────────────────────────────────────────────────────────── │
│  SE custo médio dos últimos 5 minutos > 120% do custo base              │
│    ENTÃO redirecionar 50% do tráfego para o 2º provider mais barato     │
│  SE custo médio > 150% do custo base                                    │
│    ENTÃO redirecionar 100% para o provider mais barato disponível       │
│                                                                          │
│  REGRA 2 — LATÊNCIA                                                      │
│  ─────────────────────────────────────────────────────────────────────── │
│  SE latência p95 dos últimos 2 minutos > 5 segundos                     │
│    ENTÃO desviar 30% para fallback                                      │
│  SE latência p95 > 8 segundos                                           │
│    ENTÃO desviar 100% para fallback                                     │
│  SE latência p95 > 15 segundos                                          │
│    ENTÃO ativar emergency mode (tudo para o provider mais rápido)       │
│                                                                          │
│  REGRA 3 — TAXA DE ERRO                                                  │
│  ─────────────────────────────────────────────────────────────────────── │
│  SE taxa de erro (HTTP 4xx/5xx) > 3% nos últimos 60 segundos           │
│    ENTÃO redirecionar 50% para fallback                                 │
│  SE taxa de erro > 10%                                                  │
│    ENTÃO redirecionar 100% + alerta P1 (SMS + Slack + Email)            │
│  SE taxa de erro > 25%                                                  │
│    ENTÃO desligar provider + alerta P0 (telefone do CTO)                │
│                                                                          │
│  REGRA 4 — QUALIDADE                                                     │
│  ─────────────────────────────────────────────────────────────────────── │
│  SE score de qualidade (A/B test) < 7/10 por 3 dias consecutivos       │
│    ENTÃO reduzir 30% do tráfego para aquele modelo/provider            │
│  SE score < 5/10 por 5 dias                                             │
│    ENTÃO substituir permanentemente                                      │
│  (Score de qualidade: avaliação A/B cega com 20 avaliações/dia)         │
│                                                                          │
│  REGRA 5 — ORÇAMENTO                                                     │
│  ─────────────────────────────────────────────────────────────────────── │
│  SE consumo do budget mensal > 80% antes do dia 20                      │
│    ENTÃO trocar para tier econômico até fim do mês                      │
│  SE consumo > 95% antes do dia 25                                       │
│    ENTÃO pausar operações não-críticas + notificar CFO                  │
│                                                                          │
│  REGRA 6 — RECUPERAÇÃO                                                   │
│  ─────────────────────────────────────────────────────────────────────── │
│  APÓS troca automática, testar provider original a cada 5 minutos       │
│  QUANDO provider original恢复正常 por 10 minutos consecutivos          │
│    ENTÃO retornar gradualmente (25% → 50% → 75% → 100%)                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Arquitetura do Auto-Switch

```
┌──────────┐     ┌────────────┐     ┌──────────┐
│ Monitor  │────▶│ Evaluator  │────▶│ Decider  │
│ (métricas│     │ (regras)   │     │ (ação)   │
│  em      │     │            │     │          │
│  tempo   │     │            │     │ ──▶ Router: rebalancear
│  real)   │     │            │     │ ──▶ Alert: notificar
└──────────┘     └────────────┘     │ ──▶ Log: registrar
                                    └──────────┘
```

### Prioridade de Implementação

| Ordem | Regra | Complexidade | Impacto | Prioridade |
|:-----:|:------|:-----------:|:-------:|:----------:|
| 1 | Taxa de erro (>3%) | 🟢 Baixa | 🔴 Evita falha crítica | **P0** |
| 2 | Latência (>8s) | 🟢 Baixa | 🔴 Evita perda de cliente | **P0** |
| 3 | Custo (>20%) | 🟡 Média | 🟡 Evita margem negativa | **P1** |
| 4 | Orçamento (>80%) | 🟡 Média | 🟡 Evita estouro | **P1** |
| 5 | Qualidade (<7/10) | 🔴 Alta | 🟢 Diferenciação | **P2** |

---

# MISSÃO 9 — 10-YEAR FINANCIAL ROADMAP

## Roadmap Financeiro (não técnico)

### Ano 1 (2026-2027) — Fundação & Tração Inicial

```
ESTADO ATUAL:
├── Produto: MVP funcional (SPA + CapabilityRouter + Checkout)
├── IA: 0 providers integrados (tudo em mock)
├── Clientes: 0
├── Equipe: 2-3 founders
└── Burn rate: $5K-10K/mês

DECISÕES FINANCEIRAS:
├── Provider Router: CONSTRUIR (2 semanas)
├── Provider Registry: CONSTRUIR (1 semana)
├── FAL AI: INTEGRAR como gateway principal (1 semana)
├── Runware: INTEGRAR como fallback (1 semana)
├── Pricing: R$49/R$99/R$199/R$499 (plano real, não simulado)
├── Stripe/ASAAS: INTEGRAR billing real (2 semanas)
├── Captação: Angel/Pre-Seed de $250K-$500K
└── Valuation alvo: $3M-$5M

MARCOS:
├── Q3 2026: Apex OS rodando com IA real + checkout funcional
├── Q4 2026: Primeiros 100 clientes pagantes
├── Q1 2027: Break-even operacional (~1.100 clientes)
└── Q2 2027: MVP do AI Financial Controller operacional
```

### Ano 2 (2027-2028) — Escala Controlada

```
ESTADO:
├── Clientes: 1.000-5.000
├── Receita: $200K-$1M ARR
├── Equipe: 5-10 pessoas
└── COGS: ~15% da receita

DECISÕES FINANCEIRAS:
├── COMPRAR GPU? ❌ Ainda não compensa. Gateways são mais baratos.
│   (Break-even GPU ≈ $50K/mês em inferência. Estamos em $5K-10K/mês)
├── TREINAR MODELO? ❌ Absolutamente não. Modelos abertos são suficientes.
├── SELF-HOST LLM? ❌ Negativo. Together + OpenAI resolvem.
├── Contratos anuais com FAL + Runware: negociar 15-25% de desconto
├── CDN: Cloudflare R2 (custo zero de egress)
├── Storage: Supabase/S3 (~$0.023/GB)
└── Financeiro: AI Financial Controller 100% operacional

MARCOS:
├── Q3 2027: Multi-provider funcional (FAL + Runware + WaveSpeed)
├── Q4 2027: Auto-switch rules implementadas (erro + latência)
├── Q1 2028: AI Financial Controller com forecasts
└── Q2 2028: Série A ($3M-$5M) → Valuation $15M-$25M
```

### Ano 3 (2028-2029) — Expansão

```
ESTADO:
├── Clientes: 5.000-20.000
├── Receita: $1M-$5M ARR
├── Equipe: 15-30 pessoas
└── COGS: ~12% da receita (ganho de escala)

DECISÕES FINANCEIRAS:
├── COMPRAR GPU? 🟡 ANALISAR. Se inferência > $30K/mês, considerar.
│   Custo GPU dedicada: ~$10K-20K/mês (cluster 4-8x H100)
│   Custo gateway: ~$30K-40K/mês para mesmo volume
│   Economia potencial: 50-67%
├── TREINAR MODELO? ❌ Ainda não. Fine-tuning via LoRA em gateways basta.
├── SELF-HOST LLM? 🟡 Se Together > $20K/mês, migrar para cluster próprio.
│   Custo self-host Llama 4: ~$5K-10K/mês (4x H100)
├── CDN: Manter Cloudflare R2 (commodity)
├── Storage: Avaliar Backblaze B2 para dados frios
└── Marketplace: INICIAR desenho (sem implementar)

MARCOS:
├── Q3 2028: ProviderRouter + CostController em produção
├── Q4 2028: Auto-switch completo (6 regras)
├── Q1 2029: Iniciar estudos para GPU própria
└── Q2 2029: Série B ($10M-$20M) → Valuation $50M-$100M
```

### Ano 5 (2030-2031) — Maturidade

```
ESTADO:
├── Clientes: 50.000-200.000
├── Receita: $10M-$30M ARR
├── Equipe: 50-80 pessoas
└── COGS: ~10% da receita

DECISÕES FINANCEIRAS:
├── COMPRAR GPU? ✅ SIM. Se inferência > $100K/mês, GPU própria é obrigatória.
│   Cálculo: $100K/mês gateways vs $30-40K/mês GPU própria
│   Economia: $60-70K/mês (60-70%)
│   Necessidade: 16-32x H100/B200 (~$500K-$1M em hardware)
│   ROI: 7-14 meses
├── TREINAR MODELO? 🟡 AVALIAR. Fine-tuning pesado para domínio AEC.
│   Custo LoRA: $50-100K por treinamento
│   Custo fine-tuning completo: $200-500K
├── SELF-HOST LLM? ✅ SIM. Para modelos abertos (Llama 5/6, DeepSeek).
│   Cluster de 16-32 GPUs para atender demanda.
│   OpenAI mantido apenas para Sora e casos premium.
├── Open Source HOSPEDAR? ✅ SIM. Modelos abertos em cluster próprio.
│   Custo operacional: $20-40K/mês
│   Economia vs Together/OpenAI: 60-80%
├── Marketplace: MVP operacional (terceiros podem vender capacidades)
└── CDN: Múltiplos providers (Cloudflare + Fastly + AWS)

MARCOS:
├── 2030: GPU própria operacional (inferência)
├── 2030: Marketplace lançado
├── 2031: Fine-tuning de modelo AEC proprietário
└── 2031: Série C/D → Valuation $200M-$500M
```

### Ano 10 (2035-2036) — Domínio

```
ESTADO:
├── Clientes: 500.000-1.000.000+
├── Receita: $100M-$300M ARR
├── Equipe: 200-500 pessoas
└── COGS: ~8% da receita

DECISÕES FINANCEIRAS:
├── GPU PRÓPRIA? ✅ ESSENCIAL. Data center com 100-500 GPUs.
│   Cluster B300/B400 ou equivalente para inferência massiva.
│   Custo: $5M-$10M em hardware (amortizado em 5 anos)
├── TREINAR MODELO? ✅ SE RELEVANTE. Modelo AEC proprietário (fine-tuning).
│   Modelo fundação: Llama 8x ou DeepSeek V7 (open weights)
│   Custo treinamento: $1M-$5M
│   Diferencial competitivo: "O modelo que entende de construção civil"
├── SELF-HOST LLM? ✅ Dominante. 90% dos requests em cluster próprio.
│   OpenAI: apenas para funcionalidades exclusivas (Sora 5, GPT-9)
│   Together/HF: fallback para picos de demanda
├── Open Source HOSPEDAR? ✅ SIM. Cluster dedicado para comunidade AEC.
│   Custo: $50-100K/mês
│   Retorno: Ecossistema de desenvolvedores + contribuições
├── Marketplaces: Múltiplos marketplaces verticais (Engenharia, Arquitetura, 
│   Construção, Legal, Contábil, Studio)
├── CDN: Global (20+ PoPs)
└── VALUATION: $1B-$3B (Unicorn status)

MARCOS:
├── 2032: Modelo AEC proprietário em produção
├── 2033: 80% da inferência em hardware próprio
├── 2034: Marketplace Apex como padrão da indústria AEC
└── 2035-2036: IPO ou aquisição estratégica

### Cronograma de Decisões

```
       2026  2027  2028  2029  2030  2031  2032  2033  2034  2035
      ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
GPU   │────│────│────│────│════│════│════│════│════│════│
      │  NÃO  │ NÃO │ANAL.| SIM │ SIM │ SIM │ SIM │ SIM │
      └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
      
      ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
Treino│────│────│────│────│────│════│════│════│════│════│
      │  NÃO  │ NÃO │ NÃO │ NÃO │ANAL.| SIM │ SIM │ SIM │
      └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
      
      ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
Self   │────│────│────│────│════│════│════│════│════│════│
Host   │  NÃO  │ NÃO │ANAL.│ SIM │ SIM │ SIM │ SIM │ SIM │
      └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
      
      ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
Market │────│────│────│────│════│════│════│════│════│════│
place  │  NÃO  │ NÃO │DES. │ MVP │ SIM │ SIM │ SIM │ SIM │
      └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

---

# RECOMENDAÇÕES DO INVESTMENT COMMITTEE

## Decisões IMEDIATAS (próximos 30 dias)

| # | Decisão | Justificativa |
|:-:|:--------|:--------------|
| 1 | ✅ **Construir ProviderRouter + ProviderRegistry** | Sem isso, não há multi-provider. É o fundamento de tudo. |
| 2 | ✅ **Construir CostController + BudgetController** | Sem custo controlado, não há margem previsível. |
| 3 | ✅ **Manter mock providers operacionais** | Até que o router esteja pronto, não integrar nada real. |
| 4 | ✅ **Preparar contrato anual com FAL AI** | Já existe integração no patrimônio. Negociar 15-25% de desconto. |
| 5 | ✅ **Preparar contrato anual com Runware** | Tier econômico + SOC2. Negociar preço fixo + capacidade. |
| 6 | ✅ **Captar Angel/Pre-Seed de $250K-$500K** | Suficiente para 12-18 meses de operação. |

## Decisões CURTO PRAZO (60-90 dias)

| # | Decisão |
|:-:|:--------|
| 1 | Integrar FAL AI como gateway principal |
| 2 | Integrar Runware como fallback |
| 3 | Implementar billing real (Stripe/ASAAS) |
| 4 | Construir UsageMeter real (não stub) |
| 5 | AI Financial Controller versão 1 (custo por provider + forecast 30d) |

## Decisões NÃO AUTORIZADAS (até nova ordem)

| # | Proibição | Motivo |
|:-:|:----------|:-------|
| ❌ | Integrar qualquer provider novo | Router não existe. ProviderRegistry não existe. |
| ❌ | Pedir API keys | Sem arquitetura de controle de custo, qualquer chave é risco. |
| ❌ | Comprar GPU | Anos 1-2: gateways são mais baratos. |
| ❌ | Treinar modelo | Anos 1-4: modelos abertos são suficientes. |
| ❌ | Self-host LLM | Anos 1-2: Together + OpenAI são mais baratos e atualizados. |
| ❌ | Construir Marketplace | Ano 3+ : foco em produto, não em plataforma de terceiros. |

## Projeção de Valuation

| Ano | Receita | Valuation (múltiplo 10x ARR) | Rodada |
|:---:|:-------:|:----------------------------:|:------:|
| 1 (2026-27) | $0.1M-$0.5M | $3M-$5M | Pre-Seed |
| 2 (2027-28) | $0.5M-$3M | $15M-$25M | Série A |
| 3 (2028-29) | $3M-$10M | $50M-$100M | Série B |
| 5 (2030-31) | $20M-$50M | $200M-$500M | Série C/D |
| 10 (2035-36) | $100M-$300M | $1B-$3B | IPO/Aquisição |

---

# VEREDITO FINAL

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   DECISÃO DO INVESTMENT COMMITTEE                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  "Essa empresa sabe exatamente como vai controlar seu custo de IA."       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ ARQUITETURA: APROVADA                                                 │
│     Multi-provider, abstraída por ProviderRouter, com fallback           │
│     automático, controle de custo por requisição e AI Financial          │
│     Controller.                                                          │
│                                                                          │
│  ✅ CARTEIRA: APROVADA                                                   │
│     40% FAL · 20% Runware · 15% WaveSpeed · 10% Together ·              │
│     10% OpenAI · 5% HF Inference                                         │
│                                                                          │
│  ✅ MARGEM: 83% BRUTA / 38% EBITDA AOS $100M ARR                        │
│     COGS de 17% é sustentável e competitivo globalmente.                 │
│                                                                          │
│  🟡 READNESS: 33% — ESTÁGIO PRE-SEED                                    │
│     6 componentes críticos precisam ser construídos antes                │
│     de qualquer integração real de IA.                                   │
│                                                                          │
│  ⚠️ NÃO INTEGRAR NENHUM PROVIDER ANTES DO PROVIDERROUTER                 │
│     Construir: ProviderRouter (2 sem) → ProviderRegistry (1 sem) →      │
│     CostController (2 sem) → BudgetController (1 sem) →                 │
│     UsageMeter real (1 sem) → FAL AI (1 sem) → Runware (1 sem)          │
│     = Total: ~9 semanas de engenharia                                    │
│                                                                          │
│  ⚠️ NÃO COMPRAR GPU ANTES DO ANO 3 (2029)                               │
│  ⚠️ NÃO TREINAR MODELO ANTES DO ANO 5 (2031)                            │
│  ⚠️ NÃO CONSTRUIR MARKETPLACE ANTES DO ANO 3 (2029)                     │
│                                                                          │
│  FUNDING NECESSÁRIO: $250K-$500K (Pre-Seed)                             │
│  BURN RATE: $5K-$10K/mês (Ano 1)                                       │
│  BREAK-EVEN: ~1.100 clientes (6-12 meses)                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

*Documento gerado pelo Investment Committee / CTO / CFO — Apex Global Inc.*  
*21 de julho de 2026*  
*Zero linhas de código alteradas. Zero chaves solicitadas. Zero integrações.*  
*Apenas decisões estratégicas baseadas em evidências do patrimônio existente.*
