-- MuteBites initial schema
-- Students (users), restaurants, dishes, orders, order_items.
-- Cash-on-delivery only: no payment fields anywhere.
-- Auth: Supabase Auth email OTP (Resend as the email provider); public.users
-- mirrors auth.users 1:1.

create type public.order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- USERS ----------------------------------------------------------------
-- Profile row for each authenticated student. id matches auth.users.id.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  registration_number text unique,
  hostel_block text,
  room_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RESTAURANTS ------------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  description text,
  cuisine_tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DISH_CATEGORIES --------------------------------------------------------
-- Menu sections within a restaurant, e.g. "VEG STARTERS", "NON-VEG BIRYANI".
create table public.dish_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

-- DISHES -------------------------------------------------------------------
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.dish_categories (id) on delete set null,
  name text not null,
  price numeric(8, 2) not null check (price >= 0),
  is_veg boolean not null default true,
  note text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDERS ---------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  status public.order_status not null default 'pending',
  delivery_block text not null,
  delivery_room text not null,
  contact_phone text not null,
  notes text,
  total_amount numeric(8, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDER_ITEMS ------------------------------------------------------------
-- dish_name/unit_price are snapshots taken at order time, so editing or
-- deleting a dish later never rewrites past order history.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  dish_id uuid references public.dishes (id) on delete set null,
  dish_name text not null,
  unit_price numeric(8, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(8, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

-- INDEXES ------------------------------------------------------------------
create index dishes_restaurant_id_idx on public.dishes (restaurant_id);
create index dish_categories_restaurant_id_idx on public.dish_categories (restaurant_id);
create index orders_user_id_idx on public.orders (user_id);
create index orders_restaurant_id_idx on public.orders (restaurant_id);
create index order_items_order_id_idx on public.order_items (order_id);

-- updated_at trigger ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.dishes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ROW LEVEL SECURITY -----------------------------------------------------
alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.dish_categories enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- users: a student can only see/edit their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- restaurants/menu: public read, no client-side writes (managed via
-- service role until an admin/restaurant-owner role exists)
create policy "Anyone can view restaurants" on public.restaurants
  for select using (true);
create policy "Anyone can view dish categories" on public.dish_categories
  for select using (true);
create policy "Anyone can view dishes" on public.dishes
  for select using (true);

-- orders: a student can only see/create their own orders
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);
create policy "Users can create own orders" on public.orders
  for insert with check (auth.uid() = user_id);

-- order_items: scoped through the parent order's ownership
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );
create policy "Users can create own order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );
