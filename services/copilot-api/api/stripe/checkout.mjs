// Stripe Checkout Session Creator
// POST /api/stripe/checkout
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  if (!STRIPE_SECRET_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.',
    }))
  }

  try {
    // Read JSON body
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}

    const { tenantId, userId, plan, priceId, successUrl, cancelUrl, customerEmail } = body

    if (!tenantId || !userId || !plan || !priceId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Missing required parameters: tenantId, userId, plan, priceId' }))
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })

    const sessionPayload = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.APEX_PRODUCTION_DOMAIN || 'https://www.apexglobalai.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.APEX_PRODUCTION_DOMAIN || 'https://www.apexglobalai.com'}/billing`,
      metadata: {
        tenantId,
        userId,
        plan,
      },
    }

    if (customerEmail) {
      sessionPayload.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionPayload)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      id: session.id,
      url: session.url,
    }))
  } catch (error) {
    console.error('[stripe/checkout] Error creating session:', error.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: error.message || 'Failed to create checkout session' }))
  }
}
