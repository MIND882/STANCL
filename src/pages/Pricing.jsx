import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PLANS } from '@/lib/stripe'
import toast from 'react-hot-toast'

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-[#ff4f17] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Pricing() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(null) // plan id being loaded

  const handleChoosePlan = async (plan) => {
    if (!user) {
      navigate('/signup')
      return
    }
    setLoading(plan.id)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block bg-[#fff0eb] text-[#ff4f17] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
          Pricing
        </div>
        <h1 className="text-5xl font-display font-bold text-gray-900 tracking-tight mb-4">
          Simple, creator-first pricing
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto">
          Always 0% transaction fees. What you earn is yours. Start with a 14-day free trial.
        </p>
      </div>

      {/* Cards */}
      <div className="max-width-2xl mx-auto grid md:grid-cols-2 gap-6 max-w-3xl px-4">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-200 ${
              plan.popular
                ? 'border-gray-900 shadow-xl'
                : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#ff4f17] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-500">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-2xl font-semibold text-gray-400">$</span>
              <span className="text-6xl font-display font-bold text-gray-900 tracking-tight">{plan.price}</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>

            <button
              onClick={() => handleChoosePlan(plan)}
              disabled={loading === plan.id}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-200 mb-8 ${
                plan.popular
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Redirecting…
                </span>
              ) : 'Start 14-day free trial'}
            </button>

            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        14-day free trial · No credit card required · Cancel anytime
      </p>
    </div>
  )
}
