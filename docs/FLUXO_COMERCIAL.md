# Fluxo Comercial — Apex AI Copilot Platform

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

## O Que Já Funciona

| Etapa | Status |
|-------|--------|
| Chat com IA | ✅ |
| ArchVis (imagens) | ✅ |
| DirectCut (vídeos) | ✅ |
| Budget (orçamento) | ✅ |
| Contracts (contratos) | ✅ |
| Stripe pagamento | ✅ |
| Supabase Auth | ✅ |
| CRM / Finance | ✅ |
| Revisão/iteração | ✅ (galeria, revision constraints) |

## O Que Falta Implementar

| Etapa | O que fazer |
|-------|------------|
| Chat → detectar serviço | IA perguntar "único ou assinatura?" e gerar service order |
| Service order | Tabela no Supabase + número de pedido automático |
| Fluxo pós-pagamento | Após Stripe confirmar, liberar o painel certo |
| Invoice automática | Gerar invoice numerada no Stripe ou Supabase |
| CRM automático | Criar/atualizar lead/cliente no CRM após primeiro contato |
| Dashboard do cliente | Ver pedidos, status, invoices, downloads |
| Controle financeiro | Receitas mensais, contas a receber, relatórios |
| Fluxo de aprovação | Botão "Aprovar" no preview → gatilho de entrega |

---

*Documento criado para validação do Owner antes de implementar.*
