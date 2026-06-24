# Fluxo Comercial — Apex AI Copilot Platform

> Versão: 2026-06-23
> Próximo agente: LEIA ESTE DOCUMENTO antes de modificar qualquer código.

---

## Catálogo de Serviços (O Que Vendemos)

Cada módulo da plataforma é um **serviço** que pode ser vendido avulso ou por assinatura.

| # | Serviço | Módulo | Tipo | Preço Sugerido |
|---|---------|--------|------|----------------|
| 1 | **ArchVis - Render de Imagem** | ArchVis Studio | Único | $50-200 |
| 2 | **DirectCut - Vídeo Profissional** | Director's Cut | Único | $200-1000 |
| 3 | **BIM / Modelagem 3D** | BIM/3D Studio | Único/Assinatura | $100-500 |
| 4 | **Orçamento / Quantitativo** | Budget Studio | Único | $100-300 |
| 5 | **Contratos / Legal** | Contracts Studio | Único | $50-200 |
| 6 | **Pacote Completo de Projeto** | Project Package | Único | $300-1000 |
| 7 | **Diário de Obra / RDO** | Field Ops | Assinatura | $50-200/mês |
| 8 | **Supply Chain / Compras** | Supply Chain | Assinatura | $50-200/mês |
| 9 | **CRM / Vendas** | CRM/Sales | Assinatura | $100-300/mês |
| 10 | **Financeiro / Contábil** | Finance/Admin | Assinatura | $100-300/mês |
| 11 | **Campanha de Marketing** | Campaign Automation | Único | $200-500 |
| 12 | **Pesquisa de Mercado** | Research Studio | Único | $50-200 |
| 13 | **Notificações / Alertas** | Notifications Center | Assinatura | $30-100/mês |
| 14 | **Avatar / Locução** | Avatar & Voice | Único | $50-200 |
| 15 | **Consultoria Técnica** | Chat + Knowledge Base | Único/Hora | $50-150/h |

---

## Planos de Assinatura (Para Clientes Recorrentes)

| Plano | Inclui | Preço |
|-------|--------|-------|
| **Starter** | Chat + ArchVis + Budget | $100/mês |
| **Pro** | Starter + DirectCut + Contracts + Research | $300/mês |
| **Business** | Pro + BIM + Field Ops + CRM + Finance | $500/mês |
| **Enterprise** | Tudo + Supply Chain + Notifications + Suporte | $1000/mês |
| **Offshore Partner** | Tudo + produção dedicada BIM/CAD | $2500/mês |

---

## Jornada do Cliente

```
1. ENTRADA
   Cliente acessa → Login/Cadastro → Chat
   (já funciona com Supabase Auth + local demo)

2. ESCOLHA
   Chat pergunta: "Serviço único ou assinatura mensal?"
   - Único: pagamento único (Stripe checkout)
   - Assinatura: plano recorrente (Stripe subscription)

3. PAGAMENTO
   Stripe checkout → confirmação → invoice gerada
   (já temos: api/stripe/checkout.mjs, webhook, status)

4. CRIAÇÃO
   IA abre o painel certo (ArchVis, DirectCut, Budget, Contracts...)
   Cliente descreve o que quer
   IA gera PREVIEW (rascunho, não final)

5. REVISÃO
   Cliente analisa
   Pede alterações quantas vezes quiser
   IA refaz até cliente aprovar

6. APROVAÇÃO
   Cliente diz "aprovado"
   Sistema registra: serviço concluído
   - Se único: entrega + invoice final
   - Se assinatura: liberado online

7. BACKOFFICE (invisível para o cliente)
   - CRM: cliente cadastrado + histórico
   - Service order: número, valor, status
   - Invoice: registrada
   - Controle financeiro: receita lançada
   - Contabilidade: para fechamento mensal
```

---

## Fluxo Interno (Para Uso do Owner / Admin)

```
OWNER CONSOLE
├── Dashboard Financeiro (receitas, despesas, MRR)
├── Gestão de Clientes (CRM completo)
├── Service Orders (todos os pedidos)
├── Invoices (faturas emitidas)
├── Platform Map (status de cada módulo)
├── Autoupgrade (auditoria da plataforma)
└── AI Cost Dashboard (custo por provedor)

INTERNO
├── Controladoria (contas a pagar/receber)
├── Contabilidade (fechamento mensal)
├── Relatórios Gerenciais
└── BI / Indicadores
```

---

## O Que Já Funciona

| Etapa | Status | Observação |
|-------|--------|------------|
| Chat com IA | ✅ | Provider Router com fallback automático entre 6 provedores |
| Provider Router | ✅ | Gemini FREE → OpenRouter → OpenCode Go → FAL → OpenAI → AI Gateway |
| Modelos dinâmicos | ✅ | Busca TODOS os modelos da API de cada provedor (300+ OpenRouter) |
| Auto-Fix Engine | ✅ | Detecta e corrige erros/ conflitos automaticamente |
| ArchVis (imagens) | ✅ | FAL.ai + OpenAI |
| DirectCut (vídeos) | ✅ | FAL.ai (Kling, Sora, Veo) |
| Budget (orçamento) | ✅ | SINAPI importável |
| Contracts (contratos) | ✅ | Draft + revisão |
| BIM / 3D | ✅ | web-ifc WebAssembly |
| Field Ops (RDO) | ✅ | Dados reais do usuário |
| Research | ✅ | Tavily API |
| Stripe pagamento | ✅ | Checkout + webhook + notificação WhatsApp/SMS |
| WhatsApp/SMS | ✅ | `server/service/notification.mjs` + API endpoint |
| Controle Financeiro | ✅ | `server/service/finance.mjs` + `api/finance/` + painel frontend |
| Supabase Auth | ✅ | Login multi-tenant |
| CRM / Finance | ✅ | Cadastro + pipeline |
| Service Order | ✅ | `server/service/serviceOrder.mjs` |
| Invoice | ✅ | `server/service/invoice.mjs` |
| CRM Automático | ✅ | `server/service/client.mjs` |
| Dashboard Cliente | ✅ | Rota `/api/service/my-orders` |
| MS Project Integration | ✅ | Parser MSPDI XML + análise scheduling + REST API |
| Deploy Files Script | ✅ | `scripts/deploy-files.mjs` para commits via API |
| Histórico persistente | ✅ | Conversas salvam entre logout/login |
| Botões nas mensagens | ✅ | Copiar, Compartilhar, Ouvir (TTS), Derivar |
| Layout split 35/65 | ✅ | Chat + painéis inline lado a lado |

---

## Diferenciação de Login

| Usuário | O que vê |
|---------|----------|
| **Cliente externo** | ClientDashboard: pedidos, faturas, downloads |
| **Equipe interna** | Plataforma completa: chat, painéis, estúdios |
| **Owner/Admin** | Tudo + Owner Console + comandos |

✅ Implementado em `306d654` — `isInternalUser` detecta por role ou email @apexglobal.

---

## O Que Falta Implementar (Prioridade)

| Prioridade | O que fazer | Módulo |
|-----------|------------|--------|
| ✅ Feito | Frontend do dashboard do cliente | ClientDashboard.tsx `752e644` |
| ✅ Feito | Fluxo de aprovação + assinatura libera no pagamento | `approve_service_order` tool + webhook `8975444` |
| 🟡 Média | Notificações automáticas pós-pagamento | Notifications + WhatsApp |
| 🟡 Média | Controle financeiro (receitas/despesas) | FinancePanel.tsx |
| 🟢 Baixa | Relatórios gerenciais | Export Center |
| 🟢 Baixa | BI / Indicadores | Metrics Dashboard |

---

## Regras para Qualquer Agente/IA

1. **LEIA ESTE DOCUMENTO** antes de modificar qualquer código
2. **COMMIT POR ETAPA**: um commit por etapa implementada
3. **TESTE**: `npm run build` antes de cada commit
4. **DOCS**: atualize este documento conforme avança
5. **NUNCA** modifique `.env.local` ou Vercel env vars
6. **NUNCA** remova funcionalidades existentes — só adicione
7. **Consulte** `docs/IMPL_SERVICOS.md` para o plano técnico detalhado

---

*Documento mantido pelo Owner. Qualquer agente deve respeitar as regras acima.*
