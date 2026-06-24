/**
 * scripts/setup-stripe-prices.mjs
 *
 * Cria produtos e preços no Stripe para os planos da plataforma.
 * Uso: node scripts/setup-stripe-prices.mjs
 *
 * Requer STRIPE_SECRET_KEY no .env.local
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
if (!STRIPE_SECRET_KEY) {
  console.error('ERRO: STRIPE_SECRET_KEY nao configurada. Use .env.local')
  process.exit(1)
}

const stripe = new (await import('stripe')).default(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })

const PLANS = [
  {
    name: 'Starter',
    description: 'Chat + ArchVis + Budget - para pequenos projetos',
    monthlyPrice: 10000, // $100 em centavos
    features: ['Chat Ilimitado', 'ArchVis - Render de Imagem', 'Budget / Quantitativo', 'Upload de Arquivos'],
  },
  {
    name: 'Pro',
    description: 'Starter + DirectCut + Contracts + Research',
    monthlyPrice: 30000, // $300
    features: ['Tudo do Starter', 'DirectCut - Video Profissional', 'Contracts / Legal', 'Research / Pesquisa'],
  },
  {
    name: 'Business',
    description: 'Pro + BIM + Field Ops + CRM + Finance',
    monthlyPrice: 50000, // $500
    features: ['Tudo do Pro', 'BIM / Modelagem 3D', 'Field Ops / RDO', 'CRM / Vendas', 'Financeiro'],
  },
  {
    name: 'Enterprise',
    description: 'Tudo + Supply Chain + Notifications + Suporte Premium',
    monthlyPrice: 100000, // $1000
    features: ['Tudo do Business', 'Supply Chain', 'Notificacoes', 'Suporte Premium', 'Onboarding Dedicado'],
  },
  {
    name: 'Offshore Partner',
    description: 'Tudo + producao dedicada BIM/CAD + equipe alocada',
    monthlyPrice: 250000, // $2500
    features: ['Tudo do Enterprise', 'Producao BIM/CAD Dedicada', 'Gerente de Projeto', 'Reunioes Semanais'],
  },
]

async function main() {
  console.log('=== CRIANDO PRODUTOS E PRECOS NO STRIPE ===\n')

  for (const plan of PLANS) {
    // Criar produto
    const product = await stripe.products.create({
      name: `Apex ${plan.name}`,
      description: plan.description,
      metadata: { plan_name: plan.name.toLowerCase() },
      marketing_features: plan.features.map(f => ({ name: f })),
    })
    console.log(`✅ Produto criado: ${product.name} (${product.id})`)

    // Criar preço mensal
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_name: plan.name.toLowerCase() },
    })
    console.log(`   Preço mensal: $${(plan.monthlyPrice / 100).toFixed(2)} → ${price.id}`)

    // Criar preço anual (2 meses grátis = 10x em vez de 12x)
    const annualPrice = Math.round(plan.monthlyPrice * 10)
    const priceAnnual = await stripe.prices.create({
      product: product.id,
      unit_amount: annualPrice,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan_name: `${plan.name.toLowerCase()}_annual` },
    })
    console.log(`   Preço anual: $${(annualPrice / 100).toFixed(2)} → ${priceAnnual.id}`)
    console.log('')
  }

  console.log('=== TODOS OS PRECOS CRIADOS ===')
  console.log('Copie os price_xxx IDs para seu .env.local como:')
  console.log('  STRIPE_PRICE_STARTER=price_xxx')
  console.log('  STRIPE_PRICE_PRO=price_xxx')
  console.log('  STRIPE_PRICE_BUSINESS=price_xxx')
  console.log('  STRIPE_PRICE_ENTERPRISE=price_xxx')
  console.log('  STRIPE_PRICE_PARTNER=price_xxx')
}

main().catch(err => {
  console.error('ERRO:', err.message)
  process.exit(1)
})
