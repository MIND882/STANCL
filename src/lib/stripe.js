import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER,
    description: 'Everything you need to start selling',
    features: [
      'Unlimited digital products',
      'Email list (up to 1,000 contacts)',
      'Basic analytics',
      'Stripe Connect payments',
      '0% transaction fees',
      'Custom username URL',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
    description: 'Advanced tools to scale your creator business',
    popular: true,
    features: [
      'Everything in Starter',
      'Online courses + video',
      'Coaching calendar',
      'Email broadcasts + automations',
      'Custom domain',
      'Upsells + discount codes',
      'AutoDM (Instagram)',
      'Advanced analytics + pixels',
    ],
  },
}
