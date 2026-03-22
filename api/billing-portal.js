import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase  = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId, returnUrl } = req.body

    // Look up the Stripe customer ID from our DB
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found. Please subscribe first.' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: returnUrl || `${process.env.VITE_APP_URL}/dashboard/settings`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[billing-portal]', err)
    return res.status(500).json({ error: err.message })
  }
}
