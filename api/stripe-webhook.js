import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Vercel: disable body parsing so we can verify the raw body
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig     = req.headers['stripe-signature']
  const rawBody = await getRawBody(req)
  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const data = event.data.object

  try {
    switch (event.type) {
      // ── New subscription created (after checkout) ──
      case 'checkout.session.completed': {
        if (data.mode !== 'subscription') break
        const userId = data.metadata?.userId
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(data.subscription)
        const priceId      = subscription.items.data[0]?.price.id
        const plan         = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'starter'

        await supabase.from('subscriptions').upsert({
          user_id:             userId,
          stripe_customer_id:  data.customer,
          stripe_sub_id:       data.subscription,
          plan,
          status:              subscription.status, // 'trialing' | 'active'
          current_period_end:  new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at:          new Date().toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      // ── Subscription updated (upgrade, downgrade, renewal) ──
      case 'customer.subscription.updated': {
        const priceId = data.items.data[0]?.price.id
        const plan    = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'starter'

        await supabase.from('subscriptions')
          .update({
            plan,
            status:             data.status,
            current_period_end: new Date(data.current_period_end * 1000).toISOString(),
            updated_at:         new Date().toISOString(),
          })
          .eq('stripe_sub_id', data.id)
        break
      }

      // ── Subscription cancelled / payment failed ──
      case 'customer.subscription.deleted': {
        await supabase.from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_sub_id', data.id)
        break
      }

      // ── Product checkout payment (creator selling to fan) ──
      case 'payment_intent.succeeded': {
        // This fires for creator→customer sales via Stripe Connect
        // The order record is created in create-product-checkout; here we just mark it paid
        const orderId = data.metadata?.orderId
        if (orderId) {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err)
    // Return 200 anyway so Stripe doesn't retry endlessly
  }

  return res.status(200).json({ received: true })
}
