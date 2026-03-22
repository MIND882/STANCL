import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { productId, storeId, successUrl, cancelUrl } = req.body

    // Fetch product + store info
    const { data: product } = await supabase.from('products').select('*, store:stores(*)').eq('id', productId).single()
    if (!product) return res.status(404).json({ error: 'Product not found' })
    if (!product.is_active) return res.status(400).json({ error: 'Product is not available' })

    // Create a pending order record first
    const { data: order } = await supabase.from('orders').insert({
      store_id:   storeId,
      product_id: productId,
      amount:     product.price,
      status:     'pending',
    }).select().single()

    // Create Stripe Checkout session
    // Uses Stripe Connect to pay the creator directly
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: product.price,
          product_data: {
            name:        product.name,
            description: product.description || undefined,
          },
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: { orderId: order.id, productId, storeId },
      // TODO Phase 2: add application_fee_amount + transfer_data for Stripe Connect
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[create-product-checkout]', err)
    return res.status(500).json({ error: err.message })
  }
}
