/**
 * Vercel Edge Function — /api/stripe-webhook
 * Handles Stripe webhook events to update user plan in Supabase
 *
 * Configure in Stripe Dashboard:
 *   Endpoint: https://your-app.vercel.app/api/stripe-webhook
 *   Events: checkout.session.completed, customer.subscription.deleted
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side writes (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Add this to Vercel env vars
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig    = req.headers['stripe-signature']

  let event
  try {
    // req.body must be raw buffer for signature verification
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature invalid' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId  = session.metadata?.userId

        if (userId && session.payment_status === 'paid') {
          await supabase
            .from('users')
            .update({
              plan: 'premium',
              stripe_customer_id: session.customer,
            })
            .eq('id', userId)
          console.log(`[webhook] User ${userId} upgraded to premium`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled/expired — downgrade to free
        const subscription = event.data.object
        const customerId   = subscription.customer

        await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)
        console.log(`[webhook] Customer ${customerId} downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object
        const customerId = invoice.customer
        console.warn(`[webhook] Payment failed for customer ${customerId}`)
        // Optional: send reminder email via Supabase edge function
        break
      }

      default:
        // Ignore other events
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[webhook] Handler error:', err.message)
    return res.status(500).json({ error: 'Webhook handler error' })
  }
}

export const config = {
  api: {
    bodyParser: false,  // Required for Stripe signature verification
  },
}
