# Implementação — Fluxo Comercial de Serviços

> ⚠️ Leia este documento antes de qualquer modificação no código.
> Ele documenta cada passo da implementação para que qualquer agente/IA possa continuar.

## Arquitetura do Fluxo

```
Cliente → Frontend (React) → API (server.mjs) → Stripe/Supabase → Painel → Entrega
```

## Etapas de Implementação

### Etapa 1: Service Order (Pedido de Serviço)
**Arquivos:** `server/service/serviceOrder.mjs` + rota em `server.mjs`
**O que faz:** Cria um pedido com número único, valor, status, cliente

### Etapa 2: Chat → Detectar Intenção Comercial
**Arquivos:** `src/main.tsx` + `server.mjs` (system prompt)
**O que faz:** IA pergunta "único ou assinatura?" e gera service order

### Etapa 3: Fluxo Pós-Pagamento
**Arquivos:** `api/stripe/webhook.mjs` + `server.mjs`
**O que faz:** Após Stripe confirmar, liberar painel + notificar

### Etapa 4: Invoice Automática
**Arquivos:** `server/service/invoice.mjs`
**O que faz:** Gerar invoice numerada + registrar no Supabase

### Etapa 5: CRM Automático
**Arquivos:** `src/components/CrmPanel.tsx` + API
**O que faz:** Criar lead/cliente automaticamente no primeiro contato

### Etapa 6: Dashboard do Cliente
**Arquivos:** `src/components/ClientDashboard.tsx` + API
**O que faz:** Cliente vê pedidos, status, invoices, downloads

---

## Regras para Qualquer Agente/IA

1. **LEIA ESTE DOCUMENTO** antes de modificar qualquer código
2. **CADA ETAPA** deve ser documentada aqui antes de implementar
3. **COMMIT POR ETAPA**: um commit por etapa implementada
4. **TESTE**: `npm run build` antes de cada commit
5. **DOCS**: atualize `docs/FLUXO_COMERCIAL.md` conforme avança
6. **NUNCA** modifique `.env.local` ou Vercel env vars
7. **NUNCA** remova funcionalidades existentes — só adicione

---

## Status da Implementação

| Etapa | Status | Commit | Observação |
|-------|--------|--------|------------|
| Documento de requisitos | ✅ Feito | `f5189bd` | `docs/FLUXO_COMERCIAL.md` |
| Plano de implementação | ✅ Feito | `f5189bd` | `docs/IMPL_SERVICOS.md` |
| 1. Service Order | ⏳ Pendente | — | — |
| 2. Chat → Serviço | ⏳ Pendente | — | — |
| 3. Pós-Pagamento | ⏳ Pendente | — | — |
| 4. Invoice | ⏳ Pendente | — | — |
| 5. CRM Automático | ⏳ Pendente | — | — |
| 6. Dashboard Cliente | ⏳ Pendente | — | — |

---

*Documento gerado em 2026-06-23. Qualquer agente deve lê-lo antes de modificar o código.*
