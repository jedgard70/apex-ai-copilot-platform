# 10 — SaaS, APIs, custos e monetização

Preços verificados em 2026-07-20; revalidar antes de decisão.

| Fornecedor | Uso | Custo oficial observado | Risco |
|---|---|---|---|
| Gemini | chat/multimodal | tokens/modalidade; documentos podem contar como imagem; Batch reduz custo | crítico |
| FAL | imagem/vídeo | por imagem/MP/segundo; exemplo flux/dev US$0,025/imagem | alto |
| ElevenLabs | voz | créditos/PAYG | médio |
| Supabase | auth/DB/storage | Pro desde US$25/mês; 100k MAU, 100GB storage | crítico |
| Vercel | web/serverless | Pro US$20/mês + uso | alto |
| Stripe BR | payment/billing | 3,99% + R$0,39 cartão nacional; Billing 0,7% | crítico |
| Cloud Vision | OCR opcional | 1.000/mês grátis; depois US$1,50/1.000 | opcional |
| Firebase | auxiliares | Spark/Blaze | redundância possível |

Fontes oficiais: https://ai.google.dev/gemini-api/docs/pricing ; https://fal.ai/docs/documentation/model-apis/pricing ; https://elevenlabs.io/pricing/api ; https://supabase.com/pricing ; https://vercel.com/pricing ; https://stripe.com/br/pricing ; https://cloud.google.com/vision/pricing ; https://firebase.google.com/pricing .

Sem telemetria real, custo por workflow não pode ser afirmado. Fórmula: COGS = tokens + imagens + segundos de vídeo/voz + OCR páginas + compute + storage/egress + pagamento + suporte. Uma venda de R$100 em cartão nacional perde cerca de R$4,38 antes de Billing/impostos.

Local: embeddings, reranking, classificação, OCR básico, IFC, thumbnails/cache. Externo: multimodal premium, geração premium, pagamentos e voz. Híbrido: OCR difícil, visão, chat e validação, sempre por qualidade medida.

Planos: Starter, Professional, Business, Enterprise, API e White Label, com quotas/créditos e hard limits.

Stripe existe, mas não foi comprovado ledger universal por tenant/workflow nem margem. P0: usage ledger idempotente, preços versionados, quotas, budgets e margem.

Escala: 100 usuários com quotas; 1.000 exigem filas/metering; 10.000 workers/isolamento; 100.000 multi-região e capacidade contratada.