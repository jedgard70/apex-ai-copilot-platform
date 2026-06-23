// Stripe Webhook handler
// POST /api/stripe/webhook
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({
      error: 'Stripe webhook not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
    })
  }

  const sig = req.headers['stripe-signature']
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  let event
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[stripe/webhook] Supabase not configured')
      return res.status(500).json({ error: 'Supabase not configured' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { tenantId, userId, plan, order_id } = session.metadata || {}

        if (tenantId && userId) {
          // 1. First record customer mapping
          await supabase.from('stripe_customers').upsert({
            tenant_id: tenantId,
            user_id: userId,
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_customer_id'
          })

          // 2. Then upsert subscription linking it to tenant
          await supabase.from('subscriptions').upsert({
            tenant_id: tenantId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            plan_name: plan || 'unknown',
            status: 'active',
            current_period_end: new Date((session.current_period_end || 0) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            created_by: userId,
          }, {
            onConflict: 'stripe_subscription_id'
          })
        }

        // Mark service order as paid if order_id was passed in metadata
        if (order_id) {
          const { updateServiceOrderStatus } = await import('../../server/service/serviceOrder.mjs')
          updateServiceOrderStatus(order_id, 'paid', { paymentId: session.id })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('tenant_id, user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (customer) {
          const status = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status

          await supabase.from('subscriptions').upsert({
            tenant_id: customer.tenant_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status,
            current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_subscription_id'
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('tenant_id, user_id')
          .eq('stripe_customer_id', invoice.customer)
          .single()

        if (customer) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('tenant_id', customer.tenant_id).eq('stripe_customer_id', invoice.customer)
        }
        break
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[stripe/webhook] Error processing event:', error.message)
    return res.status(500).json({ error: error.message || 'Webhook processing failed' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
