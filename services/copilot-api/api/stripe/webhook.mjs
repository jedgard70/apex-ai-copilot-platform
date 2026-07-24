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
          const { updateServiceOrderStatus, getServiceOrder } = await import('../../server/service/serviceOrder.mjs')
          const order = updateServiceOrderStatus(order_id, 'paid', { paymentId: session.id })
          if (order?.invoiceId) {
            const { payInvoice } = await import('../../server/service/invoice.mjs')
            payInvoice(order.invoiceId, session.id)
          }

          // Subscription auto-approve: grant access immediately on payment
          if (order && order.plan === 'subscription') {
            updateServiceOrderStatus(order.id, 'approved', { deliveredAt: new Date().toISOString() })
          }

          // WhatsApp/SMS notification on payment
          if (order) {
            try {
              const { notifyPaymentConfirmation } = await import('../../server/service/notification.mjs')
              const clientPhone = order.clientPhone || process.env.AUTHKEY_DEFAULT_MOBILE
              if (clientPhone) {
                notifyPaymentConfirmation(order, clientPhone).catch(() => {})
              }
            } catch {
              // notification connector not available
            }
          }
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

          // Notify owner about failed payment
          try {
            const { notifyPaymentFailed } = await import('../../server/service/notification.mjs')
            const ownerPhone = process.env.AUTHKEY_DEFAULT_MOBILE
            if (ownerPhone) {
              notifyPaymentFailed({
                tenantId: customer.tenant_id,
                invoiceId: invoice.id,
                amount: (invoice.amount_due || 0) / 100,
                currency: (invoice.currency || 'usd').toUpperCase(),
                customerEmail: invoice.customer_email || invoice.customer_name || '',
              }, ownerPhone).catch(() => {})
            }
          } catch { /* notification connector not available */ }
        }
        break
      }

      case 'invoice.paid': {
        const paidInvoice = event.data.object
        const { data: invoiceCustomer } = await supabase
          .from('stripe_customers')
          .select('tenant_id, user_id')
          .eq('stripe_customer_id', paidInvoice.customer)
          .single()

        if (invoiceCustomer) {
          // Reactivate subscription if it was past_due
          if (paidInvoice.subscription) {
            await supabase.from('subscriptions').update({
              status: 'active',
              updated_at: new Date().toISOString(),
            }).eq('tenant_id', invoiceCustomer.tenant_id).eq('stripe_subscription_id', paidInvoice.subscription)
          }

          // Record invoice in database
          try {
            await supabase.from('invoices').upsert({
              stripe_invoice_id: paidInvoice.id,
              tenant_id: invoiceCustomer.tenant_id,
              stripe_customer_id: paidInvoice.customer,
              subscription_id: paidInvoice.subscription,
              amount_paid: (paidInvoice.amount_paid || 0) / 100,
              currency: (paidInvoice.currency || 'usd').toUpperCase(),
              status: paidInvoice.status,
              hosted_invoice_url: paidInvoice.hosted_invoice_url || '',
              invoice_pdf: paidInvoice.invoice_pdf || '',
              paid_at: new Date().toISOString(),
              period_start: paidInvoice.period_start ? new Date(paidInvoice.period_start * 1000).toISOString() : null,
              period_end: paidInvoice.period_end ? new Date(paidInvoice.period_end * 1000).toISOString() : null,
            }, { onConflict: 'stripe_invoice_id' })
          } catch { /* non-critical */ }
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
