-- KPI Adjustments Table
-- Stores manual adjustments to analytics KPI values (Collections, Profit, Orders, Items Sold)
-- Each adjustment is tied to a specific restaurant, KPI type, and business date.
-- Supports full audit history and soft reversal (reversing an adjustment retains audit trail).

create table if not exists public.kpi_adjustments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  business_date date not null,
  kpi_type text not null check (kpi_type in ('collections', 'profit', 'orders', 'items_sold')),
  amount numeric not null,
  reason text not null default '',
  admin_id uuid references public.users(id) on delete set null,
  created_by text not null default 'Admin',
  created_at timestamptz not null default now(),
  is_reversed boolean not null default false,
  reversed_at timestamptz,
  reversed_by text,
  reversal_reason text
);

alter table public.kpi_adjustments enable row level security;

-- Admins can create, read, and update (for reversal) KPI adjustments
create policy "Admins can manage KPI adjustments" on public.kpi_adjustments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Index for fast date range and restaurant queries
create index if not exists idx_kpi_adjustments_filter 
  on public.kpi_adjustments (business_date, restaurant_id, kpi_type);
