// Stripe runtime status endpoint
// GET /api/stripe/status

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  const hasSecretKey = Boolean(process.env.STRIPE_SECRET_KEY)
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET)

  const configured = hasSecretKey && hasWebhookSecret
  res.writeHead(configured ? 200 : 503, { 'Content-Type': 'application/json' })
  return res.end(
    JSON.stringify({
      connector: 'stripe',
      configured,
      checks: {
        STRIPE_SECRET_KEY: hasSecretKey,
        STRIPE_WEBHOOK_SECRET: hasWebhookSecret,
      },
      reason: configured ? null : 'Missing required Stripe environment variables.',
    }),
  )
}

