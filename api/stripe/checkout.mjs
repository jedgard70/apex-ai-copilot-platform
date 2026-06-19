// Stripe Checkout Session creation
// POST /api/stripe/checkout
import Stripe from 'stripe'
import { requireOwnerAdmin } from '../../../lib/auth.mjs'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    amount: 2900,
    currency: 'usd',
    interval: 'month',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || '',
    amount: 7900,
    currency: 'usd',
    interval: 'month',
  },
  business: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS || '',
    amount: 19900,
    currency: 'usd',
    interval: 'month',
  },
  offshore: {
    name: 'Offshore Production Partner',
    priceId: process.env.STRIPE_PRICE_OFFSHORE || '',
    amount: 49900,
    currency: 'usd',
    interval: 'month',
  },
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.',
      providerStatus: 'stripe-not-configured',
    })
  }

  try {
    const { plan, tenantId, userId, email, successUrl, cancelUrl } = req.body || {}
    const planConfig = PLANS[plan]

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan selected.' })
    }

    if (!tenantId || !userId || !email) {
      return res.status(400).json({ error: 'tenantId, userId and email are required.' })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })

    // Create or retrieve Stripe customer
    let customerId
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { tenantId, userId },
        })
        customerId = customer.id

        await supabase.from('stripe_customers').insert({
          tenant_id: tenantId,
          user_id: userId,
          stripe_customer_id: customerId,
          created_by: userId,
        })
      }
    }

    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.VERCEL_URL || 'http://localhost:4177'}/?billing=success`,
      cancel_url: cancelUrl || `${process.env.VERCEL_URL || 'http://localhost:4177'}/?billing=canceled`,
      metadata: { tenantId, userId, plan: planConfig.name },
      subscription_data: {
        metadata: { tenantId, userId, plan: planConfig.name },
      },
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return res.status(200).json({
      providerStatus: 'stripe-connected',
      sessionId: session.id,
      url: session.url,
      plan: planConfig.name,
      amount: planConfig.amount,
      currency: planConfig.currency,
      authenticatedAs: req.auth.email || req.auth.userId || 'internal',
    })
  } catch (error) {
    console.error('[stripe/checkout] Error:', error.message)
    return res.status(500).json({
      error: error.message || 'Stripe checkout failed.',
      providerStatus: 'stripe-error',
    })
  }
}

export default requireOwnerAdmin(handler)
