-- ════════════════════════════════════════════════
-- STAN CLONE — Full Supabase Schema + RLS
-- Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. PROFILES
--    One row per auth.users entry.
--    Created automatically via trigger below.
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  username      text unique,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. STORES
--    One store per user (for now).
--    username is the public URL slug.
-- ─────────────────────────────────────────
create table public.stores (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  username      text not null unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  theme_color   text default '#ff4f17',
  is_active     boolean default true,
  custom_domain text unique,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.stores enable row level security;

-- Anyone can read active stores (public storefront)
create policy "Public stores are readable"
  on public.stores for select using (is_active = true);

-- Owners can read their own store even if inactive
create policy "Owners can read own store"
  on public.stores for select using (auth.uid() = owner_id);

create policy "Owners can create store"
  on public.stores for insert with check (auth.uid() = owner_id);

create policy "Owners can update store"
  on public.stores for update using (auth.uid() = owner_id);

create policy "Owners can delete store"
  on public.stores for delete using (auth.uid() = owner_id);

-- ─────────────────────────────────────────
-- 3. SUBSCRIPTIONS
--    Tracks the creator's own SaaS plan.
--    Updated via Stripe webhooks.
-- ─────────────────────────────────────────
create table public.subscriptions (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_sub_id        text unique,
  plan                 text check (plan in ('starter', 'pro')),
  status               text check (status in ('trialing','active','past_due','canceled','unpaid')),
  current_period_end   timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- Webhooks use service role key — no RLS insert/update policy needed

-- ─────────────────────────────────────────
-- 4. PRODUCTS
--    All products a creator sells.
-- ─────────────────────────────────────────
create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  type          text not null check (type in ('download','course','coaching','link','membership','webinar')),
  name          text not null,
  description   text,
  price         integer default 0,        -- in cents (0 = free)
  external_url  text,
  file_url      text,                     -- Phase 2: uploaded file
  thumbnail_url text,
  is_active     boolean default true,
  sort_order    integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.products enable row level security;

-- Anyone can read active products from active stores
create policy "Public can read active products"
  on public.products for select
  using (
    is_active = true
    and exists (select 1 from public.stores where id = products.store_id and is_active = true)
  );

-- Owners can do anything to their products
create policy "Owners can manage products"
  on public.products for all
  using (
    exists (select 1 from public.stores where id = products.store_id and owner_id = auth.uid())
  );

-- ─────────────────────────────────────────
-- 5. ORDERS
--    Records every purchase attempt.
--    status updated by Stripe webhook.
-- ─────────────────────────────────────────
create table public.orders (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  buyer_email   text,
  amount        integer not null,         -- in cents
  currency      text default 'usd',
  status        text default 'pending' check (status in ('pending','paid','refunded','failed')),
  stripe_pi_id  text unique,              -- payment_intent id
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.orders enable row level security;

-- Store owners can read their own orders
create policy "Store owners can read orders"
  on public.orders for select
  using (
    exists (select 1 from public.stores where id = orders.store_id and owner_id = auth.uid())
  );

-- Service role inserts/updates orders (from API + webhook) — no user-level policy needed

-- ─────────────────────────────────────────
-- 6. STORE VIEWS
--    Lightweight analytics — one row per page view.
--    No auth required to insert (public).
-- ─────────────────────────────────────────
create table public.store_views (
  id         bigserial primary key,
  store_id   uuid not null references public.stores(id) on delete cascade,
  referrer   text,
  created_at timestamptz default now()
);

alter table public.store_views enable row level security;

-- Anyone can insert a view (public page loads)
create policy "Anyone can log a store view"
  on public.store_views for insert with check (true);

-- Only store owners can read their view counts
create policy "Owners can read their views"
  on public.store_views for select
  using (
    exists (select 1 from public.stores where id = store_views.store_id and owner_id = auth.uid())
  );

-- ─────────────────────────────────────────
-- 7. INDEXES for performance
-- ─────────────────────────────────────────
create index idx_stores_username      on public.stores(username);
create index idx_stores_owner         on public.stores(owner_id);
create index idx_products_store       on public.products(store_id);
create index idx_products_active      on public.products(store_id, is_active);
create index idx_orders_store         on public.orders(store_id);
create index idx_orders_status        on public.orders(store_id, status);
create index idx_store_views_store    on public.store_views(store_id);
create index idx_subscriptions_user   on public.subscriptions(user_id);
create index idx_subscriptions_stripe on public.subscriptions(stripe_customer_id);

-- ─────────────────────────────────────────
-- Done! 
-- ─────────────────────────────────────────
