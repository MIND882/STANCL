# Stan Clone — Phase 1 Setup Guide

## Quick start (5 minutes to running locally)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then fill in `.env` with your real keys (see steps below).

---

## Supabase setup

1. Go to https://app.supabase.com → New project
2. **Settings → API** → copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. **SQL Editor** → paste entire contents of `supabase/schema.sql` → Run
4. **Authentication → Providers** → Enable Google (optional)
   - Add `http://localhost:3000` and your Vercel URL to "Redirect URLs"

---

## Stripe setup

1. Go to https://dashboard.stripe.com → Developers → API keys
   - Copy `Publishable key` → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Copy `Secret key` → `STRIPE_SECRET_KEY`

2. **Create Products** → Products → Add product:
   - **Starter Plan** — $19/month recurring → copy Price ID → `STRIPE_PRICE_STARTER`
   - **Pro Plan** — $49/month recurring → copy Price ID → `STRIPE_PRICE_PRO`

3. **Webhook** (for subscription sync):
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-app.vercel.app/api/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`
   - For local testing: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

---

## Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time sets up project)
vercel

# Set environment variables in Vercel dashboard:
# Project → Settings → Environment Variables
# Add all vars from .env (without VITE_ prefix for server-only ones)
```

Or push to GitHub and connect in Vercel dashboard for auto-deploys.

---

## What's built in Phase 1

- ✅ Full auth (email + Google OAuth)
- ✅ Username availability check on signup
- ✅ Stripe subscription billing (Starter $19 + Pro $49)
- ✅ 14-day free trial
- ✅ Stripe webhook handler (subscription sync)
- ✅ Creator dashboard with sidebar
- ✅ Analytics page with real DB metrics
- ✅ Store setup page (name, bio, avatar, theme color)
- ✅ Products page — add/toggle/delete products
- ✅ Public storefront at `/store/:username`
- ✅ Store view logging (analytics)
- ✅ Settings page with billing portal
- ✅ Row Level Security on all tables
- ✅ Deployed on Vercel

## Phase 2 (next session)
- File uploads to Cloudflare R2
- Stripe Connect (creators get paid directly)
- Actual product purchase flow
- Course module builder
- Email capture / lead magnets
