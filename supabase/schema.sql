-- Velora studio schema for Supabase.
-- Run this in the Supabase SQL editor, then create the public Storage bucket if the notice says to.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  details text not null default '',
  category text not null check (category in ('dresses', 'tops', 'outfits', 'shoes')),
  gender text not null check (gender in ('women', 'men')),
  price numeric(12,2) not null check (price > 0),
  compare_at numeric(12,2),
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  sku text not null unique,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check
  check (category in ('dresses', 'tops', 'outfits', 'shoes'));

create table if not exists public.orders (
  id uuid primary key,
  number text not null unique,
  access_token text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  phone text not null,
  full_name text not null,
  address text not null,
  city text not null,
  region text not null,
  note text not null default '',
  subtotal numeric(12,2) not null,
  shipping numeric(12,2) not null,
  total numeric(12,2) not null,
  status text not null,
  payment_status text not null,
  payment_channel text not null,
  momo_number text not null,
  external_ref text not null unique,
  moolre_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  slug text not null,
  image text not null default '',
  size text not null,
  color text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null
);

create table if not exists public.payments (
  id uuid primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'moolre',
  external_ref text not null,
  amount numeric(12,2) not null,
  status text not null,
  channel text not null,
  detail text not null default '',
  transaction_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key,
  product_id uuid references public.products (id) on delete set null,
  delta integer not null,
  reason text not null,
  order_id uuid references public.orders (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key,
  order_id uuid references public.orders (id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  kind text not null,
  to_address text not null,
  status text not null,
  provider_id text,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key,
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key,
  provider text not null,
  event_key text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);

create index if not exists products_shop_idx on public.products (gender, category, active);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists notifications_provider_idx on public.notifications (provider_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.webhook_events enable row level security;

create policy "Public can read active products"
  on public.products for select
  using (active = true);

create policy "Customers read their profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case when lower(coalesce(new.email, '')) = lower('admin@velora.gh') then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('products', 'products', true)
  on conflict (id) do nothing;
exception when others then
  raise notice 'Create a public Storage bucket named products in the Supabase dashboard.';
end $$;
